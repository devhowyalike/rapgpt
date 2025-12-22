/**
 * Zustand store for battle state management
 */

import { create } from "zustand";
import type { Battle, Comment, PersonaPosition } from "@/lib/shared";
import { addVerseToBattle, advanceToNextRound } from "./battle-engine";
import { getPersonaPosition } from "./battle-position-utils";

interface BattleStore {
  battle: Battle | null;
  isLoading: boolean;
  error: string | null;
  streamingVerse: string | null;
  streamingPersonaId: string | null;
  streamingPosition: PersonaPosition | null;
  votingTimeRemaining: number | null;
  isVotingPhase: boolean;
  votingCompletedRound: number | null;
  readingTimeRemaining: number | null;
  isReadingPhase: boolean;
  userVotes: Set<string>;

  setBattle: (battle: Battle) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setStreamingVerse: (
    verse: string | null,
    personaId: string | null,
    position?: PersonaPosition | null,
  ) => void;
  setVotingTimeRemaining: (time: number | null) => void;
  setIsVotingPhase: (isVoting: boolean) => void;
  setVotingCompletedRound: (round: number | null) => void;
  completeVotingPhase: (round: number) => void;
  setReadingTimeRemaining: (time: number | null) => void;
  setIsReadingPhase: (isReading: boolean) => void;
  setUserVote: (battleId: string, round: number, personaId: string, isUndo: boolean, previousVoteKey: string | null) => void;
  revertUserVote: (voteKey: string, isUndo: boolean, previousVoteKey: string | null) => void;

  addVerse: (personaId: string, verse: string) => void;
  advanceRound: () => void;
  addComment: (comment: Comment) => void;
  updateVotes: (round: number, personaId: string, votes: number) => void;
  cancelBattle: () => Promise<void>;
  resumeBattle: () => Promise<void>;

  fetchBattle: (battleId: string) => Promise<void>;
  saveBattle: () => Promise<void>;
}

// Helper to get voting completed round from localStorage
const getStoredVotingCompletedRound = (battleId: string | null): number | null => {
  if (typeof window === "undefined" || !battleId) return null;
  const key = `battle-voting-completed-${battleId}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    const parsed = parseInt(stored, 10);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
};

// Helper to persist voting completed round to localStorage
const storeVotingCompletedRound = (battleId: string | null, round: number | null) => {
  if (typeof window === "undefined" || !battleId) return;
  const key = `battle-voting-completed-${battleId}`;
  if (round === null) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, String(round));
  }
};

// Helper to get user votes from localStorage
const getStoredUserVotes = (battleId: string | null): Set<string> => {
  if (typeof window === "undefined" || !battleId) return new Set();
  const key = `battle-votes-${battleId}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return new Set(JSON.parse(stored));
    } catch {
      return new Set();
    }
  }
  return new Set();
};

// Helper to persist user votes to localStorage
const storeUserVotes = (battleId: string | null, votes: Set<string>) => {
  if (typeof window === "undefined" || !battleId) return;
  const key = `battle-votes-${battleId}`;
  localStorage.setItem(key, JSON.stringify(Array.from(votes)));
};

