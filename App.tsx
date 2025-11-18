
import React, { useState, useCallback, useEffect } from 'react';
import { useAdaNode } from './hooks/useAdaNode';
import Header from './components/Header';
import NodeStatusPanel from './components/NodeStatusPanel';
import ActivityLog from './components/ActivityLog';
import TaskInitiator from './components/TaskInitiator';
import { useLiveConversation } from './hooks/useLiveConversation';
import { TaskDetails, LogType, AgentFrameworkConfig } from './types';
import SkillsPanel from './components/SkillsPanel';
import EditorPanel from './components/EditorPanel';
import TerminalPanel from './components/TerminalPanel';
import LiveConversationPanel from './components/LiveConversationPanel';

const App: React.FC = () => {
  const [isVotingEnabled, setIsVotingEnabled] = useState(true);
  const [voterCount, setVoterCount] = useState(3);
  const { nodes, agentFrameworkConfig, logs, isProcessing, executeTask, executeTaskBatch, activeConnections, addNode, loadStateFromLocalStorage, errorConnections, addLog } = useAdaNode();
  const conversation = useLiveConversation();

  const [selectedTask, setSelectedTask] = useState<TaskDetails | null>(null);
  const [editorContent, setEditorContent] = useState<string>('');
  
  const generateEditorContent = useCallback((taskDetails: TaskDetails | null, config: AgentFrameworkConfig | null) => {
    if (!taskDetails || !config) {
      return `// Select a skill or tool from the panel to see its execution script.
// Use the terminal below to run commands.
// Example: run travel_agent flight_booking`;
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
 * MAKER:    ${isVotingEnabled ? `ON (Voters: ${voterCount})` : 'OFF'}
 */

// MCP initializes the operation
const mcp = new MasterControlProgram();

// Define the target for the operation
const operationTarget = {
  agent: '${agentId}',
  skill: '${skillId || ''}',
  ${providerId ? `provider: '${providerId}',` : ''}
  ${toolId ? `tool: '${toolId}',` : ''}
};

// The MCP selects the appropriate tools based on the target
const selectedTools = mcp.selectTools(operationTarget);

// The MCP orchestrates the execution of the selected tools
mcp.execute(selectedTools, { isVotingEnabled: ${isVotingEnabled} })
  .then(consensusResult => {
    console.log('Consensus Reached:', consensusResult);
  })
  .catch(error => {
    console.error('Operation Failed:', error);
    mcp.backtrack(error);
  });
`;
  }, [isVotingEnabled, voterCount]);

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
  }, [isVotingEnabled, voterCount, selectedTask, agentFrameworkConfig, generateEditorContent]);


  const handleTaskSelect = (taskDetails: TaskDetails) => {
    setSelectedTask(taskDetails);
  };
  
  const handleCommandSubmit = (command: string) => {
    addLog(LogType.INFO, `> ${command}`, 'Terminal');
    const parts = command.trim().split(/\s+/);
    const [action, agentId, skillId, providerId, toolId] = parts;

    if (action === 'run' && agentId && skillId) {
       const taskDetails: TaskDetails = { agentId, skillId, providerId, toolId };
       setSelectedTask(taskDetails);
       executeTask(taskDetails, isVotingEnabled, voterCount);
    } else if (action === 'run_batch') {
        executeTaskBatch([], isVotingEnabled, voterCount);
    } else if (command.trim() === 'help') {
        addLog(LogType.INFO, 'Available command:\n  run <agent_id> <skill_id> [provider_id] [tool_id]', 'System');
    }
    else {
        addLog(LogType.ERROR, `Unknown command: '${command}'. Type 'help' for available commands.`, 'System');
    }
  };


  const handleExecuteTask = (task: TaskDetails) => {
    executeTask(task, isVotingEnabled, voterCount);
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
                  "skills nodes conversation"
                  "skills editor conversation"
                  "terminal terminal terminal"`,
              gridTemplateColumns: '2fr 6fr 4fr',
              gridTemplateRows: 'auto 1fr auto',
              height: 'calc(100vh - 80px)'
          }}>
        
        <div style={{ gridArea: 'skills' }} className="flex flex-col min-h-0">
            <SkillsPanel agentFrameworkConfig={agentFrameworkConfig} onTaskSelect={handleTaskSelect} selectedTask={selectedTask} />
        </div>
        
        <div style={{ gridArea: 'nodes' }} className="flex flex-col min-h-0">
             <NodeStatusPanel 
              nodes={nodes} 
              isProcessing={isProcessing} 
              activeConnections={activeConnections}
              errorConnections={errorConnections}
              addNode={addNode} 
              restoreFromCheckpoint={loadStateFromLocalStorage}
            />
        </div>

        <div style={{ gridArea: 'editor' }} className="flex flex-col min-h-0">
            <EditorPanel content={editorContent} />
        </div>
        
        <div style={{ gridArea: 'conversation' }} className="flex flex-col gap-4 min-h-0 row-span-2">
            <TaskInitiator 
              onSubmit={handleExecuteTask} 
              isProcessing={isProcessing || conversation.status !== 'idle'}
              agentFrameworkConfig={agentFrameworkConfig}
              isVotingEnabled={isVotingEnabled}
              voterCount={voterCount}
              setVoterCount={setVoterCount}
              selectedTask={selectedTask}
              onTaskChange={handleTaskSelect}
            />
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
        </div>
        
        <div style={{ gridArea: 'terminal' }} className="flex flex-col min-h-0">
            <TerminalPanel logs={logs} onCommandSubmit={handleCommandSubmit} agentFrameworkConfig={agentFrameworkConfig} />
        </div>
      </main>
    </div>
  );
};

export default App;