import React, { useState } from 'react';
import { Node, NodeType } from '../types';
import { Server, Waves, Anchor, CloudSun, PlusCircle, X, Landmark, Globe, Database, Webhook, Clock, Presentation, Users, Gavel, Languages, Scale, Wrench, Ticket, Utensils, MessageSquare } from 'lucide-react';

interface NodeStatusPanelProps {
  nodes: Node[];
  isProcessing: boolean;
  activeConnections: [string, string][];
  addNode: (type: NodeType, instanceName: string) => void;
}

const NodeIcon: React.FC<{ type: NodeType; status: Node['status'] }> = ({ type, status }) => {
  let color = "text-gray-400";
  if (status === 'online') color = "text-cyan-300";
  if (status === 'processing') color = "text-yellow-300";
  if (status === 'offline') color = "text-red-400";

  const iconProps = { size: 24, className: `transition-colors duration-300 ${color}` };
  
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

const StatusIndicator: React.FC<{ status: Node['status'] }> = ({ status }) => {
  const baseClasses = "w-2.5 h-2.5 rounded-full transition-all duration-300";
  let statusClasses = "";
  switch (status) {
    case 'online':
      statusClasses = "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.7)]";
      break;
    case 'offline':
      statusClasses = "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]";
      break;
    case 'processing':
      statusClasses = "bg-yellow-400 animate-pulse shadow-[0_0_8px_rgba(250,204,21,0.7)]";
      break;
  }
  return <div className={`${baseClasses} ${statusClasses}`}></div>;
};

const getNodePosition = (index: number, total: number, center: { x: number; y: number }, radius: number) => {
    if (index === 0) return center; // Central node
    const angle = (2 * Math.PI / (total -1)) * (index - 1) - Math.PI / 2;
    return {
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
    };
}

const AddNodeForm: React.FC<{ addNode: (type: NodeType, name: string) => void, onDone: () => void }> = ({ addNode, onDone }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<NodeType>(NodeType.CONGRESS);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && type) {
            addNode(type, name.trim());
            onDone();
        }
    }

    return (
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2 p-3 bg-gray-900/50 rounded-lg border border-gray-700 animate-fade-in">
            <h4 className="text-sm font-semibold text-gray-300">Yeni Düğüm Klonla</h4>
             <select value={type} onChange={e => setType(e.target.value as NodeType)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none">
                 <optgroup label="Uzman Agent'lar">
                    <option value={NodeType.CONGRESS}>Congress (ada.congress.&lt;tenant&gt;)</option>
                    <option value={NodeType.CUSTOMER}>Customer (ada.customer.&lt;tenant&gt;)</option>
                    <option value={NodeType.FINANCE}>Finance (ada.finance.&lt;tenant&gt;)</option>
                    <option value={NodeType.HUKUK}>Hukuk (ada.hukuk.&lt;tenant&gt;)</option>
                    <option value={NodeType.INTERPRETER}>Interpreter (ada.interpreter.&lt;tenant&gt;)</option>
                    <option value={NodeType.LEGAL}>Legal (ada.legal.&lt;tenant&gt;)</option>
                    <option value={NodeType.MAINTENANCE}>Maintenance (ada.maintenance.&lt;tenant&gt;)</option>
                    <option value={NodeType.MARINA}>Marina (ada.marina.&lt;tenant&gt;)</option>
                    <option value={NodeType.PASSKIT}>Passkit (ada.passkit.&lt;tenant&gt;)</option>
                    <option value={NodeType.RESTAURANT}>Restaurant (ada.restaurant.&lt;tenant&gt;)</option>
                    <option value={NodeType.SEA}>Yat (ada.sea.&lt;tenant&gt;)</option>
                    <option value={NodeType.TRAVEL}>Travel Agency (ada.travel.&lt;tenant&gt;)</option>
                    <option value={NodeType.CHATBOT}>Chatbot (ada.chatbot.&lt;tenant&gt;)</option>
                 </optgroup>
                 <optgroup label="Altyapı Agent'ları">
                    <option value={NodeType.DB}>Database (ada.db.&lt;tenant&gt;)</option>
                    <option value={NodeType.API}>API Gateway (ada.api.&lt;tenant&gt;)</option>
                    <option value={NodeType.CRON}>Scheduler (ada.cron.&lt;tenant&gt;)</option>
                    <option value={NodeType.WEATHER}>Hava Düğümü</option>
                 </optgroup>
             </select>
            <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Örn: Midilli, Wim, Main"
                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
            <button type="submit" className="w-full text-sm bg-cyan-600 text-white font-semibold rounded-md p-2 hover:bg-cyan-500 transition-colors">
                Klonla
            </button>
        </form>
    )
}


