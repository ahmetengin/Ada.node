
import React from 'react';
import { Code2 } from 'lucide-react';

interface EditorPanelProps {
  content: string;
}

const EditorPanel: React.FC<EditorPanelProps> = ({ content }) => {
  const highlightSyntax = (text: string) => {
    return text
      .replace(/\/\*\*[\s\S]*?\*\//g, (match) => `<span class="text-green-400">${match}</span>`) // JSDoc comments
      .replace(/\/\/.*/g, (match) => `<span class="text-gray-500">${match}</span>`) // Single line comments
      .replace(/\b(const|let|new|await|return|true|false)\b/g, (match) => `<span class="text-pink-400">${match}</span>`) // Keywords
      .replace(/\b(mcp|crm_agent|maritime_agent)\b/g, (match) => `<span class="text-teal-300">${match}</span>`) // Classes/Objects
      .replace(/\b(decideProvider|search_flights|check_availability|fetch_customer_profile|composeResult|seal)\b/g, (match) => `<span class="text-blue-400">${match}</span>`) // Functions
      .replace(/(\'|\`|\")(.*?)(\1)/g, (match, p1, p2, p3) => `<span class="text-yellow-400">${p1}${p2}${p3}</span>`) // Strings
      .replace(/(\{|\}|\(|\)|\[|\])/g, (match) => `<span class="text-gray-400">${match}</span>`) // Brackets
  };

  return (
    <div className="panel-glow p-4 flex flex-col h-full">
      <h3 className="text-sm font-semibold text-[var(--color-text-dim)] mb-2 flex items-center gap-2 flex-shrink-0 border-b border-white/10 pb-2">
        <Code2 size={16} className="text-[var(--color-primary)]"/>
        <span>mcp-dynamic-workflow.js</span>
      </h3>
      <div className="flex-grow bg-black/30 rounded-lg p-4 overflow-y-auto font-mono text-sm">
        <pre className="whitespace-pre-wrap">
          <code dangerouslySetInnerHTML={{ __html: highlightSyntax(content) }} />
        </pre>
      </div>
    </div>
  );
};

export default EditorPanel;