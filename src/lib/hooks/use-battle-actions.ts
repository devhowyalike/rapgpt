/**
 * Custom hooks for battle actions (voting, commenting)
 */

import { useCallback } from "react";
import type { Battle } from "@/lib/shared";

interface UseBattleVoteOptions {
  battleId: string;
  onSuccess?: (updatedBattle: Battle) => void;
}

export function useBattleVote({ battleId, onSuccess }: UseBattleVoteOptions) {
  const handleVote = useCallback(
    async (round: number, personaId: string): Promise<boolean> => {
      try {
        const response = await fetch(`/api/battle/${battleId}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ round, personaId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Vote failed:", errorData.error);
          return false;
        }

        const { battle: updatedBattle } = await response.json();
        onSuccess?.(updatedBattle);
        return true;
      } catch (error) {
        console.error("Error voting:", error);
        return false;
      }
    },
    [battleId, onSuccess],
  );

  return handleVote;
}

interface UseBattleCommentOptions {
  battle: Battle | null;
  onSuccess?: (comment: any) => void;
}

export function useBattleComment({
  battle,
  onSuccess,
}: UseBattleCommentOptions) {
  const handleComment = useCallback(
    async (content: string) => {
      if (!battle) return;

      try {
        const response = await fetch(`/api/battle/${battle.id}/comment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            round: battle.currentRound,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to submit comment");
        }

        const { comment } = await response.json();
        onSuccess?.(comment);
      } catch (error) {
        console.error("Error commenting:", error);
        throw error;
      }
    },
    [battle, onSuccess],
  );

  return handleComment;
}
