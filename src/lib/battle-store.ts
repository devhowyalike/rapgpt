/**
 * Zustand store for battle state management
 */

import { create } from 'zustand';
import type { Battle, Comment, PersonaPosition } from '@/lib/shared';
import { addVerseToBattle, advanceToNextRound } from './battle-engine';
import { getPersonaPosition } from './battle-position-utils';

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
  
  setBattle: (battle: Battle) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setStreamingVerse: (verse: string | null, personaId: string | null, position?: PersonaPosition | null) => void;
  setVotingTimeRemaining: (time: number | null) => void;
  setIsVotingPhase: (isVoting: boolean) => void;
  setVotingCompletedRound: (round: number | null) => void;
  completeVotingPhase: (round: number) => void;
  setReadingTimeRemaining: (time: number | null) => void;
  setIsReadingPhase: (isReading: boolean) => void;
  
  addVerse: (personaId: string, verse: string) => void;
  advanceRound: () => void;
  addComment: (comment: Comment) => void;
  updateVotes: (round: number, personaId: string, votes: number) => void;
  cancelBattle: () => Promise<void>;
  resumeBattle: () => Promise<void>;
  
  fetchBattle: (battleId: string) => Promise<void>;
  saveBattle: () => Promise<void>;
}

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

  setBattle: (battle) => set({ battle }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setStreamingVerse: (verse, personaId, position = null) => 
    set({ streamingVerse: verse, streamingPersonaId: personaId, streamingPosition: position }),
  setVotingTimeRemaining: (time) => set({ votingTimeRemaining: time }),
  setIsVotingPhase: (isVoting) => set({ isVotingPhase: isVoting }),
  setVotingCompletedRound: (round) => set({ votingCompletedRound: round }),
  completeVotingPhase: (round) =>
    set({
      isVotingPhase: false,
      votingTimeRemaining: null,
      votingCompletedRound: round,
    }),
  setReadingTimeRemaining: (time) => set({ readingTimeRemaining: time }),
  setIsReadingPhase: (isReading) => set({ isReadingPhase: isReading }),

  addVerse: (personaId, verse) => {
    const { battle } = get();
    if (!battle) return;

    try {
      const updatedBattle = addVerseToBattle(battle, personaId, verse);
      set({ battle: updatedBattle });
    } catch (error) {
      console.error('Error adding verse:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to add verse' });
    }
  },

  advanceRound: () => {
    const { battle } = get();
    if (!battle) return;

    try {
      const updatedBattle = advanceToNextRound(battle);
      set({ battle: updatedBattle });
    } catch (error) {
      console.error('Error advancing round:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to advance round' });
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

    const scoreIndex = battle.scores.findIndex(s => s.round === round);
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
        throw new Error('Failed to fetch battle');
      }
      const battle = await response.json();
      set({ battle, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch battle',
        isLoading: false,
      });
    }
  },

  saveBattle: async () => {
    const { battle } = get();
    if (!battle) return;

    try {
      const response = await fetch(`/api/battle/${battle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(battle),
      });

      if (!response.ok) {
        throw new Error('Failed to save battle');
      }
    } catch (error) {
      console.error('Error saving battle:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to save battle' });
    }
  },

  cancelBattle: async () => {
    const { battle } = get();
    if (!battle || battle.status !== 'paused') return;

    try {
      const updatedBattle: Battle = {
        ...battle,
        status: 'paused',
        updatedAt: Date.now(),
      };

      set({ battle: updatedBattle });

      const response = await fetch(`/api/battle/${battle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBattle),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel battle');
      }
    } catch (error) {
      console.error('Error canceling battle:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to cancel battle' });
    }
  },

  resumeBattle: async () => {
    const { battle } = get();
    if (!battle || battle.status !== 'paused') return;

    try {
      const updatedBattle: Battle = {
        ...battle,
        status: 'paused',
        updatedAt: Date.now(),
      };

      set({ battle: updatedBattle });

      const response = await fetch(`/api/battle/${battle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBattle),
      });

      if (!response.ok) {
        throw new Error('Failed to resume battle');
      }
    } catch (error) {
      console.error('Error resuming battle:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to resume battle' });
    }
  },
}));

