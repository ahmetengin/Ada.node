import React, { useState, useRef, useEffect } from 'react';
import { LogEntry, LogType } from '../types';
import { ArrowRight, CheckCircle, XCircle, Info, GraduationCap, RefreshCw, CheckCheck, Lightbulb, Scale, Undo2, Terminal } from 'lucide-react';

interface TerminalPanelProps {
  logs: LogEntry[];
  onCommandSubmit: (command: string) => void;
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
    default: return <Info size={14} className="text-gray-400" />;
  }
};

const TerminalPanel: React.FC<TerminalPanelProps> = ({ logs, onCommandSubmit }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onCommandSubmit(input.trim());
      setInput('');
    }
  };

  return (
    <div className="panel-glow p-4 flex flex-col h-full max-h-[25vh] min-h-[150px]">
      <h3 className="text-sm font-semibold text-[var(--color-text-dim)] mb-2 flex items-center gap-2 flex-shrink-0 border-b border-white/10 pb-2">
        <Terminal size={16} className="text-[var(--color-primary)]" />
        <span>TERMINAL</span>
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
      <form onSubmit={handleSubmit} className="mt-2 flex-shrink-0">
        <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-md p-1.5">
          <span className="text-cyan-400 pl-1">{'>'}</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-transparent outline-none text-gray-200 font-mono text-sm"
            placeholder="Type 'run <agent> <task>' or 'help'..."
            spellCheck="false"
            autoComplete="off"
          />
        </div>
      </form>
    </div>
  );
};

export default TerminalPanel;
