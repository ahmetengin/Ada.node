import { useState, useCallback } from 'react';
import { Node, NodeType, Skill, LogEntry, LogType, GeoPoint, RouteData, TaskDetails } from '../types';
import { generateContent } from '../services/geminiService';

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
        addLog(LogType.REQUEST, requestMsg, fromNode.name);
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
    addLog(LogType.INFO, `Gözlemci tarafından yeni görev enjekte edildi: ${task.skillName}`, 'Observer');
    await sleep(200);
    addLog(LogType.INFO, `Bağlantı FastRTC mesh protokolü üzerinden kuruluyor...`, 'Ada Koordinatör');

    if (task.skillName === 'routePlanning' || task.skillName === 'fullItinerary') setRoute(null); // Clear previous route
    await sleep(500);

    try {
      const coordinatorId = 'ada-central';
      switch (task.skillName) {
        case 'congressOrganization': {
            const { eventName, targetCongressNodeId, targetPasskitNodeId, targetFinanceNodeId, targetInterpreterNodeId, targetRestaurantNodeId, targetHukukNodeId } = task;
            const congressNode = nodes.find(n => n.id === targetCongressNodeId);
            const passkitNode = nodes.find(n => n.id === targetPasskitNodeId);
            const financeNode = nodes.find(n => n.id === targetFinanceNodeId);
            const interpreterNode = nodes.find(n => n.id === targetInterpreterNodeId);
            const restaurantNode = nodes.find(n => n.id === targetRestaurantNodeId);
            const hukukNode = nodes.find(n => n.id === targetHukukNodeId);

            if (!congressNode || !passkitNode || !financeNode || !interpreterNode || !restaurantNode || !hukukNode) {
                throw new Error("Kongre organizasyonu için gerekli tüm uzman düğümler ağda bulunamadı.");
            }

            addLog(LogType.THINKING, `'${eventName}' kongresi için plan oluşturuluyor...`, 'Ada Koordinatör');
            await sleep(1000);
            addLog(LogType.THINKING, `[1/6] Ana organizasyon ve mekan planlaması için '${congressNode.name}' görevlendirilecek.`, 'Ada Koordinatör');
            await sleep(500);
            addLog(LogType.THINKING, `[2/6] Katılımcı biletleri ve QR geçiş sistemleri '${passkitNode.name}' tarafından oluşturulacak.`, 'Ada Koordinatör');
            await sleep(500);
            addLog(LogType.THINKING, `[3/6] Uluslararası katılımcılar için simultane çeviri hizmetleri '${interpreterNode.name}' ile organize edilecek.`, 'Ada Koordinatör');
            await sleep(500);
            addLog(LogType.THINKING, `[4/6] Gala yemeği ve catering hizmetleri '${restaurantNode.name}' ile planlanacak.`, 'Ada Koordinatör');
            await sleep(500);
            addLog(LogType.THINKING, `[5/6] Tedarikçi sözleşmelerinin yasal uygunluğu '${hukukNode.name}' tarafından denetlenecek.`, 'Ada Koordinatör');
            await sleep(500);
            addLog(LogType.THINKING, `[6/6] Tüm bütçe ve ödeme akışı '${financeNode.name}' üzerinden yönetilecek ve onaylanacak.`, 'Ada Koordinatör');
            await sleep(1000);

            addLog(LogType.INFO, `Adım 1/6: Ana organizasyon başlatılıyor...`, 'Ada Koordinatör');
            await simulateMeshCommunication(coordinatorId, congressNode.id, `Request to initiate full planning for '${eventName}'.`, `Affirmative. Venue options and agenda draft are being prepared.`, `Kongre planlama talebi gönderiliyor.`);

            addLog(LogType.INFO, `Adım 2/6: Bilet sistemi kuruluyor...`, 'Ada Koordinatör');
            await simulateMeshCommunication(coordinatorId, passkitNode.id, `Request to set up ticketing and digital pass infrastructure for '${eventName}'.`, `Passkit system configured. Ready to issue secure digital passes.`, `Bilet sistemi kurulum talebi gönderiliyor.`);
            
            addLog(LogType.INFO, `Adım 3/6: Çeviri hizmetleri ayarlanıyor...`, 'Ada Koordinatör');
            await simulateMeshCommunication(coordinatorId, interpreterNode.id, `Request to arrange simultaneous interpretation services for 5 languages for '${eventName}'.`, `Top-tier interpreters for the required languages are booked.`, `Tercüman organizasyon talebi gönderiliyor.`);

            addLog(LogType.INFO, `Adım 4/6: Catering planlanıyor...`, 'Ada Koordinatör');
            await simulateMeshCommunication(coordinatorId, restaurantNode.id, `Request to plan a gala dinner and full-day catering for 500 attendees of '${eventName}'.`, `Menu proposals and staffing plans are being finalized.`, `Catering planlama talebi gönderiliyor.`);

            addLog(LogType.INFO, `Adım 5/6: Yasal denetim yapılıyor...`, 'Ada Koordinatör');
            await simulateMeshCommunication(coordinatorId, hukukNode.id, `Request for legal review of all vendor contracts for '${eventName}'.`, `All contracts have been reviewed and comply with regulations.`, `Sözleşme denetim talebi gönderiliyor.`);
            
            addLog(LogType.INFO, `Adım 6/6: Finansal onay alınıyor...`, 'Ada Koordinatör');
            await simulateMeshCommunication(coordinatorId, financeNode.id, `Request final budget approval and payment processing setup for all '${eventName}' vendors.`, `Budget approved. Vendor payment channels are active.`, `Bütçe onay talebi gönderiliyor.`);

            const finalMsg = await generateContent(`Generate a final, triumphant success message for a super-agent AI that has successfully orchestrated a massive international congress named '${eventName}', coordinating 6 different specialized AI agents.`);
            addLog(LogType.SUCCESS, finalMsg, 'Ada Koordinatör');
            break;
        }
        case 'weeklyReport': {
            const { targetDbNodeId, targetApiNodeId } = task;
            const dbNode = nodes.find(n => n.id === targetDbNodeId);
            const apiNode = nodes.find(n => n.id === targetApiNodeId);
            const cronNode = nodes.find(n => n.type === NodeType.CRON); // Get first available cron

            if (!dbNode || !apiNode || !cronNode) {
                throw new Error("Rapor için gerekli altyapı düğümleri bulunamadı (DB, API, Cron).");
            }
            
            // Step 1: THINKING process
            addLog(LogType.THINKING, `Haftalık rapor oluşturma görevi alındı. Yürütme planı oluşturuluyor...`, 'Ada Koordinatör');
            await sleep(1000);
            addLog(LogType.THINKING, `[1/3] Raporun haftalık otomatik oluşturulması için '${cronNode.name}' üzerinde bir görev zamanlanacak.`, 'Ada Koordinatör');
            await sleep(500);
            addLog(LogType.THINKING, `[2/3] Geçen haftanın operasyonel verileri '${dbNode.name}' veritabanından sorgulanacak.`, 'Ada Koordinatör');
            await sleep(500);
            addLog(LogType.THINKING, `[3/3] Raporu zenginleştirmek için '${apiNode.name}' üzerinden dış piyasa verileri çekilecek.`, 'Ada Koordinatör');
            await sleep(1000);

            // Step 2: Schedule with Cron
            addLog(LogType.INFO, `Adım 1/3: Görev zamanlayıcıya kaydediliyor...`, 'Ada Koordinatör');
            await simulateMeshCommunication(
                coordinatorId, cronNode.id,
                `Generate a log delegating a recurring weekly report generation task to the '${cronNode.name}'.`,
                `Generate a log from '${cronNode.name}' confirming the new cron job has been scheduled successfully.`,
                `Haftalık rapor görevi zamanlama talebi gönderiliyor.`
            );
            
            // Step 3: Fetch from Database
            addLog(LogType.INFO, `Adım 2/3: Veritabanından veri çekiliyor...`, 'Ada Koordinatör');
            await simulateMeshCommunication(
                coordinatorId, dbNode.id,
                `Generate a log requesting last week's full operational data (marina bookings, financial transactions) from the main database node '${dbNode.name}'.`,
                `Generate a log from '${dbNode.name}' confirming the data query was successful and a data package has been transmitted.`,
                `Veritabanı sorgusu gönderiliyor.`
            );

            // Step 4: Fetch from API
            addLog(LogType.INFO, `Adım 3/3: Harici API'den veri alınıyor...`, 'Ada Koordinatör');
            await simulateMeshCommunication(
                coordinatorId, apiNode.id,
                `Generate a log requesting current market trends and maritime news from the external API gateway '${apiNode.name}'.`,
                `Generate a log from '${apiNode.name}' confirming external data has been fetched and processed.`,
                `Harici veri talebi gönderiliyor.`
            );
            
            const finalMsg = await generateContent(`Generate a final, enthusiastic success message for an AI that has successfully orchestrated infrastructure nodes (Cron, DB, API) to generate a comprehensive weekly report.`);
            addLog(LogType.SUCCESS, finalMsg, 'Ada Koordinatör');

            break;
        }
        case 'fullItinerary': {
          const { from, to, targetMarinaNodeId, targetFinanceNodeId, targetTravelNodeId } = task;
          const fromCoords = geocodeCity(from);
          const toCoords = geocodeCity(to);
          if (!fromCoords || !toCoords) {
            throw new Error(`Konumlar bulunamadı: ${!fromCoords ? from : ''} ${!toCoords ? to : ''}`);
          }

          const seaNode = nodes.find(n => n.type === NodeType.SEA);
          const weatherNode = nodes.find(n => n.type === NodeType.WEATHER);
          const travelNode = nodes.find(n => n.id === targetTravelNodeId);
          const marinaNode = nodes.find(n => n.id === targetMarinaNodeId);
          const financeNode = nodes.find(n => n.id === targetFinanceNodeId);

          if (!seaNode || !weatherNode || !travelNode || !marinaNode || !financeNode) {
              throw new Error("Görevi tamamlamak için gerekli tüm düğümler ağda bulunamadı.");
          }

          // Step 1: THINKING process
          addLog(LogType.THINKING, `Tam seyahat planı oluşturma görevi alındı. Yürütme planı oluşturuluyor...`, 'Ada Koordinatör');
          await sleep(1000);
          addLog(LogType.THINKING, `[1/4] Deniz rotası, hava durumu kontrolüyle birlikte '${seaNode.name}' üzerinden planlanacak.`, 'Ada Koordinatör');
          await sleep(500);
          addLog(LogType.THINKING, `[2/4] Varış noktası olan '${to}' için rıhtım rezervasyonu '${marinaNode.name}' üzerinden yapılacak.`, 'Ada Koordinatör');
          await sleep(500);
          addLog(LogType.THINKING, `[3/4] Varış limanından kara transferi ve diğer seyahat işleri uzman acente '${travelNode.name}' ile organize edilecek.`, 'Ada Koordinatör');
          await sleep(500);
          addLog(LogType.THINKING, `[4/4] Tüm masraflar ve rezervasyonlar '${financeNode.name}' iç gözlemcisi üzerinden doğrulanacak.`, 'Ada Koordinatör');
          await sleep(1000);

          // Step 2: Route Planning
          addLog(LogType.INFO, `Adım 1/4: Rota planlama başlatılıyor...`, 'Ada Koordinatör');
          await simulateMeshCommunication(
              coordinatorId, seaNode.id,
              `Generate a log delegating full itinerary route planning from ${from} to ${to} to the '${seaNode.name}' node.`,
              `Generate a log from '${seaNode.name}' acknowledging the route task and stating it will now query weather.`,
              `Rota planlama görevi ${seaNode.name}'e devrediliyor.`
          );
          await simulateMeshCommunication(
              seaNode.id, weatherNode.id,
              `Generate a log from '${seaNode.name}' requesting weather for the ${from}-${to} route.`,
              `Generate a log from '${weatherNode.name}' providing a favorable weather forecast.`,
              `Hava durumu verisi talep ediliyor.`
          );
          setRoute({ from: { name: from, coords: fromCoords }, to: { name: to, coords: toCoords } });
          addLog(LogType.SUCCESS, `Deniz rotası başarıyla planlandı.`, seaNode.name);

          // Step 3: Marina Booking
          addLog(LogType.INFO, `Adım 2/4: Marina rezervasyonu yapılıyor...`, 'Ada Koordinatör');
          await simulateMeshCommunication(
              coordinatorId, marinaNode.id,
              `Generate a log requesting a high-priority berth booking at '${marinaNode.name}' for a vessel arriving from ${from}.`,
              `Generate a log from '${marinaNode.name}' confirming berth booking with a confirmation ID.`,
              `Rıhtım rezervasyon talebi gönderiliyor.`
          );

          // Step 4: Land Transfer via Travel Agent
          addLog(LogType.INFO, `Adım 3/4: Seyahat acentesi ile transfer organize ediliyor...`, 'Ada Koordinatör');
          await simulateMeshCommunication(
              coordinatorId, travelNode.id,
              `Generate a log requesting a professional travel agent ('${travelNode.name}') to arrange all necessary land transfers and other travel services at the destination, ${to}.`,
              `Generate a log from the travel agent '${travelNode.name}' confirming a luxury vehicle is arranged, along with flight and hotel options sent to a private channel.`,
              `Kara transferi ve diğer seyahat hizmetleri talebi gönderiliyor.`
          );

          // Step 5: Final Confirmation with Finance
          addLog(LogType.INFO, `Adım 4/4: Finansal onay alınıyor...`, 'Ada Koordinatör');
          await simulateMeshCommunication(
              coordinatorId, financeNode.id,
              `Generate a log requesting financial validation for the entire itinerary: Route, Marina at ${marinaNode.name}, and all services from ${travelNode.name}.`,
              `Generate a log from '${financeNode.name}' internal observer confirming all transactions are logged and budget is approved.`,
              `Tüm işlemlerin finansal onayı isteniyor.`
          );

          const finalMsg = await generateContent(`Generate a final, enthusiastic success message for a super-agent AI that has successfully planned a full itinerary from ${from} to ${to}, including sea route, marina booking, and travel services, all confirmed financially.`);
          addLog(LogType.SUCCESS, finalMsg, 'Ada Koordinatör');

          break;
        }
        case 'routePlanning': {
            const fromCoords = geocodeCity(task.from);
            const toCoords = geocodeCity(task.to);
            if (!fromCoords || !toCoords) {
              throw new Error(`Konumlar bulunamadı: ${!fromCoords ? task.from : ''} ${!toCoords ? task.to : ''}`);
            }

            const seaNode = nodes.find(n => n.type === NodeType.SEA);
            if (!seaNode) throw new Error("Sea (navigasyon) düğümü bulunamadı.");
            const weatherNode = nodes.find(n => n.type === NodeType.WEATHER);
            if (!weatherNode) throw new Error("Weather (hava durumu) düğümü bulunamadı.");
            
            // Step 1: Coordinator delegates the task to the Sea node.
            await simulateMeshCommunication(
                coordinatorId,
                seaNode.id,
                `Generate a log for an AI coordinator delegating route planning from ${task.from} to ${task.to} to the primary navigation node, '${seaNode.name}'.`,
                `Generate a log from a navigation AI ('${seaNode.name}') acknowledging the route planning task. State that it will now query the weather node for a forecast.`,
                `Rota planlama görevi ${seaNode.name} düğümüne devrediliyor.`
            );

            await sleep(500); // Visual pause

            // Step 2: Sea node directly communicates with the Weather node.
            addLog(LogType.INFO, `${seaNode.name} düğümü, hava durumu verisi için ${weatherNode.name} ile iletişim kuruyor...`, seaNode.name);
            await simulateMeshCommunication(
                seaNode.id, // <-- From Sea Node
                weatherNode.id, // <-- To Weather Node
                `Generate a log from a sea navigation AI ('${seaNode.name}') requesting a detailed weather forecast from the weather node for the route: ${task.from} to ${task.to}.`,
                `Generate a log from a weather AI ('${weatherNode.name}') responding with a positive forecast. Mention low wind and clear skies.`,
                `Hava durumu talebi alındı ve işleniyor.`
            );
            
            const successPrompt = `Generate a success message from the navigation AI ('${seaNode.name}') confirming the route from ${task.from} to ${task.to} has been planned using fresh weather data and transmitted to the vessel.`;
            const successMsg = await generateContent(successPrompt);
            addLog(LogType.SUCCESS, successMsg, seaNode.name);

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