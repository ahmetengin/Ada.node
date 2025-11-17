import React, { useState, useRef, useEffect } from 'react';
import { Skill } from '../types';
import { Cog } from 'lucide-react';

interface SkillsPanelProps {
  skills: Omit<Skill, 'execute'>[];
  activeSkill: string | null;
}

const SkillsPanel: React.FC<SkillsPanelProps> = ({ skills, activeSkill }) => {
  const [leveledUpSkills, setLeveledUpSkills] = useState<Set<string>>(new Set());
  const prevSkillsRef = useRef<Omit<Skill, 'execute'>[]>(skills);

  useEffect(() => {
    const changed = new Set<string>();
    const prevMap = new Map(prevSkillsRef.current.map(s => [s.name, s.level]));

    skills.forEach(skill => {
        const prevLevel = prevMap.get(skill.name);
        if (prevLevel !== undefined && skill.level > prevLevel) {
            changed.add(skill.name);
        }
    });

    if (changed.size > 0) {
        setLeveledUpSkills(changed);
        const timer = setTimeout(() => {
            setLeveledUpSkills(new Set());
        }, 1000);

        return () => clearTimeout(timer);
    }

    prevSkillsRef.current = skills;
  }, [skills]);

  return (
    <div className="panel-glow p-4 flex flex-col h-full">
      <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-4 flex items-center gap-2 flex-shrink-0" style={{ textShadow: `0 0 5px var(--color-primary-glow)`}}>
        <Cog size={20} />
        <span>Skills</span>
      </h3>
      <ul className="space-y-4 overflow-y-auto pr-2">
        {skills.map((skill) => {
          const isActive = skill.name === activeSkill;
          const hasLeveledUp = leveledUpSkills.has(skill.name);
          return (
          <li key={skill.name} className={`p-3 rounded-lg transition-all duration-300 ${isActive ? 'bg-[var(--color-primary)]/20' : ''} ${hasLeveledUp ? 'animate-pulse-green' : ''}`}>
            <div className="flex justify-between items-center mb-1.5">
              <p className="font-medium text-sm text-[var(--color-text)]">{skill.name}</p>
              <p className="text-xs font-mono text-[var(--color-primary)]">LVL {Math.floor(skill.level)}</p>
            </div>
            <div className="w-full bg-[var(--color-primary)]/10 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[var(--color-primary)] h-1.5 rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${skill.level * 10}%`,
                  boxShadow: `0 0 8px var(--color-primary-glow)`
                }}
              ></div>
            </div>
            <p className="text-xs text-[var(--color-text-dim)] mt-1.5">{skill.description}</p>
          </li>
        )})}
      </ul>
    </div>
  );
};

export default SkillsPanel;
