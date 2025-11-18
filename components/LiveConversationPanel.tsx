
import React, { useRef, useEffect } from 'react';
import { Mic, MicOff, Bot, User, Loader2, Video } from 'lucide-react';
import { ConversationStatus, TranscriptionEntry } from '../types';
import VirtualBackgroundControl from '../hooks/VirtualBackgroundControl';
import type { BackgroundEffect } from '../hooks/useLiveConversation';

interface LiveConversationPanelProps {
  status: ConversationStatus;
  transcriptions: TranscriptionEntry[];
  startConversation: () => void;
  stopConversation: () => void;
  isOtherTaskRunning: boolean;
  stream: MediaStream | null;
  backgroundEffect: BackgroundEffect;
  setBackgroundEffect: (effect: BackgroundEffect) => void;
  setCustomBgUrl: (url: string | null) => void;
  isSegmenterLoading: boolean;
}

const LiveConversationPanel: React.FC<LiveConversationPanelProps> = ({
  status,
  transcriptions,
  startConversation,
  stopConversation,
  isOtherTaskRunning,
  stream,
  backgroundEffect,
  setBackgroundEffect,
  setCustomBgUrl,
  isSegmenterLoading,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
    }
  }, [stream]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcriptions]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCustomBgUrl(e.target?.result as string);
        setBackgroundEffect('custom');
      };
      reader.readAsDataURL(file);
    }
  };

  const isConnecting = status === 'connecting' || isSegmenterLoading;
  const isConnected = status === 'connected';

  return (
    <div className="flex flex-col h-full text-sm">
      <div className="flex-shrink-0 relative w-full aspect-video bg-black/50 rounded-lg overflow-hidden mb-2">
        {stream ? (
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <Video size={32} />
            <span className="mt-2 text-xs">Comms Offline</span>
          </div>
        )}
      </div>
      
      <div className="flex-shrink-0 mb-3">
        <VirtualBackgroundControl 
          selectedEffect={backgroundEffect} 
          onSelectEffect={setBackgroundEffect} 
          onFileChange={handleFileChange}
          isProcessing={isConnected || isConnecting}
        />
      </div>

      <div ref={scrollRef} className="flex-grow bg-black/30 rounded-lg p-2 overflow-y-auto space-y-3">
        {transcriptions.map(t => (
          <div key={t.id} className={`flex items-start gap-2 ${t.speaker === 'user' ? 'justify-end' : ''}`}>
            {t.speaker === 'ada' && <Bot size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />}
            <p className={`px-3 py-1.5 rounded-lg max-w-[85%] ${t.speaker === 'ada' ? 'bg-cyan-500/10' : 'bg-pink-500/10 text-right'}`}>
              {t.text}
            </p>
            {t.speaker === 'user' && <User size={16} className="text-pink-400 flex-shrink-0 mt-0.5" />}
          </div>
        ))}
      </div>

      <div className="flex-shrink-0 pt-3">
        <button
          onClick={isConnected ? stopConversation : startConversation}
          disabled={isConnecting || isOtherTaskRunning}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md font-semibold transition-all duration-200 border
            ${isConnected ? 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/40' : 'bg-green-500/20 border-green-500/50 text-green-400 hover:bg-green-500/40'}
            ${isConnecting ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' : ''}
            disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isConnecting ? <><Loader2 className="animate-spin" size={20}/> Connecting...</> :
           isConnected ? <><MicOff size={20}/> Stop Conversation</> :
           <><Mic size={20}/> Start Conversation</>}
        </button>
      </div>
    </div>
  );
};

export default LiveConversationPanel;
