import React, { useState, useRef, useEffect } from 'react';
import { Node, NodeType } from '../types';
import { Server, Waves, Anchor, CloudSun, PlusCircle, X, Landmark, Globe, Database, Webhook, Clock, Presentation, Users, Gavel, Languages, Scale, Wrench, Ticket, Utensils, MessageSquare, History } from 'lucide-react';

interface NodeStatusPanelProps {
  nodes: Node[];
  isProcessing: boolean;
  activeConnections: [string, string][];
  addNode: (type: NodeType, instanceName: string) => void;
  restoreFromCheckpoint: () => void;
}

const NodeIcon: React.FC<{ type: NodeType; isCentral: boolean }> = ({ type, isCentral }) => {
  const iconProps = { 
    size: isCentral ? 32 : 24, 
    className: `transition-colors duration-300 text-white/90` 
  };
  
  switch (type) {
    case NodeType.CENTRAL: return <Server {...iconProps} />;
    case NodeType.SEA: return <Waves {...iconProps} />;
    case NodeType.MARINA: return <Anchor {...iconProps} />;
    case NodeType.WEATHER: return <CloudSun {...iconProps} />;
    case NodeType.FINANCE: return <Landmark {...iconProps} />;
    case NodeType.TRAVEL: return <Globe {...iconProps} />;
    case NodeType.DB: return <Database {...iconProps} />;
    case NodeType.API: return <Webhook {...iconProps} />;
    case NodeType.CRON: return <Clock {...iconProps} />;
    case NodeType.CONGRESS: return <Presentation {...iconProps} />;
    case NodeType.CUSTOMER: return <Users {...iconProps} />;
    case NodeType.HUKUK: return <Gavel {...iconProps} />;
    case NodeType.INTERPRETER: return <Languages {...iconProps} />;
    case NodeType.LEGAL: return <Scale {...iconProps} />;
    case NodeType.MAINTENANCE: return <Wrench {...iconProps} />;
    case NodeType.PASSKIT: return <Ticket {...iconProps} />;
    case NodeType.RESTAURANT: return <Utensils {...iconProps} />;
    case NodeType.CHATBOT: return <MessageSquare {...iconProps} />;
    default: return null;
  }
};

const getNodePosition = (index: number, total: number, center: { x: number; y: number }, radius: number) => {
    if (index === 0) return center; // Central node
    const angle = (2 * Math.PI / (total - 1)) * (index - 1) - Math.PI / 2;
    return {
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
    };
}

const AddNodeForm: React.FC<{ addNode: (type: NodeType, name: string) => void, onDone: () => void, isVisible: boolean }> = ({ addNode, onDone, isVisible }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<NodeType>(NodeType.CONGRESS);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && type) {
            addNode(type, name.trim());
            setName('');
            onDone();
        }
    }

    if (!isVisible) return null;

    return (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-20 flex items-center justify-center" onClick={onDone}>
            <div className="panel-glow p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <h4 className="text-lg font-semibold text-[var(--color-primary)]">Clone New Node</h4>
                        <button type="button" onClick={onDone} className="text-[var(--color-text-dim)] hover:text-white"><X size={20}/></button>
                    </div>
                    <select value={type} onChange={e => setType(e.target.value as NodeType)} className="w-full bg-[var(--color-panel)] border border-[var(--color-primary)]/30 rounded-md p-2 text-white text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none">
                        <optgroup label="Specialist Agents">
                            {/* FIX: Removed '<' and '>' from 'tenant' to prevent JSX parsing errors. */}
                            <option value={NodeType.CONGRESS}>Congress (ada.congress.tenant)</option>
                            