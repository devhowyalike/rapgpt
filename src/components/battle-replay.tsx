/**
 * Battle replay component for viewing completed battles
 */

"use client";

import { useState, useRef, useLayoutEffect } from "react";
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

  const battleReplayHeaderRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useLayoutEffect(() => {
    const updateHeaderHeight = () => {
      if (battleReplayHeaderRef.current) {
        setHeaderHeight(battleReplayHeaderRef.current.offsetHeight);
      }
    };

    updateHeaderHeight();
    window.addEventListener("resize", updateHeaderHeight);
    return () => window.removeEventListener("resize", updateHeaderHeight);
  }, []);

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
      <div
        ref={battleReplayHeaderRef}
        className="fixed md:relative top-[52px] md:top-0 left-0 right-0 z-20 p-4 md:p-6 border-b border-gray-800 bg-stage-darker/95 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none"
      >
        <div className="max-w-7xl mx-auto">
          {/* Mobile: Stacked Layout */}
          <div className="md:hidden flex flex-col gap-3">
            {/* Battle Winner at Top */}
            {battle.status === "incomplete" ? (
              <motion.div
                className="text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="text-lg font-bold text-red-400 font-(family-name:--font-bebas-neue)">
                  ⚠️ MATCH CANCELLED ⚠️
                </div>
              </motion.div>
            ) : battle.winner ? (
              <motion.div
                className="text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="text-xl font-bold text-yellow-400 font-(family-name:--font-bebas-neue)">
                  🏆 WINNER:{" "}
                  {battle.personas.left.id === battle.winner
                    ? battle.personas.left.name
                    : battle.personas.right.name}{" "}
                  🏆
                </div>
              </motion.div>
            ) : null}

            {/* Replay Controls - Round Counter */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handlePrevRound}
                disabled={!canGoPrev}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title="Previous Round"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <div className="px-4 py-1.5 rounded-lg bg-linear-to-r from-blue-600 to-purple-600 text-white font-bold font-(family-name:--font-bebas-neue) text-lg">
                Round {selectedRound} of 3
              </div>
              <button
                onClick={handleNextRound}
                disabled={!canGoNext}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title="Next Round"
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Desktop: Horizontal Layout */}
          <div className="hidden md:flex md:items-center md:justify-between md:gap-8">
            {/* Left Side: Battle Winner */}
            <div className="shrink-0">
              {battle.status === "incomplete" ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="text-xl lg:text-2xl font-bold text-red-400 font-(family-name:--font-bebas-neue) whitespace-nowrap">
                    ⚠️ MATCH CANCELLED - INCOMPLETE ⚠️
                  </div>
                </motion.div>
              ) : battle.winner ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="text-2xl lg:text-3xl font-bold text-yellow-400 font-(family-name:--font-bebas-neue) whitespace-nowrap">
                    🏆 WINNER:{" "}
                    {battle.personas.left.id === battle.winner
                      ? battle.personas.left.name
                      : battle.personas.right.name}{" "}
                    🏆
                  </div>
                </motion.div>
              ) : null}
            </div>

            {/* Right Side: Round Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={handlePrevRound}
                disabled={!canGoPrev}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title="Previous Round"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <div className="px-6 py-2 rounded-lg bg-linear-to-r from-blue-600 to-purple-600 text-white font-bold font-(family-name:--font-bebas-neue) text-xl whitespace-nowrap">
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
          </div>
        </div>
      </div>

      {/* Spacer for mobile fixed header */}
      <div className="md:hidden" style={{ height: headerHeight }} />

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
                isRoundWinner={roundScore?.winner === battle.personas.left.id}
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
                isRoundWinner={roundScore?.winner === battle.personas.right.id}
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
        <div className="p-4 md:p-6 pb-24 md:pb-6 border-t border-gray-800 bg-gray-900/30">
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
