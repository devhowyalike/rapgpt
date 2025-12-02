/**
 * Voting content - used in both desktop sidebar and mobile drawer
 */

"use client";

import { SignInPrompt } from "@/components/auth/sign-in-prompt";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { Battle } from "@/lib/shared";
import { ROUNDS_PER_BATTLE } from "@/lib/shared";

interface VotingContentProps {
  battle: Battle;
  onVote: (round: number, personaId: string) => Promise<boolean>;
  isArchived?: boolean;
  isVotingPhase?: boolean;
  votingTimeRemaining?: number | null;
  votingCompletedRound?: number | null;
}

export function VotingContent({
  battle,
  onVote,
  isArchived = false,
  isVotingPhase = false,
  votingTimeRemaining = null,
  votingCompletedRound = null,
}: VotingContentProps) {
  const { user, isLoaded } = useUser();
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [optimisticVote, setOptimisticVote] = useState<string | null>(null);
  const [userVotes, setUserVotes] = useState<Set<string>>(() => {
    // Load votes from localStorage on mount
    if (typeof window !== "undefined") {
      const storageKey = `battle-votes-${battle.id}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          return new Set(JSON.parse(stored));
        } catch {
          return new Set();
        }
      }
    }
    return new Set();
  });

  const handleVote = async (round: number, personaId: string) => {
    if (isSubmittingVote) return; // Prevent double-clicks

    const voteKey = `${battle.id}-${round}-${personaId}`;
    const currentVoteInRound = Array.from(userVotes).find((key) =>
      key.startsWith(`${battle.id}-${round}-`)
    );

    // Optimistically update UI immediately
    setIsSubmittingVote(true);
    setOptimisticVote(voteKey);

    // Determine if this is an undo (clicking same persona again)
    const isUndo = currentVoteInRound === voteKey;

    // Optimistically update local state
    setUserVotes((prev) => {
      const newVotes = new Set(prev);
      if (isUndo) {
        // Remove the vote
        newVotes.delete(voteKey);
      } else {
        // Remove any existing vote in this round and add new one
        if (currentVoteInRound) {
          newVotes.delete(currentVoteInRound);
        }
        newVotes.add(voteKey);
      }

      // Persist to localStorage
      if (typeof window !== "undefined") {
        const storageKey = `battle-votes-${battle.id}`;
        localStorage.setItem(storageKey, JSON.stringify(Array.from(newVotes)));
      }
      return newVotes;
    });

    // Submit to server
    try {
      const success = await onVote(round, personaId);

      if (!success) {
        // Revert optimistic update on failure
        setUserVotes((prev) => {
          const newVotes = new Set(prev);
          if (isUndo) {
            // Restore the vote
            newVotes.add(voteKey);
          } else {
            // Restore previous state
            newVotes.delete(voteKey);
            if (currentVoteInRound) {
              newVotes.add(currentVoteInRound);
            }
          }

          if (typeof window !== "undefined") {
            const storageKey = `battle-votes-${battle.id}`;
            localStorage.setItem(
              storageKey,
              JSON.stringify(Array.from(newVotes))
            );
          }
          return newVotes;
        });
      }
    } finally {
      setIsSubmittingVote(false);
      setOptimisticVote(null);
    }
  };

  // Helper function to check if voting is allowed for a specific round
  const canVoteOnRound = (round: number): boolean => {
    // User must be signed in to vote
    if (!isLoaded || !user) return false;

    // Only live battles allow voting
    if (!battle.isLive) return false;

    // Archived battles cannot be voted on
    if (isArchived) return false;

    // Can only vote on the current round during its voting phase
    if (isVotingPhase && battle.currentRound === round) return true;

    return false;
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-6 touch-scroll-container">
        {isArchived && battle.scores.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-3 mb-4">
            <p className="text-center text-white text-sm">
              {battle.status === "paused"
                ? "Voting is disabled for paused battles"
                : "Voting is disabled for archived battles"}
            </p>
          </div>
        )}

        {/* Message when voting hasn't started yet */}
        {!isArchived &&
          battle.isLive &&
          !isVotingPhase &&
          battle.scores.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-3 mb-4">
              <p className="text-center text-white text-sm">
                {battle.currentRound === ROUNDS_PER_BATTLE
                  ? "Voting has ended"
                  : "Voting will begin at the end of the round"}
              </p>
            </div>
          )}

        {/* Voting Timer in Sidebar */}
        {isVotingPhase && votingTimeRemaining !== null && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-linear-to-r from-purple-600 to-blue-600 rounded-lg p-4 mb-4"
          >
            <div className="text-center">
              <div className="text-white text-sm font-medium mb-1">
                ⏱️ VOTING ACTIVE
              </div>
              <div className="text-3xl font-bold text-white mb-1 font-bebas-neue">
                {votingTimeRemaining}s
              </div>
              <div className="text-white/80 text-xs">Vote now!</div>
              <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(votingTimeRemaining / 10) * 100}%` }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {battle.scores
          .slice()
          .reverse()
          .map((roundScore) => {
            // During review (reading) phase, don't show the current round's voting pair
            const isCurrentRound = roundScore.round === battle.currentRound;
            const hideCurrentRoundDuringReview =
              !isArchived &&
              isCurrentRound &&
              !isVotingPhase &&
              votingCompletedRound !== roundScore.round;

            if (hideCurrentRoundDuringReview) {
              return null;
            }

            // Calculate optimistic vote counts by checking both server state and local state
            const getOptimisticVoteCount = (
              position: "player1" | "player2"
            ): number => {
              const serverVotes = roundScore.positionScores[position].userVotes;
              const personaId = roundScore.positionScores[position].personaId;
              // Count local votes for this persona in this round that aren't yet reflected in server state
              const localVoteKey = `${battle.id}-${roundScore.round}-${personaId}`;
              const hasLocalVote = userVotes.has(localVoteKey);

              // If we have a local vote that's being optimistically shown, ensure it's counted
              // Note: This assumes server votes don't yet include our local vote
              return hasLocalVote ? Math.max(serverVotes, 1) : serverVotes;
            };

            // Create array of personas with their scores and sort by votes (highest first)
            const sortedPersonas = [
              {
                persona: battle.personas.player1,
                position: "player1" as const,
                score: roundScore.positionScores.player1,
                optimisticVotes: getOptimisticVoteCount("player1"),
                hoverBorderColor: "hover:border-blue-500",
              },
              {
                persona: battle.personas.player2,
                position: "player2" as const,
                score: roundScore.positionScores.player2,
                optimisticVotes: getOptimisticVoteCount("player2"),
                hoverBorderColor: "hover:border-purple-500",
              },
            ].sort((a, b) => b.optimisticVotes - a.optimisticVotes);

            return (
              <motion.div
                key={roundScore.round}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900/50 border border-gray-800 rounded-lg p-4"
              >
                <h3 className="font-(family-name:--font-bebas-neue) text-xl text-yellow-400 mb-4">
                  ROUND {roundScore.round}
                </h3>

                <div className="space-y-3">
                  {sortedPersonas.map(
                    ({
                      persona,
                      position,
                      score,
                      optimisticVotes,
                      hoverBorderColor,
                    }) => {
                      const voteKey = `${battle.id}-${roundScore.round}-${persona.id}`;
                      const isVoted = userVotes.has(voteKey);
                      const canVote = canVoteOnRound(roundScore.round);
                      const playerColor =
                        position === "player1"
                          ? "rgb(var(--player1-color))"
                          : "rgb(var(--player2-color))";

                      return (
                        <motion.div
                          key={persona.id}
                          layout
                          transition={{
                            layout: {
                              type: "spring",
                              stiffness: 350,
                              damping: 25,
                              delay: 0.1,
                            },
                          }}
                        >
                          <button
                            onClick={() =>
                              handleVote(roundScore.round, persona.id)
                            }
                            disabled={!canVote || isSubmittingVote}
                            className={`
                            w-full p-3 rounded-lg border-2 transition-all
                            ${
                              isVoted
                                ? "bg-linear-to-r from-yellow-500/20 to-amber-500/20 border-yellow-400 shadow-lg shadow-yellow-400/20 hover:scale-[1.02] hover:border-yellow-500"
                                : !canVote
                                ? "bg-gray-800 border-gray-700 cursor-not-allowed"
                                : `bg-black/20 hover:bg-black/40 hover:scale-[1.02] hover:shadow-lg border-gray-700 ${hoverBorderColor}`
                            }
                            ${isSubmittingVote ? "opacity-50" : ""}
                          `}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span
                                  className="font-medium"
                                  style={{ color: playerColor }}
                                >
                                  {persona.name}
                                </span>
                                {isVoted && (
                                  <span className="text-yellow-400 text-xs">
                                    ✓ Your vote
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-400">
                                  {optimisticVotes}{" "}
                                  {optimisticVotes === 1 ? "vote" : "votes"}
                                </span>
                                {roundScore.winner === position && (
                                  <span>🏆</span>
                                )}
                              </div>
                            </div>
                            <div className="text-sm text-gray-400 mt-1">
                              Score: {score?.totalScore.toFixed(1)}
                              {isVoted && canVote && (
                                <span className="ml-2 text-xs text-yellow-400">
                                  (click to undo)
                                </span>
                              )}
                            </div>
                          </button>
                        </motion.div>
                      );
                    }
                  )}
                </div>
              </motion.div>
            );
          })}

        {battle.scores.length === 0 && (
          <div className="text-center text-white py-8">
            No rounds completed yet.
            <br />
            Check back after the first round!
          </div>
        )}
      </div>

      {!isArchived && isLoaded && !user && (
        <div className="shrink-0 p-4 pb-6 md:pb-4 border-t border-gray-800 bg-gray-900">
          <SignInPrompt message="Sign in to vote" />
        </div>
      )}
    </div>
  );
}
