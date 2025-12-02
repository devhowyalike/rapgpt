/**
 * Battle sidebar with comments and voting
 */

"use client";

import { MessageSquare, ThumbsUp } from "lucide-react";
import { useEffect, useState } from "react";
import { CommentsContent } from "@/components/battle/comments-content";
import { VotingContent } from "@/components/battle/voting-content";
import type { Battle } from "@/lib/shared";

interface BattleSidebarProps {
  battle: Battle;
  onVote: (round: number, personaId: string) => Promise<boolean>;
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
  // Determine if voting and commenting should be shown
  // Check both env flags (master switch) AND battle settings
  const isVotingGloballyEnabled =
    process.env.NEXT_PUBLIC_USER_BATTLE_VOTING !== "false";
  const isCommentsGloballyEnabled =
    process.env.NEXT_PUBLIC_USER_BATTLE_COMMENTING !== "false";
  const showVoting =
    isVotingGloballyEnabled &&
    (battle.votingEnabled ?? true) &&
    (battle.isLive || isArchived);
  const showCommenting =
    isCommentsGloballyEnabled && (battle.commentsEnabled ?? true);

  // Default to whichever is available if neither is specified
  const getInitialTab = (): "comments" | "voting" => {
    if (defaultTab) return defaultTab;
    if (showCommenting) return "comments";
    if (showVoting) return "voting";
    return "comments"; // fallback
  };

  const [activeTab, setActiveTab] = useState<"comments" | "voting">(
    getInitialTab()
  );

  // Automatically switch to voting tab when voting begins
  // This takes priority over defaultTab when voting is active
  useEffect(() => {
    if (isVotingPhase && showVoting) {
      setActiveTab("voting");
    } else if (defaultTab) {
      // Only respect defaultTab when not in voting phase
      setActiveTab(defaultTab);
    }
  }, [isVotingPhase, defaultTab, showVoting]);

  // If neither feature is enabled, don't render anything
  if (!showCommenting && !showVoting) {
    return null;
  }

  return (
    <div
      className={`flex flex-col bg-gray-900 md:border-l border-gray-800 ${
        defaultTab ? "" : "h-full"
      }`}
    >
      {/* Tabs or Header */}
      {showCommenting && showVoting ? (
        // Show tabs when both features are enabled (hidden in drawer mode)
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
      ) : (
        // Show simple header when only one feature is enabled (hidden in drawer mode)
        !defaultTab && (
          <div className="shrink-0 flex items-center justify-center px-4 py-3 border-b border-gray-800 bg-gray-800 mt-3">
            <div className="text-white font-medium flex items-center gap-2">
              {showCommenting ? (
                <>
                  <MessageSquare className="w-4 h-4" />
                  Comments
                </>
              ) : (
                <>
                  <ThumbsUp className="w-4 h-4" />
                  Vote
                </>
              )}
            </div>
          </div>
        )
      )}

      {/* Content */}
      <div className="flex-1 min-h-0 flex flex-col">
        {showCommenting && activeTab === "comments" && (
          <CommentsContent
            comments={battle.comments}
            onComment={onComment}
            isArchived={isArchived}
            battleStatus={battle.status}
          />
        )}

        {showVoting && activeTab === "voting" && (
          <VotingContent
            battle={battle}
            onVote={onVote}
            isArchived={isArchived}
            isVotingPhase={isVotingPhase}
            votingTimeRemaining={votingTimeRemaining}
            votingCompletedRound={votingCompletedRound}
          />
        )}
      </div>
    </div>
  );
}
