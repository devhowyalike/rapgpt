/**
 * Battle sidebar with comments and voting
 */

"use client";

import { useState, useEffect } from "react";
import type { Battle, Comment } from "@/lib/shared";
import { ROUNDS_PER_BATTLE } from "@/lib/shared";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, ThumbsUp } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

interface BattleSidebarProps {
  battle: Battle;
  onVote: (round: number, personaId: string) => void;
  onComment: (content: string) => void;
  isArchived?: boolean;
  isVotingPhase?: boolean;
  votingTimeRemaining?: number | null;
  votingCompletedRound?: number | null;
  defaultTab?: "comments" | "voting";
}

export function BattleSidebar({
  battle,
  onVote,
  onComment,
  isArchived = false,
  isVotingPhase = false,
  votingTimeRemaining = null,
  votingCompletedRound = null,
  defaultTab,
}: BattleSidebarProps) {
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState<"comments" | "voting">(
    defaultTab || "comments"
  );

  const [comment, setComment] = useState("");
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

  // Automatically switch to voting tab when voting begins
  // This takes priority over defaultTab when voting is active
  useEffect(() => {
    if (isVotingPhase) {
      setActiveTab("voting");
    } else if (defaultTab) {
      // Only respect defaultTab when not in voting phase
      setActiveTab(defaultTab);
    }
  }, [isVotingPhase, defaultTab]);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !user) return;

    onComment(comment.trim());
    setComment("");
  };

  const handleVote = (round: number, personaId: string) => {
    // Check if user has already voted in this round (for either persona)
    const hasVotedInRound = Array.from(userVotes).some((voteKey) =>
      voteKey.startsWith(`${round}-`)
    );
    if (hasVotedInRound) return;

    const voteKey = `${round}-${personaId}`;

    // Update local state FIRST for immediate UI feedback
    setUserVotes((prev) => {
      const newVotes = new Set(prev).add(voteKey);
      // Persist to localStorage
      if (typeof window !== "undefined") {
        const storageKey = `battle-votes-${battle.id}`;
        localStorage.setItem(storageKey, JSON.stringify(Array.from(newVotes)));
      }
      return newVotes;
    });

    // Then make the API call
    onVote(round, personaId);
  };

  // Helper function to check if user has already voted in a round
  const hasVotedInRound = (round: number): boolean => {
    return Array.from(userVotes).some((voteKey) =>
      voteKey.startsWith(`${round}-`)
    );
  };

  // Helper function to check if voting is allowed for a specific round
  const canVoteOnRound = (round: number): boolean => {
    // Archived battles cannot be voted on
    if (isArchived) return false;

    // Can't vote if already voted in this round
    if (hasVotedInRound(round)) return false;

    // Can only vote on the current round during its voting phase
    if (isVotingPhase && battle.currentRound === round) return true;

    // Can vote on completed rounds that haven't been advanced yet
    // (i.e., after voting phase ends but before advancing to next round)
    if (votingCompletedRound === round && battle.currentRound === round)
      return true;

    return false;
  };

  return (
    <div
      className={`flex flex-col bg-gray-900 md:border-l border-gray-800 ${
        defaultTab ? "" : "h-full"
      }`}
    >
      {/* Tabs - Hidden on mobile when in drawer mode */}
      <div
        className={`flex border-b border-gray-800 ${
          defaultTab ? "hidden" : ""
        }`}
      >
        <button
          onClick={() => setActiveTab("comments")}
          className={`
            flex-1 px-4 py-3 font-medium transition-colors
            ${
              activeTab === "comments"
                ? "bg-gray-800 text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white hover:bg-gray-800/50"
            }
          `}
        >
          <MessageSquare className="inline-block w-4 h-4 mr-2" />
          Comments
        </button>
        <button
          onClick={() => setActiveTab("voting")}
          className={`
            flex-1 px-4 py-3 font-medium transition-colors
            ${
              activeTab === "voting"
                ? "bg-gray-800 text-white border-b-2 border-purple-500"
                : "text-gray-400 hover:text-white hover:bg-gray-800/50"
            }
          `}
        >
          <ThumbsUp className="inline-block w-4 h-4 mr-2" />
          Vote
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "comments" && (
          <div className="flex flex-col h-full">
            {/* Archived Message - Always visible at top */}
            {isArchived && (
              <div className="bg-gray-800 rounded-lg p-3 m-4 mb-0">
                <p className="text-center text-white text-sm">
                  {battle.status === "incomplete"
                    ? "Comments are disabled for paused battles"
                    : "Comments are disabled for archived battles"}
                </p>
              </div>
            )}

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <AnimatePresence initial={false}>
                {battle.comments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-gray-800 rounded-lg p-3"
                  >
                    <div className="flex items-start gap-2">
                      {comment.imageUrl ? (
                        <img
                          src={comment.imageUrl}
                          alt={comment.username}
                          className="w-8 h-8 rounded-full shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {comment.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="font-medium text-white text-sm">
                            {comment.username}
                          </span>
                          {comment.round && (
                            <span className="text-xs text-gray-500">
                              Round {comment.round}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-300 text-sm mt-1 wrap-break-word">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Comment Input */}
            {!isArchived && (
              <div className="p-4 border-t border-gray-800 bg-gray-900">
                {isLoaded && !user ? (
                  <div className="text-center py-3">
                    <p className="text-gray-400 text-sm mb-3">
                      Sign in to leave a comment
                    </p>
                    <Link
                      href="/sign-in"
                      className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors text-sm font-medium"
                    >
                      Sign In
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitComment}>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Drop a comment..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={500}
                      />
                      <button
                        type="submit"
                        disabled={!comment.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "voting" && (
          <div className="p-4 space-y-6">
            {isArchived && battle.scores.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-3 mb-4">
                <p className="text-center text-white text-sm">
                  {battle.status === "incomplete"
                    ? "Voting is disabled for paused battles"
                    : "Voting is disabled for archived battles"}
                </p>
              </div>
            )}

            {/* Message when voting hasn't started yet */}
            {!isArchived && !isVotingPhase && battle.scores.length > 0 && (
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

                const leftScore =
                  roundScore.personaScores[battle.personas.left.id];
                const rightScore =
                  roundScore.personaScores[battle.personas.right.id];

                // Create array of personas with their scores and sort by votes (highest first)
                const sortedPersonas = [
                  {
                    persona: battle.personas.left,
                    score: leftScore,
                    hoverBorderColor: "hover:border-blue-500",
                  },
                  {
                    persona: battle.personas.right,
                    score: rightScore,
                    hoverBorderColor: "hover:border-purple-500",
                  },
                ].sort(
                  (a, b) =>
                    (b.score?.userVotes || 0) - (a.score?.userVotes || 0)
                );

                return (
                  <motion.div
                    key={roundScore.round}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800 rounded-lg p-4"
                  >
                    <h3 className="font-(family-name:--font-bebas-neue) text-xl text-yellow-400 mb-4">
                      ROUND {roundScore.round}
                    </h3>

                    <div className="space-y-3">
                      {sortedPersonas.map(
                        ({ persona, score, hoverBorderColor }) => (
                          <button
                            key={persona.id}
                            onClick={() =>
                              handleVote(roundScore.round, persona.id)
                            }
                            disabled={
                              !canVoteOnRound(roundScore.round) ||
                              userVotes.has(`${roundScore.round}-${persona.id}`)
                            }
                            className={`
                          w-full p-3 rounded-lg border-2 transition-all
                          ${
                            userVotes.has(`${roundScore.round}-${persona.id}`)
                              ? "bg-linear-to-r from-yellow-500/20 to-amber-500/20 border-yellow-400 shadow-lg shadow-yellow-400/20 cursor-not-allowed"
                              : !canVoteOnRound(roundScore.round)
                              ? "bg-gray-700 border-gray-600 cursor-not-allowed"
                              : `hover:scale-[1.02] hover:shadow-lg border-gray-600 ${hoverBorderColor}`
                          }
                        `}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className="font-medium"
                                style={{ color: persona.accentColor }}
                              >
                                {persona.name}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-400">
                                  {score?.userVotes || 0} votes
                                </span>
                                {roundScore.winner === persona.id && (
                                  <span>🏆</span>
                                )}
                              </div>
                            </div>
                            <div className="text-sm text-gray-400 mt-1">
                              Score: {score?.totalScore.toFixed(1)}
                            </div>
                          </button>
                        )
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
        )}
      </div>
    </div>
  );
}
