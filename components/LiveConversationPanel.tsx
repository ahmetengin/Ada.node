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
    } else if (videoRef.current) {
      videoRef.current.srcObject = null;
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
      const url = URL.createObjectURL(file);
      setCustomBgUrl(url);
      setBackgroundEffect('custom');
    }
  };

  const isVideoActive = stream && (status === 'connected' || status === 'connecting');
  const isButtonDisabled = isOtherTaskRunning || status === 'connecting' || isSegmenterLoading;

  const handleButtonClick = () => {
    if (status === 'connected') {
      stopConversation();
    } else {
      startConversation();
    }
  };

  const getButtonContent = () => {
    if (isSegmenterLoading) {
        return <><Loader2 size={20} className="animate-spin" /><span>Loading FX...</span></>;
    }
    switch (status) {
      case 'idle':
      case 'error':
        return <><Mic size={20} /><span>Start Conversation</span></>;
      case 'connecting':
        return <><Loader2 size={20} className="animate-spin" /><span>Connecting...</span></>;
      case 'connected':
        return <><MicOff size={20} /><span>End Conversation</span></>;
    }
  };
  
  const buttonColorClasses = status === 'connected' 
    ? 'border-[var(--color-secondary)] bg-[var(--color-secondary)]/20 text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/40' 
    : 'border-[var(--color-primary)] bg-[var(--color-primary)]/20 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/40';

  return (
    <div className="panel-glow p-4 flex flex-col gap-4 h-full">
      <div className="flex justify-between items-center flex-shrink-0">
          <h4 className="text-md font-semibold text-[var(--color-primary)] flex items-center gap-2">
            <Video size={18} />
            <span>Live Comms</span>
          </h4>
          <div className="relative w-12 h-12">
            <div className={`absolute inset-0 rounded-full bg-black/40 border-2 border-[var(--color-primary)]/50 flex items-center justify-center transition-all duration-500 ${isVideoActive ? 'animate-pulse-green' : ''}`}
                style={{boxShadow: isVideoActive ? `0 0 10px var(--color-primary-glow)`: 'none'}}>
                {isVideoActive ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-full transform scale-x-[-1]" />
                ) : (
                <User size={20} className="text-[var(--color-text-dim)]" />
                )}
            </div>
          </div>
      </div>
      
      <div className="flex-grow flex flex-col gap-4 min-h-0">
        <div ref={scrollRef} className="bg-black/30 rounded-lg p-2 overflow-y-auto text-sm space-y-3 flex-grow">
          {transcriptions.length === 0 && (
            <div className="flex items-center justify-center h-full text-[var(--color-text-dim)] text-xs text-center">
              Transcription will appear here.
            </div>
          )}
          {transcriptions.map((entry) => (
            <div key={entry.id} className={`flex items-start gap-2 ${entry.speaker === 'user' ? 'justify-end' : ''}`}>
              {entry.speaker === 'ada' && <div className="w-6 h-6 rounded-full bg-[var(--color-primary)]/50 flex items-center justify-center flex-shrink-0"><Bot size={14}/></div>}
              <div className={`max-w-[80%] p-2 rounded-lg text-xs ${ entry.speaker === 'user' ? 'bg-blue-500/20 rounded-br-none' : 'bg-gray-500/20 rounded-bl-none' }`}>
                <p>{entry.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex-shrink-0 flex flex-col gap-3">
        <VirtualBackgroundControl
            selectedEffect={backgroundEffect}
            onSelectEffect={setBackgroundEffect}
            onFileChange={handleFileChange}
            isProcessing={status !== 'idle' && status !== 'error'}
        />
        <button
          onClick={handleButtonClick}
          disabled={isButtonDisabled}
          className={`w-full px-4 py-2 font-semibold rounded-md flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed border disabled:bg-gray-500/20 disabled:border-gray-600 disabled:text-gray-500 ${buttonColorClasses}`}
        >
          {getButtonContent()}
        </button>
      </div>
    </div>
  );
};

export default LiveConversationPanel;
