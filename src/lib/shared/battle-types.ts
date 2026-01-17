/**
 * Battle system types for Versuz platform
 */

export type BattleStatus = "upcoming" | "paused" | "completed";
export type PersonaPosition = "player1" | "player2";
export type SongGenerationBeatStyle = "g-funk" | "boom-bap" | "trap";

export interface Persona {
  id: string;
  name: string;
  bio: string;
  style: string;
  avatar: string;
  accentColor: string;
  systemPrompt: string;
  /**
   * Optional: IDs of alternative costume personas linked to this primary persona.
   * Order determines cycling order in character select (primary → alt1 → alt2 → …).
   */
  altCostumes?: string[];
  musicStyleDescription?: string; // Platform-agnostic music generation descriptors (no copyrighted artist names)
  vocalGender?: "m" | "f"; // Vocal gender for music generation APIs
  isHoopla?: boolean;
  /**
   * Optional: User-provided custom context for the battle (e.g., "rap about the Eagles", "diss their sneakers").
   * This is encrypted when stored in the database. Max 120 characters.
   */
  encryptedCustomContext?: string;
}

export interface Bar {
  text: string;
  index: number;
}

export interface Verse {
  id: string;
  personaId: string;
  round: number;
  bars: Bar[];
  timestamp: number;
  fullText: string;
}

export interface AutomatedScore {
  rhymeScheme: number; // 0-30
  wordplay: number; // 0-25
  flow: number; // 0-20
  relevance: number; // 0-15
  originality: number; // 0-10
  total: number; // 0-100
  breakdown: {
    rhymeScheme: string;
    wordplay: string;
    flow: string;
    relevance: string;
    originality: string;
  };
}

export interface RoundScore {
  round: number;
  positionScores: {
    player1: {
      personaId: string;
      automated: AutomatedScore;
      userVotes: number;
      totalScore: number;
    };
    player2: {
      personaId: string;
      automated: AutomatedScore;
      userVotes: number;
      totalScore: number;
    };
  };
  winner: PersonaPosition | null;
}

export interface Comment {
  id: string;
  username: string;
  content: string;
  timestamp: number;
  round?: number;
  userId?: string;
  imageUrl?: string | null;
}

export interface Battle {
  id: string;
  title: string;
  month: string;
  year: number;
  status: BattleStatus;
  stageId: string; // Stage where the battle takes place
  personas: {
    player1: Persona;
    player2: Persona;
  };
  currentRound: number;
  currentTurn: PersonaPosition | null;
  verses: Verse[];
  scores: RoundScore[];
  comments: Comment[];
  winner: string | null;
  createdAt: number;
  updatedAt: number;
  creator?: {
    userId: string;
    displayName: string;
    imageUrl?: string | null;
    isProfilePublic?: boolean;
  } | null;
  // Battle type flags
  isFeatured?: boolean; // true = admin featured battle, false = user battle
  votingEnabled?: boolean; // Enable/disable voting (default: true)
  commentsEnabled?: boolean; // Enable/disable comments (default: true)
  /**
   * If true (default), advancing the round will automatically start the first verse
   * If false, show the "Next: [artist]" prompt and require an explicit start
   */
  autoStartOnAdvance?: boolean;
  // Live battle fields
  isLive?: boolean;
  liveStartedAt?: number;
  adminControlMode?: "manual" | "auto";
  autoPlayConfig?: {
    verseDelay?: number;
    autoAdvance?: boolean;
    readingDuration?: number;
    votingDuration?: number;
  };
  // AI-generated song from battle verses
  generatedSong?: {
    audioUrl: string;
    videoUrl?: string;
    imageUrl?: string;
    title: string;
    beatStyle: SongGenerationBeatStyle;
    generatedAt: number;
    sunoTaskId: string;
  };
}

export interface BattleState {
  battle: Battle | null;
  isLoading: boolean;
  error: string | null;
}

export interface Vote {
  battleId: string;
  round: number;
  personaId: string;
  userId: string;
  timestamp: number;
}

export const ROUNDS_PER_BATTLE = 3;
export const BARS_PER_VERSE = 8;
export const MAX_COMMENTS = 500;
