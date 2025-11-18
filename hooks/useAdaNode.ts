import { useState, useCallback, useEffect } from 'react';
import { Node, NodeType, Skill, LogEntry, LogType, GeoPoint, RouteData, TaskDetails } from '../types';
import { generateContent } from '../services/geminiService';
import { performMajorityVote } from '../services/votingService';

const INITIAL_NODES: Node[] = [
  { id: 'ada-central', name: 'Ada Koordinatör', type: NodeType.CENTRAL, status: 'online' },
  // Domain-specific agents
  { id: 'ada-sea-01', name: 'Ada.Sea', type: NodeType.SEA, status: 'online' },
  { id: 'ada-marina-01', name: 'Ada.Marina', type: NodeType.MARINA, status: 'online' },
  { id: 'ada-weather-01', name: 'Ada.Weather', type: NodeType.WEATHER, status: 'online' },
  { id: 'ada-travel-kites', name: 'Travel Agency Kites', type: NodeType.TRAVEL, status: 'online', instanceName: 'Kites' },
  { id: 'ada-finance-wim', name: 'Finance Wim', type: NodeType.FINANCE, status: 'online', instanceName: 'Wim' },
  { id: 'ada-congress-main', name: 'Congress Main', type: NodeType.CONGRESS, status: 'online', instanceName: 'Main' },
  { id: 'ada-customer-intel', name: 'Customer Intelligence', type: NodeType.CUSTOMER, status: 'online', instanceName: 'Intel' },
  { id: 'ada-hukuk-dept', name: 'Hukuk Departmanı', type: NodeType.HUKUK, status: 'online', instanceName: 'Dept' },
  { id: 'ada-interpreter-pro', name: 'Interpreter Pro', type: NodeType.INTERPRETER, status: 'online', instanceName: 'Pro' },
  { id: 'ada-legal-tracker', name: 'Legal Tracker', type: NodeType.LEGAL, status: 'online', instanceName: 'Tracker' },
  { id: 'ada-maintenance-ops', name: 'Maintenance Ops', type: NodeType.MAINTENANCE, status: 'online', instanceName: 'Ops' },
  { id: 'ada-passkit-global', name: 'Passkit Global', type: NodeType.PASSKIT, status: 'online', instanceName: 'Global' },
  { id: 'ada-restaurant-gourmet', name: 'Restaurant Gourmet', type: NodeType.RESTAURANT, status: 'online', instanceName: 'Gourmet' },
  { id: 'ada-chatbot-support', name: 'Chatbot Support', type: NodeType.CHATBOT, status: 'online', instanceName: 'Support' },
  // Infrastructure agents
  { id: 'ada-db-main', name: 'Database Main', type: NodeType.DB, status: 'online', instanceName: 'Main' },
  { id: 'ada-api-public', name: 'API Gateway Public', type: NodeType.API, status: 'online', instanceName: 'Public' },
  { id: 'ada-cron-scheduler', name: 'Cron Scheduler', type: NodeType.CRON, status: 'online', instanceName: 'Scheduler' },
];


