
import React from 'react';
import { SystemMetrics } from '../types';

interface ScoreboardProps {
    metrics: SystemMetrics;
}

const MetricBox: React.FC<{ label: string, value: string | number, color?: string }> = ({ label, value, color }) => (
    <div className="flex flex-col">
        <span className="text-[10px] uppercase text-[var(--text-secondary)] tracking-wider">{label}</span>
        <span className={`text-lg font-bold font-mono ${color ? `text-[var(--${color}-color)]` : 'text-[var(--text-primary)]'}`}>
            {value}
        </span>
    </div>
);

const Scoreboard: React.FC<ScoreboardProps> = ({ metrics }) => {
    const successRate = metrics.totalTasks > 0 ? ((metrics.successfulTasks / metrics.totalTasks) * 100).toFixed(1) : '100.0';
    const avgLat = metrics.totalTasks > 0 ? Math.round(metrics.totalLatencyMs / metrics.totalTasks) : 0;
    // Est cost: $0.10 per 1M tokens (Flash) roughly
    const estCost = (metrics.totalTokens / 1000000 * 0.10).toFixed(4);

    return (
        <div className="terminal-panel p-3 flex items-center justify-between gap-6 h-20">
            <div className="flex gap-6">
                <MetricBox label="Total Tasks" value={metrics.totalTasks} />
                <MetricBox label="Success Rate" value={`${successRate}%`} color="success" />
                <MetricBox label="Active Agents" value={metrics.activeAgents} color="accent" />
            </div>
            
            <div className="w-px bg-[var(--border-color)] h-10"></div>

            <div className="flex gap-6">
                <MetricBox label="Avg Latency" value={`${avgLat}ms`} color="warning" />
                <MetricBox label="Token Usage" value={metrics.totalTokens.toLocaleString()} />
                <MetricBox label="Est. Cost" value={`$${estCost}`} />
            </div>
        </div>
    );
};

export default Scoreboard;
