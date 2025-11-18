import React, { useState, useEffect } from 'react';
import { PlayCircle, Loader } from 'lucide-react';
import { AgentConfig, TaskDetails, Task } from '../types';

interface TaskInitiatorProps {
  onSubmit: (task: TaskDetails) => void;
  isProcessing: boolean;
  agentConfig: AgentConfig | null;
  isVotingEnabled: boolean;
  voterCount: number;
  setVoterCount: (count: number) => void;
}

const TaskInitiator: React.FC<TaskInitiatorProps> = ({ onSubmit, isProcessing, agentConfig, isVotingEnabled, voterCount, setVoterCount }) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  useEffect(() => {
    if (agentConfig && Object.keys(agentConfig.modules).length > 0) {
      const firstAgentId = Object.keys(agentConfig.modules)[0];
      setSelectedAgentId(firstAgentId);
      if (agentConfig.modules[firstAgentId].tasks.length > 0) {
        setSelectedTaskId(agentConfig.modules[firstAgentId].tasks[0].id);
      }
    }
  }, [agentConfig]);

  useEffect(() => {
    // When agent changes, reset task selection to the first available task
    if (agentConfig && selectedAgentId && agentConfig.modules[selectedAgentId].tasks.length > 0) {
        const currentTasks = agentConfig.modules[selectedAgentId].tasks;
        if (!currentTasks.find(t => t.id === selectedTaskId)) {
             setSelectedTaskId(currentTasks[0].id);
        }
    }
  }, [selectedAgentId, agentConfig]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing || !selectedAgentId || !selectedTaskId || !agentConfig) return;

    const task: Task | undefined = agentConfig.modules[selectedAgentId].tasks.find(t => t.id === selectedTaskId);
    
    if (task) {
        onSubmit({ agentId: selectedAgentId, task });
    }
  };
  
  const baseSelectClasses = "w-full bg-[var(--color-panel)] border border-[var(--color-primary)]/30 rounded-md p-2 text-white focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none transition-all text-sm";
  
  const agentModules = agentConfig ? Object.entries(agentConfig.modules) : [];
  const availableTasks = selectedAgentId && agentConfig ? agentConfig.modules[selectedAgentId].tasks : [];

  return (
    <form onSubmit={handleSubmit} className="panel-glow p-4 flex flex-col gap-4 h-full">
      <h3 className="text-lg font-semibold text-[var(--color-primary)] flex-shrink-0" style={{ textShadow: `0 0 5px var(--color-primary-glow)`}}>Task Initiator</h3>
      
      {agentConfig ? (
        <>
            <div className="w-full">
                <label htmlFor="agent-module" className="text-xs text-[var(--color-text-dim)]">Agent Module</label>
                <select
                    id="agent-module"
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    className={baseSelectClasses}
                    disabled={isProcessing}
                >
                    {agentModules.map(([agentId]) => (
                        <option key={agentId} value={agentId}>{agentId.replace(/_/g, ' ')}</option>
                    ))}
                </select>
            </div>

            <div className="w-full">
                <label htmlFor="agent-task" className="text-xs text-[var(--color-text-dim)]">Task</label>
                <select
                    id="agent-task"
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    className={baseSelectClasses}
                    disabled={isProcessing || availableTasks.length === 0}
                >
                    {availableTasks.length === 0 ? (
                        <option>No tasks available</option>
                    ) : (
                        availableTasks.map(task => (
                            <option key={task.id} value={task.id}>{task.description}</option>
                        ))
                    )}
                </select>
            </div>

            <div className={`w-full transition-all duration-300 ${isVotingEnabled ? 'opacity-100 max-h-40' : 'opacity-50 max-h-0 overflow-hidden'}`}>
                <div className="mt-2">
                    <label htmlFor="voterCount" className="text-xs text-[var(--color-text-dim)] flex justify-between">
                        <span>MAKER Voter Count</span>
                        <span className="font-mono bg-black/30 px-1.5 py-0.5 rounded">{voterCount}</span>
                    </label>
                    <input
                        id="voterCount"
                        type="range"
                        min="1"
                        max="7"
                        step="2"
                        value={voterCount}
                        onChange={(e) => setVoterCount(parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-black/40 rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)] mt-1"
                        disabled={!isVotingEnabled || isProcessing}
                    />
                    <div className="flex justify-between text-xs text-[var(--color-text-dim)] mt-1">
                        <span>Fast</span>
                        <span>Robust</span>
                    </div>
                </div>
            </div>

            <div className="flex-grow"></div>

            <button
                type="submit"
                disabled={isProcessing || !selectedTaskId}
                className="w-full mt-2 px-6 py-2 border border-[var(--color-primary)] bg-[var(--color-primary)]/20 text-[var(--color-primary)] font-semibold rounded-md flex items-center justify-center gap-2 hover:bg-[var(--color-primary)]/40 disabled:bg-gray-500/20 disabled:border-gray-600 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors self-end flex-shrink-0"
            >
                {isProcessing ? (
                <>
                    <Loader className="animate-spin" size={20} />
                    <span>Processing...</span>
                </>
                ) : (
                <>
                    <PlayCircle size={20} />
                    <span>Initiate</span>
                </>
                )}
            </button>
        </>
      ) : (
        <div className="flex-grow flex items-center justify-center text-[var(--color-text-dim)]">
            Loading agent configuration...
        </div>
      )}
    </form>
  );
};

export default TaskInitiator;
