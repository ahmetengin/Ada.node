import { useState, useCallback, useEffect } from 'react';
import { Node, NodeType, LogEntry, LogType, TaskDetails, AgentConfig } from '../types';
import { generateContent } from '../services/geminiService';
import { performMajorityVote } from '../services/votingService';

const AGENT_CONFIG: AgentConfig = {
  "modules": {
    "travel_agent": {
      "tasks": [
        {"id": "date_destination_check", "description": "Tarih ve destinasyon doğrulama"},
        {"id": "flight_combinations", "description": "Uçuş kombinasyonlarını oluşturma"},
        {"id": "price_optimization", "description": "Toplam fiyat optimizasyonu"},
        {"id": "hotel_transfer_match", "description": "Otel ve transfer eşleştirme"},
        {"id": "reservation_generation", "description": "Rezervasyon üretimi"}
      ],
      "num_samples": 12,
      "voting_strategy": "plurality",
      "red_flagging": true
    },
    "payment_agent": {
      "tasks": [
        {"id": "payment_method_check", "description": "Ödeme yöntemi doğrulama"},
        {"id": "commission_calc", "description": "Komisyon hesaplama"},
        {"id": "api_call", "description": "API çağrısı ve onay"},
        {"id": "invoice_generation", "description": "Fatura oluşturma"}
      ],
      "num_samples": 12,
      "voting_strategy": "confidence_fused",
      "red_flagging": true
    },
    "crm_agent": {
      "tasks": [
        {"id": "customer_data_check", "description": "Müşteri verilerini kontrol etme"},
        {"id": "loyalty_points_calc", "description": "Loyalty puan hesaplama"},
        {"id": "campaign_suggestion", "description": "Kampanya önerisi üretme"},
        {"id": "email_qr_generation", "description": "E-posta ve QR üretimi"}
      ],
      "num_samples": 10,
      "voting_strategy": "plurality",
      "red_flagging": true
    },
    "yacht_tactical_agent": {
      "tasks": [
        {"id": "ais_parse", "description": "AIS verisini çözümle"},
        {"id": "wind_wave_analysis", "description": "Rüzgar ve dalga analizi"},
        {"id": "optimal_route_calc", "description": "En uygun rota hesapla"},
        {"id": "voice_alert_generation", "description": "Sesli uyarı üret"}
      ],
      "num_samples": 16,
      "voting_strategy": "confidence_fused",
      "red_flagging": true
    }
  },
  "general": {
    "auto_seal": true,
    "run_interval_hours": 24,
    "log_dir": "./logs",
    "temp_dir": "./temp",
    "adapter_update": true
  }
};

const generateInitialNodes = (config: AgentConfig): Node[] => {
    const initialNodes: Node[] = [
        { id: 'ada-central', name: 'Ada Koordinatör', type: NodeType.CENTRAL, status: 'online' },
    ];
    Object.keys(config.modules).forEach(agentId => {
        initialNodes.push({
            id: agentId,
            name: agentId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            type: agentId as NodeType, // Assuming NodeType enum matches agentId strings
            status: 'online',
            instanceName: 'Main'
        });
    });
    return initialNodes;
};


const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const CHECKPOINT_INTERVAL = 10;
const CHECKPOINT_KEY = 'adaNodeCheckpoint_v2';

