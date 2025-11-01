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
import { APP_TITLE, LAYOUT } from "@/lib/constants";
import { BattleBell } from "./battle-bell";
import { VictoryConfetti } from "./victory-confetti";

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

  // Only show scores after voting is complete for the current round
  // Scores should be hidden during reading and voting phases
  const shouldShowScores =
    currentRoundScore && !isReadingPhase && !isVotingPhase;

  // Only show round winner badge after voting has been completed for the current round
  const shouldShowRoundWinner =
    votingCompletedRound !== null &&
    votingCompletedRound >= battle.currentRound;

  // Calculate mobile header spacer height dynamically
  const mobileHeaderHeight =
    LAYOUT.SITE_HEADER_HEIGHT + LAYOUT.BATTLE_STAGE_HEADER_HEIGHT_MOBILE;
  const mobileHeaderHeightWithWinner =
    mobileHeaderHeight + LAYOUT.WINNER_SECTION_HEIGHT_MOBILE;

  return (
    <div className="flex flex-col min-h-0 md:h-full bg-linear-to-b from-stage-darker to-stage-dark">
      {/* Header with Round Tracker */}
      <div
        className="fixed md:relative md:top-0 left-0 right-0 z-20 px-4 py-3 md:px-6 md:py-5 border-b border-gray-800 bg-stage-darker/95 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none"
        style={{ top: `${LAYOUT.SITE_HEADER_HEIGHT}px` }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-row md:flex-row items-center justify-between md:justify-start gap-2 md:gap-6">
            <motion.h1
              className="text-2xl md:text-4xl lg:text-6xl font-bold tracking-wider leading-none md:flex-1"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="bg-linear-to-r from-yellow-400 via-red-500 to-purple-600 text-transparent bg-clip-text">
                {APP_TITLE}
              </span>
            </motion.h1>

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

      {/* Spacer for mobile fixed header */}
      <div
        className="md:hidden"
        style={{
          height:
            battle.status === "completed" && battle.winner
              ? `${mobileHeaderHeightWithWinner}px`
              : `${mobileHeaderHeight}px`,
        }}
      />

      {/* Split Screen Stage */}
      <div className="flex-1 md:overflow-y-auto">
        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-800 md:h-full">
          {/* Left Persona */}
          <div className="flex flex-col min-h-[400px] md:min-h-0">
            <div className="p-3 md:p-4 border-b border-gray-800">
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
          <div className="flex flex-col min-h-[400px] md:min-h-0">
            <div className="p-3 md:p-4 border-b border-gray-800">
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

      {/* Score Display (when round is complete and voting is done) */}
      {shouldShowScores && currentRoundScore && (
        <motion.div
          className="p-4 md:p-6 pb-24 md:pb-6 border-t border-gray-800 bg-gray-900/30"
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
