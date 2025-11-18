import React, { useState } from 'react';
import { AgentFrameworkConfig, TaskDetails } from '../types';
import { Cpu, Wrench, Package, ChevronRight } from 'lucide-react';

interface SkillsPanelProps {
  agentFrameworkConfig: AgentFrameworkConfig | null;
  onTaskSelect: (taskDetails: TaskDetails) => void;
  selectedTask: TaskDetails | null;
}

const SkillsPanel: React.FC<SkillsPanelProps> = ({ agentFrameworkConfig, onTaskSelect, selectedTask }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!agentFrameworkConfig) {
    return (
      <div className="panel-glow p-4 flex flex-col h-full">
        <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 flex-shrink-0">Agent Skills</h3>
        <div className="flex-grow flex items-center justify-center text-[var(--color-text-dim)]">Loading...</div>
      </div>
    );
  }

  const { modules, providers, tools } = agentFrameworkConfig;

  return (
    <div className="panel-glow p-4 flex flex-col h-full">
      <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 flex-shrink-0">Agent Capability Matrix</h3>
      <div className="flex-grow overflow-y-auto pr-2 text-sm space-y-4">
        {Object.entries(modules).map(([agentId, agentModule]) => (
          <div key={agentId}>
            <div className="flex items-center gap-2 mb-2">
              <Cpu size={18} className="text-[var(--color-primary)]" />
              <h4 className="font-semibold text-[var(--color-text)] capitalize">{agentId.replace(/_/g, ' ')}</h4>
            </div>
            <ul className="space-y-1 pl-2 border-l-2 border-white/10 ml-2">
              {agentModule.skills.map(skill => {
                const isSkillSelected = selectedTask?.agentId === agentId && selectedTask?.skillId === skill.id && !selectedTask.providerId;
                const isSkillExpanded = expanded[skill.id] || false;
                
                return (
                  <li key={skill.id}>
                    <div 
                      onClick={() => onTaskSelect({ agentId, skillId: skill.id })}
                      onDoubleClick={() => toggleExpand(skill.id)}
                      title="Double-click to expand/collapse"
                      className={`flex items-center gap-2.5 cursor-pointer p-2 rounded-md transition-colors ${isSkillSelected ? 'bg-[var(--color-primary)]/20' : 'hover:bg-white/10'}`}
                    >
                      <ChevronRight size={14} className={`text-[var(--color-text-dim)] flex-shrink-0 transition-transform ${isSkillExpanded ? 'rotate-90' : ''}`} />
                      <Wrench size={14} className={`flex-shrink-0 ${isSkillSelected ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-dim)]'}`} />
                      <div className="flex flex-col">
                        <span className={`text-xs font-medium ${isSkillSelected ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'}`}>{skill.description}</span>
                        <span className="text-xs text-[var(--color-text-dim)]">{skill.providerIds.length} Providers</span>
                      </div>
                    </div>
                    {isSkillExpanded && (
                      <ul className="space-y-1 pl-6 pt-1 border-l border-white/10 ml-3">
                        {skill.providerIds.map(providerId => {
                          const provider = providers[providerId];
                          if (!provider) return null;
                          const isProviderSelected = selectedTask?.providerId === providerId && !selectedTask.toolId;
                          
                          return (
                            <li 
                              key={provider.id} 
                              onClick={(e) => {
                                e.stopPropagation(); 
                                onTaskSelect({ agentId, skillId: skill.id, providerId: provider.id })
                              }}
                              className={`flex items-start gap-2.5 cursor-pointer p-2 rounded-md transition-colors ${isProviderSelected ? 'bg-[var(--color-primary)]/15' : 'hover:bg-white/10'}`}
                            >
                              <Package size={14} className="text-teal-400 mt-0.5 flex-shrink-0" />
                              <div className="flex flex-col">
                                <span className="text-xs text-[var(--color-text)]">{provider.description}</span>
                                <div className="text-xs text-[var(--color-text-dim)] flex flex-wrap gap-x-2">
                                  {provider.supportedToolIds.map(toolId => <span key={toolId}>#{tools[toolId]?.id}</span>)}
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillsPanel;
