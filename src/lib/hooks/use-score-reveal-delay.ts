"use client";

import { useEffect, useRef, useState } from "react";

// Helper to get revealed round from localStorage
const getStoredRevealedRound = (battleId: string | null): number | null => {
  if (typeof window === "undefined" || !battleId) return null;
  const key = `battle-score-revealed-${battleId}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    const parsed = parseInt(stored, 10);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
};

// Helper to persist revealed round to localStorage
const storeRevealedRound = (battleId: string | null, round: number | null) => {
  if (typeof window === "undefined" || !battleId) return;
  const key = `battle-score-revealed-${battleId}`;
  if (round === null) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, String(round));
  }
};

/**
 * Centralized hook to manage a delay before revealing scores for a round.
 *
 * Pass the round number that has scores available (or null when not available).
 * The hook will start a timer when a new round becomes available and reveal after the delay.
 */
export function useScoreRevealDelay(
  scoresAvailableRound: number | null,
  delaySeconds: number,
  battleId?: string | null,
) {
  // Initialize from localStorage if battleId is provided
  const [revealedRound, setRevealedRound] = useState<number | null>(() => {
    return getStoredRevealedRound(battleId ?? null);
  });
  const [isDelaying, setIsDelaying] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Update revealed round and persist to localStorage
  const updateRevealedRound = (round: number | null) => {
    setRevealedRound(round);
    storeRevealedRound(battleId ?? null, round);
  };

  useEffect(() => {
    // If no scores are available, reset state and clear any timers
    if (scoresAvailableRound == null) {
      setIsDelaying(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Already revealed for this round (check both state and localStorage)
    const storedRound = getStoredRevealedRound(battleId ?? null);
    if (revealedRound === scoresAvailableRound || storedRound === scoresAvailableRound) {
      setIsDelaying(false);
      // Sync state with localStorage if needed
      if (revealedRound !== storedRound && storedRound !== null) {
        setRevealedRound(storedRound);
      }
      return;
    }

    // Immediate reveal if delay is zero
    if ((delaySeconds ?? 0) <= 0) {
      setIsDelaying(false);
      updateRevealedRound(scoresAvailableRound);
      return;
    }

    // Start delay for this round
    setIsDelaying(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    timerRef.current = window.setTimeout(
      () => {
        updateRevealedRound(scoresAvailableRound);
        setIsDelaying(false);
        timerRef.current = null;
      },
      Math.max(0, (delaySeconds ?? 0) * 1000),
    );

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [scoresAvailableRound, delaySeconds, revealedRound, battleId]);

  return { revealedRound, isDelaying };
}
