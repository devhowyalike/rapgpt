/**
 * Main battle stage component
 */

"use client";

import type { Battle } from "@/lib/shared";
import { RoundTracker } from "./round-tracker";
import { ScoreDisplay } from "./score-display";
import { getBattleProgress } from "@/lib/battle-engine";
import { motion } from "framer-motion";
import { BattleBell } from "./battle-bell";
import { VictoryConfetti } from "./victory-confetti";
import { useEffect, useRef, useLayoutEffect, useState } from "react";
import { getStage, DEFAULT_STAGE } from "@/lib/shared/stages";
import { useRoundData } from "@/lib/hooks/use-round-data";
import { BattleHeader } from "./battle/battle-header";
import { BattleSplitView } from "./battle/battle-split-view";

interface BattleStageProps {
  battle: Battle;
  streamingPersonaId?: string | null;
  streamingText?: string | null;
  isReadingPhase?: boolean;
  isVotingPhase?: boolean;
  votingCompletedRound?: number | null;
}

export function BattleStage({
  battle,
  streamingPersonaId,
  streamingText,
  isReadingPhase = false,
  isVotingPhase = false,
  votingCompletedRound = null,
}: BattleStageProps) {
  const progress = getBattleProgress(battle);
  const {
    verses: currentRoundVerses,
    score: currentRoundScore,
    hasBothVerses: bothVersesComplete,
  } = useRoundData(battle, battle.currentRound);

  // Get the stage for this battle
  const stage = getStage(battle.stageId) || DEFAULT_STAGE;

  // Scores are available when voting is complete
  const scoresAvailable =
    currentRoundScore && !isReadingPhase && !isVotingPhase;

  // Show scores automatically when available (no manual reveal button)
  const shouldShowScores = !!scoresAvailable;

  // Only show round winner badge after voting has been completed for the current round
  const shouldShowRoundWinner =
    votingCompletedRound !== null &&
    votingCompletedRound >= battle.currentRound;

  // Mobile-only offset so the first persona does not render under the sticky trophy/header
  const [isMobile, setIsMobile] = useState(false);
  const trophyRef = useRef<HTMLDivElement | null>(null);
  const [personaTopMargin, setPersonaTopMargin] = useState(0);

  // Track viewport size for mobile logic
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Compute combined offset: site header height (CSS var) + trophy banner height
  useLayoutEffect(() => {
    if (!isMobile) {
      setPersonaTopMargin(0);
      return;
    }

    const recalc = () => {
      const rootStyle = getComputedStyle(document.documentElement);
      const headerVar = rootStyle.getPropertyValue("--header-height").trim();
      const headerPx = parseFloat(headerVar || "0") || 0;

      const trophyEl = trophyRef.current;
      if (!trophyEl) {
        setPersonaTopMargin(0);
        return;
      }

      const rect = trophyEl.getBoundingClientRect();
      const trophyStyle = getComputedStyle(trophyEl);
      const mt = parseFloat(trophyStyle.marginTop || "0") || 0;
      const mb = parseFloat(trophyStyle.marginBottom || "0") || 0;
      const trophyTotal = rect.height + mt + mb;
      // Include the distance from the top of the sticky header down to the trophy block
      const distanceToTrophy = trophyEl.offsetTop || 0;

      setPersonaTopMargin(headerPx + distanceToTrophy + trophyTotal);
    };

    recalc();
    window.addEventListener("resize", recalc);
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && trophyRef.current) {
      ro = new ResizeObserver(() => recalc());
      ro.observe(trophyRef.current);
    }
    return () => {
      window.removeEventListener("resize", recalc);
      ro?.disconnect();
    };
  }, [isMobile, battle.status, battle.winner]);

  // Determine which persona to show on mobile
  // Keep showing only the second rapper until user reveals scores
  let mobileActiveSide: "left" | "right" | null = null;

  if (streamingPersonaId === battle.personas.left.id) {
    mobileActiveSide = "left";
  } else if (streamingPersonaId === battle.personas.right.id) {
    mobileActiveSide = "right";
  } else if (currentRoundVerses.left && !currentRoundVerses.right) {
    mobileActiveSide = "left";
  } else if (currentRoundVerses.right && !currentRoundVerses.left) {
    mobileActiveSide = "right";
  } else if (!currentRoundVerses.left && !currentRoundVerses.right) {
    // New round just started; show the current turn on mobile immediately
    mobileActiveSide = battle.currentTurn ?? null;
  } else if (bothVersesComplete && !scoresAvailable) {
    // Both verses complete but scores not revealed - keep showing the last performer
    // Determine who performed second
    const leftVerseId = currentRoundVerses.left?.id;
    const rightVerseId = currentRoundVerses.right?.id;
    if (leftVerseId && rightVerseId) {
      const leftVerseIndex = battle.verses.findIndex(
        (v) => v.id === leftVerseId
      );
      const rightVerseIndex = battle.verses.findIndex(
        (v) => v.id === rightVerseId
      );
      mobileActiveSide = rightVerseIndex > leftVerseIndex ? "right" : "left";
    }
  } else if (bothVersesComplete && scoresAvailable) {
    // Scores revealed - show both personas for comparison
    mobileActiveSide = null;
  }

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

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-linear-to-b from-stage-darker to-stage-dark overflow-x-hidden">
      {/* Header with Round Tracker */}
      <BattleHeader sticky={true} variant="blur" className="top-0">
        <div className="flex flex-row md:flex-row items-center justify-between md:justify-start gap-2 md:gap-6">
          <div className="md:flex-1">
            <div className="text-left">
              <div className="text-xs md:text-base text-gray-400 uppercase tracking-wider">
                Stage:
              </div>
              <div className="text-xl md:text-3xl font-bold text-white flex flex-col">
                <span>{stage.name}</span>
                <span className="text-xs md:text-base text-gray-400 font-normal flex items-center gap-1">
                  <span className="text-lg md:text-2xl">{stage.flag}</span>
                  {stage.country}
                </span>
              </div>
            </div>
          </div>

          <BattleBell
            currentRound={battle.currentRound}
            completedRounds={progress.completedRounds}
          />

          <div className="md:flex-1 md:flex md:justify-end">
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
            <VictoryConfetti trigger={true} />
            <div className="text-xl md:text-2xl lg:text-3xl font-bold text-yellow-400 font-(family-name:--font-bebas-neue) relative z-10">
              🏆 WINNER:{" "}
              {battle.personas.left.id === battle.winner
                ? battle.personas.left.name
                : battle.personas.right.name}{" "}
              🏆
            </div>
          </motion.div>
        )}
      </BattleHeader>

      {/* Split Screen Stage */}
      <div className="flex-1">
        <BattleSplitView
          battle={battle}
          leftVerse={currentRoundVerses.left}
          rightVerse={currentRoundVerses.right}
          roundScore={currentRoundScore}
          showRoundWinner={shouldShowRoundWinner}
          mobileActiveSide={mobileActiveSide}
          streamingPersonaId={streamingPersonaId}
          streamingText={streamingText}
          mobileTopOffset={isMobile ? personaTopMargin : 0}
        />
      </div>

      {/* Score Display (when scores are available) */}
      {shouldShowScores && currentRoundScore && (
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
            <ScoreDisplay
              roundScore={currentRoundScore}
              leftPersona={battle.personas.left}
              rightPersona={battle.personas.right}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
