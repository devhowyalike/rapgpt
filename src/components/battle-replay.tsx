/**
 * Battle replay component for viewing completed battles
 */

"use client";

import { useState, useRef, useLayoutEffect } from "react";
import type { Battle } from "@/lib/shared";
import { PersonaCard } from "./persona-card";
import { VerseDisplay } from "./verse-display";
import { ScoreDisplay } from "./score-display";
import { SongGenerator } from "./song-generator";
import { SongPlayer } from "./song-player";
import { getRoundVerses } from "@/lib/battle-engine";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, User } from "lucide-react";
import Link from "next/link";
import { VictoryConfetti } from "./victory-confetti";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

interface BattleReplayProps {
  battle: Battle;
}

export function BattleReplay({ battle }: BattleReplayProps) {
  const [selectedRound, setSelectedRound] = useState(1);
  const roundVerses = getRoundVerses(battle, selectedRound);
  const roundScore = battle.scores.find((s) => s.round === selectedRound);
  const { userId } = useAuth();
  const router = useRouter();

  const battleReplayHeaderRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  
  // Check if current user is the battle creator
  const isCreator = userId && battle.creator?.userId === userId;
  const showSongGenerator = isCreator && battle.status === 'completed' && !battle.generatedSong?.audioUrl;
  const showSongPlayer = battle.status === 'completed' && battle.generatedSong?.audioUrl;

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
                className="text-center mt-2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="text-2xl font-bold text-orange-400 font-(family-name:--font-bebas-neue)">
                  ⏸️ MATCH PAUSED ⏸️
                </div>
              </motion.div>
            ) : battle.winner ? (
              <motion.div
                className="text-center mt-2 relative"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <VictoryConfetti trigger={true} />
                <div className="text-3xl font-bold text-yellow-400 font-(family-name:--font-bebas-neue) relative z-10">
                  🏆 WINNER:{" "}
                  {battle.personas.left.id === battle.winner
                    ? battle.personas.left.name
                    : battle.personas.right.name}{" "}
                  🏆
                </div>
              </motion.div>
            ) : null}

            {/* Creator Link */}
            {battle.creator && (
              <div className="text-center">
                <Link
                  href={`/profile/${battle.creator.userId}`}
                  className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-blue-400 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Created by {battle.creator.displayName}</span>
                </Link>
              </div>
            )}

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
            {/* Left Side: Battle Winner and Creator */}
            <div className="shrink-0 flex flex-col gap-2">
              {battle.status === "incomplete" ? (
                <motion.div
                  className="mt-2"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="text-2xl lg:text-3xl font-bold text-orange-400 font-(family-name:--font-bebas-neue) whitespace-nowrap">
                    ⏸️ MATCH PAUSED ⏸️
                  </div>
                </motion.div>
              ) : battle.winner ? (
                <motion.div
                  className="mt-2 relative"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <VictoryConfetti trigger={true} />
                  <div className="text-4xl lg:text-5xl font-bold text-yellow-400 font-(family-name:--font-bebas-neue) whitespace-nowrap relative z-10">
                    🏆 WINNER:{" "}
                    {battle.personas.left.id === battle.winner
                      ? battle.personas.left.name
                      : battle.personas.right.name}{" "}
                    🏆
                  </div>
                </motion.div>
              ) : null}

              {/* Creator Link */}
              {battle.creator && (
                <Link
                  href={`/profile/${battle.creator.userId}`}
                  className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-blue-400 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Created by {battle.creator.displayName}</span>
                </Link>
              )}
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

      {/* AI Song Generation/Player */}
      {(showSongGenerator || showSongPlayer) && (
        <div className="p-4 md:p-6 pb-24 md:pb-6 border-t border-gray-800 bg-gray-900/30">
          <div className="max-w-2xl mx-auto">
            {showSongGenerator && (
              <SongGenerator 
                battleId={battle.id}
                onSongGenerated={() => {
                  // Refresh the page to show the generated song
                  router.refresh();
                }}
              />
            )}
            {showSongPlayer && battle.generatedSong && (
              <SongPlayer song={battle.generatedSong} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
