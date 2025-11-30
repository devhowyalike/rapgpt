/**
 * Hook for round navigation logic
 * Used by battle-replay and completed-battle-view components
 */

import { useCallback, useState } from "react";

interface UseRoundNavigationOptions {
  /** Initial round number (defaults to 1) */
  initialRound?: number;
  /** Maximum round number (defaults to 3) */
  maxRounds?: number;
}

interface UseRoundNavigationResult {
  selectedRound: number;
  setSelectedRound: (round: number) => void;
  canGoPrev: boolean;
  canGoNext: boolean;
  handlePrevRound: () => void;
  handleNextRound: () => void;
}

/**
 * Manages round selection and navigation state
 */
export function useRoundNavigation({
  initialRound = 1,
  maxRounds = 3,
}: UseRoundNavigationOptions = {}): UseRoundNavigationResult {
  const [selectedRound, setSelectedRound] = useState(initialRound);

  const canGoPrev = selectedRound > 1;
  const canGoNext = selectedRound < maxRounds;

  const handlePrevRound = useCallback(() => {
    setSelectedRound((current) => (current > 1 ? current - 1 : current));
  }, []);

  const handleNextRound = useCallback(() => {
    setSelectedRound((current) =>
      current < maxRounds ? current + 1 : current
    );
  }, [maxRounds]);

  return {
    selectedRound,
    setSelectedRound,
    canGoPrev,
    canGoNext,
    handlePrevRound,
    handleNextRound,
  };
}

