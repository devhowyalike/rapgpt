/**
 * Battle replay component for viewing completed battles
 */

"use client";

import { useState } from "react";
import type { Battle } from "@/lib/shared";
import { PersonaCard } from "./persona-card";
import { VerseDisplay } from "./verse-display";
import { ScoreDisplay } from "./score-display";
import { getRoundVerses } from "@/lib/battle-engine";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BattleReplayProps {
  battle: Battle;
}

export function BattleReplay({ battle }: BattleReplayProps) {
  const [selectedRound, setSelectedRound] = useState(1);
  const roundVerses = getRoundVerses(battle, selectedRound);
  const roundScore = battle.scores.find((s) => s.round === selectedRound);

  const canGoPrev = selectedRound > 1;
  const canGoNext = selectedRound < 3;

  const handlePrevRound = () => {
    if (canGoPrev) setSelectedRound(selectedRound - 1);
  };

  const handleNextRound = () => {
    if (canGoNext) setSelectedRound(selectedRound + 1);
  };

  return (
    <div className="flex flex-col min-h-0 md:h-full bg-linear-to-b from-stage-darker to-stage-dark">
      {/* Header with Replay Controls */}
      <div className="p-4 md:p-6 border-b border-gray-800">
        <div className="max-w-7xl mx-auto">
          {/* Replay Controls */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={handlePrevRound}
              disabled={!canGoPrev}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Previous Round"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div className="px-6 py-2 rounded-lg bg-linear-to-r from-blue-600 to-purple-600 text-white font-bold font-[family-name:var(--font-bebas-neue)] text-xl">
              Round {selectedRound} of 3
            </div>
            <button
              onClick={handleNextRound}
              disabled={!canGoNext}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Next Round"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>

          {battle.status === "incomplete" ? (
            <motion.div
              className="text-center mt-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="text-xl md:text-2xl font-bold text-red-400 font-[family-name:var(--font-bebas-neue)]">
                ⚠️ MATCH CANCELLED - INCOMPLETE ⚠️
              </div>
            </motion.div>
          ) : battle.winner ? (
            <motion.div
              className="text-center mt-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="text-xl md:text-2xl font-bold text-yellow-400 font-[family-name:var(--font-bebas-neue)]">
                🏆 WINNER:{" "}
                {battle.personas.left.id === battle.winner
                  ? battle.personas.left.name
                  : battle.personas.right.name}{" "}
                🏆
              </div>
            </motion.div>
          ) : null}
        </div>
      </div>

      {/* Split Screen Stage */}
      <div className="flex-1 md:overflow-y-auto">
        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-800 md:h-full">
          {/* Left Persona */}
          <div className="flex flex-col min-h-[400px] md:min-h-0">
            <div className="p-6 border-b border-gray-800">
              <PersonaCard
                persona={battle.personas.left}
                position="left"
                isActive={false}
              />
            </div>

            <div className="flex-1 stage-spotlight">
              <VerseDisplay
                verse={roundVerses.left}
                persona={battle.personas.left}
                position="left"
              />
            </div>
          </div>

          {/* Right Persona */}
          <div className="flex flex-col min-h-[400px] md:min-h-0">
            <div className="p-6 border-b border-gray-800">
              <PersonaCard
                persona={battle.personas.right}
                position="right"
                isActive={false}
              />
            </div>

            <div className="flex-1 stage-spotlight">
              <VerseDisplay
                verse={roundVerses.right}
                persona={battle.personas.right}
                position="right"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Score Display */}
      {roundScore && (
        <div className="p-4 md:p-6 border-t border-gray-800 bg-gray-900/30">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-xl md:text-2xl font-[family-name:var(--font-bebas-neue)] text-center mb-4 text-yellow-400">
              ROUND {roundScore.round} SCORES
            </h3>
            <ScoreDisplay
              roundScore={roundScore}
              leftPersona={battle.personas.left}
              rightPersona={battle.personas.right}
            />
          </div>
        </div>
      )}
    </div>
  );
}
