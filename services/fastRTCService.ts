import { LogType } from '../types';

type LogCallback = (type: LogType, message: string, source: string, details: {
    requestId: string;
    responseTimeMs?: number;
    direction: 'inbound' | 'outbound';
}) => void;

type TimeoutCallback = (details: { requestId: string, from: string, to: string }) => void;

export class FastRTCService {
    private pendingRequests: Map<string, { startTime: number; from: string; to: string; }> = new Map();
    private pendingTimeouts: Map<string, number> = new Map();
    private logCallback: LogCallback;
    private timeoutCallback: TimeoutCallback;
    private static readonly REQUEST_TIMEOUT_MS = 15000; // 15 seconds

    constructor(logCallback: LogCallback, timeoutCallback: TimeoutCallback) {
        this.logCallback = logCallback;
        this.timeoutCallback = timeoutCallback;
    }

    private generateRequestId(): string {
        return `rtc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    }

    public handleOutbound(fromNodeId: string, toNodeId: string, taskDescription: string): string {
        const requestId = this.generateRequestId();
        this.pendingRequests.set(requestId, { startTime: Date.now(), from: fromNodeId, to: toNodeId });

        const timeoutId = window.setTimeout(() => {
            this.handleTimeout(requestId);
        }, FastRTCService.REQUEST_TIMEOUT_MS);
        this.pendingTimeouts.set(requestId, timeoutId);

        this.logCallback(
            LogType.RTC_MESSAGE,
            `Requesting task: '${taskDescription}'`,
            fromNodeId,
            { requestId, direction: 'outbound' }
        );
        return requestId;
    }

    public handleInbound(requestId: string, message: string): void {
        const request = this.pendingRequests.get(requestId);
        if (!request) return; // Already timed out or duplicate response

        const timeoutId = this.pendingTimeouts.get(requestId);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.pendingTimeouts.delete(requestId);
        }

        const responseTimeMs = Date.now() - request.startTime;

        this.logCallback(
            LogType.RTC_MESSAGE,
            message,
            request.to, // The response comes FROM the target node
            { requestId, direction: 'inbound', responseTimeMs }
        );

        this.pendingRequests.delete(requestId);
    }
    
    private handleTimeout(requestId: string): void {
        const request = this.pendingRequests.get(requestId);
        if (request) {
            this.timeoutCallback({ requestId, from: request.from, to: request.to });
            this.pendingRequests.delete(requestId);
            this.pendingTimeouts.delete(requestId);
        }
    }
}
