/**
 * Container for battle sidebar (desktop and mobile)
 */

"use client";

import type { Battle } from "@/lib/shared";
import { BattleSidebar } from "@/components/battle-sidebar";
import { BattleDrawer } from "@/components/ui/battle-drawer";
import type { DrawerTab } from "@/lib/hooks/use-mobile-drawer";

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
  if (!showCommenting && !showVoting) {
    return null;
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-96">
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

      {/* Mobile Drawer */}
      {showMobileDrawer !== undefined && onMobileDrawerChange && (
        <BattleDrawer
          open={showMobileDrawer}
          onOpenChange={onMobileDrawerChange}
          title={mobileActiveTab === "comments" ? "Comments" : "Voting"}
          excludeBottomControls={excludeBottomControls}
        >
          <div className="flex-1 overflow-y-auto min-h-0">
            <BattleSidebar
              battle={battle}
              onVote={onVote}
              onComment={onComment}
              isArchived={isArchived}
              isVotingPhase={isVotingPhase}
              votingTimeRemaining={votingTimeRemaining}
              votingCompletedRound={votingCompletedRound}
              defaultTab={mobileActiveTab}
            />
          </div>
        </BattleDrawer>
      )}
    </>
  );
}