const NodeStatusPanel: React.FC<NodeStatusPanelProps> = ({ nodes, activeConnections, addNode }) => {
  const width = 320; // Increased width for more nodes
  const height = 320; // Increased height
  const center = { x: width / 2, y: height / 2 };
  const radius = 130; // Increased radius

  const [showAddForm, setShowAddForm] = useState(false);

  // Filter out the central node for positioning, then add it back at the start
  const peripheralNodes = nodes.filter(n => n.type !== NodeType.CENTRAL);
  const centralNode = nodes.find(n => n.type === NodeType.CENTRAL);
  const sortedNodes = centralNode ? [centralNode, ...peripheralNodes] : peripheralNodes;


  const nodePositions = sortedNodes.map((node, i) => ({
      ...node,
      pos: getNodePosition(i, sortedNodes.length, center, radius)
  }));
  
  const centralNodePos = nodePositions.find(n => n.type === NodeType.CENTRAL);

  return (
    <div className="bg-gray-800/50 rounded-2xl p-6 shadow-lg ring-1 ring-white/10 flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-cyan-300">Ağ Durumu</h3>
        <button onClick={() => setShowAddForm(!showAddForm)} className="text-gray-400 hover:text-cyan-300 transition-colors">
            {showAddForm ? <X size={20} /> : <PlusCircle size={20} />}
        </button>
      </div>
      
      {showAddForm && <AddNodeForm addNode={addNode} onDone={() => setShowAddForm(false)} />}

      <div className="relative mt-4" style={{ width, height }}>
        <svg width={width} height={height} className="absolute inset-0">
            <defs>
                <linearGradient id="glowing-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: '#22d3ee', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#a5f3fc', stopOpacity: 1 }}>
                        <animate attributeName="offset" values="-1;2" dur="1s" repeatCount="indefinite" />
                    </stop>
                </linearGradient>
            </defs>
            
            {/* Render static base lines from coordinator to other nodes */}
            {centralNodePos && nodePositions.filter(n => n.type !== NodeType.CENTRAL).map(node => (
                <line 
                    key={`base-${centralNodePos.id}-${node.id}`}
                    x1={centralNodePos.pos.x} y1={centralNodePos.pos.y}
                    x2={node.pos.x} y2={node.pos.y}
                    stroke="rgba(75, 85, 99, 0.5)"
                    strokeWidth={2}
                />
             ))}

            {/* Render glowing lines for ANY active mesh connection */}
            {activeConnections.map(([fromId, toId], index) => {
                const fromNode = nodePositions.find(n => n.id === fromId);
                const toNode = nodePositions.find(n => n.id === toId);
                if (fromNode && toNode) {
                    return (
                        <line 
                            key={`active-${index}-${fromId}-${toId}`}
                            x1={fromNode.pos.x} y1={fromNode.pos.y}
                            x2={toNode.pos.x} y2={toNode.pos.y}
                            className="transition-opacity duration-300"
                            stroke="url(#glowing-gradient)"
                            strokeWidth={3}
                        />
                    );
                }
                return null;
            })}
        </svg>

        {nodePositions.map((node) => (
            <div 
                key={node.id} 
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 group cursor-pointer"
                style={{ left: node.pos.x, top: node.pos.y }}
            >
                <div className={`w-14 h-14 rounded-full bg-gray-900/80 border-2 flex items-center justify-center transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.7)] ${node.status === 'online' ? 'border-cyan-500' : node.status === 'processing' ? 'border-yellow-400 animate-pulse' : 'border-red-500'}`}>
                    <NodeIcon type={node.type} status={node.status} />
                </div>
                <div className="flex items-center gap-1.5 bg-gray-800/80 px-2 py-0.5 rounded-full text-xs">
                    <StatusIndicator status={node.status} />
                    <span className="font-medium text-gray-300">{node.name}</span>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default NodeStatusPanel;