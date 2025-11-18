
import React, { useState, useCallback, useEffect } from 'react';
import { useAdaNode } from './hooks/useAdaNode';
import Header from './components/Header';
import NodeStatusPanel from './components/NodeStatusPanel';
import ActivityLog from './components/ActivityLog';
import TaskInitiator from './components/TaskInitiator';
import { useLiveConversation } from './hooks/useLiveConversation';
import { TaskDetails, LogType, AgentFrameworkConfig } from './types';
import EditorPanel from './components/EditorPanel';
import TerminalPanel from './components/TerminalPanel';
import LiveConversationPanel from './components/LiveConversationPanel';
import FrameworkPanel from './components/FrameworkPanel';
import { Bot, Network } from 'lucide-react';

type LeftPanelTab = 'framework' | 'comms';

const App: React.FC = () => {
  const [isVotingEnabled, setIsVotingEnabled] = useState(true);
  const [leftPanelTab, setLeftPanelTab] = useState<LeftPanelTab>('framework');
  // FIX: Added `activeConnections` to the destructuring from useAdaNode hook.
  const { nodes, agentFrameworkConfig, logs, isProcessing, executeTask, addNode, loadStateFromLocalStorage, errorConnections, addLog, activeConnections } = useAdaNode();
  const conversation = useLiveConversation();

  const [selectedTask, setSelectedTask] = useState<TaskDetails | null>(null);
  const [editorContent, setEditorContent] = useState<string>('');
  
  const generateEditorContent = useCallback((taskDetails: TaskDetails | null, config: AgentFrameworkConfig | null) => {
    if (!taskDetails || !config) {
      return `// Select a capability from the Framework panel to see its execution plan.`;
    }
    const { agentId, skillId, providerId, toolId } = taskDetails;
    const agent = config.modules[agentId];
    const skill = agent?.skills.find(s => s.id === skillId);
    const provider = providerId ? config.providers[providerId] : null;
    const tool = toolId ? config.tools[toolId] : null;

    return `/**
 * AGENT:    ${agentId}
 * SKILL:    ${skill?.description || 'N/A'}
 * PROVIDER: ${provider?.description || 'All'}
 * TOOL:     ${tool?.description || 'All'}
 * MAKER:    ${isVotingEnabled ? `ON` : 'OFF'}
 */
const task = {
  agent: "${agentId}",
  skill: "${skillId}",
  context: { customerName: "Ahmet Bey" } // Example context
};

// 1. MCP enriches context via CRM Agent
const enrichedContext = await crm_agent.fetch_customer_profile(task.context);

// 2. MCP makes an intelligent decision
const selectedProvider = mcp.decideProvider(enrichedContext); // -> 'turkish_airlines'

// 3. MCP executes a dynamic workflow
const flightData = await selectedProvider.search_flights(enrichedContext);
const marinaData = await maritime_agent.check_availability(enrichedContext);

// 4. Final result is composed and sealed
const finalPlan = composeResult(flightData, marinaData);
seal(finalPlan);
`;
  }, [isVotingEnabled]);

  useEffect(() => {
    if (agentFrameworkConfig && !selectedTask) {
        const firstAgentId = Object.keys(agentFrameworkConfig.modules)[0];
        const firstSkill = agentFrameworkConfig.modules[firstAgentId]?.skills[0];
        if (firstAgentId && firstSkill) {
            const initialTask: TaskDetails = { agentId: firstAgentId, skillId: firstSkill.id };
            setSelectedTask(initialTask);
        }
    }
  }, [agentFrameworkConfig, selectedTask]);

  useEffect(() => {
      setEditorContent(generateEditorContent(selectedTask, agentFrameworkConfig));
  }, [isVotingEnabled, selectedTask, agentFrameworkConfig, generateEditorContent]);


  const handleTaskSelect = (taskDetails: TaskDetails) => {
    setSelectedTask(taskDetails);
  };
  
  const handleCommandSubmit = (command: string) => {
    addLog(LogType.INFO, `> ${command}`, 'Terminal');
    const parts = command.trim().split(/\s+/);
    const [action, agentId, skillId] = parts;

    if (action === 'run' && agentId && skillId) {
       const taskDetails: TaskDetails = { agentId, skillId, initialContext: { customerName: "Ahmet Bey" } };
       setSelectedTask(taskDetails);
       executeTask(taskDetails, isVotingEnabled);
    } else if (command.trim() === 'help') {
        addLog(LogType.INFO, 'Available command:\n  run <agent_id> <skill_id>', 'System');
    }
    else {
        addLog(LogType.ERROR, `Unknown command: '${command}'. Type 'help' for available commands.`, 'System');
    }
  };


  const handleExecuteTask = (task: TaskDetails) => {
    executeTask({ ...task, initialContext: { customerName: "Ahmet Bey" } }, isVotingEnabled);
  }

  return (
    <div className="min-h-screen text-gray-200 font-sans flex flex-col relative bg-[var(--color-bg)]">
      <Header 
        isVotingEnabled={isVotingEnabled}
        onToggleVoting={setIsVotingEnabled}
      />
      <main className="flex-grow p-4 md:p-6 grid gap-4" 
          style={{ 
              gridTemplateAreas: `
                  "sidebar main"
                  "terminal terminal"`,
              gridTemplateColumns: 'minmax(350px, 2fr) 8fr',
              gridTemplateRows: '1fr auto',
              height: 'calc(100vh - 80px)'
          }}>
        
        <div style={{ gridArea: 'sidebar' }} className="panel-glow flex flex-col min-h-0">
            <div className="flex-shrink-0 border-b border-white/10 p-2 flex">
                <TabButton icon={<Network size={16}/>} label="Framework" isActive={leftPanelTab === 'framework'} onClick={() => setLeftPanelTab('framework')} />
                <TabButton icon={<Bot size={16}/>} label="Live Comms" isActive={leftPanelTab === 'comms'} onClick={() => setLeftPanelTab('comms')} />
            </div>
            <div className="flex-grow p-2 min-h-0">
                {leftPanelTab === 'framework' && <FrameworkPanel agentFrameworkConfig={agentFrameworkConfig} onTaskSelect={handleTaskSelect} selectedTask={selectedTask} />}
                {leftPanelTab === 'comms' && (
                    <LiveConversationPanel 
                        status={conversation.status}
                        transcriptions={conversation.transcriptions}
                        startConversation={conversation.startConversation}
                        stopConversation={conversation.stopConversation}
                        isOtherTaskRunning={isProcessing}
                        stream={conversation.videoStream}
                        backgroundEffect={conversation.backgroundEffect}
                        setBackgroundEffect={conversation.setBackgroundEffect}
                        setCustomBgUrl={conversation.setCustomBgUrl}
                        isSegmenterLoading={conversation.isSegmenterLoading}
                    />
                )}
            </div>
        </div>
        
        {/* FIX: Merged two style properties into one to avoid duplicate attribute error. */}
        <div className="grid gap-4 min-h-0"
            style={{
                gridArea: 'main',
                gridTemplateRows: 'auto 1fr',
                gridTemplateColumns: '6fr 4fr'
            }}
        >
            <div className="col-span-2">
                <NodeStatusPanel 
                  nodes={nodes} 
                  isProcessing={isProcessing} 
                  activeConnections={activeConnections}
                  errorConnections={errorConnections}
                  addNode={addNode} 
                  restoreFromCheckpoint={loadStateFromLocalStorage}
                />
            </div>
            <div className="min-h-0">
                 <EditorPanel content={editorContent} />
            </div>
            <div className="min-h-0">
                 <TaskInitiator 
                  onSubmit={handleExecuteTask} 
                  isProcessing={isProcessing || conversation.status !== 'idle'}
                  agentFrameworkConfig={agentFrameworkConfig}
                  isVotingEnabled={isVotingEnabled}
                  selectedTask={selectedTask}
                  onTaskChange={handleTaskSelect}
                />
            </div>
        </div>
        
        <div style={{ gridArea: 'terminal' }} className="flex flex-col min-h-0">
             <TerminalPanel logs={logs} onCommandSubmit={handleCommandSubmit} agentFrameworkConfig={agentFrameworkConfig} />
        </div>
      </main>
    </div>
  );
};

const TabButton: React.FC<{icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void}> = ({ icon, label, isActive, onClick }) => (
    <button 
        onClick={onClick}
        className={`flex-1 flex items-center justify-center gap-2 p-2 text-sm rounded-md transition-colors ${isActive ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]' : 'text-[var(--color-text-dim)] hover:bg-white/10'}`}
    >
        {icon}
        <span>{label}</span>
    </button>
);


export default App;