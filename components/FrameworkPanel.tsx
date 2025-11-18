
import React, { useState } from 'react';
import { AgentFrameworkConfig, TaskDetails } from '../types';
import { Cpu, Wrench, Package, Atom, ChevronRight, Workflow } from 'lucide-react';

interface FrameworkPanelProps {
  agentFrameworkConfig: AgentFrameworkConfig | null;
  onTaskSelect: (taskDetails: TaskDetails) => void;
  selectedTask: TaskDetails | null;
}

const FrameworkPanel: React.FC<FrameworkPanelProps> = ({ agentFrameworkConfig, onTaskSelect, selectedTask }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ 'crm_agent': true, 'travel_agent': true }); // Expand by default

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!agentFrameworkConfig) {
    return (
      <div className="flex-grow flex items-center justify-center text-[var(--color-text-dim)]">Loading Framework...</div>
    );
  }

  const { modules, providers, tools } = agentFrameworkConfig;

  const isSelected = (ids: Partial<TaskDetails>) => {
    if (!selectedTask) return false;
    return Object.entries(ids).every(([key, value]) => (selectedTask as any)[key] === value);
  };

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 flex-shrink-0 px-2">Agent Framework</h3>
      <div className="flex-grow overflow-y-auto pr-2 text-sm space-y-4">
        {/* FIX: Refactored from Object.entries to Object.keys to fix type inference issue on agentModule. */}
        {Object.keys(modules).map((agentId) => {
          const agentModule = modules[agentId];
          return (
          <div key={agentId}>
            <div 
              className="flex items-center gap-2 mb-2 p-2 rounded-md hover:bg-white/5 cursor-pointer"
              onClick={() => toggleExpand(agentId)}
            >
              <ChevronRight size={16} className={`text-[var(--color-text-dim)] flex-shrink-0 transition-transform ${expanded[agentId] ? 'rotate-90' : ''}`} />
              <Cpu size={18} className="text-[var(--color-primary)]" />
              <h4 className="font-semibold text-[var(--color-text)] capitalize">{agentId.replace(/_/g, ' ')}</h4>
            </div>
            {expanded[agentId] && (
              <ul className="space-y-1 pl-4 border-l-2 border-white/10 ml-4">
                {agentModule.skills.map(skill => (
                  <li key={skill.id}>
                    <div 
                      onClick={() => onTaskSelect({ agentId, skillId: skill.id })}
                      className={`flex items-start gap-2.5 cursor-pointer p-2 rounded-md transition-colors ${isSelected({ agentId, skillId: skill.id, providerId: undefined }) ? 'bg-[var(--color-primary)]/20' : 'hover:bg-white/10'}`}
                    >
                      <Workflow size={14} className="text-pink-400 mt-0.5 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-[var(--color-text)]">{skill.description}</span>
                        <span className="text-xs text-[var(--color-text-dim)]">{skill.providerIds.length} Providers</span>
                      </div>
                    </div>
                    <ul className="space-y-1 pl-4 pt-1 border-l border-white/10 ml-3">
                      {skill.providerIds.map(providerId => {
                        const provider = providers[providerId];
                        if (!provider) return null;
                        return (
                          <li key={provider.id}>
                            <div 
                              onClick={(e) => { e.stopPropagation(); onTaskSelect({ agentId, skillId: skill.id, providerId: provider.id })}}
                              className={`flex items-start gap-2.5 cursor-pointer p-2 rounded-md transition-colors ${isSelected({ agentId, skillId: skill.id, providerId: provider.id }) ? 'bg-[var(--color-primary)]/15' : 'hover:bg-white/10'}`}
                            >
                              <Package size={14} className="text-teal-400 mt-0.5 flex-shrink-0" />
                              <div className="flex flex-col">
                                <span className="text-xs text-[var(--color-text)]">{provider.description}</span>
                                <div className="text-xs text-[var(--color-text-dim)] flex flex-wrap gap-x-2">
                                  {provider.supportedToolIds.map(toolId => (
                                      <div key={toolId} className="flex items-center gap-1">
                                        <Atom size={10} />
                                        <span>{tools[toolId]?.id}</span>
                                      </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )})}
      </div>
    </div>
  );
};

export default FrameworkPanel;