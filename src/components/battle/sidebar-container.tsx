/**
 * Container for battle sidebar (desktop and mobile)
 */

"use client";

import { BattleSidebar } from "@/components/battle-sidebar";
import { CommentsContent } from "@/components/battle/comments-content";
import { VotingContent } from "@/components/battle/voting-content";
import { BattleDrawer } from "@/components/ui/battle-drawer";
import type { DrawerTab } from "@/lib/hooks/use-mobile-drawer";
import type { Battle } from "@/lib/shared";

interface SidebarContainerProps {
  battle: Battle;
  onVote: (round: number, personaId: string) => Promise<boolean>;
  onComment: (content: string) => Promise<void> | void;
  showCommenting: boolean;
  showVoting: boolean;
  isArchived?: boolean;
  isVotingPhase?: boolean;
  votingTimeRemaining?: number | null;
  votingCompletedRound?: number | null;
  // Mobile drawer props
  showMobileDrawer?: boolean;
  onMobileDrawerChange?: (open: boolean) => void;
  mobileActiveTab?: DrawerTab;
  excludeBottomControls?: boolean;
}

export function SidebarContainer({
  battle,
  onVote,
  onComment,
  showCommenting,
  showVoting,
  isArchived = false,
  isVotingPhase,
  votingTimeRemaining,
  votingCompletedRound,
  showMobileDrawer,
  onMobileDrawerChange,
  mobileActiveTab = "comments",
  excludeBottomControls,
}: SidebarContainerProps) {
  // Apply the same visibility logic as BattleSidebar to ensure we don't render an empty container
  // Voting is only shown if enabled AND (live OR archived)
  const effectiveShowVoting = showVoting && (battle.isLive || isArchived);

  // Only hide desktop sidebar when both features are disabled
  // Mobile drawer visibility is controlled by the parent via showMobileDrawer
  const showDesktopSidebar = showCommenting || effectiveShowVoting;

  return (
    <>
      {/* Desktop Sidebar - only render when at least one feature is enabled */}
      {showDesktopSidebar && (
        <div className="hidden xl:block w-96">
          <BattleSidebar
            battle={battle}
            onVote={onVote}
            onComment={onComment}
            isArchived={isArchived}
            isVotingPhase={isVotingPhase}
            votingTimeRemaining={votingTimeRemaining}
            votingCompletedRound={votingCompletedRound}
          />
        </div>
      )}

      {/* Mobile Drawer - single scroll container like MP3 drawer */}
      {/* Content visibility is based on mobileActiveTab - button visibility in fan menu controls access */}
      {showMobileDrawer !== undefined && onMobileDrawerChange && (
        <BattleDrawer
          open={showMobileDrawer}
          onOpenChange={onMobileDrawerChange}
          title={mobileActiveTab === "comments" ? "Comments" : "Voting"}
          excludeBottomControls={excludeBottomControls}
        >
          {/* Keep both tabs mounted to preserve state; hide inactive tab */}
          <div className={mobileActiveTab === "comments" ? "" : "hidden"}>
            <CommentsContent
              comments={battle.comments}
              onComment={onComment}
              isArchived={isArchived}
              battleStatus={battle.status}
            />
          </div>
          <div className={mobileActiveTab === "voting" ? "" : "hidden"}>
            <VotingContent
              battle={battle}
              onVote={onVote}
              isArchived={isArchived}
              isVotingPhase={isVotingPhase}
              votingTimeRemaining={votingTimeRemaining}
              votingCompletedRound={votingCompletedRound}
            />
          </div>
        </BattleDrawer>
      )}
    </>
  );
}
