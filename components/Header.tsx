import React from 'react';
import { BotMessageSquare } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="p-4 md:px-8 sticky top-0 z-10 bg-transparent flex-shrink-0">
      <div className="flex items-center gap-4">
        <BotMessageSquare className="w-10 h-10 text-[var(--color-primary)]" style={{ filter: `drop-shadow(0 0 5px var(--color-primary-glow))`}}/>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white" style={{ textShadow: `0 0 8px var(--color-primary-glow)`}}>Ada Node Observer</h1>
          <p className="text-sm text-[var(--color-text-dim)]">Multi-Agent Coordination Interface</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
