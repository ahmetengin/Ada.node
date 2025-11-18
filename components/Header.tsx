import React from 'react';
import { BotMessageSquare, Info } from 'lucide-react';

interface HeaderProps {
  isVotingEnabled: boolean;
  onToggleVoting: (enabled: boolean) => void;
}

const MakerModeToggle: React.FC<HeaderProps> = ({ isVotingEnabled, onToggleVoting }) => (
  <div className="flex items-center gap-4">
    <div className="relative flex items-center gap-1.5 group">
      <label htmlFor="maker-toggle" className="text-sm font-medium text-[var(--color-text-dim)] cursor-pointer">
        MAKER Mode
      </label>
      <Info size={14} className="text-[var(--color-text-dim)]" />
      <div
        className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-72 p-3 text-xs text-center text-[var(--color-text)] bg-[var(--color-panel)] border border-[var(--color-primary)]/20 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20"
      >
        Enables a more robust, but slower, decision-making process using majority voting among multiple AI agents and automatic backtracking on failure.
      </div>
    </div>
    <button
      id="maker-toggle"
      role="switch"
      aria-checked={isVotingEnabled}
      onClick={() => onToggleVoting(!isVotingEnabled)}
      className={`relative inline-flex items-center h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] bg-black/30`}
    >
      <span
        className={`${isVotingEnabled ? 'translate-x-5' : 'translate-x-0'} inline-block h-5 w-5 transform rounded-full bg-[var(--color-primary)] shadow-lg ring-0 transition duration-200 ease-in-out`}
      />
    </button>
  </div>
);


const Header: React.FC<HeaderProps> = ({ isVotingEnabled, onToggleVoting }) => {
  return (
    <header className="p-4 md:px-8 sticky top-0 z-10 bg-transparent flex-shrink-0 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <BotMessageSquare className="w-10 h-10 text-[var(--color-primary)]" style={{ filter: `drop-shadow(0 0 5px var(--color-primary-glow))`}}/>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white" style={{ textShadow: `0 0 8px var(--color-primary-glow)`}}>Ada Node Observer</h1>
          <p className="text-sm text-[var(--color-text-dim)]">Multi-Agent Coordination Interface</p>
        </div>
      </div>
      <MakerModeToggle isVotingEnabled={isVotingEnabled} onToggleVoting={onToggleVoting} />
    </header>
  );
};

export default Header;