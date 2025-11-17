export enum NodeType {
  CENTRAL = 'ada.central',
  SEA = 'ada.sea',
  MARINA = 'ada.marina',
  WEATHER = 'ada.weather',
  FINANCE = 'ada.finance',
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
  | { skillName: 'transactionQuery'; details: string; targetNodeId: string; };

export interface RouteData {
  from: { name: string; coords: GeoPoint };
  to: { name: string; coords: GeoPoint };
}