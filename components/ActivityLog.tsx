import React from 'react';
import { LogEntry, LogType } from '../types';
import { ArrowRight, ArrowLeft, CheckCircle, XCircle, Info, GraduationCap, RefreshCw, CheckCheck, Lightbulb, Scale, Undo2 } from 'lucide-react';

interface ActivityLogProps {
  logs: LogEntry[];
}

const getLogStyle = (type: LogType) => {
  switch (type) {
    case LogType.INFO:
      return { icon: <Info size={16} />, color: 'text-blue-400', };
    case LogType.REQUEST:
      return { icon: <ArrowRight size={16} />, color: 'text-yellow-400', };
    case LogType.RESPONSE:
      return { icon: <ArrowLeft size={16} />, color: 'text-purple-400', };
    case LogType.SUCCESS:
      return { icon: <CheckCircle size={16} />, color: 'text-green-400', };
    case LogType.ERROR:
      return { icon: <XCircle size={16} />, color: 'text-red-400', };
    case LogType.LEARNING:
      return { icon: <GraduationCap size={16} />, color: 'text-pink-400', };
    case LogType.ACK:
      return { icon: <CheckCheck size={16} />, color: 'text-teal-400', };
    case LogType.RETRY:
      return { icon: <RefreshCw size={16} />, color: 'text-orange-400', };
    case LogType.THINKING:
      return { icon: <Lightbulb size={16} />, color: 'text-[var(--color-text-dim)]', };
    case LogType.VOTING:
      return { icon: <Scale size={16} />, color: 'text-orange-300', };
    case LogType.CONSENSUS:
      return { icon: <CheckCheck size={16} />, color: 'text-green-300', };
    case LogType.BACKTRACK:
      return { icon: <Undo2 size={16} />, color: 'text-yellow-300', };
    default:
      return { icon: <Info size={16} />, color: 'text-gray-400', };
  }
};

const VoteDistributionChart: React.FC<{ distribution: Record<string, number> }> = ({ distribution }) => {
    const totalVotes = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    if (totalVotes === 0) return null;

    const getBarColor = (decision: string) => {
        if (decision.includes('confirm')) return 'bg-green-500';
        if (decision.includes('reject')) return 'bg-red-500';
        return 'bg-gray-500';
    }

    return (
        <div className="mt-2 space-y-1.5 pr-2">
            {Object.entries(distribution).map(([decision, count]) => (
                <div key={decision} className="flex items-center gap-2 text-xs">
                    <span className="w-20 capitalize text-gray-400 truncate">{decision} ({count})</span>
                    <div className="flex-grow bg-black/40 rounded-full h-3">
                        <div 
                            className={`h-3 rounded-full ${getBarColor(decision)}`}
                            style={{ width: `${(count / totalVotes) * 100}%`}}
                        ></div>
                    </div>
                </div>
            ))}
        </div>
    );
};


const ActivityLog: React.FC<ActivityLogProps> = ({ logs }) => {
  return (
    <div className="panel-glow p-4 flex flex-col min-h-0 h-full">
      <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-2 flex-shrink-0" style={{ textShadow: `0 0 5px var(--color-primary-glow)`}}>Activity Log</h3>
      <div className="flex-grow bg-black/30 rounded-lg p-2 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[var(--color-text-dim)]">
            Awaiting task initiation...
          </div>
        ) : (
          <ul className="space-y-1 text-sm">
            {logs.map((log) => {
              const { icon, color } = getLogStyle(log.type);
              return (
              <li key={log.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-white/5">
                <span className={`mt-0.5 ${color}`}>{icon}</span>
                <div className="flex-grow">
                  <div className="flex justify-between items-baseline">
                      <p className={`font-semibold ${color}`}>{log.type} {log.source ? `(${log.source})` : ''}</p>
                      <p className="text-xs text-gray-500 font-mono">{log.timestamp}</p>
                  </div>
                  <p className="text-[var(--color-text)]">{log.message}</p>
                  {log.voteDistribution && <VoteDistributionChart distribution={log.voteDistribution} />}
                </div>
              </li>
            )})}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
