import React from 'react';
import { LogEntry, LogType } from '../types';
import { ArrowRight, ArrowLeft, CheckCircle, XCircle, Info, GraduationCap, RefreshCw, CheckCheck, Lightbulb } from 'lucide-react';

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
      return { icon: <Lightbulb size={16} />, color: 'text-gray-400', };
    default:
      return { icon: <Info size={16} />, color: 'text-gray-400', };
  }
};


const ActivityLog: React.FC<ActivityLogProps> = ({ logs }) => {
  return (
    <div className="flex-grow flex flex-col min-h-0">
      <h3 className="text-lg font-semibold text-cyan-300 mb-4">Aktivite Kaydı</h3>
      <div className="flex-grow bg-gray-900/50 rounded-lg p-4 border border-gray-700 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            Başlatılacak görev bekleniyor...
          </div>
        ) : (
          <ul className="space-y-2 text-sm">
            {logs.map((log) => {
              const { icon, color } = getLogStyle(log.type);
              return (
              <li key={log.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-white/5 animate-fade-in">
                <span className={`mt-0.5 ${color}`}>{icon}</span>
                <div className="flex-grow">
                  <div className="flex justify-between items-baseline">
                      <p className={`font-semibold ${color}`}>{log.type} {log.source ? `(${log.source})` : ''}</p>
                      <p className="text-xs text-gray-500 font-mono">{log.timestamp}</p>
                  </div>
                  <p className="text-gray-300">{log.message}</p>
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