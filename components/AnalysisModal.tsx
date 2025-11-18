
import React from 'react';
import { Sparkles, X, Loader2 } from 'lucide-react';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  isLoading: boolean;
}

const AnalysisModal: React.FC<AnalysisModalProps> = ({ isOpen, onClose, title, content, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div className="panel-glow w-full max-w-2xl flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-white/10 flex-shrink-0">
          <h3 className="text-lg font-semibold text-yellow-400 flex items-center gap-2">
            <Sparkles size={18} />
            {title}
          </h3>
          <button onClick={onClose} className="text-[var(--color-text-dim)] hover:text-white transition-colors">
            <X size={20}/>
          </button>
        </div>
        <div className="p-6 flex-grow overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center text-yellow-400 h-full">
                <Loader2 size={32} className="animate-spin" />
                <p className="mt-4">Analyzing with Gemini...</p>
            </div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none text-[var(--color-text)] whitespace-pre-wrap">
              {content.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisModal;