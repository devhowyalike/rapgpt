"use client";

import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import {
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  forwardRef,
} from "react";

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
import { isModalOpen } from "@/lib/utils";

// Re-export for backwards compatibility
export type { DemoState, MCData, StateConfig } from "./types";

// =============================================================================
// Main Component
// =============================================================================

interface HeroBattleDemoProps {
  isPaused?: boolean;
  setIsPaused?: (paused: boolean | ((prev: boolean) => boolean)) => void;
}

export interface HeroBattleDemoRef {
  goToNext: () => void;
  goToPrev: () => void;
}

export const HeroBattleDemo = forwardRef<
  HeroBattleDemoRef,
  HeroBattleDemoProps
>(function HeroBattleDemo(
  { isPaused: externalPaused, setIsPaused: setExternalPaused },
  ref
) {
  const [stateIndex, setStateIndex] = useState(0);
  const [internalPaused, setInternalPaused] = useState(false);

  // Use external state if provided, otherwise fallback to internal
  const isPaused =
    externalPaused !== undefined ? externalPaused : internalPaused;
  const setIsPaused =
    setExternalPaused !== undefined ? setExternalPaused : setInternalPaused;

  const effectivePaused = isPaused;

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

  // Expose navigation methods to parent via ref
  useImperativeHandle(
    ref,
    () => ({
      goToNext,
      goToPrev,
    }),
    [goToNext, goToPrev]
  );

  // Intersection Observer - pause when scrolled away, resume when back in view
  const {
    ref: containerRef,
    isInView,
    isInViewRef,
  } = useInView<HTMLDivElement>({
    threshold: 0.5,
    onEnter: () => {
      setIsPaused(false);
    },
    onLeave: () => {
      setIsPaused(true);
    },
  });

  // Auto-advance (pauses when hovering too)
  useEffect(() => {
    if (!isInView || effectivePaused) return;

    const timer = setTimeout(goToNext, config.duration);
    return () => clearTimeout(timer);
  }, [stateIndex, isInView, effectivePaused, config.duration, goToNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isInViewRef.current) return;

      // Don't handle keyboard events if a modal/dialog is open (e.g., Clerk sign-in modal)
      if (isModalOpen()) return;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        goToNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goToPrev();
      } else if (e.key === " ") {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      } else if (e.key === "Escape" && isPaused) {
        e.preventDefault();
        setIsPaused(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrev, setIsPaused, isInViewRef, isPaused]);

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
    <MotionConfig reducedMotion={effectivePaused ? "always" : "never"}>
      <div
        ref={containerRef}
        className="relative w-full touch-pan-y"
        data-paused={effectivePaused}
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

        {/* Visible demo container - contain: content for layout isolation */}
        <div
          className="absolute inset-0 flex flex-col overflow-hidden"
          style={{ contain: "content" }}
        >
          {/* Background */}
          <div className="absolute inset-0 bg-linear-to-b from-gray-900 via-gray-950 to-black" />

          {/* Stage Header */}
          <div className="relative z-10 shrink-0">
            <StageHeader
              currentRound={config.round}
              completedRounds={completedRounds}
              isPaused={effectivePaused}
            />
          </div>

          {/* Split View - Two Columns on desktop, single MC on mobile */}
          <div className="relative z-10 flex-1 grid md:grid-cols-2 pb-8">
            {/* Player 1 (Left on desktop, shown on mobile only when MC1 is active) */}
            <PlayerColumn
              mc={MC1}
              verses={VERSES.mc1}
              position="player1"
              isActive={config.activeMC === "mc1" || config.activeMC === "both"}
              isStreaming={config.streamingMC === "mc1"}
              showIndicator={config.showStreamingIndicator}
              visibleLines={config.mc1Lines || 0}
              isPaused={effectivePaused}
              className="md:border-r border-gray-800/50"
              mobileVisible={config.activeMC === "mc1"}
            />

            {/* Player 2 (Right on desktop, shown on mobile when MC2 is active or during post-battle states) */}
            <PlayerColumn
              mc={MC2}
              verses={VERSES.mc2}
              position="player2"
              isActive={config.activeMC === "mc2" || config.activeMC === "both"}
              isStreaming={config.streamingMC === "mc2"}
              showIndicator={config.showStreamingIndicator}
              visibleLines={config.mc2Lines || 0}
              isPaused={effectivePaused}
              mobileVisible={config.activeMC !== "mc1"}
            />
          </div>

          {/* Overlays */}
          <AnimatePresence>
            {showFrostOverlay && <FrostOverlay key="frost" />}
            {isPaused && (
              <PauseOverlay key="pause" onUnpause={() => setIsPaused(false)} />
            )}
            {config.showScoring && (
              <ScoringOverlay key="scoring" isPaused={effectivePaused} />
            )}
            {config.showWinner && (
              <WinnerOverlay key="winner" mc={MC2} isPaused={effectivePaused} />
            )}
            {config.showSongStyleSelect && (
              <SongStyleSelectOverlay key="style" />
            )}
            {config.showSongGenerating && (
              <SongGeneratingOverlay
                key="generating"
                isPaused={effectivePaused}
              />
            )}
            {config.showSongComplete && (
              <SongCompleteOverlay key="complete" isPaused={effectivePaused} />
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
        </div>
      </div>
    </MotionConfig>
  );
});

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
  /** Whether this column is visible on mobile (hidden if false) */
  mobileVisible?: boolean;
}

