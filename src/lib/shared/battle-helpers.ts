/**
 * Helper functions for battle UI logic
 */

import type { Battle } from "./battle-types";
import { ROUNDS_PER_BATTLE } from "./battle-types";

/**
 * Get the appropriate button text for advancing to the next round
 * @param battle The current battle state
 * @param finalRoundText Text to show when on the final round (default: "Reveal Winner")
 * @param normalText Text to show for non-final rounds (default: "Next Round")
 */
export function getAdvanceRoundButtonText(
  battle: Battle,
  finalRoundText: string = "Reveal Winner",
  normalText: string = "Next Round"
): string {
  return battle.currentRound === ROUNDS_PER_BATTLE
    ? finalRoundText
    : normalText;
}

/**
 * Get the display-safe current round (clamped to max rounds)
 * Useful for completed battles where currentRound may be ROUNDS_PER_BATTLE + 1
 * @param battleOrRound Battle object or round number
 */
export function getDisplayRound(battleOrRound: Battle | number): number {
  const currentRound =
    typeof battleOrRound === "number"
      ? battleOrRound
      : battleOrRound.currentRound;
  return Math.min(currentRound, ROUNDS_PER_BATTLE);
}

