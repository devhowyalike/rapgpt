/**
 * Control bar for ongoing battles
 */

"use client";

import {
  ArrowRight,
  CheckCircle,
  Pause,
  Play,
  Radio,
  Settings,
  StopCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ScoreCalcAnimation } from "@/components/score-calc-animation";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { Battle } from "@/lib/shared";
import { getAdvanceRoundButtonText } from "@/lib/shared";
import { BattleOptionsDropdown } from "./battle-options-dropdown";
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
  isAdmin = false,
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

  const goLiveButton = (
    <button
      onClick={
        isLoadingPermissions
          ? undefined
          : isLive
            ? onEndLive
            : () => setShowGoLiveConfirmation(true)
      }
      disabled={
        isLoadingPermissions || isStartingLive || isStoppingLive || isGenerating
      }
      className={`
        w-14 h-14 rounded-full shadow-xl transition-all border-2 flex items-center justify-center backdrop-blur-md
        ${
          isLoadingPermissions
            ? "bg-gray-800/50 border-gray-700 cursor-wait"
            : isLive
              ? "bg-gray-700 hover:bg-gray-600 border-gray-500"
              : "bg-red-600 hover:bg-red-700 border-red-500 md:animate-pulse"
        }
      `}
      title={isLive ? "End Live" : "Go Live"}
    >
      {isLoadingPermissions ? (
        <div className="w-6 h-6 shrink-0 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
      ) : isStartingLive || isStoppingLive ? (
        <LoadingSpinner size="sm" />
      ) : isLive ? (
        <StopCircle className="w-6 h-6 shrink-0 text-white" />
      ) : (
        <Radio className="w-6 h-6 shrink-0 text-white" />
      )}
    </button>
  );

  const goLiveAction = {
    id: "go-live",
    component: goLiveButton,
    label: isLive ? "End Live" : "Go Live",
  };

  return (
    <div className="p-4 bg-gray-900 border-t border-gray-800">
      <div className="max-w-4xl mx-auto flex flex-row gap-3">
        {/* Battle Options Dropdown - Desktop Only */}
        <div className="hidden md:block">
          <BattleOptionsDropdown
            showCommenting={showCommenting}
            showVoting={showVoting}
            onToggleCommenting={onToggleCommenting}
            onToggleVoting={onToggleVoting}
            onPauseBattle={onCancelBattle}
            isPausing={isCanceling || isGenerating}
            adminUrl={
              isAdmin ? `/admin/battles/${battle.id}/control` : undefined
            }
            isLive={isLive}
          />
        </div>

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

        {/* Mobile Action Menu (Fan) - Replaces Go Live Button */}
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
    </div>
  );
}
