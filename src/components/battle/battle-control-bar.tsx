/**
 * Control bar for ongoing battles
 */

"use client";

import { MessageSquare, Radio, Settings, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import type { Battle } from "@/lib/shared";
import { BattleOptionsDropdown } from "./battle-options-dropdown";
import {
  ControlBarContainer,
  GoLiveButton,
  OptionsButton,
} from "./control-bar-buttons";
import { MainActionButton } from "./main-action-button";
import {
  MobileFanButton,
  type MobileFanButtonAction,
} from "./mobile-fan-button";

interface BattleControlBarProps {
  battle: Battle;
  isGenerating: boolean;
  isCanceling: boolean;
  canGenerate: boolean;
  canAdvance: boolean;
  isReadingPhase: boolean;
  isVotingPhase: boolean;
  isCalculatingScores?: boolean;
  isPreGenerating?: boolean;
  votingTimeRemaining: number | null;
  showVoting: boolean;
  showCommenting: boolean;
  nextPerformerName?: string;
  isAdmin?: boolean;
  // Live mode props
  isLive?: boolean;
  canManageLive?: boolean;
  isLoadingPermissions?: boolean;
  isStartingLive?: boolean;
  isStoppingLive?: boolean;
  onGoLive?: () => void;
  onEndLive?: () => void;
  onGenerateVerse: () => void;
  onAdvanceRound: () => void;
  onBeginVoting: () => void;
  onCancelBattle: () => void;
  // Battle options
  onToggleVoting?: (enabled: boolean) => void;
  onToggleCommenting?: (enabled: boolean) => void;
  onCommentsClick?: () => void;
  onVotingClick?: () => void;
  mobileActiveTab?: "comments" | "voting" | null;
  onSettingsClick?: () => void;
  settingsActive?: boolean;
  isMobileDrawerOpen?: boolean;
}

export function BattleControlBar({
  battle,
  isGenerating,
  isCanceling,
  canGenerate,
  canAdvance,
  isReadingPhase,
  isVotingPhase,
  isCalculatingScores = false,
  isPreGenerating = false,
  votingTimeRemaining,
  showVoting,
  showCommenting,
  nextPerformerName,
  isLive = false,
  canManageLive = false,
  isLoadingPermissions = false,
  isStartingLive = false,
  isStoppingLive = false,
  onGoLive,
  onEndLive,
  onGenerateVerse,
  onAdvanceRound,
  onBeginVoting,
  onCancelBattle,
  onToggleVoting,
  onToggleCommenting,
  onCommentsClick,
  onVotingClick,
  mobileActiveTab = null,
  onSettingsClick,
  settingsActive = false,
  isMobileDrawerOpen = false,
}: BattleControlBarProps) {
  const [showGoLiveConfirmation, setShowGoLiveConfirmation] = useState(false);

  const handleGoLiveClick = () => {
    if (isLive) {
      onEndLive?.();
    } else {
      setShowGoLiveConfirmation(true);
    }
  };

  const mobileFanActions: MobileFanButtonAction[] = [];
  if (showCommenting && onCommentsClick) {
    mobileFanActions.push({
      id: "comments",
      label: "Comments",
      icon: <MessageSquare className="w-5 h-5" />,
      onClick: onCommentsClick,
      isActive: mobileActiveTab === "comments" && isMobileDrawerOpen,
    });
  }
  if (showVoting && isLive && onVotingClick) {
    mobileFanActions.push({
      id: "voting",
      label: "Voting",
      icon: <ThumbsUp className="w-5 h-5" />,
      onClick: onVotingClick,
      isActive: mobileActiveTab === "voting" && isMobileDrawerOpen,
    });
  }
  if (onSettingsClick) {
    mobileFanActions.push({
      id: "settings",
      label: "Settings",
      icon: <Settings className="w-5 h-5" />,
      onClick: onSettingsClick,
      isActive: settingsActive,
    });
  }

  return (
    <ControlBarContainer>
      {/* Primary Action Button - Changes based on state */}
      <MainActionButton
        battle={battle}
        isGenerating={isGenerating}
        isPreGenerating={isPreGenerating}
        isCalculatingScores={isCalculatingScores}
        isReadingPhase={isReadingPhase}
        isVotingPhase={isVotingPhase}
        canGenerate={canGenerate}
        canAdvance={canAdvance}
        showVoting={showVoting}
        votingTimeRemaining={votingTimeRemaining}
        nextPerformerName={nextPerformerName}
        onGenerateVerse={onGenerateVerse}
        onAdvanceRound={onAdvanceRound}
        onBeginVoting={onBeginVoting}
      />

      {/* Battle Options Dropdown */}
      <div className="hidden xl:block">
        <BattleOptionsDropdown
          showCommenting={showCommenting}
          showVoting={showVoting}
          onToggleCommenting={onToggleCommenting}
          onToggleVoting={onToggleVoting}
          onPauseBattle={onCancelBattle}
          isPausing={isCanceling || isGenerating}
          isLive={isLive}
          customTrigger={<OptionsButton />}
        />
      </div>

      {/* Go Live Button */}
      {(isLoadingPermissions || canManageLive) && (
        <div>
          <GoLiveButton
            isLive={isLive}
            isLoadingPermissions={isLoadingPermissions}
            isStartingLive={isStartingLive}
            isStoppingLive={isStoppingLive}
            disabled={isGenerating}
            onClick={handleGoLiveClick}
          />
        </div>
      )}

      {mobileFanActions.length > 0 && (
        <div className="xl:hidden ml-auto">
          <MobileFanButton actions={mobileFanActions} />
        </div>
      )}

      <ConfirmationDialog
        open={showGoLiveConfirmation}
        onOpenChange={setShowGoLiveConfirmation}
        title="Go Live?"
        description="This broadcasts the battle live to all users. They can view, comment, and vote if allowed."
        confirmLabel="Go Live"
        onConfirm={() => {
          onGoLive?.();
          setShowGoLiveConfirmation(false);
        }}
        variant="danger"
        icon={Radio}
      />
    </ControlBarContainer>
  );
}
