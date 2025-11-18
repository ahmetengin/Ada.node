export enum NodeType {
  CENTRAL = 'ada.central',
  TRAVEL_AGENT = 'travel_agent',
  CRM_AGENT = 'crm_agent',
  FINANCE_AGENT = 'finance_agent',
  MARITIME_AGENT = 'maritime_agent',
  GENERIC = 'ada.generic',
}

export interface Node {
  id: string;
  name: string;
  type: NodeType;
  status: 'online' | 'offline' | 'processing' | 'sealing';
  instanceName?: string;
}

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

export interface TaskDetails {
  agentId: string;
  skillId?: string;
  providerId?: string;
  toolId?: string;
  initialContext?: Record<string, any>;
}

export interface TaskContext {
  customerProfile?: any;
  [key: string]: any;
}

export interface ToolOutput {
  toolId: string;
  providerId: string;
  response: VotableResponse | null;
  data?: any;
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
  CONTEXT_ENRICHMENT = 'CONTEXT_ENRICHMENT',
  WORKFLOW_STEP = 'WORKFLOW_STEP',
  MCP_DECISION = 'MCP_DECISION',
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
  reason: string;
  confidence: number;
}
