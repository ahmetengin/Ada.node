import React, { useState, useRef, useEffect } from 'react';
import { LogEntry, LogType, AgentFrameworkConfig } from '../types';
import { ArrowRight, CheckCircle, XCircle, Info, GraduationCap, RefreshCw, CheckCheck, Lightbulb, Scale, Undo2, Terminal, ClipboardCheck } from 'lucide-react';

interface TerminalPanelProps {
  logs: LogEntry[];
  onCommandSubmit: (command: string) => void;
  agentFrameworkConfig: AgentFrameworkConfig | null;
}

const getLogIcon = (type: LogType) => {
  switch (type) {
    case LogType.INFO: return <Info size={14} className="text-blue-400" />;
    case LogType.REQUEST: return <ArrowRight size={14} className="text-yellow-400" />;
    case LogType.SUCCESS: return <CheckCircle size={14} className="text-green-400" />;
    case LogType.ERROR: return <XCircle size={14} className="text-red-400" />;
    case LogType.LEARNING: return <GraduationCap size={14} className="text-pink-400" />;
    case LogType.ACK: return <CheckCheck size={14} className="text-teal-400" />;
    case LogType.RETRY: return <RefreshCw size={14} className="text-orange-400" />;
    case LogType.THINKING: return <Lightbulb size={14} className="text-gray-500" />;
    case LogType.VOTING: return <Scale size={14} className="text-orange-300" />;
    case LogType.CONSENSUS: return <CheckCheck size={14} className="text-green-300" />;
    case LogType.BACKTRACK: return <Undo2 size={14} className="text-yellow-300" />;
    case LogType.TOOL_SELECTION: return <ClipboardCheck size={14} className="text-purple-300" />;
    default: return <Info size={14} className="text-gray-400" />;
  }
};

const TerminalPanel: React.FC<TerminalPanelProps> = ({ logs, onCommandSubmit, agentFrameworkConfig }) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    if (!agentFrameworkConfig || !input.startsWith('run ')) {
        setSuggestions([]);
        return;
    }

    const parts = input.trim().split(/\s+/);
    const command = parts[0];
    const agentQuery = parts[1];
    const skillQuery = parts[2];

    // Suggest agent
    if (parts.length === 2 && agentQuery) {
        const matchingAgents = Object.keys(agentFrameworkConfig.modules)
            .filter(id => id.startsWith(agentQuery));
        setSuggestions(matchingAgents.map(id => `${command} ${id} `));
    } 
    // Suggest skill
    else if (parts.length === 3 && agentQuery && skillQuery) {
        const agent = agentFrameworkConfig.modules[agentQuery];
        if (agent) {
            const matchingSkills = agent.skills
                .filter(skill => skill.id.startsWith(skillQuery))
                .map(skill => `${command} ${agentQuery} ${skill.id}`);
            setSuggestions(matchingSkills);
        } else {
            setSuggestions([]);
        }
    } else {
        setSuggestions([]);
    }
    setSuggestionIndex(-1);
  }, [input, agentFrameworkConfig]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onCommandSubmit(input.trim());
      setInput('');
      setSuggestions([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSuggestionIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Tab' && suggestionIndex !== -1) {
      e.preventDefault();
      setInput(suggestions[suggestionIndex]);
      setSuggestions([]);
    } else if (e.key === 'Escape') {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  return (
    <div className="panel-glow p-4 flex flex-col h-full max-h-[25vh] min-h-[150px]">
      <h3 className="text-sm font-semibold text-[var(--color-text-dim)] mb-2 flex items-center gap-2 flex-shrink-0 border-b border-white/10 pb-2">
        <Terminal size={16} className="text-[var(--color-primary)]" />
        <span>MCP TERMINAL</span>
      </h3>
      <div ref={scrollRef} className="flex-grow bg-black/30 rounded-lg p-2 overflow-y-auto font-mono text-xs" onClick={() => inputRef.current?.focus()}>
        {logs.slice().reverse().map((log) => (
          <div key={log.id} className="flex items-start gap-2">
            <span className="text-gray-600">{log.timestamp}</span>
            <span className="flex-shrink-0 w-16 text-right font-bold text-cyan-400">{log.source || 'System'}</span>
            <div className="flex-grow flex gap-2 items-start">
              {getLogIcon(log.type)}
              <p className="whitespace-pre-wrap">{log.message}</p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="mt-2 flex-shrink-0 relative">
        {suggestions.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 bg-[var(--color-panel)] border border-white/20 rounded-md p-1 z-10 mb-1">
                {suggestions.map((s, i) => (
                    <div 
                        key={s}
                        onClick={() => handleSuggestionClick(s)}
                        className={`px-2 py-1 text-xs rounded cursor-pointer ${i === suggestionIndex ? 'bg-[var(--color-primary)]/30' : 'hover:bg-white/10'}`}
                    >
                        {s}
                    </div>
                ))}
            </div>
        )}
        <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-md p-1.5">
          <span className="text-cyan-400 pl-1">{'>'}</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent outline-none text-gray-200 font-mono text-sm"
            placeholder="Type 'run <agent> <skill>' or 'help'..."
            spellCheck="false"
            autoComplete="off"
          />
        </div>
      </form>
    </div>
  );
};

export default TerminalPanel;