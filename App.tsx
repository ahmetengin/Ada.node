import React, { useState } from 'react';
import { useAdaNode } from './hooks/useAdaNode';
import Header from './components/Header';
import NodeStatusPanel from './components/NodeStatusPanel';
import AgentTasksPanel from './components/SkillsPanel'; // Renamed for clarity
import ActivityLog from './components/ActivityLog';
import TaskInitiator from './components/TaskInitiator';
import { useLiveConversation } from './hooks/useLiveConversation';
import MapPanel from './components/MapPanel';
import LiveConversationPanel from './components/LiveConversationPanel';
import { TaskDetails } from './types';

const App: React.FC = () => {
  const [isVotingEnabled, setIsVotingEnabled] = useState(false);
  const [voterCount, setVoterCount] = useState(3);
  const { nodes, agentConfig, logs, route, isProcessing, executeTask, activeConnections, addNode, loadStateFromLocalStorage, errorConnections } = useAdaNode();
  const conversation = useLiveConversation();

  const handleExecuteTask = (task: TaskDetails) => {
    executeTask(task, isVotingEnabled, voterCount);
  }

  return (
    <div className="min-h-screen text-gray-200 font-sans flex flex-col relative">
      <Header 
        isVotingEnabled={isVotingEnabled}
        onToggleVoting={setIsVotingEnabled}
      />
      <main className="flex-grow p-4 md:p-6 grid gap-6" 
          style={{ 
              gridTemplateAreas: `
                  "skills nodes tasks"
                  "skills nodes conversation"
                  "log log conversation"`,
              gridTemplateColumns: '3fr 5fr 4fr',
              gridTemplateRows: 'auto 1fr auto',
              height: 'calc(100vh - 80px)' // Adjust based on header/footer height
          }}>
        
        <div style={{ gridArea: 'skills' }} className="flex flex-col gap-6 min-h-0">
            <AgentTasksPanel agentConfig={agentConfig} />
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

        <div style={{ gridArea: 'tasks' }} className="flex flex-col min-h-0">
            <TaskInitiator 
              onSubmit={handleExecuteTask} 
              isProcessing={isProcessing || conversation.status !== 'idle'}
              agentConfig={agentConfig}
              isVotingEnabled={isVotingEnabled}
              voterCount={voterCount}
              setVoterCount={setVoterCount}
            />
        </div>
        
        <div style={{ gridArea: 'log' }} className="flex flex-col gap-6 min-h-0">
            <ActivityLog logs={logs} />
        </div>

        <div style={{ gridArea: 'conversation' }} className="flex flex-col min-h-0">
            <div className="flex flex-col gap-6 h-full">
                {route && <MapPanel route={route} />}
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
        </div>
      </main>
      <footer className="text-center p-2 text-sm text-[var(--color-text-dim)]">
        <p>Ada Node Simulation Environment</p>
      </footer>
    </div>
  );
};

export default App;
