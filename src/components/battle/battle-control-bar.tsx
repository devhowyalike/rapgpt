/**
 * Control bar for ongoing battles
 */

"use client";

import { Radio } from "lucide-react";
import { useState } from "react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import type { Battle } from "@/lib/shared";
import { BattleOptionsDropdown } from "./battle-options-dropdown";
import {
  buildMobileFanActions,
  ControlBarContainer,
  GoLiveButton,
  OptionsButton,
} from "./control-bar-buttons";
import { MainActionButton } from "./main-action-button";
import { MobileFanButton } from "./mobile-fan-button";

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
  hostEndedBattle?: boolean;
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
  hostEndedBattle = false,
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

  const mobileFanActions = buildMobileFanActions({
    showCommenting,
    showVoting,
    requireLiveForVoting: true, // Active battles only show voting when live
    isLive,
    onCommentsClick,
    onVotingClick,
    onSettingsClick: canManageLive ? onSettingsClick : undefined, // Only show settings to battle manager
    mobileActiveTab,
    isMobileDrawerOpen,
    settingsActive,
    // Go Live in mobile fan (hidden on xl+ where dedicated button shows)
    // Only show when permissions are confirmed - don't flash for non-owners
    showGoLive: canManageLive,
    isLoadingPermissions: false, // No longer needed since we don't show while loading
    isStartingLive,
    isStoppingLive,
    onGoLiveClick: handleGoLiveClick,
  });

  // Show special message when host ended the battle (for viewers only)
  if (hostEndedBattle && !canManageLive) {
    return (
      <ControlBarContainer>
        <div className="flex-1 flex items-center justify-center gap-2 text-gray-400">
          <Radio className="w-4 h-4" />
          <span className="text-sm font-medium">
            The host has ended this live broadcast
          </span>
        </div>
      </ControlBarContainer>
    );
  }

  return (
    <ControlBarContainer>
      {/* Primary Action Button - Shows actions for managers, status for viewers */}
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
        canManage={canManageLive}
      />

      {/* Battle Options Dropdown - Only visible to battle manager (owner/admin) */}
      {canManageLive && (
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
      )}

      {/* Go Live Button - hidden on mobile, shown on xl+ (mobile uses fan menu) */}
      {/* Only show when permissions are confirmed - don't flash for non-owners */}
      {canManageLive && (
        <div className="hidden xl:block">
          <GoLiveButton
            isLive={isLive}
            isLoadingPermissions={false}
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
