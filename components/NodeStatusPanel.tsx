
import React from 'react';
import { Node, NodeType } from '../types';
import { Server, Plus } from 'lucide-react';

interface NodeStatusPanelProps {
  nodes: Node[];
  isProcessing: boolean;
  addNode: (type: NodeType, instanceName: string) => void;
}

const NodeStatusPanel: React.FC<NodeStatusPanelProps> = ({ nodes, isProcessing, addNode }) => {
    const totalSlots = 128; // Grid size
    const slots = Array(totalSlots).fill(null).map((_, i) => nodes[i] || null);

    const getStatusColor = (node: Node | null) => {
        if (!node) return 'bg-[var(--bg-tertiary)] opacity-20';
        if (node.status === 'sealing') return 'bg-[var(--accent-color)] animate-pulse';
        if (node.status === 'processing') return 'bg-[var(--warning-color)] blink';
        if (node.status === 'offline') return 'bg-[var(--error-color)]';
        return 'bg-[var(--success-color)] opacity-50';
    };

    return (
        <div className="terminal-panel flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-2 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
                <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">Cluster Heatmap</span>
                <button onClick={() => addNode(NodeType.GENERIC, `worker-${nodes.length+1}`)} className="text-xs flex items-center gap-1 text-[var(--text-primary)] hover:text-[var(--accent-color)]">
                    <Plus size={12} /> CLONE
                </button>
            </div>

            {/* Heatmap Grid */}
            <div className="p-2 grid grid-cols-16 gap-1 auto-rows-fr flex-grow overflow-hidden">
                {slots.map((node, i) => (
                    <div 
                        key={i} 
                        className={`w-full h-3 rounded-sm ${getStatusColor(node)} transition-colors duration-100`}
                        title={node ? `${node.name} (${node.status})` : 'Empty Slot'}
                    />
                ))}
            </div>

            {/* Process List (htop style) */}
            <div className="h-48 border-t border-[var(--border-color)] flex flex-col">
                 <div className="flex items-center px-2 py-1 text-[10px] text-[var(--text-secondary)] bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
                    <span className="w-16">PID</span>
                    <span className="w-32">USER</span>
                    <span className="w-20">PRI</span>
                    <span className="w-20">STATE</span>
                    <span className="flex-grow">COMMAND</span>
                 </div>
                 <div className="flex-grow overflow-y-auto font-mono text-xs">
                    {nodes.slice().reverse().map((node, i) => (
                        <div key={node.id} className="flex items-center px-2 py-0.5 hover:bg-[var(--selection-bg)] hover:text-white group">
                            <span className="w-16 text-[var(--accent-color)]">{1000 + i}</span>
                            <span className="w-32 truncate">{node.type.split('.')[1] || 'root'}</span>
                            <span className="w-20">20</span>
                            <span className={`w-20 ${node.status === 'processing' ? 'text-[var(--warning-color)]' : 'text-[var(--text-secondary)]'}`}>
                                {node.status.toUpperCase().substring(0,1)}
                            </span>
                            <span className="flex-grow text-[var(--text-primary)] truncate">
                                {node.status === 'processing' ? `./execute ${node.currentTask || 'task'}` : '/usr/bin/idle'}
                            </span>
                        </div>
                    ))}
                 </div>
            </div>
        </div>
    );
};

export default NodeStatusPanel;
