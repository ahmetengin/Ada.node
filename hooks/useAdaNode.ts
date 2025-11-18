import { useState, useCallback, useEffect } from 'react';
import { Node, NodeType, LogEntry, LogType, TaskDetails, AgentFrameworkConfig, ToolOutput } from '../types';
import { generateContent, generateVotableContent } from '../services/geminiService';
import { performMajorityVote } from '../services/votingService';
import { FastRTCService } from '../services/fastRTCService';

const AGENT_FRAMEWORK_CONFIG: AgentFrameworkConfig = {
  "tools": {
    "amadeus_flight_search": { "id": "amadeus_flight_search", "description": "Amadeus GDS üzerinden uçuş arar." },
    "sabre_flight_search": { "id": "sabre_flight_search", "description": "Sabre GDS üzerinden uçuş arar." },
    "kites_aggregator": { "id": "kites_aggregator", "description": "KAYAK gibi toplayıcılardan en ucuz uçuşları bulur." },
    "bookingcom_hotel_search": { "id": "bookingcom_hotel_search", "description": "Booking.com üzerinden otel arar." },
    "expedia_hotel_search": { "id": "expedia_hotel_search", "description": "Expedia üzerinden otel arar." }
  },
  "providers": {
    "amadeus": { "id": "amadeus", "description": "Amadeus Global Distribution System", "supportedToolIds": ["amadeus_flight_search"] },
    "sabre": { "id": "sabre", "description": "Sabre Global Distribution System", "supportedToolIds": ["sabre_flight_search"] },
    "sky_scanner": { "id": "sky_scanner", "description": "SkyScanner Flight Aggregator", "supportedToolIds": ["kites_aggregator"] },
    "booking_com": { "id": "booking_com", "description": "Booking.com Hotel Provider", "supportedToolIds": ["bookingcom_hotel_search"] },
    "expedia": { "id": "expedia", "description": "Expedia Hotel Provider", "supportedToolIds": ["expedia_hotel_search"] }
  },
  "modules": {
    "travel_agent": {
      "skills": [
        { "id": "flight_booking", "description": "Uçuş Rezervasyonu", "providerIds": ["amadeus", "sabre", "sky_scanner"] },
        { "id": "hotel_booking", "description": "Otel Rezervasyonu", "providerIds": ["booking_com", "expedia"] }
      ],
      "voting_strategy": "plurality",
      "red_flagging": true
    },
    "payment_agent": {
      "skills": [],
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

const generateInitialNodes = (config: AgentFrameworkConfig): Node[] => {
    const initialNodes: Node[] = [
        { id: 'ada-central', name: 'Ada Koordinatör', type: NodeType.CENTRAL, status: 'online' },
    ];
    Object.keys(config.modules).forEach(agentId => {
        initialNodes.push({
            id: agentId,
            name: agentId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            type: agentId as NodeType,
            status: 'online',
            instanceName: 'Main'
        });
    });
    // Add provider nodes
    Object.values(config.providers).forEach(provider => {
        initialNodes.push({
            id: provider.id,
            name: provider.description,
            type: NodeType.GENERIC, // Or a new NodeType.PROVIDER
            status: 'online',
            instanceName: 'Provider'
        });
    });
    return initialNodes;
};


const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const CHECKPOINT_INTERVAL = 10;
const CHECKPOINT_KEY = 'adaNodeCheckpoint_v3';

export const useAdaNode = () => {
  const [agentFrameworkConfig] = useState<AgentFrameworkConfig>(AGENT_FRAMEWORK_CONFIG);
  const [nodes, setNodes] = useState<Node[]>(() => generateInitialNodes(agentFrameworkConfig));
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeConnections, setActiveConnections] = useState<[string, string][]>([]);
  const [errorConnections, setErrorConnections] = useState<[string, string][]>([]);
  const [logCounter, setLogCounter] = useState(0);
  const [fastRTC, setFastRTC] = useState<FastRTCService | null>(null);
  
  const [route, setRoute] = useState<any>(null);

  const addLog = useCallback((type: LogType, message: string, source?: string, details?: { 
    voteDistribution?: Record<string, number>,
    requestId?: string,
    responseTimeMs?: number,
    direction?: 'inbound' | 'outbound',
   }) => {
    setLogs(prev => {
      const newLog: LogEntry = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toLocaleTimeString(),
        type,
        message,
        source,
        ...details
      };
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
        const stateToSave = { nodes, logs: logs.slice(0, 50), logCounter };
        localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(stateToSave));
        // We avoid logging here to prevent recursive loops with the log counter
    } catch (error) {
        console.error("Failed to save checkpoint:", error);
    }
  }, [nodes, logs, logCounter]);
  
  const loadStateFromLocalStorage = useCallback(() => {
      try {
          const savedState = localStorage.getItem(CHECKPOINT_KEY);
          if (savedState) {
              const restoredState = JSON.parse(savedState);
              setNodes(restoredState.nodes || generateInitialNodes(agentFrameworkConfig));
              setLogs(restoredState.logs || []);
              setLogCounter(restoredState.logCounter || 0);
              addLog(LogType.INFO, 'State restored from checkpoint.', 'System');
          } else {
            addLog(LogType.INFO, 'No checkpoint found.', 'System');
          }
      } catch (error) {
          console.error("Failed to load checkpoint:", error);
          addLog(LogType.ERROR, 'Failed to load checkpoint.', 'System');
      }
  }, [addLog, agentFrameworkConfig]);

  useEffect(() => {
      if (logCounter > 0 && logCounter % CHECKPOINT_INTERVAL === 0) {
          saveStateToLocalStorage();
      }
  }, [logCounter, saveStateToLocalStorage]);

  const updateNodeStatus = useCallback((nodeId: string, status: Node['status']) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, status } : n));
  }, []);

  const handleRequestTimeout = useCallback(({ requestId, from, to }: { requestId: string, from: string, to: string }) => {
    addLog(LogType.TIMEOUT, `Request to node '${to}' timed out.`, 'fastRTC', { requestId });
    setErrorConnections(prev => [...prev, [from, to]]);
    updateNodeStatus(to, 'offline');
  }, [addLog, updateNodeStatus]);

   useEffect(() => {
    const rtcLogCallback: any = (type: LogType, message: string, source: string, details: any) => {
        addLog(type, message, source, details);
    };
    
    setFastRTC(new FastRTCService(rtcLogCallback, handleRequestTimeout));
  }, [addLog, handleRequestTimeout]);
  
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


  // ==================================================================
  // MCP (Master Control Program) Core Logic
  // ==================================================================
  const executeTask = useCallback(async (taskDetails: TaskDetails, isVotingEnabled: boolean, voterCount: number) => {
    setIsProcessing(true);
    setErrorConnections([]);

    const { agentId, skillId, providerId, toolId } = taskDetails;
    if (!agentId || !skillId) {
        addLog(LogType.ERROR, "Task execution requires at least an Agent and a Skill.", 'MCP');
        setIsProcessing(false);
        return;
    }

    addLog(LogType.INFO, `Task injected: Agent '${agentId}', Skill '${skillId}'`, 'Observer');
    addLog(LogType.INFO, `Execution parameters: MAKER Mode: ${isVotingEnabled ? `ON` : 'OFF'}`, 'System');
    
    const involvedProviderIds = new Set<string>();

    const sealOperation = async (finalMessage: string) => {
        if (agentFrameworkConfig.general.auto_seal) {
            addLog(LogType.SEAL, `Sealing operation results for skill '${skillId}'.`, 'MCP');
            const nodesToSeal = Array.from(involvedProviderIds);
            nodesToSeal.forEach(id => updateNodeStatus(id, 'sealing'));
            await sleep(1500); // Visual delay for sealing effect
            
            addLog(LogType.SUCCESS, finalMessage, 'Coordinator');
            saveStateToLocalStorage(); // Persist the final state
            addLog(LogType.INFO, 'State checkpoint saved.', 'System');

            nodesToSeal.forEach(id => updateNodeStatus(id, 'online'));
        } else {
            addLog(LogType.INFO, `Auto-seal disabled. Skipping state save.`, 'System');
            addLog(LogType.SUCCESS, finalMessage, 'Coordinator');
        }
    };

    try {
        const agent = agentFrameworkConfig.modules[agentId];
        const skill = agent.skills.find(s => s.id === skillId);
        if (!skill) throw new Error(`Skill '${skillId}' not found for agent '${agentId}'.`);

        // --- MCP Tool Selection ---
        let providersToRun = skill.providerIds;
        if (providerId) { // User selected a specific provider
            providersToRun = [providerId];
        }
        
        const toolsToRun: { providerId: string, toolId: string }[] = [];
        for (const pId of providersToRun) {
            involvedProviderIds.add(pId);
            const provider = agentFrameworkConfig.providers[pId];
            if (provider) {
                if (toolId && provider.supportedToolIds.includes(toolId)) { // User selected a specific tool
                    toolsToRun.push({ providerId: pId, toolId: toolId });
                } else if (!toolId) { // Run all tools for the provider
                    provider.supportedToolIds.forEach(tId => toolsToRun.push({ providerId: pId, toolId: tId }));
                }
            }
        }
        
        if (toolsToRun.length === 0) {
            throw new Error(`No compatible tools found for the selection.`);
        }

        addLog(LogType.TOOL_SELECTION, `MCP selected ${toolsToRun.length} tool(s) for skill '${skillId}': ${toolsToRun.map(t => t.toolId).join(', ')}`, 'MCP');
        
        // --- Tool Execution ---
        const coordinatorId = 'ada-central';
        const toolOutputs: ToolOutput[] = [];

        let toolIndex = 0;
        for (const { providerId, toolId } of toolsToRun) {
            updateNodeStatus(providerId, 'processing');
            setActiveConnections(prev => [...prev, [coordinatorId, providerId]]);
            
            const tool = agentFrameworkConfig.tools[toolId];
            const taskDescription = tool.description;
            const requestId = fastRTC!.handleOutbound(coordinatorId, providerId, taskDescription);

            try {
                const prompt = `You are the tool '${toolId}'. Execute the task: '${taskDescription}'. Your response MUST be a JSON object with "decision", "reason", and "confidence" (0.0-1.0).`;
                const result = await generateVotableContent(prompt);
                toolOutputs.push({ toolId, providerId, response: result });
                fastRTC!.handleInbound(requestId, `Tool '${toolId}' completed successfully.`);
            } catch (e) {
                const errorMsg = e instanceof Error ? e.message : 'Unknown tool error';
                toolOutputs.push({ toolId, providerId, response: null });
                fastRTC!.handleInbound(requestId, `Tool '${toolId}' failed: ${errorMsg}`);
                setErrorConnections(prev => [...prev, [coordinatorId, providerId]]);
            } finally {
                updateNodeStatus(providerId, 'online');
            }

            // Add delay if it's not the last tool to prevent rate limiting
            if (toolIndex < toolsToRun.length - 1) {
                await sleep(6000); 
            }
            toolIndex++;
        }
        
        // --- Consensus & Sealing ---
        if (isVotingEnabled) {
            addLog(LogType.VOTING, `Running consensus vote on ${toolOutputs.length} tool outputs...`, 'MCP');
            const voteResult = performMajorityVote(toolOutputs);
            
            if (voteResult.isConsensus && voteResult.majorityDecision === 'confirm') {
                addLog(LogType.CONSENSUS, `Consensus: '${voteResult.majorityDecision}' (Confidence: ${voteResult.confidence.toFixed(2)})`, 'MCP', { voteDistribution: voteResult.voteDistribution });
                const finalMessage = `Consensus reached. Task '${skill.description}' successfully executed.`;
                await sealOperation(finalMessage);
            } else {
                 const reason = voteResult.isConsensus ? `Consensus was to '${voteResult.majorityDecision}'` : 'No clear consensus reached';
                 addLog(LogType.BACKTRACK, `${reason}. Backtracking operation.`, 'MCP', { voteDistribution: voteResult.voteDistribution });
                 throw new Error(`Consensus failed or was rejected.`);
            }
        } else {
            const finalMessage = `Task '${skill.description}' completed without consensus check.`;
            await sealOperation(finalMessage);
        }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      addLog(LogType.ERROR, `Task failed: ${errorMessage}`, 'MCP');
    } finally {
      setIsProcessing(false);
      setActiveConnections([]);
    }
  }, [addLog, agentFrameworkConfig, fastRTC, saveStateToLocalStorage, updateNodeStatus]);
  
  const executeTaskBatch = useCallback(async (tasks: TaskDetails[], isVotingEnabled: boolean, voterCount: number) => {
    addLog(LogType.INFO, `Batch execution is not compatible with the new MCP architecture. Please run tasks individually.`, 'System');
  }, [addLog]);


  return { nodes, agentFrameworkConfig, logs, route, isProcessing, executeTask, executeTaskBatch, activeConnections, addNode, loadStateFromLocalStorage, errorConnections, addLog };
};