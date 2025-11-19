
import React, { useRef, useEffect } from 'react';
import { LogEntry, LogType } from '../types';

interface ActivityLogProps {
  logs: LogEntry[];
  onRequestAnalysis: (type: 'summary' | 'errors' | 'explain_error', log?: LogEntry) => void;
}

const LogLine: React.FC<{ log: LogEntry, onClick: () => void }> = ({ log, onClick }) => {
    let color = 'text-[var(--text-primary)]';
    let prefix = 'INFO';
    
    switch(log.type) {
        case LogType.ERROR: color = 'text-[var(--error-color)]'; prefix = 'ERR '; break;
        case LogType.SUCCESS: color = 'text-[var(--success-color)]'; prefix = 'OK  '; break;
        case LogType.MCP_DECISION: color = 'text-[var(--accent-color)]'; prefix = 'MCP '; break;
        case LogType.MCP_WORKFLOW_PLAN: color = 'text-[var(--warning-color)]'; prefix = 'PLAN'; break;
        case LogType.TOOL_SELECTION: color = 'text-[#d7ba7d]'; prefix = 'TOOL'; break; // VSCode yellow
        default: prefix = log.type.substring(0, 4).toUpperCase().padEnd(4);
    }

    return (
        <div className="flex gap-2 hover:bg-[var(--selection-bg)] hover:text-white px-2 py-0.5 cursor-pointer" onClick={onClick}>
            <span className="text-[var(--text-secondary)] whitespace-nowrap">{log.timestamp}</span>
            <span className={`font-bold ${color} whitespace-nowrap`}>[{prefix}]</span>
            <span className="text-[var(--accent-color)] whitespace-nowrap w-24 truncate hidden md:block">{log.source || 'KERNEL'}</span>
            <span className={`whitespace-pre-wrap break-all ${color}`}>{log.message}</span>
        </div>
    );
}

const ActivityLog: React.FC<ActivityLogProps> = ({ logs, onRequestAnalysis }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="terminal-panel flex flex-col h-full font-mono text-xs">
        <div className="flex items-center justify-between p-2 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
            <span className="font-bold text-[var(--text-secondary)]">/var/log/ada.log</span>
            <span className="text-[var(--text-secondary)]">{logs.length} lines</span>
        </div>
        <div ref={scrollRef} className="flex-grow overflow-y-auto p-1">
            {logs.map(log => (
                <LogLine 
                    key={log.id} 
                    log={log} 
                    onClick={() => log.type === LogType.ERROR ? onRequestAnalysis('explain_error', log) : null} 
                />
            ))}
            <div className="h-4 w-2 bg-[var(--text-secondary)] animate-pulse ml-2 mt-1"></div>
        </div>
    </div>
  );
};

export default ActivityLog;
