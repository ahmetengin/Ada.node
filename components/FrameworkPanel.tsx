
import React from 'react';
import { AgentFrameworkConfig, TaskDetails } from '../types';

interface FrameworkPanelProps {
  agentFrameworkConfig: AgentFrameworkConfig | null;
  onTaskSelect: (taskDetails: TaskDetails) => void;
  selectedTask: TaskDetails | null;
}

const FrameworkPanel: React.FC<FrameworkPanelProps> = ({ agentFrameworkConfig, onTaskSelect }) => {
  if (!agentFrameworkConfig) return <div className="p-4 font-mono text-xs">Loading tree...</div>;

  const { modules } = agentFrameworkConfig;

  return (
    <div className="terminal-panel h-full flex flex-col font-mono text-xs overflow-hidden">
        <div className="p-2 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
            <span className="font-bold text-[var(--text-secondary)]">TREE VIEW</span>
        </div>
        <div className="p-2 overflow-y-auto whitespace-pre text-[var(--text-primary)]">
            <div>.</div>
            {Object.keys(modules).map((agentId, i, arr) => {
                const isLastAgent = i === arr.length - 1;
                const prefix = isLastAgent ? '└── ' : '├── ';
                const childPrefix = isLastAgent ? '    ' : '│   ';
                
                return (
                    <div key={agentId}>
                        <div className="hover:bg-[var(--selection-bg)] hover:text-white cursor-pointer">
                            <span className="text-[var(--text-secondary)]">{prefix}</span>
                            <span className="font-bold text-[var(--accent-color)]">{agentId}</span>
                        </div>
                        {modules[agentId].skills.map((skill, j, sArr) => {
                            const isLastSkill = j === sArr.length - 1;
                            const skillPrefix = isLastSkill ? '└── ' : '├── ';
                            
                            return (
                                <div 
                                    key={skill.id} 
                                    className="hover:bg-[var(--selection-bg)] hover:text-white cursor-pointer"
                                    onClick={() => onTaskSelect({ agentId, skillId: skill.id })}
                                >
                                    <span className="text-[var(--text-secondary)]">{childPrefix}{skillPrefix}</span>
                                    <span className="text-[var(--text-primary)]">{skill.id}</span>
                                    <span className="text-[var(--text-secondary)] ml-2"># {skill.description}</span>
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    </div>
  );
};

export default FrameworkPanel;