export const useAdaNode = () => {
  const [agentConfig] = useState<AgentConfig>(AGENT_CONFIG);
  const [nodes, setNodes] = useState<Node[]>(() => generateInitialNodes(agentConfig));
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeConnections, setActiveConnections] = useState<[string, string][]>([]);
  const [errorConnections, setErrorConnections] = useState<[string, string][]>([]);
  const [logCounter, setLogCounter] = useState(0);
  
  // Deprecated state, can be removed if map is no longer needed.
  const [route, setRoute] = useState<any>(null);

  const addLog = useCallback((type: LogType, message: string, source?: string, details?: { voteDistribution?: Record<string, number> }) => {
    setLogs(prev => {
      const newLog: LogEntry = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toLocaleTimeString(),
        type,
        message,
        source,
        ...details
      };
      // Keep the log list from getting too large for performance
      const newLogs = [newLog, ...prev];
      if (newLogs.length > 200) {
        newLogs.pop();
      }
      return newLogs;
    });
    setLogCounter(prev => prev + 1); 
  }, []);

  const saveStateToLocalStorage = useCallback(() => {
    try {
        const stateToSave = { nodes, logs: logs.slice(0, 50), logCounter }; // Save only recent logs
        localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(stateToSave));
        addLog(LogType.INFO, 'State checkpoint saved.', 'System');
    } catch (error) {
        console.error("Failed to save checkpoint:", error);
    }
  }, [nodes, logs, logCounter, addLog]);
  
  const loadStateFromLocalStorage = useCallback(() => {
      try {
          const savedState = localStorage.getItem(CHECKPOINT_KEY);
          if (savedState) {
              const restoredState = JSON.parse(savedState);
              setNodes(restoredState.nodes || generateInitialNodes(agentConfig));
              setLogs(restoredState.logs || []);
              setLogCounter(restoredState.logCounter || 0);
              setLogs(prev => [
                { id: Date.now(), timestamp: new Date().toLocaleTimeString(), type: LogType.INFO, message: 'State restored from checkpoint.', source: 'System' }, 
                ...prev
              ]);
          } else {
            addLog(LogType.INFO, 'No checkpoint found.', 'System');
          }
      } catch (error) {
          console.error("Failed to load checkpoint:", error);
          addLog(LogType.ERROR, 'Failed to load checkpoint.', 'System');
      }
  }, [addLog, agentConfig]);

  useEffect(() => {
      if (logCounter > 0 && logCounter % CHECKPOINT_INTERVAL === 0) {
          saveStateToLocalStorage();
      }
  }, [logCounter, saveStateToLocalStorage]);
  
  const addNode = useCallback((type: NodeType, instanceName: string) => {
    const newNode: Node = {
        id: `${type}.${instanceName.toLowerCase().replace(/\s/g, '-')}-${Date.now()}`,
        name: `${type.replace(/_/g, ' ')} ${instanceName}`.replace(/\b\w/g, l => l.toUpperCase()),
        type,
        status: 'online',
        instanceName,
    };
    setNodes(prev => [...prev, newNode]);
    addLog(LogType.INFO, `New node cloned: ${newNode.name} (${type})`, 'Coordinator');
  }, [addLog]);

  const updateNodeStatus = useCallback((nodeId: string, status: Node['status']) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, status } : n));
  }, []);

  const simulateMeshCommunication = useCallback(async (
    fromNodeId: string,
    toNodeId: string,
    taskDescription: string,
    isVotingEnabled = false,
    voterCount = 3
  ) => {
    const fromNode = nodes.find(n => n.id === fromNodeId);
    const toNode = nodes.find(n => n.id === toNodeId);
    if (!fromNode || !toNode) throw new Error("Communication nodes not found.");

    setActiveConnections(prev => [...prev, [fromNodeId, toNodeId]]);
    updateNodeStatus(toNodeId, 'processing');
    await sleep(500);

    const requestPrompt = `As ${fromNode.name}, request ${toNode.name} to perform the task: '${taskDescription}'`;
    let finalResponseMsg: string;

    if (isVotingEnabled) {
        addLog(LogType.VOTING, `Running vote with ${voterCount} agents for task: ${taskDescription}`, fromNode.name);
        const votingPrompt = `You are an AI agent. Decide the next action for '${taskDescription}'. Your response MUST be a JSON object with "decision", "reason", and "confidence" (0.0-1.0). The 'decision' field MUST be one of: ['CONFIRM', 'REJECT', 'ABSTAIN']. Example: {"decision": "CONFIRM", "reason": "All prerequisites are met.", "confidence": 0.95}`;
        const voteResult = await performMajorityVote(votingPrompt, voterCount);

        const voteLogDetails = { voteDistribution: voteResult.voteDistribution };

        if (voteResult.isConsensus && voteResult.majorityDecision === 'confirm') {
            addLog(LogType.CONSENSUS, `Consensus: '${voteResult.majorityDecision}' (Confidence: ${voteResult.confidence.toFixed(2)})`, fromNode.name, voteLogDetails);
            finalResponseMsg = await generateContent(`As ${toNode.name}, generate a success confirmation for completing '${taskDescription}'.`);
        } else {
            const reason = voteResult.isConsensus ? `Consensus was to '${voteResult.majorityDecision}'` : 'No clear consensus reached';
            addLog(LogType.BACKTRACK, `${reason}. Backtracking operation. (Confidence: ${voteResult.confidence.toFixed(2)})`, fromNode.name, voteLogDetails);
            setErrorConnections(prev => [...prev, [fromNodeId, toNodeId]]);
            throw new Error(`Consensus failed or rejected for ${toNode.name}.`);
        }
    } else {
        const requestMsg = await generateContent(requestPrompt);
        addLog(LogType.REQUEST, requestMsg, fromNode.name);
        await sleep(1000);
        addLog(LogType.ACK, `'${taskDescription}' task received and is being processed.`, toNode.name);
        await sleep(500);
        finalResponseMsg = await generateContent(`As ${toNode.name}, generate a response for completing '${taskDescription}'.`);
    }
    
    addLog(LogType.RESPONSE, finalResponseMsg, toNode.name);
    updateNodeStatus(toNodeId, 'online');
    await sleep(500);
  }, [addLog, updateNodeStatus, nodes]);

  const executeTask = useCallback(async (taskDetails: TaskDetails, isVotingEnabled: boolean, voterCount: number) => {
    setIsProcessing(true);
    setErrorConnections([]);
    
    const { agentId, task } = taskDetails;
    const taskDescription = task.description;
    
    addLog(LogType.INFO, `Task injected: '${taskDescription}' on Agent '${agentId}'`, 'Observer');
    await sleep(200);
    addLog(LogType.INFO, `Connecting via fastRTC Katmanı... (MAKER Mode: ${isVotingEnabled ? `ON, Voters: ${voterCount}` : 'OFF'})`, 'Coordinator');
    await sleep(500);

    try {
      const coordinatorId = 'ada-central';
      
      // Simulate a simple 2-step process: Coordinator delegates to the selected agent.
      await simulateMeshCommunication(coordinatorId, agentId, taskDescription, isVotingEnabled, voterCount);
      
      const finalMsg = await generateContent(`Generate a final success message for orchestrating the agent '${agentId}' to complete the task: '${taskDescription}'.`);
      addLog(LogType.SUCCESS, finalMsg, 'Coordinator');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      addLog(LogType.ERROR, `Task failed: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
      setActiveConnections([]);
    }
  }, [addLog, simulateMeshCommunication]);

  return { nodes, agentConfig, logs, route, isProcessing, executeTask, activeConnections, addNode, loadStateFromLocalStorage, errorConnections, addLog };
};
