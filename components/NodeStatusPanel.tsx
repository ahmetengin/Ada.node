import React, { useState, useRef, useEffect } from 'react';
import { Node, NodeType } from '../types';
import { Server, Waves, Anchor, CloudSun, PlusCircle, X, Landmark, Globe, Database, Webhook, Clock, Presentation, Users, Gavel, Languages, Scale, Wrench, Ticket, Utensils, MessageSquare } from 'lucide-react';

interface NodeStatusPanelProps {
  nodes: Node[];
  isProcessing: boolean;
  activeConnections: [string, string][];
  addNode: (type: NodeType, instanceName: string) => void;
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
                            <option value={NodeType.CONGRESS}>Congress (ada.congress.<tenant>)</option>
                            <option value={NodeType.CUSTOMER}>Customer (ada.customer.<tenant>)</option>
                            <option value={NodeType.FINANCE}>Finance (ada.finance.<tenant>)</option>
                        </optgroup>
                        <optgroup label="Infrastructure Agents">
                            <option value={NodeType.DB}>Database (ada.db.<tenant>)</option>
                            <option value={NodeType.API}>API Gateway (ada.api.<tenant>)</option>
                        </optgroup>
                    </select>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        placeholder="Instance Name (e.g., Midilli, Wim)"
                        className="w-full bg-[var(--color-panel)] border border-[var(--color-primary)]/30 rounded-md p-2 text-white text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none"
                    />
                    <button type="submit" className="w-full text-sm bg-[var(--color-primary)]/20 border border-[var(--color-primary)] text-[var(--color-primary)] font-semibold rounded-md p-2 hover:bg-[var(--color-primary)]/40 transition-colors">
                        Clone
                    </button>
                </form>
            </div>
        </div>
    )
}

const NodeStatusPanel: React.FC<NodeStatusPanelProps> = ({ nodes, activeConnections, addNode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const updateDimensions = () => {
        if (containerRef.current) {
            setDimensions({
                width: containerRef.current.offsetWidth,
                height: containerRef.current.offsetHeight
            });
        }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const center = { x: dimensions.width / 2, y: dimensions.height / 2 };
  const radius = Math.min(dimensions.width, dimensions.height) * 0.35;
  
  const peripheralNodes = nodes.filter(n => n.type !== NodeType.CENTRAL);
  const centralNode = nodes.find(n => n.type === NodeType.CENTRAL);
  const sortedNodes = centralNode ? [centralNode, ...peripheralNodes] : peripheralNodes;

  const nodePositions = sortedNodes.map((node, i) => ({
      ...node,
      pos: getNodePosition(i, sortedNodes.length, center, radius)
  }));
  
  const centralNodePos = nodePositions.find(n => n.type === NodeType.CENTRAL);

  return (
    <div className="panel-glow p-4 flex flex-col items-center h-full relative overflow-hidden">
      <div className="w-full flex justify-between items-center mb-2 z-10">
        <h3 className="text-lg font-semibold text-[var(--color-primary)]" style={{ textShadow: `0 0 5px var(--color-primary-glow)` }}>Node Activity</h3>
        <button onClick={() => setShowAddForm(true)} className="text-[var(--color-text-dim)] hover:text-white transition-colors">
            <PlusCircle size={20} />
        </button>
      </div>
      
      <AddNodeForm addNode={addNode} onDone={() => setShowAddForm(false)} isVisible={showAddForm} />

      <div ref={containerRef} className="relative w-full h-full">
        {dimensions.width > 0 && (
          <svg width={dimensions.width} height={dimensions.height} className="absolute inset-0 overflow-visible">
              <defs>
                  <filter id="glow-effect">
                      <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                      <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                      </feMerge>
                  </filter>
                  <radialGradient id="line-gradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={String('var(--color-primary)')} stopOpacity="1" />
                    <stop offset="100%" stopColor={String('var(--color-primary)')} stopOpacity="0.1" />
                  </radialGradient>
              </defs>
              
              {/* Render connections */}
              {activeConnections.map(([fromId, toId], index) => {
                  const fromNode = nodePositions.find(n => n.id === fromId);
                  const toNode = nodePositions.find(n => n.id === toId);
                  if (fromNode && toNode) {
                      const d = `M ${fromNode.pos.x} ${fromNode.pos.y} L ${toNode.pos.x} ${toNode.pos.y}`;
                      return (
                          <g key={`active-${index}-${fromId}-${toId}`}>
                              <path d={d} stroke="url(#line-gradient)" strokeWidth="1.5" filter="url(#glow-effect)"
                                  strokeDasharray="10 15" style={{ animation: `line-flow 10s linear infinite` }} />
                          </g>
                      );
                  }
                  return null;
              })}
          </svg>
        )}

        {nodePositions.map((node) => {
            const statusGlowClass = node.status === 'online' ? 'animate-pulse-green' : node.status === 'processing' ? 'animate-pulse-yellow' : 'animate-pulse-red';
            const sizeClass = node.type === NodeType.CENTRAL ? 'w-20 h-20' : 'w-16 h-16';
            
            return (
              <div 
                  key={node.id} 
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 group cursor-pointer"
                  style={{ left: node.pos.x, top: node.pos.y }}
              >
                  <div className={`rounded-full bg-[var(--color-bg)]/80 border border-[var(--color-primary)]/50 flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${sizeClass} ${statusGlowClass}`}>
                      <NodeIcon type={node.type} isCentral={node.type === NodeType.CENTRAL} />
                  </div>
                  <div className="bg-[var(--color-bg)]/60 px-2 py-0.5 rounded-full text-xs text-center">
                      <span className="font-medium text-[var(--color-text)]">{node.name}</span>
                  </div>
              </div>
            )
        })}
      </div>
    </div>
  );
};

export default NodeStatusPanel;
