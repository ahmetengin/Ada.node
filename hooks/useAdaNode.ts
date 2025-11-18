import { useState, useCallback, useEffect } from 'react';
import { Node, NodeType, LogEntry, LogType, TaskDetails, AgentFrameworkConfig, ToolOutput, TaskContext } from '../types';
import { generateContent } from '../services/geminiService';
import { performMajorityVote } from '../services/votingService';
import { FastRTCService } from '../services/fastRTCService';
import { AGENT_FRAMEWORK_CONFIG } from '../services/agentFrameworkConfig';
import { simulateProviderResponse } from '../services/providerSimulationService';
import { fetchCustomerProfile } from '../services/crmSimulationService';

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
    return initialNodes;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const CHECKPOINT_KEY = 'adaNodeCheckpoint_v4_hyper';

export const useAdaNode = () => {
  const [agentFrameworkConfig] = useState<AgentFrameworkConfig>(AGENT_FRAMEWORK_CONFIG);
  const [nodes, setNodes] = useState<Node[]>(() => generateInitialNodes(agentFrameworkConfig));
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeConnections, setActiveConnections] = useState<[string, string][]>([]);
  const [errorConnections, setErrorConnections] = useState<[string, string][]>([]);
  const [fastRTC, setFastRTC] = useState<FastRTCService | null>(null);

  const addLog = useCallback((type: LogType, message: string, source?: string, details?: Omit<Partial<LogEntry>, 'id' | 'timestamp' | 'type' | 'message' | 'source'>) => {
    setLogs(prev => {
      const newLog: LogEntry = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toLocaleTimeString(),
        type,
        message,
        source,
        ...details
      };
      return [newLog, ...prev.slice(0, 199)];
    });
  }, []);

  const saveStateToLocalStorage = useCallback(() => {
    try {
        const stateToSave = { nodes, logs: logs.slice(0, 50) };
        localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(stateToSave));
    } catch (error) {
        console.error("Failed to save checkpoint:", error);
    }
  }, [nodes, logs]);
  
  const loadStateFromLocalStorage = useCallback(() => {
      try {
          const savedState = localStorage.getItem(CHECKPOINT_KEY);
          if (savedState) {
              const restoredState = JSON.parse(savedState);
              setNodes(restoredState.nodes || generateInitialNodes(agentFrameworkConfig));
              setLogs(restoredState.logs || []);
              addLog(LogType.INFO, 'State restored from checkpoint.', 'System');
          } else {
            addLog(LogType.INFO, 'No checkpoint found.', 'System');
          }
      } catch (error) {
          addLog(LogType.ERROR, 'Failed to load checkpoint.', 'System');
      }
  }, [addLog, agentFrameworkConfig]);

  const updateNodeStatus = useCallback((nodeId: string, status: Node['status']) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, status } : n));
  }, []);

  const handleRequestTimeout = useCallback(({ requestId, from, to }: { requestId: string, from: string, to: string }) => {
    addLog(LogType.TIMEOUT, `Request to node '${to}' timed out.`, 'fastRTC', { requestId });
    setErrorConnections(prev => [...prev, [from, to]]);
    updateNodeStatus(to, 'offline');
  }, [addLog, updateNodeStatus]);

   useEffect(() => {
    setFastRTC(new FastRTCService((...args) => addLog(...args), handleRequestTimeout));
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

  const executeTask = useCallback(async (taskDetails: TaskDetails, isVotingEnabled: boolean) => {
    setIsProcessing(true);
    setErrorConnections([]);
    const coordinatorId = 'ada-central';
    let context: TaskContext = taskDetails.initialContext || {};
    
    addLog(LogType.INFO, `Task injected: Agent '${taskDetails.agentId}', Skill '${taskDetails.skillId}'`, 'Observer');

    try {
        // Step 1: Proactive Context Enrichment (if customer context is available)
        if (context.customerName) {
            addLog(LogType.WORKFLOW_STEP, `Initiating customer profile lookup for '${context.customerName}'.`, 'MCP');
            updateNodeStatus(NodeType.CRM_AGENT, 'processing');
            context.customerProfile = await fetchCustomerProfile(context.customerName);
            updateNodeStatus(NodeType.CRM_AGENT, 'online');
            if (context.customerProfile) {
                addLog(LogType.CONTEXT_ENRICHMENT, `Customer profile for '${context.customerName}' retrieved. Preferences: ${context.customerProfile.preferences.airline}, ${context.customerProfile.preferences.class_preference} Class.`, 'CRM Agent');
            } else {
                 addLog(LogType.ERROR, `Customer profile for '${context.customerName}' not found. Proceeding with generic data.`, 'CRM Agent');
            }
        }

        // Step 2: Intelligent Provider & Tool Selection based on Context
        const { agentId, skillId } = taskDetails;
        const skill = agentFrameworkConfig.modules[agentId]?.skills.find(s => s.id === skillId);
        if (!skill) throw new Error(`Skill not found.`);

        let providersToRun = skill.providerIds;
        if (context.customerProfile?.preferences?.airline === 'THY') {
             addLog(LogType.MCP_DECISION, `Customer preference detected. Prioritizing 'turkish_airlines' provider.`, 'MCP');
             providersToRun = ['turkish_airlines'];
        }

        const toolsToRun = providersToRun.flatMap(pId => 
            agentFrameworkConfig.providers[pId]?.supportedToolIds.map(tId => ({ providerId: pId, toolId: tId })) || []
        );
        addLog(LogType.TOOL_SELECTION, `MCP selected ${toolsToRun.length} tool(s): ${toolsToRun.map(t => t.toolId).join(', ')}`, 'MCP');
        
        // Step 3: Dynamic Workflow Execution (Simulated)
        const toolOutputs: ToolOutput[] = [];
        for (const { providerId, toolId } of toolsToRun) {
            addLog(LogType.WORKFLOW_STEP, `Executing tool '${toolId}' via provider '${providerId}'.`, 'MCP');
            updateNodeStatus(providerId, 'processing');
            setActiveConnections(prev => [...prev, [coordinatorId, providerId]]);

            // Simulate tool execution with context
            const { response, data } = await simulateProviderResponse(toolId, context);
            context = { ...context, ...data }; // Merge new data into context for next steps
            toolOutputs.push({ toolId, providerId, response, data });
            
            updateNodeStatus(providerId, 'online');
            await sleep(1000); // Simulate network latency
        }
        
        // Step 4: Final Consensus with Single API Call (if MAKER mode)
        let finalDecision: string;
        if (isVotingEnabled) {
            addLog(LogType.THINKING, `Compiling simulated data for final consensus check...`, 'MCP');
            const prompt = `You are a master coordinator. Based on the following data from multiple providers, what is the final, single best course of action and why? Data: ${JSON.stringify(toolOutputs.map(o=>o.data))}`;
            finalDecision = await generateContent(prompt);
            addLog(LogType.CONSENSUS, `Final decision from AI coordinator: ${finalDecision}`, 'Gemini');
        } else {
            finalDecision = `Task completed successfully based on provider data. ${toolOutputs.map(o=>o.data?.summary).join(' ')}`;
        }
        
        // Step 5: SEAL Operation
        if (agentFrameworkConfig.general.auto_seal) {
            addLog(LogType.SEAL, `Sealing operation results for skill '${skillId}'.`, 'MCP');
            providersToRun.forEach(id => updateNodeStatus(id, 'sealing'));
            await sleep(1500);
            
            addLog(LogType.SUCCESS, finalDecision, 'Coordinator');
            saveStateToLocalStorage();
            addLog(LogType.INFO, 'State checkpoint saved.', 'System');

            providersToRun.forEach(id => updateNodeStatus(id, 'online'));
        } else {
            addLog(LogType.SUCCESS, finalDecision, 'Coordinator');
        }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      addLog(LogType.ERROR, `Task failed: ${errorMessage}`, 'MCP');
    } finally {
      setIsProcessing(false);
      setActiveConnections([]);
    }
  }, [addLog, agentFrameworkConfig, saveStateToLocalStorage, updateNodeStatus]);
  
  const executeTaskBatch = useCallback(async () => {
    addLog(LogType.INFO, `Batch execution is not compatible with this architecture. Please run tasks individually.`, 'System');
  }, [addLog]);

  return { nodes, agentFrameworkConfig, logs, isProcessing, executeTask, executeTaskBatch, activeConnections, addNode, loadStateFromLocalStorage, errorConnections, addLog };
};
