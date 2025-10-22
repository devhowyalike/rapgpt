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
import { APP_TITLE } from "@/lib/constants";

interface BattleStageProps {
  battle: Battle;
  streamingPersonaId?: string | null;
  streamingText?: string | null;
}

export function BattleStage({
  battle,
  streamingPersonaId,
  streamingText,
}: BattleStageProps) {
  const progress = getBattleProgress(battle);
  const currentRoundVerses = getRoundVerses(battle, battle.currentRound);
  const currentRoundScore = battle.scores.find(
    (s) => s.round === battle.currentRound
  );

  return (
    <div className="flex flex-col min-h-0 md:h-full bg-linear-to-b from-stage-darker to-stage-dark">
      {/* Header with Round Tracker */}
      <div className="p-4 md:p-6 border-b border-gray-800">
        <div className="max-w-7xl mx-auto">
          <motion.h1
            className="text-4xl md:text-6xl font-bold text-center mb-6 tracking-wider"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="bg-linear-to-r from-yellow-400 via-red-500 to-purple-600 text-transparent bg-clip-text">
              {APP_TITLE}
            </span>
          </motion.h1>

          <RoundTracker
            currentRound={battle.currentRound}
            completedRounds={progress.completedRounds}
          />

          {battle.status === "completed" && battle.winner && (
            <motion.div
              className="mt-6 text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="text-2xl md:text-3xl font-bold text-yellow-400 font-[family-name:var(--font-bebas-neue)]">
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

      {/* Score Display (when round is complete) */}
      {currentRoundScore && (
        <div className="p-4 md:p-6 border-t border-gray-800 bg-gray-900/30">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-xl md:text-2xl font-[family-name:var(--font-bebas-neue)] text-center mb-4 text-yellow-400">
              ROUND {currentRoundScore.round} SCORES
            </h3>
            <ScoreDisplay
              roundScore={currentRoundScore}
              leftPersona={battle.personas.left}
              rightPersona={battle.personas.right}
            />
          </div>
        </div>
      )}
    </div>
  );
}
