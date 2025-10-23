/**
 * Battle sidebar with comments and voting
 */

"use client";

import { useState } from "react";
import type { Battle, Comment } from "@/lib/shared";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, ThumbsUp } from "lucide-react";

interface BattleSidebarProps {
  battle: Battle;
  onVote: (round: number, personaId: string) => void;
  onComment: (username: string, content: string) => void;
}

export function BattleSidebar({
  battle,
  onVote,
  onComment,
}: BattleSidebarProps) {
  const [activeTab, setActiveTab] = useState<"comments" | "voting">("comments");
  const [username, setUsername] = useState("");
  const [usernameConfirmed, setUsernameConfirmed] = useState(false);
  const [comment, setComment] = useState("");
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !comment.trim()) return;

    onComment(username.trim(), comment.trim());
    setComment("");
    setUsernameConfirmed(true);
  };

  const handleVote = (round: number, personaId: string) => {
    const voteKey = `${round}-${personaId}`;
    if (userVotes.has(voteKey)) return;

    onVote(round, personaId);
    setUserVotes((prev) => new Set(prev).add(voteKey));
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-800">
      {/* Tabs */}
      <div className="flex border-b border-gray-800">
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
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {comment.username.charAt(0).toUpperCase()}
                      </div>
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
                        <p className="text-gray-300 text-sm mt-1 break-words">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Comment Input */}
            <form
              onSubmit={handleSubmitComment}
              className="p-4 border-t border-gray-800 bg-gray-900"
            >
              {!usernameConfirmed && (
                <input
                  type="text"
                  placeholder="Your name..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 mb-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={50}
                />
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Drop a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={!username.trim()}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  maxLength={500}
                />
                <button
                  type="submit"
                  disabled={!username.trim() || !comment.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === "voting" && (
          <div className="p-4 space-y-6">
            {battle.scores.map((roundScore) => {
              const leftScore =
                roundScore.personaScores[battle.personas.left.id];
              const rightScore =
                roundScore.personaScores[battle.personas.right.id];

              return (
                <motion.div
                  key={roundScore.round}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-800 rounded-lg p-4"
                >
                  <h3 className="font-[family-name:var(--font-bebas-neue)] text-xl text-yellow-400 mb-4">
                    ROUND {roundScore.round}
                  </h3>

                  <div className="space-y-3">
                    {/* Left Persona Vote */}
                    <button
                      onClick={() =>
                        handleVote(roundScore.round, battle.personas.left.id)
                      }
                      disabled={userVotes.has(
                        `${roundScore.round}-${battle.personas.left.id}`
                      )}
                      className={`
                        w-full p-3 rounded-lg border-2 transition-all
                        ${
                          userVotes.has(
                            `${roundScore.round}-${battle.personas.left.id}`
                          )
                            ? "bg-gray-700 border-gray-600 cursor-not-allowed"
                            : "hover:bg-gray-700 border-gray-600 hover:border-blue-500"
                        }
                        ${
                          roundScore.winner === battle.personas.left.id
                            ? "ring-2 ring-yellow-400"
                            : ""
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="font-medium"
                          style={{ color: battle.personas.left.accentColor }}
                        >
                          {battle.personas.left.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">
                            {leftScore?.userVotes || 0} votes
                          </span>
                          {roundScore.winner === battle.personas.left.id && (
                            <span>🏆</span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        Score: {leftScore?.totalScore.toFixed(1)}
                      </div>
                    </button>

                    {/* Right Persona Vote */}
                    <button
                      onClick={() =>
                        handleVote(roundScore.round, battle.personas.right.id)
                      }
                      disabled={userVotes.has(
                        `${roundScore.round}-${battle.personas.right.id}`
                      )}
                      className={`
                        w-full p-3 rounded-lg border-2 transition-all
                        ${
                          userVotes.has(
                            `${roundScore.round}-${battle.personas.right.id}`
                          )
                            ? "bg-gray-700 border-gray-600 cursor-not-allowed"
                            : "hover:bg-gray-700 border-gray-600 hover:border-purple-500"
                        }
                        ${
                          roundScore.winner === battle.personas.right.id
                            ? "ring-2 ring-yellow-400"
                            : ""
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="font-medium"
                          style={{ color: battle.personas.right.accentColor }}
                        >
                          {battle.personas.right.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">
                            {rightScore?.userVotes || 0} votes
                          </span>
                          {roundScore.winner === battle.personas.right.id && (
                            <span>🏆</span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        Score: {rightScore?.totalScore.toFixed(1)}
                      </div>
                    </button>
                  </div>
                </motion.div>
              );
            })}

            {battle.scores.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No rounds completed yet. Check back after the first round!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
