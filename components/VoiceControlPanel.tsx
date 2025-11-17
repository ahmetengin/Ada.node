import React, { useRef, useEffect } from 'react';
import { Mic, MicOff, Bot, User, Loader2 } from 'lucide-react';
import { ConversationStatus, TranscriptionEntry } from '../types';

interface VoiceControlPanelProps {
  status: ConversationStatus;
  transcriptions: TranscriptionEntry[];
  startConversation: () => void;
  stopConversation: () => void;
  isOtherTaskRunning: boolean;
}

const VoiceControlPanel: React.FC<VoiceControlPanelProps> = ({
  status,
  transcriptions,
  startConversation,
  stopConversation,
  isOtherTaskRunning,
}) => {
    
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcriptions]);
    
  const isButtonDisabled = isOtherTaskRunning || status === 'connecting';

  const getButtonContent = () => {
    switch (status) {
      case 'idle':
      case 'error':
        return (
          <>
            <Mic size={20} />
            <span>Konuşma Başlat</span>
          </>
        );
      case 'connecting':
        return (
          <>
            <Loader2 size={20} className="animate-spin" />
            <span>Bağlanılıyor...</span>
          </>
        );
      case 'connected':
        return (
          <>
            <MicOff size={20} />
            <span>Konuşmayı Bitir</span>
          </>
        );
    }
  };

  const handleButtonClick = () => {
    if (status === 'connected') {
      stopConversation();
    } else {
      startConversation();
    }
  };

  return (
    <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h4 className="text-md font-semibold text-cyan-300">Canlı Konuşma</h4>
        <button
          onClick={handleButtonClick}
          disabled={isButtonDisabled}
          className={`px-4 py-2 h-[42px] font-semibold rounded-md flex items-center justify-center gap-2 transition-colors
            ${status === 'connected' ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-green-600 hover:bg-green-500 text-white'}
            disabled:bg-gray-500 disabled:cursor-not-allowed`}
        >
          {getButtonContent()}
        </button>
      </div>

      <div ref={scrollRef} className="h-48 bg-gray-900/70 rounded-md p-3 border border-gray-600 overflow-y-auto text-sm space-y-3">
        {transcriptions.length === 0 && (
            <div className="flex items-center justify-center h-full text-gray-500">
                Konuşma başlatmak için butona tıklayın...
            </div>
        )}
        {transcriptions.map((entry) => (
          <div
            key={entry.id}
            className={`flex items-start gap-3 ${entry.speaker === 'user' ? 'justify-end' : ''}`}
          >
            {entry.speaker === 'ada' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-800 flex items-center justify-center">
                <Bot size={18} className="text-cyan-300" />
              </div>
            )}
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                entry.speaker === 'user'
                  ? 'bg-blue-800/70 text-blue-100 rounded-br-none'
                  : 'bg-gray-700/70 text-gray-200 rounded-bl-none'
              }`}
            >
              <p>{entry.text}</p>
            </div>
             {entry.speaker === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                <User size={18} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VoiceControlPanel;
