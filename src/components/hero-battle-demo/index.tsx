"use client";

import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

import { StageHeader, PersonaCardDemo, VerseDemo } from "./components";
import { MC1, MC2, VERSES, STATE_CONFIGS, STATE_ORDER } from "./data";
import { useInView, useSwipeNavigation } from "./hooks";
import {
  ScoringOverlay,
  WinnerOverlay,
  SongStyleSelectOverlay,
  SongGeneratingOverlay,
  SongCompleteOverlay,
  PauseOverlay,
  FrostOverlay,
} from "./overlays";
import { PLAYER_COLORS } from "./utils";

// Re-export for backwards compatibility
export type { DemoState, MCData, StateConfig } from "./types";

// =============================================================================
// Main Component
// =============================================================================

interface HeroBattleDemoProps {
  isPaused?: boolean;
  setIsPaused?: (paused: boolean | ((prev: boolean) => boolean)) => void;
}

export function HeroBattleDemo({
  isPaused: externalPaused,
  setIsPaused: setExternalPaused,
}: HeroBattleDemoProps) {
  const [stateIndex, setStateIndex] = useState(0);
  const [internalPaused, setInternalPaused] = useState(false);

  // Use external state if provided, otherwise fallback to internal
  const isPaused =
    externalPaused !== undefined ? externalPaused : internalPaused;
  const setIsPaused =
    setExternalPaused !== undefined ? setExternalPaused : setInternalPaused;

  const currentStateName = STATE_ORDER[stateIndex];
  const config = STATE_CONFIGS[currentStateName];

  // Navigation helpers
  const goToNext = useCallback(() => {
    setStateIndex((prev) => (prev + 1) % STATE_ORDER.length);
    setIsPaused(false);
  }, [setIsPaused]);

  const goToPrev = useCallback(() => {
    setStateIndex((prev) => (prev === 0 ? STATE_ORDER.length - 1 : prev - 1));
    setIsPaused(false);
  }, [setIsPaused]);

  // Intersection Observer - pause when scrolled away, resume when back in view
  const {
    ref: containerRef,
    isInView,
    isInViewRef,
  } = useInView<HTMLDivElement>({
    threshold: 0.3,
    onEnter: () => {
      setIsPaused(false);
    },
    onLeave: () => {
      setIsPaused(true);
    },
  });

  // Auto-advance
  useEffect(() => {
    if (!isInView || isPaused) return;

    const timer = setTimeout(goToNext, config.duration);
    return () => clearTimeout(timer);
  }, [stateIndex, isInView, isPaused, config.duration, goToNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isInViewRef.current) return;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        goToNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goToPrev();
      } else if (e.key === " ") {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrev, setIsPaused, isInViewRef]);

  // Touch/swipe navigation
  const { handleTouchStart, handleTouchEnd } = useSwipeNavigation({
    onSwipeLeft: goToNext,
    onSwipeRight: goToPrev,
  });

  // Computed values
  const completedRounds = isPostBattleState(currentStateName)
    ? [1, 2, 3]
    : [1, 2];
  const showFrostOverlay =
    config.showScoring ||
    config.showWinner ||
    config.showSongStyleSelect ||
    config.showSongGenerating ||
    config.showSongComplete;

  return (
    <MotionConfig reducedMotion={isPaused ? "always" : "never"}>
      <div
        ref={containerRef}
        className="relative w-full group touch-pan-y"
        data-paused={isPaused}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={
          {
            "--player1-color": PLAYER_COLORS.player1,
            "--player2-color": PLAYER_COLORS.player2,
          } as React.CSSProperties
        }
      >
        {/* Measurement container - invisible but defines height */}
        <MeasurementContainer />

        {/* Visible demo container */}
        <div className="absolute inset-0 flex flex-col overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-linear-to-b from-gray-900 via-gray-950 to-black" />

          {/* Stage Header */}
          <div className="relative z-10 shrink-0">
            <StageHeader
              currentRound={config.round}
              completedRounds={completedRounds}
              isPaused={isPaused}
            />
          </div>

          {/* Split View - Two Columns */}
          <div className="relative z-10 flex-1 grid grid-cols-2 pb-8">
            {/* Player 1 (Left) */}
            <PlayerColumn
              mc={MC1}
              verses={VERSES.mc1}
              position="player1"
              isActive={config.activeMC === "mc1" || config.activeMC === "both"}
              isStreaming={config.streamingMC === "mc1"}
              showIndicator={config.showStreamingIndicator}
              visibleLines={config.mc1Lines || 0}
              isPaused={isPaused}
              className="border-r border-gray-800/50"
            />

            {/* Player 2 (Right) */}
            <PlayerColumn
              mc={MC2}
              verses={VERSES.mc2}
              position="player2"
              isActive={config.activeMC === "mc2" || config.activeMC === "both"}
              isStreaming={config.streamingMC === "mc2"}
              showIndicator={config.showStreamingIndicator}
              visibleLines={config.mc2Lines || 0}
              isPaused={isPaused}
            />
          </div>

          {/* Overlays */}
          <AnimatePresence>
            {showFrostOverlay && <FrostOverlay key="frost" />}
            {isPaused && <PauseOverlay key="pause" />}
            {config.showScoring && (
              <ScoringOverlay key="scoring" isPaused={isPaused} />
            )}
            {config.showWinner && (
              <WinnerOverlay key="winner" mc={MC2} isPaused={isPaused} />
            )}
            {config.showSongStyleSelect && (
              <SongStyleSelectOverlay key="style" />
            )}
            {config.showSongGenerating && (
              <SongGeneratingOverlay key="generating" isPaused={isPaused} />
            )}
            {config.showSongComplete && (
              <SongCompleteOverlay key="complete" isPaused={isPaused} />
            )}
          </AnimatePresence>

          {/* State indicator pills */}
          <StateIndicator
            currentIndex={stateIndex}
            totalStates={STATE_ORDER.length}
            onSelect={(idx) => {
              setStateIndex(idx);
              setIsPaused(false);
            }}
          />

          {/* Frost overlay on hover */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-30" />
        </div>
      </div>
    </MotionConfig>
  );
}

