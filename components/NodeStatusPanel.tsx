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
                            <option value={NodeType.CUSTOMER}>Customer (ada.customer.tenant)</option>
                            <option value={NodeType.HUKUK}>Hukuk (ada.hukuk.tenant)</option>
                            <option value={NodeType.INTERPRETER}>Interpreter (ada.interpreter.tenant)</option>
                            <option value={NodeType.LEGAL}>Legal (ada.legal.tenant)</option>
                            <option value={NodeType.MAINTENANCE}>Maintenance (ada.maintenance.tenant)</option>
                            <option value={NodeType.PASSKIT}>Passkit (ada.passkit.tenant)</option>
                            <option value={NodeType.RESTAURANT}>Restaurant (ada.restaurant.tenant)</option>
                            <option value={NodeType.CHATBOT}>Chatbot (ada.chatbot.tenant)</option>
                        </optgroup>
                        <optgroup label="Domain Agents">
                            <option value={NodeType.SEA}>Sea (ada.sea)</option>
                            <option value={NodeType.MARINA}>Marina (ada.marina)</option>
                            <option value={NodeType.WEATHER}>Weather (ada.weather)</option>
                            <option value={NodeType.FINANCE}>Finance (ada.finance)</option>
                            <option value={NodeType.TRAVEL}>Travel (ada.travel)</option>
                        </optgroup>
                        <optgroup label="Infrastructure Agents">
                            <option value={NodeType.DB}>Database (ada.db)</option>
                            <option value={NodeType.API}>API (ada.api)</option>
                            <option value={NodeType.CRON}>Cron (ada.cron)</option>
                        </optgroup>
                    </select>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Instance Name (e.g., 'wim', 'midilli')" className="w-full bg-[var(--color-panel)] border border-[var(--color-primary)]/30 rounded-md p-2 text-white text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none" />
                    <button type="submit" disabled={!name.trim()} className="w-full px-6 py-2 border border-[var(--color-primary)] bg-[var(--color-primary)]/20 text-[var(--color-primary)] font-semibold rounded-md flex items-center justify-center gap-2 hover:bg-[var(--color-primary)]/40 disabled:bg-gray-500/20 disabled:border-gray-600 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors">Add Node</button>
                </form>
            </div>
        </div>
    );
};

const NodeStatusPanel: React.FC<NodeStatusPanelProps> = ({ nodes, isProcessing, activeConnections, addNode, restoreFromCheckpoint }) => {
    const [isAddingNode, setIsAddingNode] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0, radius: 0 });
    const nodePositions = useRef<Map<string, { x: number; y: number }>>(new Map());

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                const radius = Math.min(width, height) / 2 - (width > 500 ? 60 : 40);
                setDimensions({ width, height, radius });
            }
        };
        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    useEffect(() => {
        const center = { x: dimensions.width / 2, y: dimensions.height / 2 };
        const positions = new Map();
        nodes.forEach((node, index) => {
            const pos = getNodePosition(index, nodes.length, center, dimensions.radius);
            positions.set(node.id, pos);
        });
        nodePositions.current = positions;
    }, [nodes, dimensions]);


    return (
        <div className="panel-glow p-4 flex flex-col h-full relative">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h3 className="text-lg font-semibold text-[var(--color-primary)]" style={{ textShadow: `0 0 5px var(--color-primary-glow)` }}>Node Status</h3>
                <div className="flex gap-2">
                    <button onClick={() => setIsAddingNode(true)} disabled={isProcessing} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-black/30 border border-white/20 rounded-md hover:bg-white/10 transition-colors disabled:opacity-50">
                        <PlusCircle size={16} /> Clone
                    </button>
                    <button onClick={restoreFromCheckpoint} disabled={isProcessing} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-black/30 border border-white/20 rounded-md hover:bg-white/10 transition-colors disabled:opacity-50">
                        <History size={16} /> Restore
                    </button>
                </div>
            </div>
            <div ref={containerRef} className="flex-grow relative bg-black/30 rounded-lg overflow-hidden">
                <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
                    {activeConnections.map(([fromId, toId], index) => {
                        const fromPos = nodePositions.current.get(fromId);
                        const toPos = nodePositions.current.get(toId);
                        if (!fromPos || !toPos) return null;
                        return (
                            <line
                                key={`${fromId}-${toId}-${index}`}
                                x1={fromPos.x} y1={fromPos.y}
                                x2={toPos.x} y2={toPos.y}
                                stroke="var(--color-primary)"
                                strokeWidth="2"
                                strokeOpacity="0.7"
                            >
                                <animate attributeName="stroke-dasharray" from="0, 20" to="20, 0" dur="1s" repeatCount="indefinite" />
                            </line>
                        );
                    })}
                </svg>

                {nodes.map((node, index) => {
                    const pos = nodePositions.current.get(node.id);
                    if (!pos) return null;
                    const isCentral = index === 0;
                    const size = isCentral ? 80 : 64;
                    
                    let statusColor = 'border-gray-500';
                    if (node.status === 'online') statusColor = 'border-[var(--color-primary)]';
                    if (node.status === 'processing') statusColor = 'border-yellow-400 animate-pulse';
                    
                    const isConnected = activeConnections.some(c => c.includes(node.id));
                    if (isConnected && node.status !== 'processing') statusColor = 'border-green-400';

                    return (
                        <div
                            key={node.id}
                            className={`absolute flex flex-col items-center justify-center p-2 rounded-full transition-all duration-500 ${statusColor} border-2 bg-black/50 backdrop-blur-sm`}
                            style={{
                                left: pos.x, top: pos.y,
                                width: size, height: size,
                                transform: `translate(-50%, -50%)`,
                                zIndex: 2,
                                boxShadow: isConnected ? '0 0 15px var(--color-primary-glow)' : 'none'
                            }}
                            title={`${node.name} (${node.status})`}
                        >
                            <NodeIcon type={node.type} isCentral={isCentral} />
                            <span className="text-xs text-center text-[var(--color-text-dim)] truncate w-full" style={{ fontSize: '10px' }}>
                                {node.instanceName || node.name.split(' ').pop()}
                            </span>
                        </div>
                    );
                })}
            </div>
            <AddNodeForm isVisible={isAddingNode} onDone={() => setIsAddingNode(false)} addNode={addNode} />
        </div>
    );
};

export default NodeStatusPanel;
