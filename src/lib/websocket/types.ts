/**
 * WebSocket event types for real-time battle system
 */

import type { Battle, Comment } from "@/lib/shared";

export type WebSocketEventType =
  | "battle:live_started"
  | "battle:live_ended"
  | "battle:ending_soon"
  | "verse:streaming"
  | "verse:complete"
  | "phase:reading"
  | "phase:voting"
  | "round:advanced"
  | "battle:completed"
  | "comment:added"
  | "vote:cast"
  | "state:sync"
  | "viewers:count"
  | "admin:connected"
  | "admin:disconnected"
  | "connection:acknowledged"
  | "server:shutdown"
  | "homepage:battle_progress";

export type BattleEndingReason =
  | "inactivity"
  | "admin_timeout"
  | "server_shutdown"
  | "max_lifetime";

export interface BaseWebSocketEvent {
  type: WebSocketEventType;
  battleId: string;
  timestamp: number;
}

export interface BattleLiveStartedEvent extends BaseWebSocketEvent {
  type: "battle:live_started";
  battle: Battle;
  adminId: string;
}

export interface BattleLiveEndedEvent extends BaseWebSocketEvent {
  type: "battle:live_ended";
  battle: Battle;
}

export interface VerseStreamingEvent extends BaseWebSocketEvent {
  type: "verse:streaming";
  personaId: string;
  text: string;
  isComplete: boolean;
}

export interface VerseCompleteEvent extends BaseWebSocketEvent {
  type: "verse:complete";
  personaId: string;
  verseText: string;
  round: number;
}

export interface PhaseReadingEvent extends BaseWebSocketEvent {
  type: "phase:reading";
  round: number;
  duration: number;
}

export interface PhaseVotingEvent extends BaseWebSocketEvent {
  type: "phase:voting";
  round: number;
  duration: number;
}

export interface RoundAdvancedEvent extends BaseWebSocketEvent {
  type: "round:advanced";
  newRound: number;
  battle: Battle;
}

export interface BattleCompletedEvent extends BaseWebSocketEvent {
  type: "battle:completed";
  battle: Battle;
  winner: string | null;
}

export interface CommentAddedEvent extends BaseWebSocketEvent {
  type: "comment:added";
  comment: Comment;
}

export interface VoteCastEvent extends BaseWebSocketEvent {
  type: "vote:cast";
  round: number;
  personaId: string;
  battle: Battle;
}

export interface StateSyncEvent extends BaseWebSocketEvent {
  type: "state:sync";
  battle: Battle;
  viewerCount: number;
}

export interface ViewersCountEvent extends BaseWebSocketEvent {
  type: "viewers:count";
  count: number;
}

export interface AdminConnectedEvent extends BaseWebSocketEvent {
  type: "admin:connected";
  adminId: string;
}

export interface AdminDisconnectedEvent extends BaseWebSocketEvent {
  type: "admin:disconnected";
  adminId: string;
}

export interface ConnectionAcknowledgedEvent extends BaseWebSocketEvent {
  type: "connection:acknowledged";
  clientId: string;
  viewerCount: number;
}

export interface BattleEndingSoonEvent extends BaseWebSocketEvent {
  type: "battle:ending_soon";
  reason: BattleEndingReason;
  secondsRemaining: number;
}

export interface ServerShutdownEvent extends BaseWebSocketEvent {
  type: "server:shutdown";
  message: string;
}

/**
 * Lightweight event for homepage to track battle progress
 * Sent when a verse completes - homepage increments verse count locally
 */
export interface HomepageBattleProgressEvent extends BaseWebSocketEvent {
  type: "homepage:battle_progress";
  currentRound: number;
}

export type WebSocketEvent =
  | BattleLiveStartedEvent
  | BattleLiveEndedEvent
  | BattleEndingSoonEvent
  | VerseStreamingEvent
  | VerseCompleteEvent
  | PhaseReadingEvent
  | PhaseVotingEvent
  | RoundAdvancedEvent
  | BattleCompletedEvent
  | CommentAddedEvent
  | VoteCastEvent
  | StateSyncEvent
  | ViewersCountEvent
  | AdminConnectedEvent
  | AdminDisconnectedEvent
  | ConnectionAcknowledgedEvent
  | ServerShutdownEvent
  | HomepageBattleProgressEvent;

export interface ClientMessage {
  type: "join" | "leave" | "sync_request";
  battleId: string;
  clientId?: string;
  isAdmin?: boolean;
}

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnecting"
  | "disconnected"
  | "error";

export interface WebSocketConnection {
  status: ConnectionStatus;
  error?: string;
  reconnectAttempts: number;
}
