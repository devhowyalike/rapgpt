/**
 * Control bar for ongoing battles
 */

"use client";

import { Play, ArrowRight, Pause, Settings, CheckCircle } from "lucide-react";
import Link from "next/link";
import type { Battle } from "@/lib/shared";
import { ScoreCalcAnimation } from "@/components/score-calc-animation";

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
  nextPerformerName?: string;
  isAdmin?: boolean;
  onGenerateVerse: () => void;
  onAdvanceRound: () => void;
  onBeginVoting: () => void;
  onCancelBattle: () => void;
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
  nextPerformerName,
  isAdmin = false,
  onGenerateVerse,
  onAdvanceRound,
  onBeginVoting,
  onCancelBattle,
}: BattleControlBarProps) {
  return (
    <div className="p-4 bg-gray-900 border-t border-gray-800">
      <div className="max-w-4xl mx-auto flex flex-row gap-3">
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
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Kicking ballistics...
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
              {battle.currentRound === 3 ? "Reveal Winner" : "Next Round"}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Play className="w-5 h-5" />
              {battle.verses.length === 0 ? "First up:" : "Next:"}{" "}
              {nextPerformerName}
            </div>
          )}
        </button>

        {/* Pause Battle Button */}
        <button
          onClick={onCancelBattle}
          disabled={isCanceling || isGenerating}
          className="px-3 sm:px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-bold flex items-center justify-center gap-2 transition-all"
        >
          <Pause className="w-5 h-5" />
          <span className="hidden sm:inline">Pause Battle</span>
        </button>

        {/* Admin Control Panel Link */}
        {isAdmin && (
          <Link
            href={`/admin/battles/${battle.id}/control`}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-bold flex items-center justify-center gap-2 transition-all"
          >
            <Settings className="w-5 h-5" />
            <span className="hidden sm:inline">Live Controls</span>
          </Link>
        )}
      </div>
    </div>
  );
}
