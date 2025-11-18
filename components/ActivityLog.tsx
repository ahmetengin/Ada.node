import React, { useState } from 'react';
import { LogEntry, LogType } from '../types';
import { ArrowRight, ArrowLeft, CheckCircle, XCircle, Info, GraduationCap, RefreshCw, CheckCheck, Lightbulb, Scale, Undo2, Zap, TimerOff, Clock, ClipboardCheck, ShieldCheck, UserCheck, Workflow, BrainCircuit, Filter, X } from 'lucide-react';
import ActivityLogFilters from './ActivityLogFilters';

interface ActivityLogProps {
  logs: LogEntry[];
}

const getLogStyle = (type: LogType) => {
  switch (type) {
    case LogType.INFO: return { icon: <Info size={16} />, color: 'text-blue-400' };
    case LogType.REQUEST: return { icon: <ArrowRight size={16} />, color: 'text-yellow-400' };
    case LogType.RESPONSE: return { icon: <ArrowLeft size={16} />, color: 'text-purple-400' };
    case LogType.SUCCESS: return { icon: <CheckCircle size={16} />, color: 'text-green-400' };
    case LogType.ERROR: return { icon: <XCircle size={16} />, color: 'text-red-400' };
    case LogType.LEARNING: return { icon: <GraduationCap size={16} />, color: 'text-pink-400' };
    case LogType.ACK: return { icon: <CheckCheck size={16} />, color: 'text-teal-400' };
    case LogType.RETRY: return { icon: <RefreshCw size={16} />, color: 'text-orange-400' };
    case LogType.THINKING: return { icon: <Lightbulb size={16} />, color: 'text-gray-400' };
    case LogType.VOTING: return { icon: <Scale size={16} />, color: 'text-orange-300' };
    case LogType.CONSENSUS: return { icon: <CheckCheck size={16} />, color: 'text-green-300' };
    case LogType.BACKTRACK: return { icon: <Undo2 size={16} />, color: 'text-yellow-300' };
    case LogType.RTC_MESSAGE: return { icon: <Zap size={16} />, color: 'text-cyan-400' };
    case LogType.TIMEOUT: return { icon: <TimerOff size={16} />, color: 'text-red-500' };
    case LogType.TOOL_SELECTION: return { icon: <ClipboardCheck size={16} />, color: 'text-purple-300' };
    case LogType.SEAL: return { icon: <ShieldCheck size={16} />, color: 'text-cyan-300' };
    case LogType.CONTEXT_ENRICHMENT: return { icon: <UserCheck size={16} />, color: 'text-teal-300' };
    case LogType.WORKFLOW_STEP: return { icon: <Workflow size={16} />, color: 'text-indigo-300' };
    case LogType.MCP_DECISION: return { icon: <BrainCircuit size={16} />, color: 'text-pink-400' };
    default: return { icon: <Info size={16} />, color: 'text-gray-400' };
  }
};

const VoteDistributionChart: React.FC<{ distribution: Record<string, number> }> = ({ distribution }) => {
    const totalVotes = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    if (totalVotes === 0) return null;
    const getBarColor = (decision: string) => decision.includes('confirm') ? 'bg-green-500' : 'bg-red-500';
    return (
        <div className="mt-2 space-y-1.5 pr-2">
            {Object.entries(distribution).map(([decision, count]) => (
                <div key={decision} className="flex items-center gap-2 text-xs">
                    <span className="w-20 capitalize text-gray-400 truncate">{decision} ({count})</span>
                    <div className="flex-grow bg-black/40 rounded-full h-3">
                        <div className={`h-3 rounded-full ${getBarColor(decision)}`} style={{ width: `${(count / totalVotes) * 100}%`}}/>
                    </div>
                </div>
            ))}
        </div>
    );
};

const ActivityLog: React.FC<ActivityLogProps> = ({ logs }) => {
  const [typeFilters, setTypeFilters] = useState<Set<LogType>>(new Set());
  const [sourceFilters, setSourceFilters] = useState<Set<string>>(new Set());

  const availableSources = [...new Set(logs.map(log => log.source).filter(Boolean))] as string[];

  const filteredLogs = logs.filter(log => {
    const typeMatch = typeFilters.size === 0 || typeFilters.has(log.type);
    const sourceMatch = sourceFilters.size === 0 || (log.source && sourceFilters.has(log.source));
    return typeMatch && sourceMatch;
  });

  return (
    <div className="panel-glow p-4 flex flex-col min-h-0 h-full">
      <ActivityLogFilters
        logs={logs}
        typeFilters={typeFilters}
        setTypeFilters={setTypeFilters}
        sourceFilters={sourceFilters}
        setSourceFilters={setSourceFilters}
        availableSources={availableSources}
      />
      <div className="flex-grow bg-black/30 rounded-lg p-2 overflow-y-auto mt-2">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[var(--color-text-dim)]">
            {logs.length === 0 ? 'Awaiting task initiation...' : 'No logs match the current filters.'}
          </div>
        ) : (
          <ul className="space-y-1 text-sm">
            {filteredLogs.map((log) => {
              const { icon, color } = getLogStyle(log.type);
              return (
                <li key={log.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-white/5">
                  <span className={`mt-0.5 ${color}`}>{icon}</span>
                  <div className="flex-grow">
                    <div className="flex justify-between items-baseline">
                      <p className={`font-semibold ${color}`}>
                        {log.type} {log.source ? `(${log.source})` : ''}
                        {log.direction === 'outbound' && ' ->'}
                        {log.direction === 'inbound' && ' <-'}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">{log.timestamp}</p>
                    </div>
                    <p className="text-[var(--color-text)] whitespace-pre-wrap">{log.message}</p>
                    {log.requestId && (
                      <div className="text-xs text-gray-500 font-mono mt-1 flex items-center gap-4">
                        <span>ID: {log.requestId}</span>
                        {log.responseTimeMs !== undefined && (
                          <span className="flex items-center gap-1"><Clock size={12} /> {log.responseTimeMs}ms</span>
                        )}
                      </div>
                    )}
                    {log.voteDistribution && <VoteDistributionChart distribution={log.voteDistribution} />}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
