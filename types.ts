
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
  lastActive?: number;
  currentTask?: string;
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
  REQUEST = 'REQ',
  RESPONSE = 'RESP',
  SUCCESS = 'SUCC',
  ERROR = 'ERR',
  LEARNING = 'LRN',
  ACK = 'ACK',
  RETRY = 'RTRY',
  THINKING = 'THNK',
  VOTING = 'VOTE',
  CONSENSUS = 'CNSS',
  BACKTRACK = 'BACK',
  RTC_MESSAGE = 'RTC',
  TIMEOUT = 'T/O',
  TOOL_SELECTION = 'TOOL',
  SEAL = 'SEAL',
  CONTEXT_ENRICHMENT = 'CXT',
  WORKFLOW_STEP = 'STEP',
  MCP_DECISION = 'DEC',
  MCP_WORKFLOW_PLAN = 'PLAN',
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

export interface SystemMetrics {
    totalTasks: number;
    successfulTasks: number;
    failedTasks: number;
    totalTokens: number;
    totalLatencyMs: number;
    activeAgents: number;
    avgConfidence: number;
}