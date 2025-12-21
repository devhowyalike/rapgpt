"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckCircle, Play } from "lucide-react";
import type { ReactNode } from "react";
import { ScoreCalcAnimation } from "@/components/score-calc-animation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Skeleton } from "@/components/ui/skeleton";
import type { Battle } from "@/lib/shared";
import { ROUNDS_PER_BATTLE, getAdvanceRoundButtonText } from "@/lib/shared";

// =============================================================================
// Types
// =============================================================================

type ButtonState =
  | "calculating"
  | "generating"
  | "voting"
  | "reading"
  | "advance"
  | "generate"
  | "idle";

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
  isLoadingPermissions?: boolean;
}

// =============================================================================
// Shared Content Components
// =============================================================================

function CalculatingContent() {
  return (
    <div className="flex items-center justify-center gap-3">
      <ScoreCalcAnimation />
      <span className="text-lg font-medium">Calculating Score...</span>
    </div>
  );
}

function GeneratingContent() {
  return (
    <div className="flex items-center justify-center gap-2">
      <LoadingSpinner />
      <span>Kickin' ballistics...</span>
    </div>
  );
}

function VotingContent({
  votingTimeRemaining,
}: {
  votingTimeRemaining: number;
}) {
  return (
    <div className="flex items-center justify-center md:justify-between gap-4 w-full">
      <div className="flex items-center gap-3 whitespace-nowrap">
        <span className="text-2xl leading-none flex items-center">⏱️</span>
        <span className="text-lg font-medium leading-none">Vote Now!</span>
      </div>
      <div className="hidden md:flex items-center gap-3">
        <span className="text-2xl font-bebas-neue leading-none pt-1 xl:hidden">
          {votingTimeRemaining}s
        </span>
        <span className="hidden xl:inline text-sm text-white/80 whitespace-nowrap">
          Vote in the sidebar →
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// State Determination
// =============================================================================

function getButtonState(props: {
  isCalculatingScores: boolean;
  isGenerating: boolean;
  isPreGenerating: boolean;
  isVotingPhase: boolean;
  isReadingPhase: boolean;
  canAdvance: boolean;
  canGenerate: boolean;
  showVoting: boolean;
  votingTimeRemaining: number | null;
}): ButtonState {
  const {
    isCalculatingScores,
    isGenerating,
    isPreGenerating,
    isVotingPhase,
    isReadingPhase,
    canAdvance,
    canGenerate,
    showVoting,
    votingTimeRemaining,
  } = props;

  if (isCalculatingScores) return "calculating";
  if (isGenerating || isPreGenerating) return "generating";
  if (isVotingPhase && votingTimeRemaining !== null && showVoting)
    return "voting";
  if (isReadingPhase) return "reading";
  if (canAdvance) return "advance";
  if (canGenerate) return "generate";
  return "idle";
}

// =============================================================================
// Background Gradient Logic
// =============================================================================

function getBackgroundClass(state: ButtonState, canManage: boolean): string {
  const baseGradients: Record<ButtonState, string> = {
    calculating: "bg-linear-to-r from-amber-600 to-yellow-600",
    generating: "bg-linear-to-r from-teal-600 to-cyan-600",
    voting: "bg-linear-to-r from-purple-600 to-pink-600",
    reading: "bg-linear-to-r from-cyan-600 to-blue-600",
    advance: "bg-linear-to-r from-green-600 to-emerald-600",
    generate: "bg-linear-to-r from-green-500 to-emerald-500",
    idle: "bg-linear-to-r from-gray-700 to-gray-600",
  };

  const hoverAdditions: Partial<Record<ButtonState, string>> = {
    reading: "hover:from-cyan-700 hover:to-blue-700",
    advance: "hover:from-green-700 hover:to-emerald-700",
    generate: "hover:from-green-600 hover:to-emerald-600 shadow-md",
    idle: "hover:from-teal-700 hover:to-cyan-700",
  };

  let className = baseGradients[state];

  // Viewer mode additions
  if (!canManage && state === "voting") {
    className += " animate-pulse";
  }

  // Manager mode hover additions
  if (canManage && hoverAdditions[state]) {
    className += ` ${hoverAdditions[state]}`;
  }

  return className;
}

// =============================================================================
// Viewer Content (Status Indicators)
// =============================================================================

function renderViewerContent(
  state: ButtonState,
  props: {
    battle: Battle;
    votingTimeRemaining: number | null;
    nextPerformerName?: string;
  }
): ReactNode {
  const { battle, votingTimeRemaining, nextPerformerName } = props;

  switch (state) {
    case "calculating":
      return <CalculatingContent />;

    case "generating":
      return <GeneratingContent />;

    case "voting":
      return <VotingContent votingTimeRemaining={votingTimeRemaining!} />;

    case "reading":
      return (
        <div className="flex items-center justify-center gap-2 h-full">
          <span className="text-xl leading-none flex items-center">📖</span>
          <span className="text-lg font-medium leading-none">
            Reading verses...
          </span>
        </div>
      );

    case "advance":
      return (
        <div className="flex items-center justify-center gap-2 h-full">
          <span className="text-xl leading-none flex items-center">⏳</span>
          <span className="hidden sm:inline leading-none">
            {battle.currentRound === ROUNDS_PER_BATTLE
              ? "Waiting for host to reveal winner..."
              : "Waiting for host to advance..."}
          </span>
          <span className="sm:hidden leading-none">Waiting for host...</span>
        </div>
      );

    case "generate":
      return (
        <div className="flex items-center justify-center gap-2 h-full">
          <span className="text-xl leading-none flex items-center">🎤</span>
          <span className="whitespace-nowrap leading-none">
            <span className="hidden sm:inline">Up next: </span>
            <span className="sm:hidden">Next: </span>
            {nextPerformerName}
          </span>
        </div>
      );

    case "idle":
    default:
      return (
        <div className="flex items-center justify-center gap-2 h-full">
          <span className="text-xl leading-none flex items-center">📺</span>
          <span className="hidden sm:inline leading-none">
            Watching battle...
          </span>
          <span className="sm:hidden leading-none">Watching...</span>
        </div>
      );
  }
}

// =============================================================================
// Manager Content (Action Buttons)
// =============================================================================

function renderManagerContent(
  state: ButtonState,
  props: {
    battle: Battle;
    votingTimeRemaining: number | null;
    nextPerformerName?: string;
    showVoting: boolean;
  }
): ReactNode {
  const { battle, votingTimeRemaining, nextPerformerName, showVoting } = props;

  switch (state) {
    case "calculating":
      return <CalculatingContent />;

    case "generating":
      return <GeneratingContent />;

    case "voting":
      return <VotingContent votingTimeRemaining={votingTimeRemaining!} />;

    case "reading":
      // Manager sees "Begin Voting" button during reading phase
      return showVoting ? (
        <div className="flex items-center justify-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span className="text-lg font-medium">Begin Voting</span>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 h-full">
          <span className="text-xl leading-none flex items-center">📖</span>
          <span className="text-lg font-medium leading-none">
            Reading verses...
          </span>
        </div>
      );

    case "advance":
      return (
        <div className="flex items-center justify-center gap-2 h-full">
          <ArrowRight className="w-5 h-5" />
          <span className="leading-none">
            {getAdvanceRoundButtonText(battle)}
          </span>
        </div>
      );

    case "generate":
    case "idle":
    default:
      return (
        <div className="flex items-center justify-center gap-2 h-full">
          <Play className="w-5 h-5 shrink-0" />
          <span className="whitespace-nowrap leading-none">
            {battle.verses.length === 0 ? "First:" : "Next:"}{" "}
            {nextPerformerName}
          </span>
        </div>
      );
  }
}

// =============================================================================
// Main Component
// =============================================================================

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
  isLoadingPermissions = false,
}: MainActionButtonProps) {
  // Determine current state
  const state = getButtonState({
    isCalculatingScores,
    isGenerating,
    isPreGenerating,
    isVotingPhase,
    isReadingPhase,
    canAdvance,
    canGenerate,
    showVoting,
    votingTimeRemaining,
  });

  // Get background styling
  const backgroundClass = getBackgroundClass(state, canManage);

  // Determine if button should be disabled (manager mode only)
  const isDisabled =
    isGenerating ||
    isPreGenerating ||
    isVotingPhase ||
    isCalculatingScores ||
    (!canGenerate && !canAdvance && !(isReadingPhase && showVoting));

  // Determine click handler (manager mode only)
  const handleClick = () => {
    if (isCalculatingScores) return;
    if (isReadingPhase && showVoting) return onBeginVoting();
    if (canAdvance) return onAdvanceRound();
    if (canGenerate) return onGenerateVerse();
  };

  // Should the button pulse/animate attention?
  const shouldPulse = isVotingPhase || canAdvance;

  return (
    <AnimatePresence mode="wait">
      {/* Loading State */}
      {isLoadingPermissions ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 h-(--control-button-height)"
        >
          <Skeleton className="w-full h-full rounded-lg" />
        </motion.div>
      ) : !canManage ? (
        /* Viewer Mode: Status Indicator (non-interactive) */
        <motion.div
          key="status"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={`
            flex-1 px-2 h-(--control-button-height) flex items-center justify-center rounded-lg text-white font-bold transition-all
            ${backgroundClass}
          `}
        >
          {renderViewerContent(state, {
            battle,
            votingTimeRemaining,
            nextPerformerName,
          })}
        </motion.div>
      ) : (
        /* Manager Mode: Action Button (interactive) */
        <motion.button
          key="action"
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            scale: shouldPulse ? [1, 1.02, 1] : 1,
            filter: shouldPulse
              ? ["brightness(1)", "brightness(1.1)", "brightness(1)"]
              : "brightness(1)",
          }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 0.3 },
            scale: { repeat: Infinity, duration: 2, ease: "easeInOut" },
            filter: { repeat: Infinity, duration: 2, ease: "easeInOut" },
          }}
          onClick={handleClick}
          disabled={isDisabled}
          className={`
            flex-1 px-2 h-(--control-button-height) flex items-center justify-center rounded-lg text-white font-bold transition-all
            ${backgroundClass}
            ${isDisabled ? "cursor-not-allowed" : ""}
          `}
        >
          {renderManagerContent(state, {
            battle,
            votingTimeRemaining,
            nextPerformerName,
            showVoting,
          })}
        </motion.button>
      )}
    </AnimatePresence>
  );
}
