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
  ControlBarContainer,
  GoLiveButton,
  OptionsButton,
  createGoLiveAction,
} from "./control-bar-buttons";
import { MainActionButton } from "./main-action-button";
import { MobileActionButtons } from "./mobile-action-buttons";

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
  // Mobile Drawer Actions
  onCommentsClick?: () => void;
  onVotingClick?: () => void;
  settingsAction?: React.ReactNode;
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
  settingsAction,
}: BattleControlBarProps) {
  const [showGoLiveConfirmation, setShowGoLiveConfirmation] = useState(false);

  const handleGoLiveClick = () => {
    if (isLive) {
      onEndLive?.();
    } else {
      setShowGoLiveConfirmation(true);
    }
  };

  // Mobile action for Go Live
  const goLiveAction = createGoLiveAction({
    isLive,
    isLoadingPermissions,
    isStartingLive,
    isStoppingLive,
    disabled: isGenerating,
    onClick: onEndLive || (() => {}),
    onShowConfirmation: () => setShowGoLiveConfirmation(true),
  });

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

      {/* Battle Options Dropdown - Desktop Only */}
      <div className="hidden md:block">
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

      {/* Go Live Button - Desktop Only */}
      {(isLoadingPermissions || canManageLive) && (
        <div className="hidden md:block">
          <GoLiveButton
            isLive={isLive}
            isLoadingPermissions={isLoadingPermissions}
            isStartingLive={isStartingLive}
            isStoppingLive={isStoppingLive}
            disabled={isGenerating}
            onClick={handleGoLiveClick}
            variant="desktop"
          />
        </div>
      )}

      {/* Mobile Action Menu (Fan) - Mobile Only */}
      <div className="md:hidden">
        <MobileActionButtons
          isFixed={false}
          showCommenting={showCommenting}
          showVoting={showVoting && isLive}
          onCommentsClick={onCommentsClick || (() => {})}
          onVotingClick={onVotingClick || (() => {})}
          settingsAction={settingsAction}
          customActions={
            isLoadingPermissions || canManageLive ? [goLiveAction] : []
          }
          className="ml-2"
          alignment="right"
        />
      </div>

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
