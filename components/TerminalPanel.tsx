import React, { useState } from 'react';
import { LogEntry, AgentFrameworkConfig } from '../types';

interface TerminalPanelProps {
  logs: LogEntry[];
  onCommandSubmit: (command: string) => void;
  agentFrameworkConfig: AgentFrameworkConfig | null;
}

const TerminalPanel: React.FC<TerminalPanelProps> = ({ onCommandSubmit }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onCommandSubmit(input.trim());
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="terminal-panel p-2 flex items-center gap-2 h-full bg-[var(--bg-primary)]">
        <span className="text-[var(--success-color)] font-bold font-mono">➜</span>
        <span className="text-[var(--accent-color)] font-bold font-mono">~</span>
        <div className="flex-grow relative flex items-center">
            <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                className="w-full bg-transparent border-none outline-none font-mono text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] caret-[var(--accent-color)]"
                placeholder="Enter command..."
                autoFocus
            />
        </div>
    </form>
  );
};

export default TerminalPanel;