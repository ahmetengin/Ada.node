
import React, { useRef, useEffect } from 'react';
import { Mic, MicOff, Video } from 'lucide-react';
import { ConversationStatus, TranscriptionEntry } from '../types';
import type { BackgroundEffect } from '../hooks/useLiveConversation';

interface LiveConversationPanelProps {
  status: ConversationStatus;
  transcriptions: TranscriptionEntry[];
  startConversation: () => void;
  stopConversation: () => void;
  stream: MediaStream | null;
}

const LiveConversationPanel: React.FC<LiveConversationPanelProps> = ({
  status,
  transcriptions,
  startConversation,
  stopConversation,
  stream,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const isConnected = status === 'connected';

  return (
    <div className="terminal-panel flex flex-col h-full">
        <div className="flex items-center justify-between p-2 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
            <span className="font-bold text-[var(--text-secondary)]">LIVE FEED</span>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[var(--error-color)] animate-pulse' : 'bg-[var(--text-secondary)]'}`} />
        </div>
        
        <div className="relative aspect-video bg-black border-b border-[var(--border-color)]">
            {stream ? (
                 <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover opacity-80 grayscale" />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[var(--text-secondary)] font-mono text-xs">
                    NO SIGNAL
                </div>
            )}
            
            {/* HUD Overlay */}
            <div className="absolute bottom-2 left-2 font-mono text-[10px] text-[var(--accent-color)]">
                CAM: {isConnected ? 'ON' : 'OFF'} <br/>
                MIC: {isConnected ? 'ON' : 'OFF'}
            </div>
        </div>

        <div className="flex-grow p-2 overflow-y-auto font-mono text-xs space-y-1">
            {transcriptions.map(t => (
                <div key={t.id} className={t.speaker === 'ada' ? 'text-[var(--accent-color)]' : 'text-[var(--text-primary)]'}>
                    <span className="opacity-50 uppercase mr-2">{t.speaker}:</span>
                    {t.text}
                </div>
            ))}
        </div>

        <div className="p-2 border-t border-[var(--border-color)]">
            <button 
                onClick={isConnected ? stopConversation : startConversation}
                className={`w-full py-1 font-mono text-xs border ${isConnected ? 'border-[var(--error-color)] text-[var(--error-color)] hover:bg-[var(--error-color)] hover:text-white' : 'border-[var(--success-color)] text-[var(--success-color)] hover:bg-[var(--success-color)] hover:text-white'}`}
            >
                {isConnected ? 'TERMINATE UPLINK' : 'ESTABLISH UPLINK'}
            </button>
        </div>
    </div>
  );
};

export default LiveConversationPanel;
