
import React, { useState, useCallback, useEffect } from 'react';
import { useAdaNode } from './hooks/useAdaNode';
import Header from './components/Header';
import NodeStatusPanel from './components/NodeStatusPanel';
import ActivityLog from './components/ActivityLog';
import TaskInitiator from './components/TaskInitiator';
import { useLiveConversation } from './hooks/useLiveConversation';
import MapPanel from './components/MapPanel';
import LiveConversationPanel from './components/LiveConversationPanel';
// FIX: Import LogType to use enum values instead of strings.
import { TaskDetails, Task, LogType } from './types';
import FileTreePanel from './components/FileTreePanel';
import EditorPanel from './components/EditorPanel';
import TerminalPanel from './components/TerminalPanel';

const App: React.FC = () => {
  const [isVotingEnabled, setIsVotingEnabled] = useState(false);
  const [voterCount, setVoterCount] = useState(3);
  const { nodes, agentConfig, logs, route, isProcessing, executeTask, activeConnections, addNode, loadStateFromLocalStorage, errorConnections, addLog } = useAdaNode();
  const conversation = useLiveConversation();

  const [selectedTask, setSelectedTask] = useState<TaskDetails | null>(null);
  const [editorContent, setEditorContent] = useState<string>('');
  
  const generateEditorContent = useCallback((taskDetails: TaskDetails | null) => {
    if (!taskDetails || !agentConfig) {
      return `// Select a task from the file tree to see its execution script.
// Use the terminal below to run commands.
// Example: run travel_agent flight_combinations`;
    }
    const { agentId, task } = taskDetails;
    const module = agentConfig.modules[agentId];
    
    return `/**
 * Agent: ${agentId}
 * Task: ${task.description}
 * Voting Strategy: ${module.voting_strategy}
 * Red Flagging: ${module.red_flagging ? 'Enabled' : 'Disabled'}
 */

// Initialize Ada Node client
const ada = new AdaNodeClient();

// Define the task payload
const taskPayload = {
  agent: '${agentId}',
  taskId: '${task.id}',
  description: '${task.description}',
  parameters: {
    // Parameters would be dynamically generated here
  }
};

// Execute with MAKER Mode settings
const executionOptions = {
  isVotingEnabled: ${isVotingEnabled},
  voterCount: ${voterCount}
};

// Initiate the task
ada.run(taskPayload, executionOptions)
  .then(result => {
    console.log('Task Completed Successfully:', result);
  })
  .catch(error => {
    console.error('Task Failed:', error);
    ada.backtrack(error);
  });
`;
  }, [agentConfig, isVotingEnabled, voterCount]);

  useEffect(() => {
    // Set initial task and editor content
    if (agentConfig && !selectedTask) {
        const firstAgentId = Object.keys(agentConfig.modules)[0];
        const firstTask = agentConfig.modules[firstAgentId]?.tasks[0];
        if (firstAgentId && firstTask) {
            const initialTask = { agentId: firstAgentId, task: firstTask };
            setSelectedTask(initialTask);
            setEditorContent(generateEditorContent(initialTask));
        }
    }
  }, [agentConfig, selectedTask, generateEditorContent]);

  useEffect(() => {
      // Update editor content when voting settings change
      setEditorContent(generateEditorContent(selectedTask));
  }, [isVotingEnabled, voterCount, selectedTask, generateEditorContent]);


  const handleTaskSelect = (taskDetails: TaskDetails) => {
    setSelectedTask(taskDetails);
    setEditorContent(generateEditorContent(taskDetails));
  };
  
  const handleCommandSubmit = (command: string) => {
    // FIX: Use LogType.INFO enum instead of string 'INFO'.
    addLog(LogType.INFO, `> ${command}`, 'Terminal');
    const [action, agentId, taskId] = command.trim().split(/\s+/);

    if (action === 'run' && agentId && taskId) {
        if (agentConfig && agentConfig.modules[agentId]) {
            const task = agentConfig.modules[agentId].tasks.find(t => t.id === taskId);
            if (task) {
                const taskDetails: TaskDetails = { agentId, task };
                setSelectedTask(taskDetails);
                setEditorContent(generateEditorContent(taskDetails));
                executeTask(taskDetails, isVotingEnabled, voterCount);
            } else {
                // FIX: Use LogType.ERROR enum instead of string 'ERROR'.
                addLog(LogType.ERROR, `Task '${taskId}' not found for agent '${agentId}'.`, 'System');
            }
        } else {
            // FIX: Use LogType.ERROR enum instead of string 'ERROR'.
            addLog(LogType.ERROR, `Agent '${agentId}' not found.`, 'System');
        }
    } else if (command.trim() === 'help') {
        // FIX: Use LogType.INFO enum instead of string 'INFO'.
        addLog(LogType.INFO, 'Available commands: run <agent_id> <task_id>, help, clear', 'System');
    }
    else {
        // FIX: Use LogType.ERROR enum instead of string 'ERROR'.
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
                  "tree nodes conversation"
                  "tree editor conversation"
                  "terminal terminal terminal"`,
              gridTemplateColumns: '2fr 6fr 4fr',
              gridTemplateRows: 'auto 1fr auto',
              height: 'calc(100vh - 80px)' // Adjust based on header/footer height
          }}>
        
        <div style={{ gridArea: 'tree' }} className="flex flex-col min-h-0">
            <FileTreePanel agentConfig={agentConfig} onTaskSelect={handleTaskSelect} selectedTask={selectedTask} />
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
              agentConfig={agentConfig}
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
            <TerminalPanel logs={logs} onCommandSubmit={handleCommandSubmit} />
        </div>
      </main>
    </div>
  );
};

export default App;