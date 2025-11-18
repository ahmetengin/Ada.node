
import React, { useState, useRef, useEffect } from 'react';
import { Node, NodeType } from '../types';
import { Server, PlusCircle, X, History, PlaneTakeoff, Users, Sailboat, Landmark } from 'lucide-react';

interface NodeStatusPanelProps {
  nodes: Node[];
  isProcessing: boolean;
  activeConnections: [string, string][];
  errorConnections: [string, string][];
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
    case NodeType.TRAVEL_AGENT: return <PlaneTakeoff {...iconProps} />;
    case NodeType.CRM_AGENT: return <Users {...iconProps} />;
    case NodeType.MARITIME_AGENT: return <Sailboat {...iconProps} />;
    case NodeType.FINANCE_AGENT: return <Landmark {...iconProps} />;
    default: return <Server {...iconProps} />;
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
    const [type, setType] = useState<NodeType>(NodeType.GENERIC);

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
                       {Object.values(NodeType).filter(t => t !== NodeType.CENTRAL).map((t: string) => (
                         <option key={t} value={t}>{t}</option>
                       ))}
                    </select>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Instance Name (e.g., 'wim', 'midilli')" className="w-full bg-[var(--color-panel)] border border-[var(--color-primary)]/30 rounded-md p-2 text-white text-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none" />
                    <button type="submit" disabled={!name.trim()} className="w-full px-6 py-2 border border-[var(--color-primary)] bg-[var(--color-primary)]/20 text-[var(--color-primary)] font-semibold rounded-md flex items-center justify-center gap-2 hover:bg-[var(--color-primary)]/40 disabled:bg-gray-500/20 disabled:border-gray-600 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors">Add Node</button>
                </form>
            </div>
        </div>
    );
};

const NodeStatusPanel: React.FC<NodeStatusPanelProps> = ({ nodes, isProcessing, activeConnections, errorConnections, addNode, restoreFromCheckpoint }) => {
    const [isAddingNode, setIsAddingNode] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0, radius: 0 });
    const nodePositions = useRef<Map<string, { x: number; y: number }>>(new Map());

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                const radius = Math.min(width, height) / 2 - (width > 500 ? 50 : 35);
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
    
    const isConnectionActive = (from: string, to: string) => activeConnections.some(c => (c[0] === from && c[1] === to) || (c[0] === to && c[1] === from));
    const isConnectionError = (from: string, to: string) => errorConnections.some(c => (c[0] === from && c[1] === to) || (c[0] === to && c[1] === from));


    return (
        <div className="panel-glow p-4 flex flex-col h-full relative" style={{ minHeight: '300px' }}>
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
                    {nodes.map(fromNode => 
                        nodes.map(toNode => {
                            if (fromNode.id >= toNode.id) return null; // Avoid duplicates and self-loops
                            
                            const isError = isConnectionError(fromNode.id, toNode.id);
                            const isActive = isConnectionActive(fromNode.id, toNode.id);

                            if (!isError && !isActive) return null;

                            const fromPos = nodePositions.current.get(fromNode.id);
                            const toPos = nodePositions.current.get(toNode.id);
                            if (!fromPos || !toPos) return null;

                            let lineClass = 'data-flow-line';
                            if (isError) lineClass += ' line-pulse-red';
                            else if(isActive) lineClass += ' line-pulse-green';

                            return (
                                <line
                                    key={`${fromNode.id}-${toNode.id}`}
                                    x1={fromPos.x} y1={fromPos.y}
                                    x2={toPos.x} y2={toPos.y}
                                    className={lineClass}
                                />
                            );
                        })
                    )}
                </svg>

                {nodes.map((node, index) => {
                    const pos = nodePositions.current.get(node.id);
                    if (!pos) return null;
                    const isCentral = index === 0;
                    const size = isCentral ? 70 : 56;
                    
                    let statusColor = 'border-gray-500';
                    const isActive = activeConnections.some(c => c.includes(node.id));
                    const isError = errorConnections.some(c => c.includes(node.id));

                    if (isError) {
                        statusColor = 'border-red-500 animate-pulse-red';
                    } else if (node.status === 'sealing') {
                        statusColor = 'border-[var(--color-primary)] animate-pulse-cyan';
                    } else if (node.status === 'processing') {
                        statusColor = 'border-yellow-400 animate-pulse-yellow';
                    } else if (isActive) {
                        statusColor = 'border-green-400 animate-pulse-green';
                    } else if (node.status === 'online') {
                         statusColor = 'border-[var(--color-primary)]/50';
                    }

                    return (
                        <div
                            key={node.id}
                            className={`absolute flex flex-col items-center justify-center p-1 rounded-full transition-all duration-500 ${statusColor} border-2 bg-black/50 backdrop-blur-sm`}
                            style={{
                                left: pos.x, top: pos.y,
                                width: size, height: size,
                                transform: `translate(-50%, -50%)`,
                                zIndex: 2,
                                boxShadow: isActive || isError || node.status === 'sealing' ? '0 0 15px currentColor' : 'none'
                            }}
                            title={`${node.name} (${node.status})`}
                        >
                            <NodeIcon type={node.type} isCentral={isCentral} />
                            <span className="text-xs text-center text-[var(--color-text-dim)] truncate w-full" style={{ fontSize: '9px' }}>
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