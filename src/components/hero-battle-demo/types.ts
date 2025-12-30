import type { PlayerPosition } from "./utils";

// =============================================================================
// Demo State Types
// =============================================================================

export type DemoState =
  | "intro"
  | "mc1-verse"
  | "mc2-intro"
  | "mc2-verse"
  | "scoring"
  | "winner"
  | "song-style-select"
  | "song-generating"
  | "song-complete";

export interface StateConfig {
  duration: number;
  activeMC: "mc1" | "mc2" | "both" | "none";
  round: number;
  showScoring?: boolean;
  showWinner?: boolean;
  showSongStyleSelect?: boolean;
  showSongGenerating?: boolean;
  showSongComplete?: boolean;
  streamingMC?: "mc1" | "mc2";
  showStreamingIndicator?: boolean;
  mc1Lines?: number;
  mc2Lines?: number;
}

// =============================================================================
// MC Data Types
// =============================================================================

export interface MCData {
  name: string;
  shortName?: string;
  avatar: string;
  style: string;
  bio: string;
}

// =============================================================================
// Common Component Props
// =============================================================================

export interface PausableProps {
  isPaused: boolean;
}

export interface PlayerPositionProps {
  position: PlayerPosition;
}

