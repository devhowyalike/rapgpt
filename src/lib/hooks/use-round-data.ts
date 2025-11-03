/**
 * Custom hook for fetching round-specific battle data
 * Centralizes round verses and score retrieval logic
 */

import { useMemo } from "react";
import type { Battle, Verse, RoundScore } from "@/lib/shared";
import { getRoundVerses } from "@/lib/battle-engine";

interface RoundData {
  verses: {
    left: Verse | null;
    right: Verse | null;
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
    const hasVerses = !!(verses.left || verses.right);
    const hasBothVerses = !!(verses.left && verses.right);
    const isComplete = hasBothVerses && !!score;

    return {
      verses,
      score,
      isComplete,
      hasVerses,
      hasBothVerses,
    };
  }, [battle, round]);
}


