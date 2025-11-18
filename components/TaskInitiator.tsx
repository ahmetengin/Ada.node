import React from 'react';
import { PlayCircle, Loader } from 'lucide-react';
import { AgentFrameworkConfig, TaskDetails } from '../types';

interface TaskInitiatorProps {
  onSubmit: (task: TaskDetails) => void;
  isProcessing: boolean;
  agentFrameworkConfig: AgentFrameworkConfig | null;
  isVotingEnabled: boolean;
  voterCount: number;
  setVoterCount: (count: number) => void;
  selectedTask: TaskDetails | null;
  onTaskChange: (taskDetails: TaskDetails) => void;
}

const TaskInitiator: React.FC<TaskInitiatorProps> = ({ 
    onSubmit, 
    isProcessing, 
    agentFrameworkConfig, 
    isVotingEnabled, 
    voterCount, 
    setVoterCount,
    selectedTask,
    onTaskChange
}) => {
  const { agentId, skillId, providerId, toolId } = selectedTask || {};

  const handleSelectionChange = (level: 'agent' | 'skill' | 'provider' | 'tool', value: string) => {
    if (!agentFrameworkConfig) return;

    let newSelection: TaskDetails = { agentId: agentId || '' };

    if (level === 'agent') {
        newSelection.agentId = value;
        const firstSkill = agentFrameworkConfig.modules[value]?.skills[0];
        if (firstSkill) newSelection.skillId = firstSkill.id;
    } else if (level === 'skill') {
        newSelection.agentId = agentId!;
        newSelection.skillId = value;
    } else if (level === 'provider') {
        newSelection.agentId = agentId!;
        newSelection.skillId = skillId!;
        newSelection.providerId = value;
    } else if (level === 'tool') {
        newSelection.agentId = agentId!;
        newSelection.skillId = skillId!;
        newSelection.providerId = providerId!;
        newSelection.toolId = value;
    }
    
    onTaskChange(newSelection);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing || !agentId || !skillId) return;
    onSubmit({ agentId, skillId, providerId, toolId });
  };
  
  const baseSelectClasses = "w-full bg-[var(--color-panel)] border border-[var(--color-primary)]/30 rounded-md p-2 text-white focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none transition-all text-sm capitalize";
  
  const { modules, providers, tools } = agentFrameworkConfig || {};
  
  const availableSkills = agentId && modules ? modules[agentId]?.skills : [];
  const skill = skillId && availableSkills ? availableSkills.find(s => s.id === skillId) : null;
  const availableProviders = skill && providers ? skill.providerIds.map(id => providers[id]).filter(Boolean) : [];
  const provider = providerId && availableProviders ? availableProviders.find(p => p.id === providerId) : null;
  const availableTools = provider && tools ? provider.supportedToolIds.map(id => tools[id]).filter(Boolean) : [];

  return (
    <form onSubmit={handleSubmit} className="panel-glow p-4 flex flex-col gap-3">
      <h3 className="text-lg font-semibold text-[var(--color-primary)] flex-shrink-0">Task Initiator</h3>
      
      {!agentFrameworkConfig ? (
        <div className="flex-grow flex items-center justify-center text-[var(--color-text-dim)]">Loading...</div>
      ) : (
        <>
            <Select label="Agent" value={agentId} onChange={val => handleSelectionChange('agent', val)} options={Object.keys(modules || {})} disabled={isProcessing} />
            <Select label="Skill" value={skillId} onChange={val => handleSelectionChange('skill', val)} options={availableSkills.map(s => ({ value: s.id, label: s.description }))} disabled={isProcessing || !agentId} />
            <Select label="Provider (Optional)" value={providerId} onChange={val => handleSelectionChange('provider', val)} options={availableProviders.map(p => ({ value: p.id, label: p.description }))} disabled={isProcessing || !skillId} includeEmpty />
            <Select label="Tool (Optional)" value={toolId} onChange={val => handleSelectionChange('tool', val)} options={availableTools.map(t => ({ value: t.id, label: t.description }))} disabled={isProcessing || !providerId} includeEmpty />
            
            <div className={`w-full transition-all duration-300 ${isVotingEnabled ? 'opacity-100' : 'opacity-50'}`}>
                <div className="mt-2">
                    <label htmlFor="voterCount" className="text-xs text-[var(--color-text-dim)] flex justify-between"><span>MAKER Consensus</span></label>
                    <div className="text-xs text-[var(--color-text-dim)] mt-1">Runs consensus on tool outputs.</div>
                </div>
            </div>

            <button type="submit" disabled={isProcessing || !skillId} className="w-full mt-2 px-6 py-2 border border-[var(--color-primary)] bg-[var(--color-primary)]/20 text-[var(--color-primary)] font-semibold rounded-md flex items-center justify-center gap-2 hover:bg-[var(--color-primary)]/40 disabled:bg-gray-500/20 disabled:border-gray-600 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors">
                {isProcessing ? <><Loader className="animate-spin" size={20} /><span>Processing...</span></> : <><PlayCircle size={20} /><span>Initiate</span></>}
            </button>
        </>
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
    includeEmpty?: boolean;
}

const Select: React.FC<SelectProps> = ({ label, value, onChange, options, disabled, includeEmpty }) => (
    <div>
        <label className="text-xs text-[var(--color-text-dim)]">{label}</label>
        <select value={value || ''} onChange={e => onChange(e.target.value)} disabled={disabled || options.length === 0} className="w-full bg-[var(--color-panel)] border border-[var(--color-primary)]/30 rounded-md p-2 text-white focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none transition-all text-sm capitalize">
            {includeEmpty && <option value="">All</option>}
            {options.map(opt => {
                const val = typeof opt === 'string' ? opt : opt.value;
                const lab = typeof opt === 'string' ? opt.replace(/_/g, ' ') : opt.label;
                return <option key={val} value={val}>{lab}</option>;
            })}
        </select>
    </div>
);


export default TaskInitiator;