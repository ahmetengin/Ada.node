import React from 'react';
import { useAdaNode } from './hooks/useAdaNode';
import Header from './components/Header';
import NodeStatusPanel from './components/NodeStatusPanel';
import SkillsPanel from './components/SkillsPanel';
import ActivityLog from './components/ActivityLog';
import TaskInitiator from './components/TaskInitiator';
import { BrainCircuit } from 'lucide-react';
import { useLiveConversation } from './hooks/useLiveConversation';
import VoiceControlPanel from './components/VoiceControlPanel';
import MapPanel from './components/MapPanel';
import VideoPanel from './components/VideoPanel';

const App: React.FC = () => {
  const { nodes, skills, logs, route, isProcessing, executeTask, activeSkill, activeConnections, addNode } = useAdaNode();
  const conversation = useLiveConversation();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col">
      <Header />
      <main className="flex-grow p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Column */}
        <div className="lg:col-span-3 flex flex-col gap-6 lg:gap-8">
          <NodeStatusPanel nodes={nodes} isProcessing={isProcessing} activeConnections={activeConnections} addNode={addNode} />
          <SkillsPanel skills={skills} activeSkill={activeSkill} />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-9 flex flex-col bg-gray-800/50 rounded-2xl shadow-2xl ring-1 ring-white/10 overflow-hidden">
          <div className="flex-grow p-6 flex flex-col gap-6 overflow-y-auto">
            <h2 className="text-2xl font-bold text-cyan-300 flex items-center gap-3">
              <BrainCircuit size={28} />
              <span>Central Coordination Unit</span>
            </h2>
            {route && <MapPanel route={route} />}
            <TaskInitiator 
              onSubmit={executeTask} 
              isProcessing={isProcessing || conversation.status !== 'idle'}
              nodes={nodes}
            />
            <VideoPanel stream={conversation.videoStream} status={conversation.status} />
            <VoiceControlPanel {...conversation} isOtherTaskRunning={isProcessing} />
            <ActivityLog logs={logs} />
          </div>
        </div>
      </main>
      <footer className="text-center p-4 text-gray-500 text-sm">
        <p>Ada Node Simulation Environment</p>
      </footer>
    </div>
  );
};

export default App;