const PlayerColumn = memo(function PlayerColumn({
  mc,
  verses,
  position,
  isActive,
  isStreaming,
  showIndicator,
  visibleLines,
  isPaused,
  className,
  mobileVisible = true,
}: PlayerColumnProps) {
  // Convert readonly array to mutable only once, memoized
  const mutableVerses = useMemo(() => [...verses], [verses]);

  return (
    <div
      className={`flex flex-col overflow-hidden ${
        !mobileVisible ? "hidden md:flex" : ""
      } ${className || ""}`}
    >
      <PersonaCardDemo
        mc={mc}
        position={position}
        isActive={isActive}
        isPaused={isPaused}
      />
      <VerseDemo
        lines={mutableVerses}
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
});

interface StateIndicatorProps {
  currentIndex: number;
  totalStates: number;
  onSelect: (index: number) => void;
}

const StateIndicator = memo(function StateIndicator({
  currentIndex,
  totalStates,
  onSelect,
}: StateIndicatorProps) {
  // Memoize array to prevent recreation on every render
  const stateIndices = useMemo(
    () => Array.from({ length: totalStates }, (_, i) => i),
    [totalStates]
  );

  return (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20 bg-black/60 px-3 py-1.5 rounded-full border border-white/5">
      <div className="flex gap-1">
        {stateIndices.map((idx) => (
          <button
            key={idx}
            onClick={() => onSelect(idx)}
            className={`h-1 rounded-full transition-all duration-300 ${
              idx === currentIndex
                ? "w-4 sm:w-6 bg-yellow-400"
                : "w-1 sm:w-1.5 bg-gray-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
});

// Memoized measurement container - renders once to establish layout height
// On mobile: measures single MC (since only one shows at a time)
// On desktop: measures both MCs side by side
const MeasurementContainer = memo(function MeasurementContainer() {
  // Use the verse with more total characters (causes more text wrapping)
  const mc1TotalChars = VERSES.mc1.join("").length;
  const mc2TotalChars = VERSES.mc2.join("").length;
  const mc2IsLonger = mc2TotalChars > mc1TotalChars;

  const longerVerse = mc2IsLonger ? VERSES.mc2 : VERSES.mc1;
  const longerMC = mc2IsLonger ? MC2 : MC1;
  const longerPosition = mc2IsLonger ? "player2" : "player1";

  return (
    <div
      aria-hidden="true"
      className="w-full flex flex-col pointer-events-none"
      style={{ visibility: "hidden" }}
    >
      <div className="shrink-0">
        <StageHeader currentRound={3} completedRounds={[1, 2]} isPaused />
      </div>
      {/* Mobile: single column with longest verse */}
      <div className="flex-1 md:hidden pb-8">
        <div className="flex flex-col">
          <PersonaCardDemo
            mc={longerMC}
            position={longerPosition}
            isActive={false}
            isPaused
          />
          <VerseDemo
            lines={[...longerVerse]}
            visibleCount={4}
            position={longerPosition}
            mcName={longerMC.name}
            shortMcName={longerMC.shortName}
            isPaused
          />
        </div>
      </div>
      {/* Desktop: two columns */}
      <div className="flex-1 hidden md:grid md:grid-cols-2 pb-8">
        <div className="flex flex-col md:border-r border-gray-800/50">
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
});
