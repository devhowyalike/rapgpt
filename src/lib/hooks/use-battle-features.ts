/**
 * Custom hook for battle feature flags (voting, commenting)
 */

import type { Battle } from "@/lib/shared";

export function useBattleFeatures(battle: Battle | null) {
  // Check both env flags (master switch) AND battle settings
  const isVotingGloballyEnabled =
    process.env.NEXT_PUBLIC_USER_BATTLE_VOTING !== "false";
  const isCommentsGloballyEnabled =
    process.env.NEXT_PUBLIC_USER_BATTLE_COMMENTING !== "false";

  const showVoting = isVotingGloballyEnabled && (battle?.votingEnabled ?? true);
  const showCommenting =
    isCommentsGloballyEnabled && (battle?.commentsEnabled ?? true);

  return {
    showVoting,
    showCommenting,
    isVotingGloballyEnabled,
    isCommentsGloballyEnabled,
  };
}

