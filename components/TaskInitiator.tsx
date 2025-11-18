import React from 'react';
import { PlayCircle, Loader } from 'lucide-react';
import { AgentFrameworkConfig, TaskDetails } from '../types';

interface TaskInitiatorProps {
  onSubmit: (task: TaskDetails) => void;
  isProcessing: boolean;
  agentFrameworkConfig: AgentFrameworkConfig | null;
  isVotingEnabled: boolean;
  selectedTask: TaskDetails | null;
  onTaskChange: (taskDetails: TaskDetails) => void;
}

const TaskInitiator: React.FC<TaskInitiatorProps> = ({ 
    onSubmit, 
    isProcessing, 
    agentFrameworkConfig, 
    selectedTask,
    onTaskChange
}) => {
  const { agentId, skillId } = selectedTask || {};

  const handleSelectionChange = (level: 'agent' | 'skill', value: string) => {
    if (!agentFrameworkConfig) return;

    let newSelection: TaskDetails = { agentId: agentId || '' };

    if (level === 'agent') {
        newSelection.agentId = value;
        const firstSkill = agentFrameworkConfig.modules[value]?.skills[0];
        if (firstSkill) newSelection.skillId = firstSkill.id;
    } else if (level === 'skill') {
        newSelection.agentId = agentId!;
        newSelection.skillId = value;
    }
    
    onTaskChange(newSelection);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing || !agentId || !skillId) return;
    onSubmit({ agentId, skillId });
  };
  
  const { modules } = agentFrameworkConfig || {};
  const availableSkills = agentId && modules ? modules[agentId]?.skills : [];

  return (
    <form onSubmit={handleSubmit} className="panel-glow p-4 flex flex-col gap-3 h-full">
      <h3 className="text-lg font-semibold text-[var(--color-primary)] flex-shrink-0">Task Initiator</h3>
      
      {!agentFrameworkConfig ? (
        <div className="flex-grow flex items-center justify-center text-[var(--color-text-dim)]">Loading...</div>
      ) : (
        <div className="flex-grow flex flex-col justify-between">
            <div className="space-y-4">
                <Select label="Target Agent" value={agentId} onChange={val => handleSelectionChange('agent', val)} options={Object.keys(modules || {})} disabled={isProcessing} />
                <Select label="Primary Skill" value={skillId} onChange={val => handleSelectionChange('skill', val)} options={availableSkills.map(s => ({ value: s.id, label: s.description }))} disabled={isProcessing || !agentId} />
                <div className="text-xs text-gray-400 p-2 bg-black/20 rounded-md">
                    The MCP will automatically select the best providers and tools based on the skill and any available customer context.
                </div>
            </div>

            <button type="submit" disabled={isProcessing || !skillId} className="w-full mt-2 px-6 py-2.5 border border-[var(--color-primary)] bg-[var(--color-primary)]/20 text-[var(--color-primary)] font-semibold rounded-md flex items-center justify-center gap-2 hover:bg-[var(--color-primary)]/40 disabled:bg-gray-500/20 disabled:border-gray-600 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors">
                {isProcessing ? <><Loader className="animate-spin" size={20} /><span>Processing...</span></> : <><PlayCircle size={20} /><span>Initiate Task</span></>}
            </button>
        </div>
      )}
    </form>
  );
};

interface SelectProps {
    label: string;
    value?: string;
    onChange: (value: string) => void;
    options: (string | { value: string; label: string })[];
    disabled: boolean;
}

const Select: React.FC<SelectProps> = ({ label, value, onChange, options, disabled }) => (
    <div>
        <label className="text-sm text-[var(--color-text-dim)] mb-1 block">{label}</label>
        <select value={value || ''} onChange={e => onChange(e.target.value)} disabled={disabled || options.length === 0} className="w-full bg-[var(--color-panel)] border border-[var(--color-primary)]/30 rounded-md p-2 text-white focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none transition-all text-sm capitalize">
            {options.map(opt => {
                const val = typeof opt === 'string' ? opt : opt.value;
                const lab = typeof opt === 'string' ? opt.replace(/_/g, ' ') : opt.label;
                return <option key={val} value={val}>{lab}</option>;
            })}
        </select>
    </div>
);

export default TaskInitiator;
