/**
 * Unified battle stage component
 * Supports both active battles (mode="active") and replay mode (mode="replay")
 */

"use client";

import { motion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { getBattleProgress, getWinnerPosition } from "@/lib/battle-engine";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import { useRoundData } from "@/lib/hooks/use-round-data";
import { useRoundNavigation } from "@/lib/hooks/use-round-navigation";
import { useScoreRevealDelay } from "@/lib/hooks/use-score-reveal-delay";
import type { Battle, PersonaPosition } from "@/lib/shared";
import { DEFAULT_STAGE, getStage } from "@/lib/shared/stages";
import type { ConnectionStatus } from "@/lib/websocket/types";
import { BattleHeader } from "./battle/battle-header";
import { BattleScoreSection } from "./battle/battle-score-section";
import { BattleSplitView } from "./battle/battle-split-view";
import { BattleBell } from "./battle-bell";
import { CreatorAttribution } from "./creator-attribution";
import { LiveStatusBadge } from "./live-status-badge";
import { RoundControls } from "./round-controls";
import { RoundTracker } from "./round-tracker";
import { VictoryConfetti } from "./victory-confetti";
import { WinnerBanner } from "./winner-banner";

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
  isLive?: never;
  liveConnectionStatus?: never;
  liveViewerCount?: never;
  canManageLive?: never;
  onDisconnect?: never;
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
    mode === "active" ? (props.isReadingPhase ?? false) : false;
  const isVotingPhase =
    mode === "active" ? (props.isVotingPhase ?? false) : false;
  const votingCompletedRound =
    mode === "active" ? (props.votingCompletedRound ?? null) : null;
  const scoreDelaySeconds =
    mode === "active" ? (props.scoreDelaySeconds ?? 5) : 0;
  const isLive = mode === "active" ? (props.isLive ?? false) : false;
  const liveConnectionStatus =
    mode === "active"
      ? (props.liveConnectionStatus ?? "disconnected")
      : "disconnected";
  const liveViewerCount = mode === "active" ? (props.liveViewerCount ?? 0) : 0;
  const canManageLive =
    mode === "active" ? (props.canManageLive ?? false) : false;
  const onDisconnect = mode === "active" ? props.onDisconnect : undefined;

  const isReplayMode = mode === "replay";

  // Round navigation for replay mode
  const {
    selectedRound,
    canGoPrev,
    canGoNext,
    handlePrevRound,
    handleNextRound,
  } = useRoundNavigation();

  // Use selected round for replay, current round for active
  const displayRound = isReplayMode ? selectedRound : battle.currentRound;

  const progress = getBattleProgress(battle);
  const {
    verses: currentRoundVerses,
    score: currentRoundScore,
    hasBothVerses: bothVersesComplete,
  } = useRoundData(battle, displayRound);

  // Get the stage for this battle
  const stage = getStage(battle.stageId) || DEFAULT_STAGE;

  // Scores are available when voting is complete (active mode) or always in replay mode
  const scoresAvailable = isReplayMode
    ? !!currentRoundScore
    : currentRoundScore && !isReadingPhase && !isVotingPhase;

  // Centralized score reveal delay via shared hook (skip delay in replay mode)
  const scoresAvailableRound =
    scoresAvailable && currentRoundScore ? currentRoundScore.round : null;
  const { revealedRound } = useScoreRevealDelay(
    scoresAvailableRound,
    isReplayMode ? 0 : scoreDelaySeconds,
  );

  const shouldShowScores =
    !!scoresAvailable &&
    !!currentRoundScore &&
    revealedRound === currentRoundScore.round;

  // For replay mode, track scroll position to collapse header on mobile
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  // Mobile-only offset so the first persona does not render under the sticky trophy/header
  const isMobile = useIsMobile();

  // Show round winner badge when:
  // 1. Replay mode: always show if score exists
  // 2. Voting is enabled (true or undefined/default) AND voting has been completed for the current round, OR
  // 3. Voting is explicitly disabled (false) AND the round has scores (is complete)
  const shouldShowRoundWinner = isReplayMode
    ? !!currentRoundScore
    : currentRoundScore &&
      ((battle.votingEnabled !== false &&
        votingCompletedRound !== null &&
        votingCompletedRound >= battle.currentRound) ||
        (battle.votingEnabled === false && !isReadingPhase && !isVotingPhase));

  // Track scroll position to collapse header on mobile (replay mode)
  useEffect(() => {
    if (!isReplayMode) return;

    const scrollContainer = document.querySelector("[data-scroll-container]");
    if (!scrollContainer) return;

    // Do not collapse header on desktop; ensure it's expanded
    if (!isMobile) {
      setIsHeaderCollapsed(false);
      return;
    }

    const handleScroll = () => {
      const scrollTop = scrollContainer.scrollTop;
      // Collapse after scrolling 50px (mobile only)
      setIsHeaderCollapsed(scrollTop > 50);
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [isReplayMode, isMobile]);

  const trophyRef = useRef<HTMLDivElement | null>(null);
  const winnerNameRef = useRef<HTMLSpanElement | null>(null);
  const [personaTopMargin, setPersonaTopMargin] = useState(0);
  const [confettiOrigin, setConfettiOrigin] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Calculate confetti origin from winner name element position
  const updateConfettiOrigin = useCallback(() => {
    if (winnerNameRef.current) {
      const rect = winnerNameRef.current.getBoundingClientRect();
      setConfettiOrigin({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    }
  }, []);

  // Update confetti origin when battle is completed and winner name is rendered
  useEffect(() => {
    if (battle.status === "completed" && battle.winner) {
      // Small delay to ensure the element is rendered and positioned
      const timeoutId = setTimeout(updateConfettiOrigin, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [battle.status, battle.winner, updateConfettiOrigin]);

  // Compute combined offset: site header height (CSS var) + BattleHeader height
  useLayoutEffect(() => {
    if (!isMobile) {
      setPersonaTopMargin(0);
      return;
    }

    const recalc = () => {
      const rootStyle = getComputedStyle(document.documentElement);
      const headerVar = rootStyle.getPropertyValue("--header-height").trim();
      const headerPx = parseFloat(headerVar || "0") || 0;

      const headerEl = document.querySelector(
        "[data-battle-header]",
      ) as HTMLElement | null;
      const battleHeaderHeight =
        (headerEl?.getBoundingClientRect().height as number) || 0;

      // Use just the battle header height since BattleHeader is already positioned at top: var(--header-height)
      // This avoids double-counting the site header offset
      setPersonaTopMargin(battleHeaderHeight);
    };

    recalc();
    window.addEventListener("resize", recalc);
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      const headerEl = document.querySelector(
        "[data-battle-header]",
      ) as HTMLElement | null;
      if (headerEl) {
        ro = new ResizeObserver(() => recalc());
        ro.observe(headerEl);
      }
    }
    return () => {
      window.removeEventListener("resize", recalc);
      ro?.disconnect();
    };
  }, [isMobile, battle.status, battle.winner]);

  // Determine which persona to show on mobile
  // Keep showing only the second rapper until user reveals scores
  let mobileActiveSide: PersonaPosition | null = null;

  if (streamingPosition) {
    mobileActiveSide = streamingPosition;
  } else if (currentRoundVerses.player1 && !currentRoundVerses.player2) {
    mobileActiveSide = "player1";
  } else if (currentRoundVerses.player2 && !currentRoundVerses.player1) {
    mobileActiveSide = "player2";
  } else if (!currentRoundVerses.player1 && !currentRoundVerses.player2) {
    // New round just started; show the current turn on mobile immediately
    mobileActiveSide = battle.currentTurn ?? null;
  } else if (bothVersesComplete && !scoresAvailable) {
    // Both verses complete but scores not revealed - keep showing the last performer
    // Determine who performed second
    const player1VerseId = currentRoundVerses.player1?.id;
    const player2VerseId = currentRoundVerses.player2?.id;
    if (player1VerseId && player2VerseId) {
      const player1VerseIndex = battle.verses.findIndex(
        (v) => v.id === player1VerseId,
      );
      const player2VerseIndex = battle.verses.findIndex(
        (v) => v.id === player2VerseId,
      );
      mobileActiveSide =
        player2VerseIndex > player1VerseIndex ? "player2" : "player1";
    }
  } else if (bothVersesComplete && scoresAvailable) {
    // Scores revealed - show both personas for comparison
    mobileActiveSide = null;
  }

  // Enable sticky personas only at end of round (voting/scores) or end of battle
  // NOT during active verse generation/streaming
  const enableStickyPersonas =
    isReadingPhase ||
    isVotingPhase ||
    !!scoresAvailable ||
    battle.status === "completed";

  // When scores become visible on mobile, scroll them into view
  const scoreSectionRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!shouldShowScores) return;
    if (typeof window === "undefined") return;
    const id = window.requestAnimationFrame(() => {
      scoreSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
    return () => window.cancelAnimationFrame(id);
  }, [shouldShowScores]);

  // Replay mode header content
  const renderReplayHeader = () => (
    <BattleHeader
      sticky={false}
      variant="blur"
      className="md:bg-transparent md:backdrop-blur-none transition-all duration-300"
      compact={isHeaderCollapsed}
    >
      <div
        className={`transition-all duration-300 ${
          isHeaderCollapsed
            ? "flex flex-row items-center justify-between gap-2 md:flex-row md:gap-3"
            : "flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-8"
        }`}
      >
        {/* Left Side: Winner/Paused and Creator */}
        <div
          className={`shrink-0 flex flex-col items-center md:items-start transition-all duration-300 ${
            isHeaderCollapsed ? "gap-0" : "gap-2"
          }`}
        >
          <WinnerBanner battle={battle} collapsed={isHeaderCollapsed} />
          <CreatorAttribution
            battle={battle}
            hideOnMobileWhenWinnerVisible
            hideWhenCollapsed={isHeaderCollapsed}
          />
        </div>

        {/* Right Side: Round Controls */}
        <RoundControls
          selectedRound={selectedRound}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          onPrev={handlePrevRound}
          onNext={handleNextRound}
          compact={isHeaderCollapsed}
        />
      </div>
    </BattleHeader>
  );

  // Active mode header content
  const renderActiveHeader = () => (
    <BattleHeader sticky={true} variant="blur" className="top-0">
      <div className="flex flex-row md:flex-row items-center justify-between md:justify-start gap-2 md:gap-6">
        <div className="md:flex-1">
          <div className="text-left">
            <div className="text-xs md:text-base text-gray-400 uppercase tracking-wider hidden md:block">
              Stage:
            </div>
            <div className="text-lg md:text-3xl font-bold text-white flex flex-col">
              <span>{stage.name}</span>
              <span className="text-[11px] md:text-base text-gray-400 font-normal flex items-center gap-1">
                <span className="text-base md:text-2xl">{stage.flag}</span>
                {stage.country}
              </span>
            </div>
          </div>
        </div>

        <BattleBell
          currentRound={battle.currentRound}
          completedRounds={progress.completedRounds}
        />

        <div className="md:flex-1 md:flex md:justify-end md:items-center md:gap-3">
          {isLive && (
            <LiveStatusBadge
              isLive={isLive}
              viewerCount={liveViewerCount}
              connectionStatus={liveConnectionStatus}
              canToggle={canManageLive}
              onToggle={onDisconnect}
            />
          )}
          <RoundTracker
            currentRound={battle.currentRound}
            completedRounds={progress.completedRounds}
          />
        </div>
      </div>

      {battle.status === "completed" && battle.winner && (
        <motion.div
          ref={trophyRef}
          className="mt-4 md:mt-6 text-center relative"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <VictoryConfetti
            trigger={confettiOrigin !== null}
            origin={confettiOrigin ?? undefined}
          />
          <div className="text-xl md:text-2xl lg:text-3xl font-bold text-yellow-400 font-(family-name:--font-bebas-neue) relative z-10">
            🏆 WINNER:{" "}
            <span ref={winnerNameRef}>
              {getWinnerPosition(battle) === "player1"
                ? battle.personas.player1.name
                : battle.personas.player2.name}
            </span>{" "}
            🏆
          </div>
        </motion.div>
      )}
    </BattleHeader>
  );

  return (
    <div
      className={`flex flex-col ${isReplayMode ? "min-h-0 md:h-full" : "h-full overflow-y-auto"} bg-linear-to-b from-stage-darker to-stage-dark overflow-x-hidden touch-scroll-container pb-(--mobile-bottom-padding) xl:pb-0`}
      style={{
        ["--mobile-bottom-padding" as any]: mobileBottomPadding || "0px",
      }}
    >
      {/* Header - different content based on mode */}
      {isReplayMode ? renderReplayHeader() : renderActiveHeader()}

      {/* Split Screen Stage */}
      <div
        className="flex-1 overflow-y-auto"
        {...(isReplayMode ? { "data-scroll-container": true } : {})}
      >
        <BattleSplitView
          battle={battle}
          verses={currentRoundVerses}
          roundScore={currentRoundScore}
          showRoundWinner={!!shouldShowRoundWinner}
          mobileActiveSide={isReplayMode ? undefined : mobileActiveSide}
          streamingPersonaId={streamingPersonaId}
          streamingText={streamingText}
          streamingPosition={streamingPosition}
          mobileTopOffset={isMobile && !isReplayMode ? personaTopMargin : 0}
          enableStickyPersonas={isReplayMode ? true : enableStickyPersonas}
          isBattleEnd={isReplayMode}
          cardPadding={isReplayMode ? "px-3 py-2 md:p-4" : undefined}
        />
      </div>

      {/* Score Display (when scores are available) - only in active mode */}
      {!isReplayMode && shouldShowScores && currentRoundScore && (
        <motion.div
          ref={scoreSectionRef}
          className="p-4 md:p-6 border-t border-gray-800 bg-gray-900/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="max-w-4xl mx-auto">
            <motion.h3
              className="text-xl md:text-2xl font-(family-name:--font-bebas-neue) text-center mb-4 text-yellow-400"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              ROUND {currentRoundScore.round} SCORES
            </motion.h3>
            <BattleScoreSection
              battle={battle}
              roundScore={currentRoundScore}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