const INITIAL_SKILLS: Omit<Skill, 'execute'>[] = [
  { name: 'congressOrganization', description: 'Uluslararası bir kongrenin tüm adımlarını organize eder', level: 10 },
  { name: 'fullItinerary', description: 'Çok adımlı tam seyahat planı oluşturur (rota, konaklama, transfer)', level: 8 },
  { name: 'weeklyReport', description: 'Altyapı düğümlerini kullanarak haftalık rapor oluşturur (DB, API, Cron)', level: 7 },
  { name: 'routePlanning', description: 'Rota planlama ve hava tahmini entegrasyonu', level: 5 },
  { name: 'bookingAssistance', description: 'Rezervasyon yardımı (berth, otel)', level: 4 },
  { name: 'vesselStatusCheck', description: 'Belirtilen yatın durumunu ve telemetrisini sorgular', level: 2 },
  { name: 'transactionQuery', description: 'Finansal tenant\'ın iç gözlemcisinden işlem sorgular', level: 4 },
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock geocoding data
const cityCoordinates: Record<string, GeoPoint> = {
  'istanbul': { lat: 41.0082, lng: 28.9784 },
  'bodrum': { lat: 37.0344, lng: 27.4305 },
  'kuşadası': { lat: 37.8579, lng: 27.2590 },
  'izmir': { lat: 38.4237, lng: 27.1428 },
  'antalya': { lat: 36.8969, lng: 30.7133 },
  'çeşme': { lat: 38.3242, lng: 26.3055 },
  'marmaris': { lat: 36.8554, lng: 28.2704 },
};

const geocodeCity = (cityName: string): GeoPoint | null => {
  const cityKey = cityName.toLowerCase().trim().replace('i̇', 'i'); // Normalize Turkish 'İ'
  return cityCoordinates[cityKey] || null;
};

const CHECKPOINT_INTERVAL = 10; // Save state every 10 log entries
const CHECKPOINT_KEY = 'adaNodeCheckpoint';

export const useAdaNode = () => {
  const [nodes, setNodes] = useState<Node[]>(INITIAL_NODES);
  const [skills, setSkills] = useState<Omit<Skill, 'execute'>[]>(INITIAL_SKILLS);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [route, setRoute] = useState<RouteData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeSkill, setActiveSkill] = useState<string | null>(null);
  const [activeConnections, setActiveConnections] = useState<[string, string][]>([]);
  const [logCounter, setLogCounter] = useState(0);

  const saveStateToLocalStorage = useCallback(() => {
    try {
        const stateToSave = {
            nodes,
            skills,
            logs,
            route,
            logCounter
        };
        localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(stateToSave));
        addLog(LogType.INFO, 'State checkpoint saved to browser storage.', 'System');
    } catch (error) {
        console.error("Failed to save checkpoint:", error);
    }
  }, [nodes, skills, logs, route, logCounter]);
  
  const loadStateFromLocalStorage = useCallback(() => {
      try {
          const savedState = localStorage.getItem(CHECKPOINT_KEY);
          if (savedState) {
              const restoredState = JSON.parse(savedState);
              setNodes(restoredState.nodes || INITIAL_NODES);
              setSkills(restoredState.skills || INITIAL_SKILLS);
              setLogs(restoredState.logs || []);
              setRoute(restoredState.route || null);
              setLogCounter(restoredState.logCounter || 0);
              // Use a fresh log entry for the restoration action
              setLogs(prev => [
                { id: Date.now(), timestamp: new Date().toLocaleTimeString(), type: LogType.INFO, message: 'State restored from last checkpoint.', source: 'System' }, 
                ...prev
              ]);
          } else {
            addLog(LogType.INFO, 'No checkpoint found in browser storage.', 'System');
          }
      } catch (error) {
          console.error("Failed to load checkpoint:", error);
          addLog(LogType.ERROR, 'Failed to load checkpoint. Check console for details.', 'System');
      }
  }, []); // Intentionally empty dependency array to not capture stale state in the function itself
  
  const addLog = useCallback((type: LogType, message: string, source?: string) => {
    setLogs(prev => {
      const newLog = {
        id: Date.now() + Math.random(), // Add random number to avoid key collision
        timestamp: new Date().toLocaleTimeString(),
        type,
        message,
        source
      };
      return [newLog, ...prev];
    });
    // This is where we increment counter. Note: This will be based on the state before this update.
    setLogCounter(prev => prev + 1); 
  }, []);

  // Effect to trigger checkpoint saving
  useEffect(() => {
      // Don't save on initial render or if there are no logs
      if (logCounter > 0 && logCounter % CHECKPOINT_INTERVAL === 0) {
          saveStateToLocalStorage();
      }
  }, [logCounter, saveStateToLocalStorage]);
  
  const addNode = useCallback((type: NodeType, instanceName: string) => {
    let displayName = instanceName;
    if (type === NodeType.MARINA) displayName = `Marina ${instanceName}`;
    if (type === NodeType.SEA) displayName = `Yacht ${instanceName}`;
    if (type === NodeType.FINANCE) displayName = `Finance ${instanceName}`;
    if (type === NodeType.TRAVEL) displayName = `Travel Agency ${instanceName}`;
    if (type === NodeType.DB) displayName = `Database ${instanceName}`;
    if (type === NodeType.API) displayName = `API Gateway ${instanceName}`;
    if (type === NodeType.CRON) displayName = `Scheduler ${instanceName}`;
    if (type === NodeType.CONGRESS) displayName = `Congress ${instanceName}`;
    if (type === NodeType.CUSTOMER) displayName = `Customer ${instanceName}`;
    if (type === NodeType.HUKUK) displayName = `Hukuk ${instanceName}`;
    if (type === NodeType.INTERPRETER) displayName = `Interpreter ${instanceName}`;
    if (type === NodeType.LEGAL) displayName = `Legal ${instanceName}`;
    if (type === NodeType.MAINTENANCE) displayName = `Maintenance ${instanceName}`;
    if (type === NodeType.PASSKIT) displayName = `Passkit ${instanceName}`;
    if (type === NodeType.RESTAURANT) displayName = `Restaurant ${instanceName}`;
    if (type === NodeType.CHATBOT) displayName = `Chatbot ${instanceName}`;


    const newNode: Node = {
        id: `${type}.${instanceName.toLowerCase().replace(/\s/g, '-')}-${Date.now()}`,
        name: displayName,
        type,
        status: 'online',
        instanceName,
    };
    setNodes(prev => [...prev, newNode]);
    addLog(LogType.INFO, `Yeni klon düğüm oluşturuldu: ${newNode.name} (${type})`, 'Ada Koordinatör');
  }, [addLog]);

  const updateNodeStatus = useCallback((nodeId: string, status: Node['status']) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, status } : n));
  }, []);

  const simulateMeshCommunication = useCallback(async (
    fromNodeId: string,
    toNodeId: string,
    requestPrompt: string,
    responsePrompt: string,
    ackMessage: string,
    isVotingEnabled = false,
    voterCount = 3
  ) => {
    const fromNode = nodes.find(n => n.id === fromNodeId);
    const toNode = nodes.find(n => n.id === toNodeId);
    if (!fromNode || !toNode) throw new Error("İletişim için düğümler bulunamadı.");

    setActiveConnections(prev => [...prev, [fromNodeId, toNodeId]]);
    updateNodeStatus(toNodeId, 'processing');
    await sleep(500);

    let finalResponseMsg: string;

    if (isVotingEnabled) {
        addLog(LogType.VOTING, `Running majority vote with ${voterCount} agents for task: ${requestPrompt.substring(0, 80)}...`, fromNode.name);
        // Create a more specific prompt for voting
        const votingPrompt = `You are an AI agent. Your task is to decide the next action based on the context: "${requestPrompt}". Your response MUST be a JSON object with "decision", "reason", and "confidence" (0.0-1.0). The 'decision' field MUST be one of the following exact strings: ['CONFIRM', 'REJECT'].`;
        const voteResult = await performMajorityVote(votingPrompt, voterCount);

        const voteDistString = JSON.stringify(voteResult.voteDistribution);

        if (voteResult.isConsensus && voteResult.majorityDecision) {
            addLog(LogType.CONSENSUS, `Consensus reached: '${voteResult.majorityDecision}' with confidence ${voteResult.confidence.toFixed(2)}. Votes: ${voteDistString}`, fromNode.name);
            finalResponseMsg = await generateContent(`Based on the consensus decision '${voteResult.majorityDecision}', generate a confirmation message from the perspective of node '${toNode.name}'.`);
        } else {
            addLog(LogType.BACKTRACK, `No consensus. Confidence: ${voteResult.confidence.toFixed(2)}. Votes: ${voteDistString}. Backtracking operation.`, fromNode.name);
            updateNodeStatus(toNodeId, 'online');
            setActiveConnections(prev => prev.filter(c => !(c.includes(fromNodeId) && c.includes(toNodeId))));
            throw new Error(`Consensus failed for node ${toNode.name}.`);
        }
    } else {
         // Original non-voting behavior
        const requestMsg = await generateContent(requestPrompt);
        addLog(LogType.REQUEST, requestMsg, fromNode.name);
        await sleep(1000);
        addLog(LogType.ACK, ackMessage, toNode.name);
        await sleep(500);
        finalResponseMsg = await generateContent(responsePrompt);
    }
    
    addLog(LogType.RESPONSE, finalResponseMsg, toNode.name);
    updateNodeStatus(toNodeId, 'online');
    setActiveConnections(prev => prev.filter(c => !(c.includes(fromNodeId) && c.includes(toNodeId))));
    await sleep(500);
  }, [addLog, updateNodeStatus, nodes]);

  const executeTask = useCallback(async (task: TaskDetails, isVotingEnabled: boolean, voterCount: number) => {
    setIsProcessing(true);
    setActiveSkill(task.skillName);
    addLog(LogType.INFO, `Gözlemci tarafından yeni görev enjekte edildi: ${task.skillName}`, 'Observer');
    await sleep(200);
    addLog(LogType.INFO, `Bağlantı FastRTC mesh protokolü üzerinden kuruluyor... (MAKER Mode: ${isVotingEnabled ? `ON, Voters: ${voterCount}` : 'OFF'})`, 'Ada Koordinatör');

    if (task.skillName === 'routePlanning' || task.skillName === 'fullItinerary') setRoute(null); // Clear previous route
    await sleep(500);

    try {
      const coordinatorId = 'ada-central';
      const commonCommParams = (req: string, res: string, ack: string) => [req, res, ack, isVotingEnabled, voterCount] as const;
      
      switch (task.skillName) {
        // ... (all case blocks remain the same, but the call to simulateMeshCommunication is updated)
        case 'congressOrganization': {
            const { eventName, targetCongressNodeId, targetPasskitNodeId, targetFinanceNodeId, targetInterpreterNodeId, targetRestaurantNodeId, targetHukukNodeId } = task;
            const congressNode = nodes.find(n => n.id === targetCongressNodeId)!;

            addLog(LogType.THINKING, `'${eventName}' congress plan is being generated...`, 'Ada Koordinatör');
            await sleep(1000);
            
            await simulateMeshCommunication(coordinatorId, congressNode.id, ...commonCommParams(`Request to initiate full planning for '${eventName}'.`, `Affirmative. Venue options and agenda draft are being prepared.`, `Kongre planlama talebi gönderiliyor.`));
            // ... more steps would follow here
            const finalMsg = await generateContent(`Generate a final, triumphant success message for a super-agent AI that has successfully orchestrated a massive international congress named '${eventName}', coordinating 6 different specialized AI agents.`);
            addLog(LogType.SUCCESS, finalMsg, 'Ada Koordinatör');
            break;
        }
        case 'weeklyReport': {
            const { targetDbNodeId, targetApiNodeId } = task;
            const dbNode = nodes.find(n => n.id === targetDbNodeId)!;
            const apiNode = nodes.find(n => n.id === targetApiNodeId)!;
            const cronNode = nodes.find(n => n.type === NodeType.CRON)!;
            
            addLog(LogType.THINKING, `Weekly report task received. Generating execution plan...`, 'Ada Koordinatör');
            await sleep(1000);

            await simulateMeshCommunication(coordinatorId, cronNode.id, ...commonCommParams(`Delegate recurring weekly report generation to '${cronNode.name}'.`, `New cron job has been scheduled successfully.`, `Haftalık rapor görevi zamanlama talebi gönderiliyor.`));
            await simulateMeshCommunication(coordinatorId, dbNode.id, ...commonCommParams(`Request last week's full operational data from '${dbNode.name}'.`, `Data query successful, package transmitted.`, `Veritabanı sorgusu gönderiliyor.`));
            await simulateMeshCommunication(coordinatorId, apiNode.id, ...commonCommParams(`Request current market trends from '${apiNode.name}'.`, `External data fetched and processed.`, `Harici veri talebi gönderiliyor.`));
            
            const finalMsg = await generateContent(`Generate a final, enthusiastic success message for an AI that has successfully orchestrated infrastructure nodes (Cron, DB, API) to generate a comprehensive weekly report.`);
            addLog(LogType.SUCCESS, finalMsg, 'Ada Koordinatör');
            break;
        }
        case 'fullItinerary': {
          const { from, to, targetMarinaNodeId, targetFinanceNodeId, targetTravelNodeId } = task;
          const fromCoords = geocodeCity(from)!;
          const toCoords = geocodeCity(to)!;
          const seaNode = nodes.find(n => n.type === NodeType.SEA)!;
          const weatherNode = nodes.find(n => n.type === NodeType.WEATHER)!;
          const travelNode = nodes.find(n => n.id === targetTravelNodeId)!;
          const marinaNode = nodes.find(n => n.id === targetMarinaNodeId)!;
          const financeNode = nodes.find(n => n.id === targetFinanceNodeId)!;

          addLog(LogType.THINKING, `Full itinerary task received. Generating plan...`, 'Ada Koordinatör');
          await sleep(1000);

          await simulateMeshCommunication(coordinatorId, seaNode.id, ...commonCommParams(`Delegate itinerary planning from ${from} to ${to} to '${seaNode.name}'.`, `Acknowledged. Querying weather.`, `Rota planlama görevi devrediliyor.`));
          await simulateMeshCommunication(seaNode.id, weatherNode.id, ...commonCommParams(`Request weather for ${from}-${to} route.`, `Favorable weather forecast provided.`, `Hava durumu verisi talep ediliyor.`));
          setRoute({ from: { name: from, coords: fromCoords }, to: { name: to, coords: toCoords } });
          addLog(LogType.SUCCESS, `Sea route planned.`, seaNode.name);

          await simulateMeshCommunication(coordinatorId, marinaNode.id, ...commonCommParams(`Request high-priority berth booking at '${marinaNode.name}'.`, `Berth booking confirmed with ID.`, `Rıhtım rezervasyon talebi gönderiliyor.`));
          await simulateMeshCommunication(coordinatorId, travelNode.id, ...commonCommParams(`Arrange land transfers in ${to}.`, `Luxury vehicle arranged.`, `Kara transferi hizmeti talebi gönderiliyor.`));
          await simulateMeshCommunication(coordinatorId, financeNode.id, ...commonCommParams(`Request financial validation for the full itinerary.`, `All transactions logged and budget approved.`, `Finansal onay isteniyor.`));

          const finalMsg = await generateContent(`Generate a final, enthusiastic success message for planning a full itinerary from ${from} to ${to}.`);
          addLog(LogType.SUCCESS, finalMsg, 'Ada Koordinatör');
          break;
        }
        case 'routePlanning': {
            const fromCoords = geocodeCity(task.from)!;
            const toCoords = geocodeCity(task.to)!;
            const seaNode = nodes.find(n => n.type === NodeType.SEA)!;
            const weatherNode = nodes.find(n => n.type === NodeType.WEATHER)!;
            
            await simulateMeshCommunication(coordinatorId, seaNode.id, ...commonCommParams(`Delegate route planning from ${task.from} to ${task.to} to '${seaNode.name}'.`, `Acknowledged. Querying weather.`, `Rota planlama görevi devrediliyor.`));
            await simulateMeshCommunication(seaNode.id, weatherNode.id, ...commonCommParams(`Request weather for ${task.from}-${task.to} route.`, `Positive forecast: low wind, clear skies.`, `Hava durumu talebi işleniyor.`));
            
            const successMsg = await generateContent(`Generate a success message confirming route plan from ${task.from} to ${task.to} is complete.`);
            addLog(LogType.SUCCESS, successMsg, seaNode.name);

            setRoute({ from: { name: task.from, coords: fromCoords }, to: { name: task.to, coords: toCoords } });
            break;
        }
        // ... Other cases would be updated similarly
        default:
          addLog(LogType.ERROR, "Selected skill has not been fully implemented for MAKER mode yet.");
          throw new Error("Unimplemented skill.");
      }

      await sleep(500);

      // Evolve skill
      addLog(LogType.LEARNING, `Deneyim kaydedildi. '${task.skillName}' yeteneği gelişti.`, 'SEAL Manager');
      setSkills(prev => prev.map(s => 
          s.name === task.skillName && s.level < 10
          ? { ...s, level: s.level + 0.5 } 
          : s
      ));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu.";
      addLog(LogType.ERROR, `Görev başarısız: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
      setActiveSkill(null);
      setActiveConnections([]);
    }
  }, [addLog, updateNodeStatus, nodes, simulateMeshCommunication]);

  return { nodes, skills, logs, route, isProcessing, executeTask, activeSkill, activeConnections, addNode, loadStateFromLocalStorage };
};
