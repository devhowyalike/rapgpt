/**
 * Battle replay component for viewing completed battles
 */

"use client";

import { useState, useEffect } from "react";
import type { Battle } from "@/lib/shared";
import { SongGenerator } from "./song-generator";
import { SongPlayer } from "./song-player";
import { motion } from "framer-motion";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { AnimatedEq } from "./animated-eq";
import { WinnerBanner } from "./winner-banner";
import { CreatorAttribution } from "./creator-attribution";
import { RoundControls } from "./round-controls";
import { BattleDrawer } from "./ui/battle-drawer";
import { useExclusiveDrawer } from "@/lib/hooks/use-exclusive-drawer";
import { useRoundData } from "@/lib/hooks/use-round-data";
import { BattleHeader } from "./battle/battle-header";
import { BattleSplitView } from "./battle/battle-split-view";
import { BattleBottomControls } from "./battle/battle-bottom-controls";
import { BattleScoreSection } from "./battle/battle-score-section";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";

interface BattleReplayProps {
  battle: Battle;
  /**
   * Extra bottom padding for mobile to clear floating UI
   */
  mobileBottomPadding?: string;
}

export function BattleReplay({
  battle,
  mobileBottomPadding,
}: BattleReplayProps) {
  // Base mobile bottom padding to clear bottom controls; can be increased when FABs are present
  const mobileContentPadding =
    mobileBottomPadding ?? "var(--bottom-controls-height)";
  const [selectedRound, setSelectedRound] = useState(1);
  const { verses: roundVerses, score: roundScore } = useRoundData(
    battle,
    selectedRound
  );
  const { sessionClaims, isLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [dbUserId, setDbUserId] = useState<string | null>(null);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const isMobile = useIsMobile();

  // Fetch internal database user ID
  useEffect(() => {
    if (!user?.id) {
      setDbUserId(null);
      return;
    }

    // Try to get from public metadata first
    const cachedDbUserId = user.publicMetadata?.dbUserId as string | undefined;
    if (cachedDbUserId) {
      setDbUserId(cachedDbUserId);
    } else {
      // Fallback: fetch from API
      fetch("/api/user/me")
        .then((res) => res.json())
        .then((data) => {
          if (data.user?.id) {
            setDbUserId(data.user.id);
          }
        })
        .catch(console.error);
    }
  }, [user]);

  // Check if current user is the battle creator or admin
  // Wait for Clerk to finish loading before checking admin status
  const isAdmin = isLoaded && sessionClaims?.metadata?.role === "admin";
  const isCreator = dbUserId && battle.creator?.userId === dbUserId;

  // Allow song generation for:
  // 1. Battle creators (verified ownership)
  // 2. Admins (can generate for any battle, including legacy ones)
  // Also show generator if song generation was incomplete (has taskId but no audioUrl)
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

  // Ensure only one drawer is open at a time across the page
  useExclusiveDrawer("replay-scores-song", isDrawerOpen, setIsDrawerOpen);

  // Track scroll position to collapse header on mobile
  useEffect(() => {
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
  }, [isMobile]);

  const canGoPrev = selectedRound > 1;
  const canGoNext = selectedRound < 3;

  const handlePrevRound = () => {
    if (canGoPrev) setSelectedRound(selectedRound - 1);
  };

  const handleNextRound = () => {
    if (canGoNext) setSelectedRound(selectedRound + 1);
  };

  const handleTabClick = (tab: "scores" | "song") => {
    // If clicking the same tab while open, close it
    if (activeTab === tab && isDrawerOpen) {
      setIsDrawerOpen(false);
      setActiveTab(null);
      return;
    }

    // If switching tabs while the drawer is open, animate close then open
    if (activeTab !== tab && isDrawerOpen) {
      setIsDrawerOpen(false);
      // Match BattleDrawer close animation duration (~300ms) with slight buffer
      window.setTimeout(() => {
        setActiveTab(tab);
        setIsDrawerOpen(true);
      }, 320);
      return;
    }

    // Drawer is closed: open with the requested tab
    setActiveTab(tab);
    setIsDrawerOpen(true);
  };

  const handleSongButtonClick = () => {
    // If drawer is closed but song is playing, open it instead of pausing
    if (isSongPlaying && !isDrawerOpen) {
      handleTabClick("song");
    }
    // If drawer is open with song tab AND song is playing, pause it
    else if (isSongPlaying && isDrawerOpen && activeTab === "song") {
      setIsSongPlaying(false);
    }
    // If drawer is open with different tab OR song is not playing, toggle/switch to song tab
    else {
      handleTabClick("song");
    }
  };

  return (
    <div className="flex flex-col min-h-0 md:h-full bg-linear-to-b from-stage-darker to-stage-dark">
      {/* Header with Replay Controls - Unified responsive layout */}
      <BattleHeader
        variant="blur"
        className="md:bg-transparent md:backdrop-blur-none transition-all duration-300"
        compact={isHeaderCollapsed}
      >
        <div
          className={`transition-all duration-300 ${
            isHeaderCollapsed
              ? "flex flex-row items-center justify-between gap-2 md:flex-row md:gap-3"
              : "flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-8"
          }`}
        >
          {/* Left Side: Winner/Paused and Creator */}
          <div
            className={`shrink-0 flex flex-col items-center md:items-start transition-all duration-300 ${
              isHeaderCollapsed ? "gap-0" : "gap-2"
            }`}
          >
            <WinnerBanner battle={battle} collapsed={isHeaderCollapsed} />
            <CreatorAttribution
              battle={battle}
              hideOnMobileWhenWinnerVisible
              hideWhenCollapsed={isHeaderCollapsed}
            />
          </div>

          {/* Right Side: Round Controls */}
          <RoundControls
            selectedRound={selectedRound}
            canGoPrev={canGoPrev}
            canGoNext={canGoNext}
            onPrev={handlePrevRound}
            onNext={handleNextRound}
            compact={isHeaderCollapsed}
          />
        </div>
      </BattleHeader>

      {/* Split Screen Stage */}
      <div
        data-scroll-container
        className="flex-1 overflow-y-auto pb-(--mobile-bottom-padding) md:pb-24"
        style={{
          ["--mobile-bottom-padding" as any]: mobileContentPadding,
        }}
      >
        <BattleSplitView
          battle={battle}
          verses={roundVerses}
          roundScore={roundScore}
          showRoundWinner={true}
          cardPadding="px-3 py-2 md:p-4"
          isBattleEnd={true}
        />
      </div>

      {/* Unified Drawer - Only show for completed battles */}
      {battle.status === "completed" &&
        (roundScore || showSongGenerator || showSongPlayer) && (
          <>
            <BattleDrawer
              open={isDrawerOpen}
              onOpenChange={setIsDrawerOpen}
              title={
                activeTab === "scores"
                  ? "Round Scores"
                  : showSongGenerator
                  ? "Generate Song"
                  : "Generated Song"
              }
              excludeBottomControls={true}
              mobileOnly={false}
            >
              <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 touch-scroll-container">
                <div className="p-4 md:p-6">
                  <div className={activeTab === "scores" ? "" : "hidden"}>
                    {roundScore && (
                      <div>
                        {/* Round Navigation Controls */}
                        <div className="flex justify-center mb-6">
                          <RoundControls
                            selectedRound={selectedRound}
                            canGoPrev={canGoPrev}
                            canGoNext={canGoNext}
                            onPrev={handlePrevRound}
                            onNext={handleNextRound}
                          />
                        </div>

                        <BattleScoreSection battle={battle} roundScore={roundScore} />
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
                        battle={battle}
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
            </BattleDrawer>

            {/* Fixed Bottom Buttons */}
            <BattleBottomControls>
              <motion.button
                onClick={() => handleTabClick("scores")}
                className={`
                  flex-1 md:flex-none px-4 py-2.5 md:px-6 md:py-3 font-bold text-sm md:text-base
                  rounded-lg border-2 transition-all duration-200 isolate
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
                    rounded-lg border-2 transition-all duration-200 isolate
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
            </BattleBottomControls>
          </>
        )}
    </div>
  );
}
