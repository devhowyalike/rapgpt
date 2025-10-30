/**
 * Battle system types for Versuz platform
 */

export type BattleStatus = 'upcoming' | 'ongoing' | 'completed' | 'incomplete';
export type PersonaPosition = 'left' | 'right';
export type SongGenerationBeatStyle = 'g-funk' | 'boom-bap' | 'trap';

export interface Persona {
  id: string;
  name: string;
  bio: string;
  style: string;
  avatar: string;
  accentColor: string;
  systemPrompt: string;
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
  personaScores: {
    [personaId: string]: {
      automated: AutomatedScore;
      userVotes: number;
      totalScore: number;
    };
  };
  winner: string | null;
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
  personas: {
    left: Persona;
    right: Persona;
  };
  currentRound: number;
  currentTurn: 'left' | 'right' | null;
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
  } | null;
  // Battle type flags
  isFeatured?: boolean; // true = admin featured battle, false = user battle
  // Live battle fields
  isLive?: boolean;
  liveStartedAt?: number;
  adminControlMode?: 'manual' | 'auto';
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

