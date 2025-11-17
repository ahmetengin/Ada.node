import React from 'react';
import { Skill } from '../types';
import { Cog } from 'lucide-react';

interface SkillsPanelProps {
  skills: Omit<Skill, 'execute'>[];
  activeSkill: string | null;
}

const SkillsPanel: React.FC<SkillsPanelProps> = ({ skills, activeSkill }) => {
  return (
    <div className="bg-gray-800/50 rounded-2xl p-6 shadow-lg ring-1 ring-white/10">
      <h3 className="text-lg font-semibold text-cyan-300 mb-4 flex items-center gap-2">
        <Cog size={20} />
        <span>Yetenekler</span>
      </h3>
      <ul className="space-y-4">
        {skills.map((skill) => {
          const isActive = skill.name === activeSkill;
          return (
          <li key={skill.name} className={`p-2 -m-2 rounded-lg transition-all duration-300 ${isActive ? 'shadow-[0_0_15px_rgba(34,211,238,0.7)]' : ''}`}>
            <div className="flex justify-between items-center mb-1">
              <p className="font-medium text-sm text-gray-300">{skill.name}</p>
              <p className="text-xs font-mono text-cyan-400">LVL {Math.floor(skill.level)}</p>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-cyan-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${skill.level * 10}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-1">{skill.description}</p>
          </li>
        )})}
      </ul>
    </div>
  );
};

export default SkillsPanel;
