"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Centralized hook to manage a delay before revealing scores for a round.
 *
 * Pass the round number that has scores available (or null when not available).
 * The hook will start a timer when a new round becomes available and reveal after the delay.
 */
export function useScoreRevealDelay(
  scoresAvailableRound: number | null,
  delaySeconds: number,
) {
  const [revealedRound, setRevealedRound] = useState<number | null>(null);
  const [isDelaying, setIsDelaying] = useState(false);
  const timerRef = useRef<number | null>(null);

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

    // Already revealed for this round
    if (revealedRound === scoresAvailableRound) {
      setIsDelaying(false);
      return;
    }

    // Immediate reveal if delay is zero
    if ((delaySeconds ?? 0) <= 0) {
      setIsDelaying(false);
      setRevealedRound(scoresAvailableRound);
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
        setRevealedRound(scoresAvailableRound);
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
  }, [scoresAvailableRound, delaySeconds, revealedRound]);

  return { revealedRound, isDelaying };
}
