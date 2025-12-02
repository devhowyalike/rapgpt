"use client";

import { ArrowRight, CheckCircle, Play } from "lucide-react";
import { ScoreCalcAnimation } from "@/components/score-calc-animation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { Battle } from "@/lib/shared";
import { getAdvanceRoundButtonText, ROUNDS_PER_BATTLE } from "@/lib/shared";

interface MainActionButtonProps {
  battle: Battle;
  isGenerating: boolean;
  isPreGenerating: boolean;
  isCalculatingScores: boolean;
  isReadingPhase: boolean;
  isVotingPhase: boolean;
  canGenerate: boolean;
  canAdvance: boolean;
  showVoting: boolean;
  votingTimeRemaining: number | null;
  nextPerformerName?: string;
  onGenerateVerse: () => void;
  onAdvanceRound: () => void;
  onBeginVoting: () => void;
  /** Whether the current user can manage the battle (owner/admin). If false, shows status indicators instead of action buttons. */
  canManage?: boolean;
}

export function MainActionButton({
  battle,
  isGenerating,
  isPreGenerating,
  isCalculatingScores,
  isReadingPhase,
  isVotingPhase,
  canGenerate,
  canAdvance,
  showVoting,
  votingTimeRemaining,
  nextPerformerName,
  onGenerateVerse,
  onAdvanceRound,
  onBeginVoting,
  canManage = true,
}: MainActionButtonProps) {
  // For non-managers (viewers), show status indicators instead of action buttons
  if (!canManage) {
    return (
      <div
        className={`
          flex-1 px-2 h-[42px] flex items-center justify-center rounded-lg text-white font-bold transition-all
          ${
            isCalculatingScores
              ? "bg-linear-to-r from-amber-600 to-yellow-600"
              : isGenerating || isPreGenerating
              ? "bg-linear-to-r from-teal-600 to-cyan-600"
              : isVotingPhase
              ? "bg-linear-to-r from-purple-600 to-pink-600 animate-pulse"
              : isReadingPhase
              ? "bg-linear-to-r from-cyan-600 to-blue-600"
              : "bg-linear-to-r from-gray-700 to-gray-600"
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
            <span>Kickin' ballistics...</span>
          </div>
        ) : isVotingPhase && votingTimeRemaining !== null && showVoting ? (
          <div className="flex items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-3 whitespace-nowrap">
              <span className="text-2xl leading-none flex items-center">
                ⏱️
              </span>
              <span className="text-lg font-medium hidden md:inline leading-none">
                Vote Now!
              </span>
              <span className="text-lg font-medium md:hidden leading-none">
                Vote Above!
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bebas-neue leading-none pt-1">
                {votingTimeRemaining}s
              </span>
              <span className="hidden md:inline text-sm text-white/80 whitespace-nowrap">
                Vote in the sidebar →
              </span>
            </div>
          </div>
        ) : isReadingPhase ? (
          <div className="flex items-center justify-center gap-2 h-full">
            <span className="text-xl leading-none flex items-center">📖</span>
            <span className="text-lg font-medium leading-none">
              Reading verses...
            </span>
          </div>
        ) : canAdvance ? (
          <div className="flex items-center justify-center gap-2 h-full">
            <span className="text-xl leading-none flex items-center">⏳</span>
            <span className="hidden sm:inline leading-none">
              {battle.currentRound === ROUNDS_PER_BATTLE
                ? "Waiting for host to reveal winner..."
                : "Waiting for host to advance..."}
            </span>
            <span className="sm:hidden leading-none">Waiting for host...</span>
          </div>
        ) : canGenerate ? (
          <div className="flex items-center justify-center gap-2 h-full">
            <span className="text-xl leading-none flex items-center">🎤</span>
            <span className="whitespace-nowrap leading-none">
              <span className="hidden sm:inline">Up next: </span>
              <span className="sm:hidden">Next: </span>
              {nextPerformerName}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 h-full">
            <span className="text-xl leading-none flex items-center">📺</span>
            <span className="hidden sm:inline leading-none">
              Watching battle...
            </span>
            <span className="sm:hidden leading-none">Watching...</span>
          </div>
        )}
      </div>
    );
  }

  // For managers (owner/admin), show action buttons
  return (
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
        flex-1 px-2 h-[42px] flex items-center justify-center rounded-lg text-white font-bold transition-all
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
          <span>Kickin' ballistics...</span>
        </div>
      ) : isReadingPhase && showVoting ? (
        <div className="flex items-center justify-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span className="text-lg font-medium">Begin Voting</span>
        </div>
      ) : isVotingPhase && votingTimeRemaining !== null && showVoting ? (
        <div className="flex items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-3 whitespace-nowrap">
            <span className="text-2xl leading-none flex items-center">⏱️</span>
            <span className="text-lg font-medium hidden md:inline leading-none">
              Vote Now!
            </span>
            <span className="text-lg font-medium md:hidden leading-none">
              Vote Above!
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bebas-neue leading-none pt-1">
              {votingTimeRemaining}s
            </span>
            <span className="hidden md:inline text-sm text-white/80 whitespace-nowrap">
              Vote in the sidebar →
            </span>
          </div>
        </div>
      ) : canAdvance ? (
        <div className="flex items-center justify-center gap-2 h-full">
          <ArrowRight className="w-5 h-5" />
          <span className="leading-none pt-0.5">
            {getAdvanceRoundButtonText(battle)}
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 h-full">
          <Play className="w-5 h-5 shrink-0" />
          <span className="whitespace-nowrap leading-none pt-0.5">
            {battle.verses.length === 0 ? "First:" : "Next:"}{" "}
            {nextPerformerName}
          </span>
        </div>
      )}
    </button>
  );
}
