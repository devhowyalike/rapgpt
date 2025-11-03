/**
 * Main battle stage component
 */

"use client";

import type { Battle } from "@/lib/shared";
import { PersonaCard } from "./persona-card";
import { VerseDisplay } from "./verse-display";
import { RoundTracker } from "./round-tracker";
import { ScoreDisplay } from "./score-display";
import { getRoundVerses, getBattleProgress } from "@/lib/battle-engine";
import { motion } from "framer-motion";
import { BattleBell } from "./battle-bell";
import { VictoryConfetti } from "./victory-confetti";
import { useEffect, useRef, useLayoutEffect, useState } from "react";
import { Eye } from "lucide-react";
import { DEFAULT_STAGE } from "@/lib/shared/stages";

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
  const currentRoundVerses = getRoundVerses(battle, battle.currentRound);
  const currentRoundScore = battle.scores.find(
    (s) => s.round === battle.currentRound
  );

  // Track if user has revealed scores for this round
  const [scoresRevealed, setScoresRevealed] = useState(false);

  // Reset scoresRevealed when round changes
  useEffect(() => {
    setScoresRevealed(false);
  }, [battle.currentRound]);

  // Scores are available when voting is complete
  const scoresAvailable =
    currentRoundScore && !isReadingPhase && !isVotingPhase;

  // Only show scores after user clicks reveal button
  const shouldShowScores = scoresAvailable && scoresRevealed;

  // Show reveal button when scores are available but not yet revealed
  const shouldShowRevealButton = scoresAvailable && !scoresRevealed;

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
  const bothVersesComplete =
    currentRoundVerses.left && currentRoundVerses.right;

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
  } else if (bothVersesComplete && !scoresRevealed) {
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
  } else if (bothVersesComplete && scoresRevealed) {
    // Scores revealed - show both personas for comparison
    mobileActiveSide = null;
  }

  // Handle reveal scores button click
  const scoreSectionRef = useRef<HTMLDivElement | null>(null);
  const handleRevealScores = () => {
    setScoresRevealed(true);
    // Scroll to scores after revealing
    setTimeout(() => {
      scoreSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-linear-to-b from-stage-darker to-stage-dark overflow-x-hidden">
      {/* Header with Round Tracker */}
      <div className="sticky left-0 right-0 z-20 px-4 py-2 md:px-6 md:py-4 border-b border-gray-800 bg-stage-darker/95 backdrop-blur-sm top-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-row md:flex-row items-center justify-between md:justify-start gap-2 md:gap-6">
            <div className="md:flex-1">
              <div className="text-left">
                <div className="text-xs md:text-base text-gray-400 uppercase tracking-wider">
                  Stage
                </div>
                <div className="text-xl md:text-3xl font-bold text-white flex flex-col">
                  <span>{DEFAULT_STAGE.name}</span>
                  <span className="text-xs md:text-base text-gray-400 font-normal flex items-center gap-1">
                    <span className="text-lg md:text-2xl">
                      {DEFAULT_STAGE.flag}
                    </span>
                    {DEFAULT_STAGE.country}
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
        </div>
      </div>

      {/* Split Screen Stage */}
      <div className="flex-1">
        <div className="max-w-7xl mx-auto h-full">
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-800 h-full">
            {/* Left Persona */}
            <div
              className={`${
                mobileActiveSide && mobileActiveSide !== "left"
                  ? "hidden md:flex"
                  : "flex"
              } flex-col md:min-h-0`}
            >
            <div
              className="p-3 md:p-4 border-b border-gray-800"
              style={isMobile ? { marginTop: personaTopMargin } : undefined}
            >
              <PersonaCard
                persona={battle.personas.left}
                position="left"
                isActive={
                  battle.currentTurn === "left" ||
                  streamingPersonaId === battle.personas.left.id
                }
                isRoundWinner={
                  shouldShowRoundWinner &&
                  currentRoundScore?.winner === battle.personas.left.id
                }
              />
            </div>

            <div className="flex-1 stage-spotlight">
              <VerseDisplay
                verse={currentRoundVerses.left}
                persona={battle.personas.left}
                position="left"
                isStreaming={streamingPersonaId === battle.personas.left.id}
                streamingText={streamingText || undefined}
              />
            </div>
          </div>

          {/* Right Persona */}
          <div
            className={`${
              mobileActiveSide && mobileActiveSide !== "right"
                ? "hidden md:flex"
                : "flex"
            } flex-col md:min-h-0`}
          >
            <div
              className="p-3 md:p-4 border-b border-gray-800"
              style={isMobile ? { marginTop: personaTopMargin } : undefined}
            >
              <PersonaCard
                persona={battle.personas.right}
                position="right"
                isActive={
                  battle.currentTurn === "right" ||
                  streamingPersonaId === battle.personas.right.id
                }
                isRoundWinner={
                  shouldShowRoundWinner &&
                  currentRoundScore?.winner === battle.personas.right.id
                }
              />
            </div>

            <div className="flex-1 stage-spotlight">
              <VerseDisplay
                verse={currentRoundVerses.right}
                persona={battle.personas.right}
                position="right"
                isStreaming={streamingPersonaId === battle.personas.right.id}
                streamingText={streamingText || undefined}
              />
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Reveal Scores Button */}
      {shouldShowRevealButton && currentRoundScore && (
        <motion.div
          className="p-4 md:p-6 border-t border-gray-800 bg-gray-900/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="max-w-4xl mx-auto text-center">
            <motion.button
              onClick={handleRevealScores}
              className="px-8 py-4 bg-linear-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 rounded-lg text-white font-bold text-lg md:text-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-3 mx-auto"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Eye className="w-6 h-6" />
              Reveal Round {currentRoundScore.round} Scores
            </motion.button>
            <p className="text-gray-400 text-sm mt-3">
              Ready to see who won? Compare both verses and check the scores.
            </p>
          </div>
        </motion.div>
      )}

      {/* Score Display (when user reveals scores) */}
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
