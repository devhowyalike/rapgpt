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
      <div className="fixed md:relative top-[52px] md:top-0 left-0 right-0 z-20 p-4 md:p-6 border-b border-gray-800 bg-stage-darker/95 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none">
        <div className="max-w-7xl mx-auto">
          {/* Battle Winner at Top */}
          {battle.status === "incomplete" ? (
            <motion.div
              className="text-center mb-3 md:mb-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="text-lg md:text-xl lg:text-2xl font-bold text-red-400 font-(family-name:--font-bebas-neue)">
                ⚠️ MATCH CANCELLED{" "}
                <span className="hidden md:inline">- INCOMPLETE</span> ⚠️
              </div>
            </motion.div>
          ) : battle.winner ? (
            <motion.div
              className="text-center mb-3 md:mb-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="text-lg md:text-xl lg:text-2xl font-bold text-yellow-400 font-(family-name:--font-bebas-neue)">
                🏆 WINNER:{" "}
                {battle.personas.left.id === battle.winner
                  ? battle.personas.left.name
                  : battle.personas.right.name}{" "}
                🏆
              </div>
            </motion.div>
          ) : null}

          {/* Replay Controls - Round Counter */}
          <div className="flex items-center justify-center gap-3 md:gap-4 mb-3 md:mb-4">
            <button
              onClick={handlePrevRound}
              disabled={!canGoPrev}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Previous Round"
            >
              <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </button>
            <div className="px-4 md:px-6 py-1.5 md:py-2 rounded-lg bg-linear-to-r from-blue-600 to-purple-600 text-white font-bold font-(family-name:--font-bebas-neue) text-lg md:text-xl">
              Round {selectedRound} of 3
            </div>
            <button
              onClick={handleNextRound}
              disabled={!canGoNext}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Next Round"
            >
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </button>
          </div>

          {/* Round Winner Below Counter */}
          {roundScore?.winner && (
            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <span className="text-xs md:text-sm text-gray-400">
                Round Winner:{" "}
              </span>
              <span
                className="text-sm md:text-lg font-bold font-(family-name:--font-bebas-neue)"
                style={{
                  color:
                    battle.personas.left.id === roundScore.winner
                      ? battle.personas.left.accentColor
                      : battle.personas.right.accentColor,
                }}
              >
                {battle.personas.left.id === roundScore.winner
                  ? battle.personas.left.name
                  : battle.personas.right.name}
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Spacer for mobile fixed header */}
      <div
        className="md:hidden"
        style={{ height: roundScore?.winner ? "160px" : "140px" }}
      />

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
            <h3 className="text-xl md:text-2xl font-(family-name:--font-bebas-neue) text-center mb-4 text-yellow-400">
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
