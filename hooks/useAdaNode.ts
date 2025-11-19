import { useState, useCallback, useEffect } from 'react';
import { Node, NodeType, LogEntry, LogType, TaskDetails, AgentFrameworkConfig, ToolOutput, TaskContext, SystemMetrics } from '../types';
import { generateContent } from '../services/geminiService';
import { AGENT_FRAMEWORK_CONFIG } from '../services/agentFrameworkConfig';
import { simulateProviderResponse } from '../services/providerSimulationService';
import { fetchCustomerProfile } from '../services/crmSimulationService';

const generateInitialNodes = (config: AgentFrameworkConfig): Node[] => {
    const initialNodes: Node[] = [
        { id: 'ada.central', name: 'Ada Coordinator', type: NodeType.CENTRAL, status: 'online', lastActive: Date.now() },
    ];
    Object.keys(config.modules).forEach(agentId => {
        initialNodes.push({
            id: agentId,
            name: agentId,
            type: agentId as NodeType,
            status: 'online',
            instanceName: 'Main',
            lastActive: 0
        });
    });
    return initialNodes;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const CHECKPOINT_KEY = 'adaNodeCheckpoint_v6_ghostty';

export const useAdaNode = () => {
  const [agentFrameworkConfig] = useState<AgentFrameworkConfig>(AGENT_FRAMEWORK_CONFIG);
  const [nodes, setNodes] = useState<Node[]>(() => generateInitialNodes(agentFrameworkConfig));
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeConnections, setActiveConnections] = useState<[string, string][]>([]);
  const [errorConnections, setErrorConnections] = useState<[string, string][]>([]);
  
  // New Metrics State
  const [metrics, setMetrics] = useState<SystemMetrics>({
      totalTasks: 0,
      successfulTasks: 0,
      failedTasks: 0,
      totalTokens: 0,
      totalLatencyMs: 0,
      activeAgents: 0,
      avgConfidence: 0.95
  });

  const addLog = useCallback((type: LogType, message: string, source?: string, details?: Omit<Partial<LogEntry>, 'id' | 'timestamp' | 'type' | 'message' | 'source'>) => {
    setLogs(prev => {
      const newLog: LogEntry = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' }),
        type,
        message,
        source,
        ...details
      };
      return [newLog, ...prev.slice(0, 999)]; // Keep 1000 logs
    });
  }, []);

  const updateMetrics = useCallback((updates: Partial<SystemMetrics>) => {
      setMetrics(prev => ({ ...prev, ...updates }));
  }, []);

  const saveStateToLocalStorage = useCallback(() => {
    try {
        const stateToSave = { nodes, logs: logs.slice(0, 100), metrics }; 
        localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(stateToSave));
    } catch (error) {
        console.error("Failed to save checkpoint:", error);
    }
  }, [nodes, logs, metrics]);
  
  const loadStateFromLocalStorage = useCallback(() => {
      try {
          const savedState = localStorage.getItem(CHECKPOINT_KEY);
          if (savedState) {
              const restoredState = JSON.parse(savedState);
              setNodes(restoredState.nodes || generateInitialNodes(agentFrameworkConfig));
              setLogs(restoredState.logs || []);
              if (restoredState.metrics) setMetrics(restoredState.metrics);
              addLog(LogType.INFO, 'System state restored from disk.', 'SYS');
          } else {
            addLog(LogType.INFO, 'No checkpoint found on disk.', 'SYS');
          }
      } catch (error) {
          addLog(LogType.ERROR, 'Failed to load checkpoint.', 'SYS');
      }
  }, [addLog, agentFrameworkConfig]);

  const updateNodeStatus = useCallback((nodeId: string, status: Node['status'], task?: string) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, status, lastActive: Date.now(), currentTask: task } : n));
    if (status === 'processing') {
        setMetrics(prev => ({ ...prev, activeAgents: prev.activeAgents + 1 }));
    } else if (status === 'online' || status === 'offline') {
        setMetrics(prev => ({ ...prev, activeAgents: Math.max(0, prev.activeAgents - 1) }));
    }
  }, []);
  
  const addNode = useCallback((type: NodeType, instanceName: string) => {
    const newNode: Node = {
        id: `${type}.${instanceName.toLowerCase().replace(/\s/g, '-')}-${Date.now()}`,
        name: `${type}`,
        type,
        status: 'online',
        instanceName,
        lastActive: Date.now()
    };
    setNodes(prev => [...prev, newNode]);
    addLog(LogType.INFO, `Spawning new process: ${newNode.id}`, 'MCP');
  }, [addLog]);

  const executeTask = useCallback(async (taskDetails: TaskDetails, isVotingEnabled: boolean) => {
    const startTime = Date.now();
    setIsProcessing(true);
    setErrorConnections([]);
    const coordinatorId = 'ada.central';
    let context: TaskContext = taskDetails.initialContext || {};
    let tokensConsumed = 0;
    
    setMetrics(prev => ({ ...prev, totalTasks: prev.totalTasks + 1 }));

    try {
        const { agentId, skillId } = taskDetails;
        const skill = agentFrameworkConfig.modules[agentId]?.skills.find(s => s.id === skillId);
        if (!skill) throw new Error(`Skill '${skillId}' not found for agent '${agentId}'.`);

        // --- INTELLIGENT WORKFLOW PLANNING ---
        let workflowPlan: NodeType[] = [];
        if (skillId === 'flight_booking' || skillId === 'marina_booking') {
            workflowPlan = [NodeType.CRM_AGENT, agentId as NodeType];
        } else if (skillId === 'handle_payment') {
            workflowPlan = [NodeType.CRM_AGENT, NodeType.FINANCE_AGENT];
        } else if (skillId === 'fetch_customer_profile') {
            workflowPlan = [NodeType.CRM_AGENT];
        } else {
            workflowPlan = [agentId as NodeType];
        }
        
        addLog(LogType.MCP_WORKFLOW_PLAN, `PLAN: [${workflowPlan.join(' >> ')}]`, 'MCP');
        
        for (const agentToExecute of workflowPlan) {
            
            // Step 1: Context Enrichment
            if (agentToExecute === NodeType.CRM_AGENT && context.customerName) {
                addLog(LogType.WORKFLOW_STEP, `FETCH: Customer Profile '${context.customerName}'`, agentToExecute);
                setActiveConnections(prev => [...prev, [coordinatorId, agentToExecute]]);
                updateNodeStatus(agentToExecute, 'processing', 'fetch_profile');
                
                const profile = await fetchCustomerProfile(context.customerName);
                await sleep(400);
                
                updateNodeStatus(agentToExecute, 'online');
                
                if (profile) {
                    context.customerProfile = profile;
                    addLog(LogType.CONTEXT_ENRICHMENT, `ENRICHED: ${context.customerName}`, agentToExecute);
                } else {
                    addLog(LogType.ERROR, `MISSING: Profile '${context.customerName}'`, agentToExecute);
                }
            } 
            
            // Step 2: Main Execution
            else if (agentToExecute === agentId) {
                addLog(LogType.WORKFLOW_STEP, `EXEC: ${skillId}`, agentId);
                let providersToRun = skill.providerIds;
                
                if (context.customerProfile?.preferences?.airline === 'THY') {
                    addLog(LogType.MCP_DECISION, `PREF: THY detected. Filtering providers.`, 'MCP');
                    providersToRun = providersToRun.filter(p => p === 'turkish_airlines');
                }

                const toolsToRun = providersToRun.flatMap(pId => 
                    agentFrameworkConfig.providers[pId]?.supportedToolIds.map(tId => ({ providerId: pId, toolId: tId })) || []
                );
                
                const toolOutputs: ToolOutput[] = [];
                for (const { providerId, toolId } of toolsToRun) {
                    setActiveConnections(prev => [...prev, [coordinatorId, agentId]]);
                    updateNodeStatus(agentId, 'processing', toolId);
                    
                    const { response, data } = await simulateProviderResponse(toolId, providerId, context);
                    context = { ...context, ...data };
                    toolOutputs.push({ toolId, providerId, response, data });
                    
                    addLog(LogType.INFO, `TOOL: ${toolId} >> OK`, agentId);
                    updateNodeStatus(agentId, 'online');
                    await sleep(800); // Faster in terminal mode
                }

                // Final Consensus
                let finalDecision: string;
                if (isVotingEnabled && toolOutputs.length > 1) {
                    addLog(LogType.THINKING, `CONSENSUS: Aggregating results...`, 'MCP');
                    const prompt = `Best option based on: ${JSON.stringify(toolOutputs.map(o => o.data))}?`;
                    const genResult = await generateContent(prompt);
                    finalDecision = genResult.text;
                    tokensConsumed += genResult.tokens;
                    addLog(LogType.CONSENSUS, `DECISION: ${finalDecision}`, 'AI');
                } else {
                    finalDecision = toolOutputs.map(o => o.data?.summary).filter(Boolean).join('; ') || "Done.";
                }

                if (agentFrameworkConfig.general.auto_seal) {
                    addLog(LogType.SEAL, `SEALING: ${skillId}`, 'MCP');
                    [agentId, ...workflowPlan].forEach(id => updateNodeStatus(id, 'sealing'));
                    await sleep(500);
                    addLog(LogType.SUCCESS, `DONE: ${finalDecision}`, 'MCP');
                    saveStateToLocalStorage();
                    [agentId, ...workflowPlan].forEach(id => updateNodeStatus(id, 'online'));
                } else {
                    addLog(LogType.SUCCESS, `DONE: ${finalDecision}`, 'MCP');
                }
            }
        }

        setMetrics(prev => ({
            ...prev,
            successfulTasks: prev.successfulTasks + 1,
            totalLatencyMs: prev.totalLatencyMs + (Date.now() - startTime),
            totalTokens: prev.totalTokens + tokensConsumed
        }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      addLog(LogType.ERROR, `FAIL: ${errorMessage}`, 'MCP');
      setMetrics(prev => ({ ...prev, failedTasks: prev.failedTasks + 1 }));
    } finally {
      setIsProcessing(false);
      setActiveConnections([]);
    }
  }, [addLog, agentFrameworkConfig, saveStateToLocalStorage, updateNodeStatus]);

  return { nodes, agentFrameworkConfig, logs, isProcessing, executeTask, activeConnections, addNode, loadStateFromLocalStorage, errorConnections, addLog, metrics };
};