
import React from 'react';
import { BotMessageSquare } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="p-4 md:px-8 bg-gray-900/80 backdrop-blur-sm border-b border-white/10 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <BotMessageSquare className="w-10 h-10 text-cyan-400" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Ada Node</h1>
          <p className="text-sm text-gray-400">Merkezi AI Koordinatörü Arayüzü</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