export const useBattleStore = create<BattleStore>((set, get) => ({
  battle: null,
  isLoading: false,
  error: null,
  streamingVerse: null,
  streamingPersonaId: null,
  streamingPosition: null,
  votingTimeRemaining: null,
  isVotingPhase: false,
  votingCompletedRound: null,
  readingTimeRemaining: null,
  isReadingPhase: false,
  userVotes: new Set<string>(),

  setBattle: (battle) => {
    // When battle changes, restore votingCompletedRound and userVotes from localStorage
    const storedRound = getStoredVotingCompletedRound(battle?.id ?? null);
    const storedVotes = getStoredUserVotes(battle?.id ?? null);
    set({ battle, votingCompletedRound: storedRound, userVotes: storedVotes });
  },
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setStreamingVerse: (verse, personaId, position = null) =>
    set({
      streamingVerse: verse,
      streamingPersonaId: personaId,
      streamingPosition: position,
    }),
  setVotingTimeRemaining: (time) => set({ votingTimeRemaining: time }),
  setIsVotingPhase: (isVoting) => set({ isVotingPhase: isVoting }),
  setVotingCompletedRound: (round) => {
    const { battle } = get();
    storeVotingCompletedRound(battle?.id ?? null, round);
    set({ votingCompletedRound: round });
  },
  completeVotingPhase: (round) => {
    const { battle } = get();
    storeVotingCompletedRound(battle?.id ?? null, round);
    set({
      isVotingPhase: false,
      votingTimeRemaining: null,
      votingCompletedRound: round,
    });
  },
  setReadingTimeRemaining: (time) => set({ readingTimeRemaining: time }),
  setIsReadingPhase: (isReading) => set({ isReadingPhase: isReading }),
  setUserVote: (battleId, round, personaId, isUndo, previousVoteKey) => {
    const voteKey = `${battleId}-${round}-${personaId}`;
    set((state) => {
      const newVotes = new Set(state.userVotes);
      if (isUndo) {
        newVotes.delete(voteKey);
      } else {
        if (previousVoteKey) {
          newVotes.delete(previousVoteKey);
        }
        newVotes.add(voteKey);
      }
      storeUserVotes(battleId, newVotes);
      return { userVotes: newVotes };
    });
  },
  revertUserVote: (voteKey, isUndo, previousVoteKey) => {
    const { battle } = get();
    set((state) => {
      const newVotes = new Set(state.userVotes);
      if (isUndo) {
        // Restore the vote
        newVotes.add(voteKey);
      } else {
        // Restore previous state
        newVotes.delete(voteKey);
        if (previousVoteKey) {
          newVotes.add(previousVoteKey);
        }
      }
      storeUserVotes(battle?.id ?? null, newVotes);
      return { userVotes: newVotes };
    });
  },

  addVerse: (personaId, verse) => {
    const { battle } = get();
    if (!battle) return;

    try {
      const updatedBattle = addVerseToBattle(battle, personaId, verse);
      set({ battle: updatedBattle });
    } catch (error) {
      console.error("Error adding verse:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to add verse",
      });
    }
  },

  advanceRound: () => {
    const { battle } = get();
    if (!battle) return;

    try {
      const updatedBattle = advanceToNextRound(battle);
      set({ battle: updatedBattle });
    } catch (error) {
      console.error("Error advancing round:", error);
      set({
        error:
          error instanceof Error ? error.message : "Failed to advance round",
      });
    }
  },

  addComment: (comment) => {
    const { battle } = get();
    if (!battle) return;

    set({
      battle: {
        ...battle,
        comments: [...battle.comments, comment],
      },
    });
  },

  updateVotes: (round, personaId, votes) => {
    const { battle } = get();
    if (!battle) return;

    const scoreIndex = battle.scores.findIndex((s) => s.round === round);
    if (scoreIndex === -1) return;

    // Determine which position the persona is in
    const position = getPersonaPosition(battle, personaId);
    if (!position) return; // Invalid persona ID

    const updatedScores = [...battle.scores];
    updatedScores[scoreIndex] = {
      ...updatedScores[scoreIndex],
      positionScores: {
        ...updatedScores[scoreIndex].positionScores,
        [position]: {
          ...updatedScores[scoreIndex].positionScores[position],
          userVotes: votes,
        },
      },
    };

    set({
      battle: {
        ...battle,
        scores: updatedScores,
      },
    });
  },

  fetchBattle: async (battleId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/battle/${battleId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch battle");
      }
      const battle = await response.json();
      // Restore votingCompletedRound and userVotes from localStorage when fetching battle
      const storedRound = getStoredVotingCompletedRound(battle?.id ?? null);
      const storedVotes = getStoredUserVotes(battle?.id ?? null);
      set({ battle, votingCompletedRound: storedRound, userVotes: storedVotes, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch battle",
        isLoading: false,
      });
    }
  },

  saveBattle: async () => {
    const { battle } = get();
    if (!battle) return;

    try {
      const response = await fetch(`/api/battle/${battle.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(battle),
      });

      if (!response.ok) {
        throw new Error("Failed to save battle");
      }
    } catch (error) {
      console.error("Error saving battle:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to save battle",
      });
    }
  },

  cancelBattle: async () => {
    const { battle } = get();
    if (!battle || battle.status !== "paused") return;

    try {
      const updatedBattle: Battle = {
        ...battle,
        status: "paused",
        updatedAt: Date.now(),
      };

      set({ battle: updatedBattle });

      const response = await fetch(`/api/battle/${battle.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedBattle),
      });

      if (!response.ok) {
        throw new Error("Failed to cancel battle");
      }
    } catch (error) {
      console.error("Error canceling battle:", error);
      set({
        error:
          error instanceof Error ? error.message : "Failed to cancel battle",
      });
    }
  },

  resumeBattle: async () => {
    const { battle } = get();
    if (!battle || battle.status !== "paused") return;

    try {
      const updatedBattle: Battle = {
        ...battle,
        status: "paused",
        updatedAt: Date.now(),
      };

      set({ battle: updatedBattle });

      const response = await fetch(`/api/battle/${battle.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedBattle),
      });

      if (!response.ok) {
        throw new Error("Failed to resume battle");
      }
    } catch (error) {
      console.error("Error resuming battle:", error);
      set({
        error:
          error instanceof Error ? error.message : "Failed to resume battle",
      });
    }
  },
}));
