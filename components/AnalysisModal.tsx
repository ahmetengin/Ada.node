
import React from 'react';
import { X } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center font-mono" onClick={onClose}>
      <div className="w-full max-w-3xl bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-2 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
          <span className="text-sm font-bold text-[var(--accent-color)]">:: {title} ::</span>
          <button onClick={onClose} className="text-[var(--text-primary)] hover:bg-[var(--error-color)] hover:text-white px-2">
            <X size={16}/>
          </button>
        </div>
        <div className="p-4 h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm text-[var(--text-primary)]">
          {isLoading ? (
            <div className="animate-pulse">Processing...</div>
          ) : (
            content
          )}
        </div>
        <div className="p-1 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] text-[10px] text-center text-[var(--text-secondary)]">
            PRESS ESC TO CLOSE
        </div>
      </div>
    </div>
  );
};

export default AnalysisModal;
