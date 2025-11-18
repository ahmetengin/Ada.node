
import { useState, useCallback, useEffect } from 'react';
import { Node, NodeType, LogEntry, LogType, TaskDetails, AgentFrameworkConfig, ToolOutput, TaskContext } from '../types';
import { generateContent } from '../services/geminiService';
import { AGENT_FRAMEWORK_CONFIG } from '../services/agentFrameworkConfig';
import { simulateProviderResponse } from '../services/providerSimulationService';
import { fetchCustomerProfile } from '../services/crmSimulationService';

const generateInitialNodes = (config: AgentFrameworkConfig): Node[] => {
    const initialNodes: Node[] = [
        { id: 'ada.central', name: 'Ada Koordinatör', type: NodeType.CENTRAL, status: 'online' },
    ];
    // Add agents from modules
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

const CHECKPOINT_KEY = 'adaNodeCheckpoint_v5_final';

export const useAdaNode = () => {
  const [agentFrameworkConfig] = useState<AgentFrameworkConfig>(AGENT_FRAMEWORK_CONFIG);
  const [nodes, setNodes] = useState<Node[]>(() => generateInitialNodes(agentFrameworkConfig));
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeConnections, setActiveConnections] = useState<[string, string][]>([]);
  const [errorConnections, setErrorConnections] = useState<[string, string][]>([]);

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
      return [newLog, ...prev.slice(0, 499)];
    });
  }, []);

  const saveStateToLocalStorage = useCallback(() => {
    try {
        const stateToSave = { nodes, logs: logs.slice(0, 100) }; // Save more logs
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
    const coordinatorId = 'ada.central';
    let context: TaskContext = taskDetails.initialContext || {};
    
    addLog(LogType.INFO, `Task injected: Agent '${taskDetails.agentId}', Skill '${taskDetails.skillId}'`, 'Observer');

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
            // Default plan for unknown skills
            workflowPlan = [agentId as NodeType];
        }
        
        addLog(LogType.MCP_WORKFLOW_PLAN, `Workflow Plan: [${workflowPlan.join(' -> ')}]. Reason: Skill '${skillId}' requires this execution path.`, 'MCP');
        
        // --- DYNAMIC WORKFLOW EXECUTION ---
        for (const agentToExecute of workflowPlan) {
            
            // Step 1: Context Enrichment for CRM Agent
            if (agentToExecute === NodeType.CRM_AGENT && context.customerName) {
                addLog(LogType.WORKFLOW_STEP, `[1] Retrieving customer profile for '${context.customerName}'.`, agentToExecute);
                setActiveConnections(prev => [...prev, [coordinatorId, agentToExecute]]);
                updateNodeStatus(agentToExecute, 'processing');
                
                const profile = await fetchCustomerProfile(context.customerName);
                
                updateNodeStatus(agentToExecute, 'online');
                
                if (profile) {
                    context.customerProfile = profile;
                    addLog(LogType.CONTEXT_ENRICHMENT, `Context enriched with profile for '${context.customerName}'.`, agentToExecute);
                } else {
                    addLog(LogType.ERROR, `Customer profile for '${context.customerName}' not found.`, agentToExecute);
                }
            } 
            
            // Step 2: Main Task Execution for the primary agent
            else if (agentToExecute === agentId) {
                addLog(LogType.WORKFLOW_STEP, `[2] Executing primary skill '${skillId}' for agent '${agentId}'.`, agentId);
                let providersToRun = skill.providerIds;
                
                // Intelligent provider selection
                if (context.customerProfile?.preferences?.airline === 'THY') {
                    addLog(LogType.MCP_DECISION, `Customer preference detected. Prioritizing 'turkish_airlines' provider.`, 'MCP');
                    providersToRun = providersToRun.filter(p => p === 'turkish_airlines');
                }

                const toolsToRun = providersToRun.flatMap(pId => 
                    agentFrameworkConfig.providers[pId]?.supportedToolIds.map(tId => ({ providerId: pId, toolId: tId })) || []
                );
                addLog(LogType.TOOL_SELECTION, `MCP selected ${toolsToRun.length} tool(s) for skill '${skillId}': ${toolsToRun.map(t => t.toolId).join(', ')}`, 'MCP');

                const toolOutputs: ToolOutput[] = [];
                for (const { providerId, toolId } of toolsToRun) {
                    addLog(LogType.THINKING, `Executing tool '${toolId}' via provider '${providerId}'.`, agentId);
                    setActiveConnections(prev => [...prev, [coordinatorId, agentId]]);
                    updateNodeStatus(agentId, 'processing');
                    
                    const { response, data } = await simulateProviderResponse(toolId, providerId, context);
                    context = { ...context, ...data };
                    toolOutputs.push({ toolId, providerId, response, data });
                    
                    addLog(LogType.INFO, `Tool '${toolId}' responded: ${response?.reason || 'OK'}.`, agentId);
                    updateNodeStatus(agentId, 'online');
                    await sleep(6000); // PACE REQUESTS
                }

                // Final Consensus
                let finalDecision: string;
                if (isVotingEnabled && toolOutputs.length > 1) {
                    addLog(LogType.THINKING, `Compiling simulated data for final consensus check...`, 'MCP');
                    const prompt = `You are a master travel coordinator. Based on the following data from multiple providers, what is the single best flight option for your client and why? Be concise. Data: ${JSON.stringify(toolOutputs.map(o => o.data))}`;
                    finalDecision = await generateContent(prompt);
                    addLog(LogType.CONSENSUS, `Final decision from AI coordinator: ${finalDecision}`, 'Gemini');
                } else {
                    finalDecision = toolOutputs.map(o => o.data?.summary).filter(Boolean).join(' ') || "Task completed.";
                }

                // SEAL
                if (agentFrameworkConfig.general.auto_seal) {
                    addLog(LogType.SEAL, `Sealing operation results for skill '${skillId}'.`, 'MCP');
                    [agentId, ...workflowPlan].forEach(id => updateNodeStatus(id, 'sealing'));
                    await sleep(1500);
                    
                    addLog(LogType.SUCCESS, finalDecision, 'Coordinator');
                    saveStateToLocalStorage();
                    
                    [agentId, ...workflowPlan].forEach(id => updateNodeStatus(id, 'online'));
                } else {
                    addLog(LogType.SUCCESS, finalDecision, 'Coordinator');
                }
            }
        }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      addLog(LogType.ERROR, `Task failed: ${errorMessage}`, 'MCP');
    } finally {
      setIsProcessing(false);
      setActiveConnections([]);
    }
  }, [addLog, agentFrameworkConfig, saveStateToLocalStorage, updateNodeStatus]);

  return { nodes, agentFrameworkConfig, logs, isProcessing, executeTask, activeConnections, addNode, loadStateFromLocalStorage, errorConnections, addLog };
};