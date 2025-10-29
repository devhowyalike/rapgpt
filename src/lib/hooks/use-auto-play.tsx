/**
 * Hook for auto-play battle mode
 */

"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Battle } from "@/lib/shared";
import { getNextPerformer, isRoundComplete } from "@/lib/battle-engine";

interface UseAutoPlayOptions {
  battle: Battle | null;
  enabled: boolean;
  onGenerateVerse: () => Promise<void>;
  onAdvanceRound: () => Promise<void>;
  isGenerating: boolean;
}

export function useAutoPlay({
  battle,
  enabled,
  onGenerateVerse,
  onAdvanceRound,
  isGenerating,
}: UseAutoPlayOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActionRef = useRef<string>("");

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const scheduleNextAction = useCallback(() => {
    if (
      !battle ||
      !enabled ||
      !battle.isLive ||
      battle.adminControlMode !== "auto"
    ) {
      return;
    }

    clearPendingTimeout();

    const config = battle.autoPlayConfig || {
      verseDelay: 30,
      autoAdvance: true,
      readingDuration: 20,
      votingDuration: 10,
    };

    const nextPerformer = getNextPerformer(battle);
    const roundComplete = isRoundComplete(battle, battle.currentRound);

    // If battle is complete, stop
    if (battle.status === "completed") {
      console.log("[Auto-Play] Battle completed, stopping");
      return;
    }

    // If currently generating, wait
    if (isGenerating) {
      console.log("[Auto-Play] Currently generating, will retry");
      timeoutRef.current = setTimeout(scheduleNextAction, 2000);
      return;
    }

    // Determine next action
    if (nextPerformer && !isGenerating) {
      // Generate next verse
      const delay = config.verseDelay || 30;
      const actionKey = `generate-${battle.currentRound}-${nextPerformer}`;

      if (lastActionRef.current === actionKey) {
        // Already triggered this action, wait
        return;
      }

      console.log(`[Auto-Play] Scheduling verse generation in ${delay}s`);
      timeoutRef.current = setTimeout(async () => {
        console.log(`[Auto-Play] Generating verse for ${nextPerformer}`);
        lastActionRef.current = actionKey;
        await onGenerateVerse();
        // After generation, schedule next action
        setTimeout(scheduleNextAction, 1000);
      }, delay * 1000);
    } else if (roundComplete && config.autoAdvance) {
      // Advance to next round after voting phase
      const totalDelay =
        (config.readingDuration || 20) + (config.votingDuration || 10);
      const actionKey = `advance-${battle.currentRound}`;

      if (lastActionRef.current === actionKey) {
        // Already triggered this action, wait
        return;
      }

      console.log(`[Auto-Play] Scheduling round advance in ${totalDelay}s`);
      timeoutRef.current = setTimeout(async () => {
        console.log("[Auto-Play] Advancing round");
        lastActionRef.current = actionKey;
        await onAdvanceRound();
        // After advancing, schedule next action
        setTimeout(scheduleNextAction, 1000);
      }, totalDelay * 1000);
    }
  }, [
    battle,
    enabled,
    isGenerating,
    onGenerateVerse,
    onAdvanceRound,
    clearPendingTimeout,
  ]);

  // Reset last action when round changes
  useEffect(() => {
    if (battle) {
      lastActionRef.current = "";
    }
  }, [battle?.currentRound]);

  // Schedule actions when conditions change
  useEffect(() => {
    if (enabled && battle?.isLive && battle?.adminControlMode === "auto") {
      console.log("[Auto-Play] Enabled, scheduling next action");
      scheduleNextAction();
    } else {
      console.log("[Auto-Play] Disabled or manual mode, clearing timeouts");
      clearPendingTimeout();
      lastActionRef.current = "";
    }

    return () => {
      clearPendingTimeout();
    };
  }, [
    enabled,
    battle?.isLive,
    battle?.adminControlMode,
    battle?.currentRound,
    battle?.currentTurn,
    battle?.verses.length,
    isGenerating,
    scheduleNextAction,
    clearPendingTimeout,
  ]);

  return {
    scheduleNextAction,
    clearPendingTimeout,
  };
}
