/**
 * Custom hook for fetching round-specific battle data
 * Centralizes round verses and score retrieval logic
 */

import { useMemo } from "react";
import type { Battle, Verse, RoundScore } from "@/lib/shared";
import { getRoundVerses } from "@/lib/battle-engine";

interface RoundData {
  verses: {
    player1: Verse | null;
    player2: Verse | null;
  };
  score: RoundScore | undefined;
  isComplete: boolean;
  hasVerses: boolean;
  hasBothVerses: boolean;
}

/**
 * Hook to fetch and compute round-specific data
 * @param battle - The battle object
 * @param round - The round number (1-3)
 * @returns Round data including verses, scores, and completion status
 */
export function useRoundData(battle: Battle, round: number): RoundData {
  return useMemo(() => {
    const verses = getRoundVerses(battle, round);
    const score = battle.scores.find((s) => s.round === round);
    const hasVerses = !!(verses.player1 || verses.player2);
    const hasBothVerses = !!(verses.player1 && verses.player2);
    const isComplete = hasBothVerses && !!score;

    return {
      verses: {
        player1: verses.player1 ?? null,
        player2: verses.player2 ?? null,
      },
      score,
      isComplete,
      hasVerses,
      hasBothVerses,
    };
  }, [battle, round]);
}


