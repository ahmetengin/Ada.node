import React, { useState } from 'react';
import { AgentConfig, AgentModule, TaskDetails } from '../types';
import { Folder, ChevronDown, ChevronRight, FileCode } from 'lucide-react';

interface FileTreePanelProps {
  agentConfig: AgentConfig | null;
  onTaskSelect: (taskDetails: TaskDetails) => void;
  selectedTask: TaskDetails | null;
}

const FileTreePanel: React.FC<FileTreePanelProps> = ({ agentConfig, onTaskSelect, selectedTask }) => {
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>(() => {
    if (!agentConfig) return {};
    // Open all folders by default
    return Object.keys(agentConfig.modules).reduce((acc, agentId) => {
        acc[agentId] = true;
        return acc;
    }, {} as Record<string, boolean>);
  });

  const toggleFolder = (agentId: string) => {
    setOpenFolders(prev => ({ ...prev, [agentId]: !prev[agentId] }));
  };

  if (!agentConfig) {
    return (
      <div className="panel-glow p-4 flex flex-col h-full">
        <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 flex-shrink-0" style={{ textShadow: `0 0 5px var(--color-primary-glow)`}}>Explorer</h3>
        <div className="flex-grow flex items-center justify-center text-[var(--color-text-dim)]">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="panel-glow p-4 flex flex-col h-full">
      <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 flex-shrink-0" style={{ textShadow: `0 0 5px var(--color-primary-glow)`}}>Explorer</h3>
      <div className="flex-grow overflow-y-auto pr-2 text-sm">
        {Object.entries(agentConfig.modules).map(([agentId, agentModule]: [string, AgentModule]) => (
          <div key={agentId} className="mb-2">
            <div 
                onClick={() => toggleFolder(agentId)}
                className="flex items-center gap-2 cursor-pointer p-1 rounded-md hover:bg-white/10"
            >
              {openFolders[agentId] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <Folder size={16} className="text-[var(--color-primary)]" />
              <span className="font-medium text-[var(--color-text)]">{agentId.replace(/_/g, ' ')}</span>
            </div>
            {openFolders[agentId] && (
              <ul className="pl-6 border-l-2 border-white/10 ml-2 mt-1">
                {agentModule.tasks.map((task) => {
                  const isSelected = selectedTask?.agentId === agentId && selectedTask?.task.id === task.id;
                  return (
                    <li 
                      key={task.id}
                      onClick={() => onTaskSelect({ agentId, task })}
                      className={`flex items-center gap-2 cursor-pointer p-1.5 rounded-md hover:bg-white/10 ${isSelected ? 'bg-[var(--color-primary)]/20' : ''}`}
                    >
                      <FileCode size={16} className="text-[var(--color-text-dim)]" />
                      <span className="text-xs text-[var(--color-text-dim)]">{task.id}.js</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileTreePanel;
