import { useState, useCallback } from 'react';
import { Node, NodeType, Skill, LogEntry, LogType, GeoPoint, RouteData, TaskDetails } from '../types';
import { generateContent } from '../services/geminiService';

const INITIAL_NODES: Node[] = [
  { id: 'ada-central', name: 'Ada Koordinatör', type: NodeType.CENTRAL, status: 'online' },
  { id: 'ada-sea-01', name: 'Ada.Sea', type: NodeType.SEA, status: 'online' },
  { id: 'ada-marina-01', name: 'Ada.Marina', type: NodeType.MARINA, status: 'online' },
  { id: 'ada-weather-01', name: 'Ada.Weather', type: NodeType.WEATHER, status: 'online' },
];

const INITIAL_SKILLS: Omit<Skill, 'execute'>[] = [
  { name: 'routePlanning', description: 'Rota planlama ve hava tahmini entegrasyonu', level: 5 },
  { name: 'bookingAssistance', description: 'Rezervasyon yardımı (berth, otel)', level: 4 },
  { name: 'bookingConfirmation', description: 'Marina rıhtım rezervasyonunu onaylar', level: 3 },
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

export const useAdaNode = () => {
  const [nodes, setNodes] = useState<Node[]>(INITIAL_NODES);
  const [skills, setSkills] = useState<Omit<Skill, 'execute'>[]>(INITIAL_SKILLS);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [route, setRoute] = useState<RouteData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeSkill, setActiveSkill] = useState<string | null>(null);
  const [activeConnections, setActiveConnections] = useState<[string, string][]>([]);
  
  const addLog = useCallback((type: LogType, message: string, source?: string) => {
    setLogs(prev => [
      {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        type,
        message,
        source
      },
      ...prev,
    ]);
  }, []);
  
  const addNode = useCallback((type: NodeType, instanceName: string) => {
    let displayName = instanceName;
    if (type === NodeType.MARINA) displayName = `Marina ${instanceName}`;
    if (type === NodeType.SEA) displayName = `Yacht ${instanceName}`;
    if (type === NodeType.FINANCE) displayName = `Finance ${instanceName}`;

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
    ackMessage: string
  ) => {
    const fromNode = nodes.find(n => n.id === fromNodeId);
    const toNode = nodes.find(n => n.id === toNodeId);
    if (!fromNode || !toNode) throw new Error("İletişim için düğümler bulunamadı.");

    const maxRetries = 3;
    const failureChance = 0.2; // 20% chance of failure

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        setActiveConnections(prev => [...prev, [fromNodeId, toNodeId]]);
        updateNodeStatus(toNodeId, 'processing');
        await sleep(500);

      if (Math.random() > failureChance || attempt === maxRetries) {
        // Success
        const requestMsg = await generateContent(requestPrompt);
        addLog(LogType.REQUEST, requestMsg, toNode.name);
        await sleep(1000);

        addLog(LogType.ACK, ackMessage, toNode.name);
        await sleep(500);

        const responseMsg = await generateContent(responsePrompt);
        addLog(LogType.RESPONSE, responseMsg, toNode.name);
        updateNodeStatus(toNodeId, 'online');
        setActiveConnections(prev => prev.filter(c => !(c.includes(fromNodeId) && c.includes(toNodeId))));
        await sleep(500);
        return; // Exit on success
      } else {
        // Failure
        updateNodeStatus(toNodeId, 'online');
        setActiveConnections(prev => prev.filter(c => !(c.includes(fromNodeId) && c.includes(toNodeId))));
        addLog(LogType.ERROR, `İletişim hatası: ${toNode.name} yanıt vermedi. (Deneme ${attempt}/${maxRetries})`, fromNode.name);
        await sleep(500);

        if (attempt < maxRetries) {
          addLog(LogType.RETRY, `2 saniye içinde yeniden denenecek...`, fromNode.name);
          await sleep(2000);
        }
      }
    }
    
    throw new Error(`${toNode.name} ile ${maxRetries} denemeden sonra iletişim kurulamadı.`);
  }, [addLog, updateNodeStatus, nodes]);

  const executeTask = useCallback(async (task: TaskDetails) => {
    setIsProcessing(true);
    setActiveSkill(task.skillName);
    addLog(LogType.INFO, `Yeni görev başlatıldı: ${task.skillName}`);
    addLog(LogType.INFO, `Bağlantı FastRTC mesh protokolü üzerinden kuruluyor...`, 'Ada Koordinatör');

    if (task.skillName === 'routePlanning') setRoute(null); // Clear previous route
    await sleep(500);

    try {
      const coordinatorId = 'ada-central';
      switch (task.skillName) {
        case 'routePlanning': {
            const fromCoords = geocodeCity(task.from);
            const toCoords = geocodeCity(task.to);
            if (!fromCoords || !toCoords) {
              throw new Error(`Konumlar bulunamadı: ${!fromCoords ? task.from : ''} ${!toCoords ? task.to : ''}`);
            }

            const weatherNode = nodes.find(n => n.type === NodeType.WEATHER);
            if (!weatherNode) throw new Error("Weather node not found");

            await simulateMeshCommunication(
                coordinatorId,
                weatherNode.id,
                `Generate a futuristic log message for an AI coordinator requesting a weather forecast for a sea route from ${task.from} to ${task.to}. Keep it concise.`,
                `Generate a futuristic log message for a weather AI node responding with a positive forecast for a sea route. Mention low wind and clear skies. Keep it concise.`,
                `Hava durumu talebi alındı ve işleniyor.`
            );

            const seaNode = nodes.find(n => n.type === NodeType.SEA);
            if (!seaNode) throw new Error("Sea node not found");
            
            await simulateMeshCommunication(
                coordinatorId,
                seaNode.id,
                `Generate a log message for a sea navigation AI that is calculating the optimal route from ${task.from} to ${task.to} using the positive weather data.`,
                `Generate a success message confirming the route from ${task.from} to ${task.to} has been planned and transmitted to the vessel.`,
                `Rota planlama talebi alındı, hesaplanıyor.`
            );
            
            const successPrompt = `Generate a success message confirming the route from ${task.from} to ${task.to} has been planned and transmitted to the vessel.`;
            const successMsg = await generateContent(successPrompt);
            addLog(LogType.SUCCESS, successMsg, 'Ada Koordinatör');

            setRoute({
              from: { name: task.from, coords: fromCoords },
              to: { name: task.to, coords: toCoords },
            });
            break;
        }
        case 'bookingConfirmation': {
            const targetNode = nodes.find(n => n.id === task.targetNodeId);
            if (!targetNode) throw new Error(`Hedef düğüm bulunamadı: ${task.targetNodeId}`);
            
            await simulateMeshCommunication(
                coordinatorId,
                targetNode.id,
                `Generate a futuristic log message for an AI coordinator requesting a berth booking confirmation at ${task.location} for the vessel named '${task.vessel}'. Keep it concise.`,
                `Generate a futuristic log message for a marina AI node confirming a berth booking at ${task.location} for the vessel '${task.vessel}'. Include a unique confirmation ID. Keep it concise.`,
                `Rezervasyon talebi alındı. Müsaitlik kontrol ediliyor.`
            );

            const successPrompt = `Generate a success message confirming the booking at ${task.location} for '${task.vessel}' has been finalized and logged.`;
            const successMsg = await generateContent(successPrompt);
            addLog(LogType.SUCCESS, successMsg, 'Ada Koordinatör');
            break;
        }
        case 'bookingAssistance': {
            const targetNode = nodes.find(n => n.id === task.targetNodeId);
            if (!targetNode) throw new Error(`Hedef düğüm bulunamadı: ${task.targetNodeId}`);
            
            await simulateMeshCommunication(
                coordinatorId,
                targetNode.id,
                `Generate a futuristic log message for an AI coordinator requesting booking assistance for a '${task.service}' at '${task.location}'. Keep it concise.`,
                `Generate a futuristic log message for a marina AI node acknowledging the assistance request for a '${task.service}' at '${task.location}' and providing options. Keep it concise.`,
                `Yardım talebi alındı. Seçenekler aranıyor.`
            );

            const successPrompt = `Generate a success message confirming that assistance options for a '${task.service}' at '${task.location}' have been sent to the user's private channel.`;
            const successMsg = await generateContent(successPrompt);
            addLog(LogType.SUCCESS, successMsg, 'Ada Koordinatör');
            break;
        }
        case 'vesselStatusCheck': {
            const targetNode = nodes.find(n => n.id === task.targetNodeId);
            if (!targetNode) throw new Error(`Hedef yat düğümü bulunamadı: ${task.targetNodeId}`);
            
            await simulateMeshCommunication(
                coordinatorId,
                targetNode.id,
                `Generate a futuristic log message for an AI coordinator requesting a full status and telemetry check for the vessel '${targetNode.name}'.`,
                `Generate a futuristic log message for a vessel's AI node responding with nominal status. Mention engine temp, battery level, and current coordinates. Be creative.`,
                `Durum sorgusu alındı. Telemetri verileri toplanıyor.`
            );

            const successPrompt = `Generate a short success message confirming that the status report for vessel '${targetNode.name}' has been received and logged.`;
            const successMsg = await generateContent(successPrompt);
            addLog(LogType.SUCCESS, successMsg, 'Ada Koordinatör');
            break;
        }
        case 'transactionQuery': {
            const targetNode = nodes.find(n => n.id === task.targetNodeId);
            if (!targetNode) throw new Error(`Hedef finans düğümü bulunamadı: ${task.targetNodeId}`);
            
            await simulateMeshCommunication(
                coordinatorId,
                targetNode.id,
                `Generate a futuristic log message for an AI coordinator querying the internal observer of '${targetNode.name}' regarding: '${task.details}'.`,
                `Generate a futuristic log from the internal observer of '${targetNode.name}' responding to the query. State that the query is complete and results are encrypted. Be creative.`,
                `İşlem sorgusu alındı. '${targetNode.name}' iç gözlemcisiyle bağlantı kuruluyor.`
            );

            const successPrompt = `Generate a short success message confirming that the transaction query for '${targetNode.name}' has been successfully completed by its internal observer.`;
            const successMsg = await generateContent(successPrompt);
            addLog(LogType.SUCCESS, successMsg, 'Ada Koordinatör');
            break;
        }
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

  return { nodes, skills, logs, route, isProcessing, executeTask, activeSkill, activeConnections, addNode };
};