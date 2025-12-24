/**
 * Unified battle stage component
 * Supports both active battles (mode="active") and replay mode (mode="replay")
 */

"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useBattleStage } from "@/lib/hooks/use-battle-stage";
import type { Battle, PersonaPosition } from "@/lib/shared";
import type { ConnectionStatus } from "@/lib/websocket/types";
import { BattleSplitView } from "./battle/battle-split-view";
import { BattleStageActiveHeader } from "./battle/battle-stage-active-header";
import { BattleStageReplayHeader } from "./battle/battle-stage-replay-header";
import { BattleStageScoreDisplay } from "./battle/battle-stage-score-display";

/** Active mode props - for live/in-progress battles */
interface ActiveModeProps {
  mode?: "active";
  streamingPersonaId?: string | null;
  streamingText?: string | null;
  streamingPosition?: PersonaPosition | null;
  isReadingPhase?: boolean;
  isVotingPhase?: boolean;
  votingCompletedRound?: number | null;
  /**
   * Delay, in seconds, before revealing scores once available.
   * Default: 5 seconds. Set to 0 to reveal immediately.
   */
  scoreDelaySeconds?: number;
  /** Whether the battle is currently live */
  isLive?: boolean;
  /** WebSocket connection status when live */
  liveConnectionStatus?: ConnectionStatus;
  /** Number of viewers when live */
  liveViewerCount?: number;
  /** Whether user can manage live mode (for clickable badge) */
  canManageLive?: boolean;
  /** Callback when live badge is clicked to disconnect */
  onDisconnect?: () => void;
}

/** Replay mode props - for viewing completed battles */
interface ReplayModeProps {
  mode: "replay";
  streamingPersonaId?: never;
  streamingText?: never;
  streamingPosition?: never;
  isReadingPhase?: never;
  isVotingPhase?: never;
  votingCompletedRound?: never;
  scoreDelaySeconds?: never;
  // Live props are allowed in replay mode for completed battles still broadcasting
  isLive?: boolean;
  liveConnectionStatus?: ConnectionStatus;
  liveViewerCount?: number;
  canManageLive?: boolean;
  onDisconnect?: () => void;
}

interface BaseBattleStageProps {
  battle: Battle;
  mobileBottomPadding?: string;
}

type BattleStageProps = BaseBattleStageProps &
  (ActiveModeProps | ReplayModeProps);

export function BattleStage(props: BattleStageProps) {
  const { battle, mobileBottomPadding, mode = "active" } = props;

  // Active mode props (with defaults)
  const streamingPersonaId =
    mode === "active" ? props.streamingPersonaId : null;
  const streamingText = mode === "active" ? props.streamingText : null;
  const streamingPosition = mode === "active" ? props.streamingPosition : null;
  const isReadingPhase =
    mode === "active" ? props.isReadingPhase ?? false : false;
  const isVotingPhase =
    mode === "active" ? props.isVotingPhase ?? false : false;
  const votingCompletedRound =
    mode === "active" ? props.votingCompletedRound ?? null : null;
  const scoreDelaySeconds =
    mode === "active" ? props.scoreDelaySeconds ?? 5 : 0;

  // Live props are supported in both active and replay mode
  // (for completed battles still broadcasting)
  const isLive = props.isLive ?? false;
  const liveConnectionStatus = props.liveConnectionStatus ?? "disconnected";
  const liveViewerCount = props.liveViewerCount ?? 0;
  const canManageLive = props.canManageLive ?? false;
  const onDisconnect = props.onDisconnect;

  const isReplayMode = mode === "replay";

  // Centralized state management via custom hook
  const {
    selectedRound,
    canGoPrev,
    canGoNext,
    handlePrevRound,
    handleNextRound,
    currentRoundVerses,
    currentRoundScore,
    shouldShowScores,
    shouldShowRoundWinner,
    isMobile,
    isHeaderCollapsed,
    personaTopMargin,
    mobileActiveSide,
    enableStickyPersonas,
    confettiOrigin,
    winnerNameRef,
    trophyRef,
    scoreSectionRef,
  } = useBattleStage({
    battle,
    mode,
    isReadingPhase,
    isVotingPhase,
    votingCompletedRound,
    scoreDelaySeconds,
  });

  // Track direction for round transitions
  const [prevRound, setPrevRound] = useState(selectedRound);
  const direction = selectedRound > prevRound ? 1 : -1;

  useEffect(() => {
    setPrevRound(selectedRound);
  }, [selectedRound]);

  // Override mobileActiveSide with streaming position when active
  const effectiveMobileActiveSide = streamingPosition || mobileActiveSide;

  return (
    <div
      className={`flex flex-col ${
        isReplayMode ? "min-h-0 md:h-full" : "h-full overflow-y-auto"
      } bg-linear-to-b from-stage-darker to-stage-dark overflow-x-hidden touch-scroll-container pb-(--mobile-bottom-padding) xl:pb-0`}
      style={{
        ["--mobile-bottom-padding" as string]: mobileBottomPadding || "0px",
      }}
    >
      {/* Header - different content based on mode */}
      {isReplayMode ? (
        <BattleStageReplayHeader
          battle={battle}
          isHeaderCollapsed={isHeaderCollapsed}
          selectedRound={selectedRound}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          onPrevRound={handlePrevRound}
          onNextRound={handleNextRound}
        />
      ) : (
        <BattleStageActiveHeader
          battle={battle}
          confettiOrigin={confettiOrigin}
          trophyRef={trophyRef}
          winnerNameRef={winnerNameRef}
        />
      )}

      <div
        className={`flex-1 ${isReplayMode ? "overflow-y-auto" : ""}`}
        {...(isReplayMode ? { "data-scroll-container": true } : {})}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={selectedRound}
            initial={
              isReplayMode ? { opacity: 0, x: direction * 50 } : undefined
            }
            animate={{ opacity: 1, x: 0 }}
            exit={isReplayMode ? { opacity: 0, x: -direction * 50 } : undefined}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="h-full"
          >
            <BattleSplitView
              battle={battle}
              verses={currentRoundVerses}
              roundScore={currentRoundScore}
              showRoundWinner={!!shouldShowRoundWinner}
              mobileActiveSide={
                isReplayMode ? undefined : effectiveMobileActiveSide
              }
              streamingPersonaId={streamingPersonaId}
              streamingText={streamingText}
              streamingPosition={streamingPosition}
              mobileTopOffset={isMobile && !isReplayMode ? personaTopMargin : 0}
              enableStickyPersonas={isReplayMode ? true : enableStickyPersonas}
              isBattleEnd={isReplayMode}
              cardPadding={isReplayMode ? "px-3 py-2 md:p-4" : undefined}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Score Display (when scores are available) - only in active mode */}
      {!isReplayMode && shouldShowScores && currentRoundScore && (
        <BattleStageScoreDisplay
          battle={battle}
          roundScore={currentRoundScore}
          scoreSectionRef={scoreSectionRef}
        />
      )}
    </div>
  );
}
