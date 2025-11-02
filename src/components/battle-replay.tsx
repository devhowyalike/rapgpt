/**
 * Battle replay component for viewing completed battles
 */

"use client";

import { useState } from "react";
import type { Battle } from "@/lib/shared";
import { PersonaCard } from "./persona-card";
import { VerseDisplay } from "./verse-display";
import { ScoreDisplay } from "./score-display";
import { SongGenerator } from "./song-generator";
import { SongPlayer } from "./song-player";
import { getRoundVerses } from "@/lib/battle-engine";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { AnimatedEq } from "./animated-eq";
import { WinnerBanner } from "./winner-banner";
import { CreatorAttribution } from "./creator-attribution";
import { RoundControls } from "./round-controls";

interface BattleReplayProps {
  battle: Battle;
}

export function BattleReplay({ battle }: BattleReplayProps) {
  const [selectedRound, setSelectedRound] = useState(1);
  const roundVerses = getRoundVerses(battle, selectedRound);
  const roundScore = battle.scores.find((s) => s.round === selectedRound);
  const { userId, sessionClaims, isLoaded } = useAuth();
  const router = useRouter();

  // Check if current user is the battle creator or admin
  // Wait for Clerk to finish loading before checking admin status
  const isAdmin = isLoaded && sessionClaims?.metadata?.role === "admin";
  const isCreator = userId && battle.creator?.userId === userId;

  // Allow song generation for:
  // 1. Battle creators (verified ownership)
  // 2. Admins (can generate for any battle, including legacy ones)
  const canGenerateSong =
    (isCreator || isAdmin) &&
    battle.status === "completed" &&
    !battle.generatedSong?.audioUrl;
  const showSongGenerator = canGenerateSong;
  const showSongPlayer =
    battle.status === "completed" && battle.generatedSong?.audioUrl;

  // Default to "song" tab when battle is completed and song tab is available
  const defaultTab =
    battle.status === "completed" && (showSongGenerator || showSongPlayer)
      ? "song"
      : "scores";
  const [activeTab, setActiveTab] = useState<"scores" | "song" | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSongPlaying, setIsSongPlaying] = useState(false);

  // No JS offset needed when header is sticky

  const canGoPrev = selectedRound > 1;
  const canGoNext = selectedRound < 3;

  const handlePrevRound = () => {
    if (canGoPrev) setSelectedRound(selectedRound - 1);
  };

  const handleNextRound = () => {
    if (canGoNext) setSelectedRound(selectedRound + 1);
  };

  const handleTabClick = (tab: "scores" | "song") => {
    if (activeTab === tab && isDrawerOpen) {
      // Close drawer if clicking the same tab
      setIsDrawerOpen(false);
      setActiveTab(null);
    } else {
      // Open drawer with new tab
      setActiveTab(tab);
      setIsDrawerOpen(true);
    }
  };

  const handleSongButtonClick = () => {
    // If song is playing, pause it (regardless of drawer state)
    if (isSongPlaying) {
      setIsSongPlaying(false);
    } else {
      // If song is not playing, toggle the drawer
      handleTabClick("song");
    }
  };

  return (
    <div className="flex flex-col min-h-0 md:h-full bg-linear-to-b from-stage-darker to-stage-dark">
      {/* Header with Replay Controls - Unified responsive layout */}
      <div className="sticky md:relative left-0 right-0 z-20 p-4 md:p-6 border-b border-gray-800 bg-stage-darker/95 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none top-(--header-height) md:top-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-8">
            {/* Left Side: Winner/Paused and Creator */}
            <div className="shrink-0 flex flex-col gap-2 items-center md:items-start">
              <WinnerBanner battle={battle} />
              <CreatorAttribution
                battle={battle}
                hideOnMobileWhenWinnerVisible
              />
            </div>

            {/* Right Side: Round Controls */}
            <RoundControls
              selectedRound={selectedRound}
              canGoPrev={canGoPrev}
              canGoNext={canGoNext}
              onPrev={handlePrevRound}
              onNext={handleNextRound}
            />
          </div>
        </div>
      </div>

      {/* No spacer necessary with sticky header */}

      {/* Split Screen Stage */}
      <div className="flex-1 md:overflow-y-auto pb-20 md:pb-0">
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

      {/* Drawer Backdrop - Synchronized with drawer (all breakpoints) */}
      <AnimatePresence>
        {isDrawerOpen && activeTab && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "tween", ease: "easeOut", duration: 0.2 }}
            onClick={() => setIsDrawerOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Bottom Action Drawer - Unified responsive drawer (always mounted) */}
      {(roundScore || showSongGenerator || showSongPlayer) && (
        <>
          <motion.div
            className={
              "fixed left-0 right-0 z-30 bg-gray-900 shadow-2xl border-t border-gray-800 pointer-events-none"
            }
            style={{ bottom: "var(--bottom-controls-height)" }}
            animate={
              isDrawerOpen && activeTab
                ? { y: 0, opacity: 1 }
                : { y: "100%", opacity: 0 }
            }
            initial={{ y: "100%", opacity: 0 }}
            transition={{ type: "tween", ease: "easeOut", duration: 0.28 }}
          >
            <div
              className={`max-w-4xl mx-auto ${
                isDrawerOpen && activeTab ? "pointer-events-auto" : ""
              }`}
            >
              {/* Close button */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                <h3 className="text-lg font-bold text-white">
                  {activeTab === "scores"
                    ? "Round Scores"
                    : showSongGenerator
                    ? "Generate Song"
                    : "Generated Song"}
                </h3>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto max-h-[60vh]">
                <div className="p-4 md:p-6 pb-8">
                  <div className={activeTab === "scores" ? "" : "hidden"}>
                    {roundScore && (
                      <div>
                        <h3 className="text-xl md:text-2xl font-(family-name:--font-bebas-neue) text-center mb-4 text-yellow-400">
                          ROUND {roundScore.round} SCORES
                        </h3>
                        <ScoreDisplay
                          roundScore={roundScore}
                          leftPersona={battle.personas.left}
                          rightPersona={battle.personas.right}
                        />
                      </div>
                    )}
                  </div>
                  <div
                    className={`max-w-2xl mx-auto ${
                      activeTab === "song" ? "" : "hidden"
                    }`}
                  >
                    {showSongGenerator && (
                      <SongGenerator
                        battleId={battle.id}
                        onSongGenerated={() => router.refresh()}
                      />
                    )}
                    {showSongPlayer && battle.generatedSong && (
                      <SongPlayer
                        song={battle.generatedSong}
                        externalIsPlaying={isSongPlaying}
                        onPlayStateChange={(playing) =>
                          setIsSongPlaying(playing)
                        }
                        onTogglePlay={() => setIsSongPlaying(!isSongPlaying)}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Fixed Bottom Buttons */}
          <div
            className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800"
            style={{ height: "var(--bottom-controls-height)" }}
          >
            <div className="max-w-4xl mx-auto h-full px-2 md:px-4 flex items-center justify-center gap-2 md:gap-3">
              <motion.button
                onClick={() => handleTabClick("scores")}
                className={`
                  flex-1 md:flex-none px-4 py-2.5 md:px-6 md:py-3 font-bold text-sm md:text-base
                  rounded-lg border-2 transition-all duration-200
                  ${
                    activeTab === "scores" && isDrawerOpen
                      ? "bg-linear-to-r from-yellow-600 to-orange-600 border-yellow-500 text-white shadow-lg shadow-yellow-500/30"
                      : "bg-gray-800/60 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600"
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="text-lg">📊</span>
                  <span>Scores</span>
                </span>
              </motion.button>

              {(showSongGenerator || showSongPlayer) && (
                <motion.button
                  onClick={
                    showSongPlayer
                      ? handleSongButtonClick
                      : () => handleTabClick("song")
                  }
                  className={`
                    flex-1 md:flex-none px-4 py-2.5 md:px-6 md:py-3 font-bold text-sm md:text-base
                    rounded-lg border-2 transition-all duration-200
                    ${
                      isSongPlaying
                        ? "bg-linear-to-r from-green-600 to-emerald-600 border-green-500 text-white shadow-lg shadow-green-500/30"
                        : activeTab === "song" && isDrawerOpen
                        ? "bg-linear-to-r from-green-600 to-emerald-600 border-green-500 text-white shadow-lg shadow-green-500/30"
                        : showSongGenerator
                        ? "bg-linear-to-r from-green-700/40 to-emerald-700/40 border-green-600 text-green-300 hover:from-green-700/60 hover:to-emerald-700/60 hover:border-green-500 animate-pulse"
                        : "bg-gray-800/60 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600"
                    }
                  `}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="flex items-center justify-center gap-2">
                    {showSongGenerator ? (
                      <>
                        <span
                          className="text-lg inline-block"
                          style={{ filter: "invert(1)" }}
                        >
                          🎵
                        </span>
                        <span>Make it an MP3</span>
                      </>
                    ) : isSongPlaying ? (
                      <>
                        <AnimatedEq className="text-white" />
                        <span>Pause Song</span>
                      </>
                    ) : (
                      <>
                        <span
                          className="text-lg inline-block"
                          style={{ filter: "invert(1)" }}
                        >
                          🎵
                        </span>
                        <span>Song</span>
                      </>
                    )}
                  </span>
                </motion.button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
