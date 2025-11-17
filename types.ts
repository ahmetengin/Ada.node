export enum NodeType {
  CENTRAL = 'ada.central',
  SEA = 'ada.sea',
  MARINA = 'ada.marina',
  WEATHER = 'ada.weather',
  FINANCE = 'ada.finance',
  TRAVEL = 'ada.travel',
  DB = 'ada.db',
  API = 'ada.api',
  CRON = 'ada.cron',
  // New, more granular agent types based on user's repositories
  CONGRESS = 'ada.congress',
  CUSTOMER = 'ada.customer',
  HUKUK = 'ada.hukuk',
  INTERPRETER = 'ada.interpreter',
  LEGAL = 'ada.legal',
  MAINTENANCE = 'ada.maintenance',
  PASSKIT = 'ada.passkit',
  RESTAURANT = 'ada.restaurant',
  CHATBOT = 'ada.chatbot',
}

export interface Node {
  id: string;
  name: string;
  type: NodeType;
  status: 'online' | 'offline' | 'processing';
  instanceName?: string; // e.g., 'wim', 'midilli'
}

export interface Skill {
  name: string;
  description: string;
  level: number; // 1-10
  execute: (input: any) => Promise<any>;
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

export type TaskDetails =
  | { skillName: 'routePlanning'; from: string; to: string }
  | { skillName: 'bookingConfirmation'; location: string; vessel: string; targetNodeId: string; }
  | { skillName: 'bookingAssistance'; service: string; location: string; targetNodeId: string; }
  | { skillName: 'vesselStatusCheck'; targetNodeId: string; }
  | { skillName: 'transactionQuery'; details: string; targetNodeId: string; }
  | { 
      skillName: 'fullItinerary'; 
      from: string; 
      to: string; 
      targetMarinaNodeId: string; 
      targetFinanceNodeId: string;
      targetTravelNodeId: string;
    }
  | {
      skillName: 'weeklyReport';
      targetDbNodeId: string;
      targetApiNodeId: string;
    }
  | {
      skillName: 'congressOrganization';
      eventName: string;
      targetCongressNodeId: string;
      targetPasskitNodeId: string;
      targetFinanceNodeId: string;
      targetInterpreterNodeId: string;
      targetRestaurantNodeId: string;
      targetHukukNodeId: string;
    };


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
