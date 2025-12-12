/**
 * Custom hook for battle stage state management
 * Centralizes all the complex state logic used by BattleStage component
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { getBattleProgress } from "@/lib/battle-engine";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import { useRoundData } from "@/lib/hooks/use-round-data";
import { useRoundNavigation } from "@/lib/hooks/use-round-navigation";
import { useScoreRevealDelay } from "@/lib/hooks/use-score-reveal-delay";
import type { Battle, PersonaPosition } from "@/lib/shared";

interface UseBattleStageOptions {
  battle: Battle;
  mode: "active" | "replay";
  isReadingPhase: boolean;
  isVotingPhase: boolean;
  votingCompletedRound: number | null;
  scoreDelaySeconds: number;
}

export interface BattleStageState {
  // Round navigation (replay mode)
  selectedRound: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  handlePrevRound: () => void;
  handleNextRound: () => void;

  // Display state
  displayRound: number;
  progress: ReturnType<typeof getBattleProgress>;
  currentRoundVerses: ReturnType<typeof useRoundData>["verses"];
  currentRoundScore: ReturnType<typeof useRoundData>["score"];
  bothVersesComplete: boolean;

  // Score visibility
  scoresAvailable: boolean;
  shouldShowScores: boolean;
  shouldShowRoundWinner: boolean;

  // Mobile state
  isMobile: boolean;
  isHeaderCollapsed: boolean;
  personaTopMargin: number;
  mobileActiveSide: PersonaPosition | null;
  enableStickyPersonas: boolean;

  // Confetti
  confettiOrigin: { x: number; y: number } | null;
  winnerNameRef: React.RefObject<HTMLSpanElement | null>;
  trophyRef: React.RefObject<HTMLDivElement | null>;
  scoreSectionRef: React.RefObject<HTMLDivElement | null>;
}

export function useBattleStage({
  battle,
  mode,
  isReadingPhase,
  isVotingPhase,
  scoreDelaySeconds,
}: UseBattleStageOptions): BattleStageState {
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

  // Scores are available when voting is complete (active mode) or always in replay mode
  const scoresAvailable = isReplayMode
    ? !!currentRoundScore
    : !!(currentRoundScore && !isReadingPhase && !isVotingPhase);

  // Centralized score reveal delay via shared hook (skip delay in replay mode)
  const scoresAvailableRound =
    scoresAvailable && currentRoundScore ? currentRoundScore.round : null;
  const { revealedRound } = useScoreRevealDelay(
    scoresAvailableRound,
    isReplayMode ? 0 : scoreDelaySeconds,
    battle.id,
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
  // 2. Active mode: show when scores are revealed (after delay)
  const shouldShowRoundWinner = isReplayMode
    ? !!currentRoundScore
    : shouldShowScores;

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
  const scoreSectionRef = useRef<HTMLDivElement | null>(null);
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

  if (!isReplayMode) {
    if (currentRoundVerses.player1 && !currentRoundVerses.player2) {
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
  }

  // Enable sticky personas always to keep profiles visible during streaming
  const enableStickyPersonas = true;

  // When scores become visible on mobile, scroll them into view
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

  return {
    // Round navigation
    selectedRound,
    canGoPrev,
    canGoNext,
    handlePrevRound,
    handleNextRound,

    // Display state
    displayRound,
    progress,
    currentRoundVerses,
    currentRoundScore,
    bothVersesComplete,

    // Score visibility
    scoresAvailable,
    shouldShowScores,
    shouldShowRoundWinner,

    // Mobile state
    isMobile,
    isHeaderCollapsed,
    personaTopMargin,
    mobileActiveSide,
    enableStickyPersonas,

    // Confetti
    confettiOrigin,
    winnerNameRef,
    trophyRef,
    scoreSectionRef,
  };
}

