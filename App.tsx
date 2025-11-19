import React, { useState, useEffect } from 'react';
import { useAdaNode } from './hooks/useAdaNode';
import Header from './components/Header';
import NodeStatusPanel from './components/NodeStatusPanel';
import ActivityLog from './components/ActivityLog';
import TaskInitiator from './components/TaskInitiator';
import { useLiveConversation } from './hooks/useLiveConversation';
import { TaskDetails, AgentFrameworkConfig, LogEntry, LogType } from './types';
import EditorPanel from './components/EditorPanel';
import TerminalPanel from './components/TerminalPanel';
import LiveConversationPanel from './components/LiveConversationPanel';
import FrameworkPanel from './components/FrameworkPanel';
import AnalysisModal from './components/AnalysisModal';
import Scoreboard from './components/Scoreboard';
import { generateAnalyticContent } from './services/geminiService';

const App: React.FC = () => {
  const [isVotingEnabled, setIsVotingEnabled] = useState(true);
  
  // Analysis Modal State
  const [analysisState, setAnalysisState] = useState({
    isOpen: false,
    title: '',
    content: '',
    isLoading: false
  });

  const { nodes, agentFrameworkConfig, logs, isProcessing, executeTask, addNode, metrics, addLog } = useAdaNode();
  const conversation = useLiveConversation();

  const [selectedTask, setSelectedTask] = useState<TaskDetails | null>(null);
  
  useEffect(() => {
    if (agentFrameworkConfig && !selectedTask) {
        const firstAgentId = Object.keys(agentFrameworkConfig.modules)[0];
        const firstSkill = agentFrameworkConfig.modules[firstAgentId]?.skills[0];
        if (firstAgentId && firstSkill) {
            setSelectedTask({ agentId: firstAgentId, skillId: firstSkill.id });
        }
    }
  }, [agentFrameworkConfig, selectedTask]);

  const handleCommandSubmit = (command: string) => {
    addLog(LogType.INFO, `stdin: ${command}`, 'USER');
    const parts = command.trim().split(/\s+/);
    const [action, agentId, skillId] = parts;

    if (action === 'run' && agentId && skillId) {
       const taskDetails: TaskDetails = { agentId, skillId, initialContext: { customerName: "Ahmet Bey" } };
       executeTask(taskDetails, isVotingEnabled);
    } else if (command === 'help') {
       addLog(LogType.INFO, 'usage: run <agent> <skill>', 'SYS');
    } else {
       addLog(LogType.ERROR, 'command not found', 'SYS');
    }
  };

  const handleRequestAnalysis = async (type: 'summary' | 'errors' | 'explain_error', logEntry?: LogEntry) => {
    const title = type === 'errors' ? 'ERROR_DUMP' : type === 'summary' ? 'EXEC_SUMMARY' : 'ERR_TRACE';
    setAnalysisState({ isOpen: true, title, content: '', isLoading: true });

    let prompt = '';
    if (type === 'summary') {
        prompt = `Analyze logs. Summarize system state.\nLogs:\n${logs.slice(0, 50).map(l => l.message).join('\n')}`;
    } else if (type === 'explain_error' && logEntry) {
        prompt = `Explain error: ${logEntry.message}`;
    }

    try {
        const result = await generateAnalyticContent(prompt, 'gemini-2.5-flash');
        setAnalysisState(prev => ({ ...prev, content: result.text, isLoading: false }));
    } catch (error) {
        setAnalysisState(prev => ({ ...prev, content: 'API_FAIL', isLoading: false }));
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] relative">
      <div className="scanline"></div>
      <Header isVotingEnabled={isVotingEnabled} onToggleVoting={setIsVotingEnabled} />
      
      <div className="flex-grow p-1 gap-1 grid grid-cols-12 grid-rows-6 overflow-hidden z-10">
         
         {/* Left Column: Tree & Manual Control (2/12 width) */}
         <div className="col-span-2 row-span-4">
            <FrameworkPanel agentFrameworkConfig={agentFrameworkConfig} onTaskSelect={setSelectedTask} selectedTask={selectedTask} />
         </div>
         <div className="col-span-2 row-span-2">
            <TaskInitiator 
                onSubmit={(t) => executeTask({...t, initialContext: { customerName: "Ahmet Bey" }}, isVotingEnabled)} 
                isProcessing={isProcessing} 
                agentFrameworkConfig={agentFrameworkConfig} 
                selectedTask={selectedTask} 
            />
         </div>

         {/* Center Column: Visualization (7/12 width) */}
         <div className="col-span-7 row-span-1">
            <Scoreboard metrics={metrics} />
         </div>
         <div className="col-span-7 row-span-3">
             <NodeStatusPanel nodes={nodes} isProcessing={isProcessing} addNode={addNode} />
         </div>
         <div className="col-span-7 row-span-2">
             <ActivityLog logs={logs} onRequestAnalysis={handleRequestAnalysis} />
         </div>

         {/* Right Column: Comms & Code (3/12 width) */}
         <div className="col-span-3 row-span-2">
             <LiveConversationPanel 
                status={conversation.status} 
                transcriptions={conversation.transcriptions}
                startConversation={conversation.startConversation}
                stopConversation={conversation.stopConversation}
                stream={conversation.videoStream}
             />
         </div>
         <div className="col-span-3 row-span-4">
             <EditorPanel content="// Dynamic workflow visualization will appear here..." /> 
         </div>
      </div>

      {/* Bottom Bar: Terminal Input */}
      <div className="h-8 flex-shrink-0 border-t border-[var(--border-color)] z-10">
        <TerminalPanel logs={logs} onCommandSubmit={handleCommandSubmit} agentFrameworkConfig={agentFrameworkConfig} />
      </div>

      <AnalysisModal 
        isOpen={analysisState.isOpen}
        onClose={() => setAnalysisState(prev => ({ ...prev, isOpen: false }))}
        title={analysisState.title}
        content={analysisState.content}
        isLoading={analysisState.isLoading}
      />
    </div>
  );
};

export default App;