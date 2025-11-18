export enum NodeType {
  CENTRAL = 'ada.central',
  // New agent module types from config
  TRAVEL_AGENT = 'travel_agent',
  PAYMENT_AGENT = 'payment_agent',
  CRM_AGENT = 'crm_agent',
  YACHT_TACTICAL_AGENT = 'yacht_tactical_agent',
  // Keep generic types for manual adding if needed
  GENERIC = 'ada.generic',
}

export interface Node {
  id: string;
  name: string;
  type: NodeType;
  status: 'online' | 'offline' | 'processing';
  instanceName?: string; 
}

// New data-driven structures
export interface Task {
  id: string;
  description: string;
}

export interface AgentModule {
  tasks: Task[];
  num_samples: number;
  voting_strategy: string;
  red_flagging: boolean;
}

export interface AgentConfig {
  modules: Record<string, AgentModule>;
  general: {
    auto_seal: boolean;
    run_interval_hours: number;
    log_dir: string;
    temp_dir: string;
    adapter_update: boolean;
  };
}

// Simplified TaskDetails for execution
export interface TaskDetails {
  agentId: string;
  task: Task;
}


export enum LogType {
  INFO = 'INFO',
  REQUEST = 'REQUEST',
  RESPONSE = 'RESPONSE',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  LEARNING = 'LEARNING',
  ACK = 'ACK',
  RETRY = 'RETRY',
  THINKING = 'THINKING',
  VOTING = 'VOTING',
  CONSENSUS = 'CONSENSUS',
  BACKTRACK = 'BACKTRACK',
}

export interface LogEntry {
  id: number;
  timestamp: string;
  type: LogType;
  message: string;
  source?: string;
  voteDistribution?: Record<string, number>;
}

export type ConversationStatus = 'idle' | 'connecting' | 'connected' | 'error';

export interface TranscriptionEntry {
  id: number;
  speaker: 'user' | 'ada';
  text: string;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface RouteData {
  from: { name: string; coords: GeoPoint };
  to: { name: string; coords: GeoPoint };
}

export interface VoteOutcome {
  isConsensus: boolean;
  majorityDecision: string | null;
  confidence: number;
  voteDistribution: Record<string, number>;
  rawResponses: VotableResponse[];
}

export interface VotableResponse {
    decision: string;
    reason: string;
    confidence: number;
}
