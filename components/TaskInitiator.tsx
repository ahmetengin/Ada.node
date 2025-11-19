
import React from 'react';
import { AgentFrameworkConfig, TaskDetails } from '../types';
import { Play } from 'lucide-react';

interface TaskInitiatorProps {
  onSubmit: (task: TaskDetails) => void;
  isProcessing: boolean;
  agentFrameworkConfig: AgentFrameworkConfig | null;
  selectedTask: TaskDetails | null;
}

const TaskInitiator: React.FC<TaskInitiatorProps> = ({ onSubmit, isProcessing, selectedTask }) => {
  const handleSubmit = () => {
    if (selectedTask && !isProcessing) onSubmit(selectedTask);
  };

  return (
    <div className="terminal-panel p-3 flex flex-col justify-between h-full">
        <div>
            <div className="text-[10px] text-[var(--text-secondary)] uppercase mb-1">Target Agent</div>
            <div className="text-sm font-mono text-[var(--accent-color)] bg-[var(--bg-tertiary)] p-1 mb-3 border border-[var(--border-color)]">
                {selectedTask?.agentId || 'None'}
            </div>
            <div className="text-[10px] text-[var(--text-secondary)] uppercase mb-1">Skill / Routine</div>
            <div className="text-sm font-mono text-[var(--success-color)] bg-[var(--bg-tertiary)] p-1 border border-[var(--border-color)]">
                {selectedTask?.skillId || 'None'}
            </div>
        </div>
        <button 
            onClick={handleSubmit}
            disabled={isProcessing || !selectedTask}
            className="w-full bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold font-mono py-2 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
            <Play size={14} /> EXEC
        </button>
    </div>
  );
};

export default TaskInitiator;
