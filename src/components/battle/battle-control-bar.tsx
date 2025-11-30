/**
 * Control bar for ongoing battles
 */

"use client";

import {
  ArrowRight,
  CheckCircle,
  Play,
  Radio,
} from "lucide-react";
import { useState } from "react";
import { ScoreCalcAnimation } from "@/components/score-calc-animation";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { Battle } from "@/lib/shared";
import { getAdvanceRoundButtonText } from "@/lib/shared";
import { BattleOptionsDropdown } from "./battle-options-dropdown";
import {
  ControlBarContainer,
  GoLiveButton,
  OptionsButton,
  createGoLiveAction,
} from "./control-bar-buttons";
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
      <button
        onClick={
          isCalculatingScores
            ? undefined
            : isReadingPhase && showVoting
              ? onBeginVoting
              : canAdvance
                ? onAdvanceRound
                : canGenerate
                  ? onGenerateVerse
                  : undefined
        }
        disabled={
          isGenerating ||
          isPreGenerating ||
          isVotingPhase ||
          isCalculatingScores ||
          (!canGenerate && !canAdvance && !(isReadingPhase && showVoting))
        }
        className={`
          flex-1 px-2 py-2 rounded-lg text-white font-bold transition-all
          ${
            isCalculatingScores
              ? "bg-linear-to-r from-amber-600 to-yellow-600"
              : isGenerating || isPreGenerating
                ? "bg-linear-to-r from-teal-600 to-cyan-600"
                : isReadingPhase
                  ? "bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                  : isVotingPhase
                    ? "bg-linear-to-r from-purple-600 to-pink-600 animate-pulse"
                    : canAdvance
                      ? "bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 animate-pulse"
                      : canGenerate
                        ? "bg-linear-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg shadow-green-500/50"
                        : "bg-linear-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700"
          }
          ${
            isGenerating ||
            isVotingPhase ||
            isCalculatingScores ||
            (!canGenerate && !canAdvance && !isReadingPhase)
              ? "cursor-not-allowed"
              : ""
          }
        `}
      >
        {isCalculatingScores ? (
          <div className="flex items-center justify-center gap-3">
            <ScoreCalcAnimation />
            <span className="text-lg font-medium">Calculating Score...</span>
          </div>
        ) : isGenerating || isPreGenerating ? (
          <div className="flex items-center justify-center gap-2">
            <LoadingSpinner />
            <span className="hidden sm:inline">Kicking ballistics...</span>
            <span className="sm:hidden">Generating...</span>
          </div>
        ) : isReadingPhase && showVoting ? (
          <div className="flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span className="text-lg font-medium">Begin Voting</span>
          </div>
        ) : isVotingPhase && votingTimeRemaining !== null && showVoting ? (
          <div className="flex items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-3 whitespace-nowrap">
              <span className="text-2xl">⏱️</span>
              <span className="text-lg font-medium">Vote Now!</span>
              <span className="text-2xl font-bebas-neue">
                {votingTimeRemaining}s
              </span>
            </div>
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <span className="hidden md:inline text-sm text-white/80 whitespace-nowrap">
                Vote in the sidebar →
              </span>
              <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden min-w-[100px]">
                <div
                  className="h-full bg-white rounded-full transition-all duration-1000 ease-linear"
                  style={{
                    width: `${(votingTimeRemaining / 10) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ) : canAdvance ? (
          <div className="flex items-center justify-center gap-2">
            <ArrowRight className="w-5 h-5" />
            {getAdvanceRoundButtonText(battle)}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <Play className="w-5 h-5 shrink-0" />
            <span className="whitespace-nowrap">
              {battle.verses.length === 0 ? "First:" : "Next:"}{" "}
              {nextPerformerName}
            </span>
          </div>
        )}
      </button>

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
