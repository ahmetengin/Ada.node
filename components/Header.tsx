import React, { useEffect, useState } from 'react';
import { Moon, Sun, Terminal } from 'lucide-react';

interface HeaderProps {
  isVotingEnabled: boolean;
  onToggleVoting: (enabled: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ isVotingEnabled, onToggleVoting }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
      const t = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
      return () => clearInterval(t);
  }, []);

  return (
    <header className="flex-shrink-0 h-10 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex items-center justify-between px-4 select-none">
      <div className="flex items-center gap-4 text-sm font-mono">
        {/* Mac-style Window Controls */}
        <div className="flex gap-2 mr-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
            <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
        </div>

        <div className="flex items-center gap-2 text-[var(--accent-color)]">
            <Terminal size={16} />
            <span className="font-bold tracking-wide">ADA.OBSERVER</span>
        </div>
        <span className="text-[var(--text-secondary)]">|</span>
        <span className="text-[var(--text-primary)]">USER: <span className="text-[var(--success-color)]">admin</span></span>
        <span className="text-[var(--text-secondary)]">|</span>
        <span className="text-[var(--text-primary)]">HOST: <span className="text-[var(--warning-color)]">ada-core-01</span></span>
        <span className="text-[var(--text-secondary)]">|</span>
        <span className="text-[var(--text-secondary)]">{time}</span>
      </div>

      <div className="flex items-center gap-4">
         <div className="flex items-center gap-2 text-xs">
            <span className={isVotingEnabled ? 'text-[var(--success-color)]' : 'text-[var(--text-secondary)]'}>
                MAKER: {isVotingEnabled ? 'ON' : 'OFF'}
            </span>
            <button 
                onClick={() => onToggleVoting(!isVotingEnabled)}
                className="w-8 h-4 bg-[var(--bg-tertiary)] border border-[var(--border-color)] relative"
            >
                <div className={`absolute top-0.5 bottom-0.5 w-3 bg-[var(--text-primary)] transition-all ${isVotingEnabled ? 'right-0.5' : 'left-0.5'}`} />
            </button>
         </div>

        <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
};

export default Header;