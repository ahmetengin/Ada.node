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
  status: 'online' | 'offline' | 'processing' | 'sealing';
  instanceName?: string; 
}

// New "Capability Matrix" data structures
export interface Tool {
  id: string;
  description: string;
}

export interface Provider {
  id: string;
  description: string;
  supportedToolIds: string[];
}

export interface Skill {
  id: string;
  description: string;
  providerIds: string[];
}

export interface AgentModule {
  skills: Skill[];
  voting_strategy: string;
  red_flagging: boolean;
}

export interface AgentFrameworkConfig {
  modules: Record<string, AgentModule>;
  providers: Record<string, Provider>;
  tools: Record<string, Tool>;
  general: {
    auto_seal: boolean;
    run_interval_hours: number;
    log_dir: string;
    temp_dir: string;
    adapter_update: boolean;
  };
}

// TaskDetails for execution, now reflects the hierarchy
export interface TaskDetails {
  agentId: string;
  skillId?: string;
  providerId?: string;
  toolId?: string;
}

export interface ToolOutput {
  toolId: string;
  providerId: string;
  response: VotableResponse | null;
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
  RTC_MESSAGE = 'RTC_MESSAGE',
  TIMEOUT = 'TIMEOUT',
  TOOL_SELECTION = 'TOOL_SELECTION',
  SEAL = 'SEAL',
}

export interface LogEntry {
  id: number;
  timestamp: string;
  type: LogType;
  message: string;
  source?: string;
  voteDistribution?: Record<string, number>;
  requestId?: string;
  responseTimeMs?: number;
  direction?: 'inbound' | 'outbound';
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
  rawResponses: ToolOutput[];
}

export interface VotableResponse {
    decision: string;
    reason:string;
    confidence: number;
}