// =============================================================================
// Helper Components
// =============================================================================

function isPostBattleState(state: string): boolean {
  return [
    "winner",
    "song-style-select",
    "song-generating",
    "song-complete",
  ].includes(state);
}

interface PlayerColumnProps {
  mc: typeof MC1;
  verses: readonly string[];
  position: "player1" | "player2";
  isActive: boolean;
  isStreaming?: boolean;
  showIndicator?: boolean;
  visibleLines: number;
  isPaused: boolean;
  className?: string;
}

function PlayerColumn({
  mc,
  verses,
  position,
  isActive,
  isStreaming,
  showIndicator,
  visibleLines,
  isPaused,
  className,
}: PlayerColumnProps) {
  return (
    <div className={`flex flex-col overflow-hidden ${className || ""}`}>
      <PersonaCardDemo
        mc={mc}
        position={position}
        isActive={isActive}
        isPaused={isPaused}
      />
      <VerseDemo
        lines={[...verses]}
        visibleCount={visibleLines}
        position={position}
        isStreaming={isStreaming}
        showIndicator={showIndicator}
        mcName={mc.name}
        shortMcName={mc.shortName}
        isPaused={isPaused}
      />
    </div>
  );
}

function MeasurementContainer() {
  return (
    <div
      aria-hidden="true"
      className="w-full flex flex-col pointer-events-none"
      style={{ visibility: "hidden" }}
    >
      <div className="shrink-0">
        <StageHeader currentRound={3} completedRounds={[1, 2]} isPaused />
      </div>
      <div className="flex-1 grid grid-cols-2 pb-8">
        <div className="flex flex-col border-r border-gray-800/50">
          <PersonaCardDemo
            mc={MC1}
            position="player1"
            isActive={false}
            isPaused
          />
          <VerseDemo
            lines={[...VERSES.mc1]}
            visibleCount={4}
            position="player1"
            mcName={MC1.name}
            shortMcName={MC1.shortName}
            isPaused
          />
        </div>
        <div className="flex flex-col">
          <PersonaCardDemo
            mc={MC2}
            position="player2"
            isActive={false}
            isPaused
          />
          <VerseDemo
            lines={[...VERSES.mc2]}
            visibleCount={4}
            position="player2"
            mcName={MC2.name}
            shortMcName={MC2.shortName}
            isPaused
          />
        </div>
      </div>
    </div>
  );
}

interface StateIndicatorProps {
  currentIndex: number;
  totalStates: number;
  onSelect: (index: number) => void;
}

function StateIndicator({
  currentIndex,
  totalStates,
  onSelect,
}: StateIndicatorProps) {
  return (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
      <div className="flex gap-1">
        {Array.from({ length: totalStates }).map((_, idx) => (
          <motion.button
            key={idx}
            onClick={() => onSelect(idx)}
            className={`h-1 rounded-full transition-all duration-300 ${
              idx === currentIndex ? "w-4 sm:w-6" : "w-1 sm:w-1.5"
            }`}
            animate={{
              backgroundColor: idx === currentIndex ? "#facc15" : "#374151",
            }}
          />
        ))}
      </div>
    </div>
  );
}
