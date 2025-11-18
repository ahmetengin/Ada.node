
import React from 'react';
import { AgentConfig, AgentModule } from './types';
import { Cog } from 'lucide-react';

interface AgentTasksPanelProps {
  agentConfig: AgentConfig | null;
}

const AgentTasksPanel: React.FC<AgentTasksPanelProps> = ({ agentConfig }) => {
  if (!agentConfig) {
    return (
      <div className="panel-glow p-4 flex flex-col h-full">
        <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 flex items-center gap-2 flex-shrink-0" style={{ textShadow: `0 0 5px var(--color-primary-glow)`}}>
          <Cog size={20} />
          <span>Agent Tasks</span>
        </h3>
        <div className="flex-grow flex items-center justify-center text-[var(--color-text-dim)]">
          Loading agent configuration...
        </div>
      </div>
    );
  }

  return (
    <div className="panel-glow p-4 flex flex-col h-full">
      <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 flex items-center gap-2 flex-shrink-0" style={{ textShadow: `0 0 5px var(--color-primary-glow)`}}>
        <Cog size={20} />
        <span>Agent Tasks</span>
      </h3>
      <div className="space-y-4 overflow-y-auto pr-2">
        {/* FIX: Explicitly type map parameters to resolve TypeScript inference issue with Object.entries. */}
        {Object.entries(agentConfig.modules).map(([agentId, agentModule]: [string, AgentModule]) => (
          <div key={agentId}>
            <p className="font-medium text-sm text-[var(--color-primary)] mb-2 uppercase tracking-wider">{agentId.replace(/_/g, ' ')}</p>
            <ul className="space-y-2 pl-2 border-l-2 border-white/10">
              {agentModule.tasks.map((task) => (
                <li key={task.id} className="p-2 rounded-md bg-black/20">
                  <p className="text-xs text-[var(--color-text-dim)]">{task.description}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentTasksPanel;
