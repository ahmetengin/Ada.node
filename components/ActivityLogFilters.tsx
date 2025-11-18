
import React, { useState, useRef, useEffect } from 'react';
import { LogType } from '../types';
import { Filter, X, ChevronDown, Sparkles } from 'lucide-react';

interface ActivityLogFiltersProps {
  logs: any[];
  filteredCount: number;
  typeFilters: Set<LogType>;
  setTypeFilters: React.Dispatch<React.SetStateAction<Set<LogType>>>;
  sourceFilters: Set<string>;
  setSourceFilters: React.Dispatch<React.SetStateAction<Set<string>>>;
  availableSources: string[];
  onRequestAnalysis: (type: 'summary' | 'errors') => void;
}

const useOutsideClick = (ref: React.RefObject<HTMLDivElement>, callback: () => void) => {
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                callback();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [ref, callback]);
};

const FilterDropdown: React.FC<{
    label: string;
    options: string[];
    selected: Set<string>;
    setSelected: (updater: (prev: Set<string>) => Set<string>) => void;
}> = ({ label, options, selected, setSelected }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    useOutsideClick(wrapperRef, () => setIsOpen(false));

    const handleToggle = (option: string) => {
        setSelected(prev => {
            const newSet = new Set(prev);
            if (newSet.has(option)) {
                newSet.delete(option);
            } else {
                newSet.add(option);
            }
            return newSet;
        });
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-black/30 border border-white/20 rounded-md hover:bg-white/10 transition-colors">
                {label} ({selected.size})
                <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-[var(--color-panel)] border border-white/20 rounded-md p-2 z-20 max-h-60 overflow-y-auto">
                    {options.map(option => (
                        <label key={option} className="flex items-center gap-2 p-1.5 text-xs rounded hover:bg-white/10 cursor-pointer capitalize">
                            <input
                                type="checkbox"
                                className="h-3 w-3 rounded bg-black/30 border-white/30 text-[var(--color-primary)] focus:ring-0 focus:ring-offset-0"
                                checked={selected.has(option)}
                                onChange={() => handleToggle(option)}
                            />
                            {option.replace(/_/g, ' ')}
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
};

const GeminiAnalysisDropdown: React.FC<{ onRequestAnalysis: (type: 'summary' | 'errors') => void }> = ({ onRequestAnalysis }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    useOutsideClick(wrapperRef, () => setIsOpen(false));
    
    return (
        <div className="relative" ref={wrapperRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-yellow-400/20 text-yellow-400 border border-yellow-400/50 rounded-md hover:bg-yellow-400/30 transition-colors">
                <Sparkles size={16} />
                Analyze with Gemini
                <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
             {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-[var(--color-panel)] border border-white/20 rounded-md p-2 z-20">
                    <button onClick={() => { onRequestAnalysis('summary'); setIsOpen(false); }} className="w-full text-left p-2 text-xs rounded hover:bg-white/10">Summarize Last Task</button>
                    <button onClick={() => { onRequestAnalysis('errors'); setIsOpen(false); }} className="w-full text-left p-2 text-xs rounded hover:bg-white/10">Explain All Errors</button>
                </div>
             )}
        </div>
    );
};


const ActivityLogFilters: React.FC<ActivityLogFiltersProps> = ({ logs, filteredCount, typeFilters, setTypeFilters, sourceFilters, setSourceFilters, availableSources, onRequestAnalysis }) => {
    const activeFilterCount = typeFilters.size + sourceFilters.size;
    
    const handleClearFilters = () => {
        setTypeFilters(new Set());
        setSourceFilters(new Set());
    };
    
    return (
        <div className="flex justify-between items-center mb-2 flex-shrink-0">
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-[var(--color-primary)] flex items-center gap-2" style={{ textShadow: `0 0 5px var(--color-primary-glow)` }}>
                    <Filter size={18} />
                    <span>Activity Log</span>
                </h3>
                 <span className="text-xs text-gray-400">
                    (Showing {filteredCount} of {logs.length} entries)
                </span>
            </div>

            <div className="flex items-center gap-2">
                <FilterDropdown label="Type" options={Object.values(LogType)} selected={typeFilters as Set<string>} setSelected={setTypeFilters as any} />
                <FilterDropdown label="Source" options={availableSources} selected={sourceFilters} setSelected={setSourceFilters} />
                {activeFilterCount > 0 && (
                    <button onClick={handleClearFilters} className="flex items-center gap-1 px-3 py-1.5 text-xs bg-pink-500/20 border border-pink-500/50 text-pink-400 rounded-md hover:bg-pink-500/40 transition-colors">
                        <X size={14} /> Clear ({activeFilterCount})
                    </button>
                )}
                <GeminiAnalysisDropdown onRequestAnalysis={onRequestAnalysis} />
            </div>
      </div>
    );
};

export default ActivityLogFilters;