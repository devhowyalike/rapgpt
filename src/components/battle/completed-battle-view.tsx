"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  BattleOptionsDrawer,
  BattleReplayControlBar,
  BattleScoreSection,
  SidebarContainer,
} from "@/components/battle";
import { RoundControls } from "@/components/round-controls";
import { SongGenerator } from "@/components/song-generator";
import { SongPlayer } from "@/components/song-player";
import { BattleDrawer } from "@/components/ui/battle-drawer";
import { useExclusiveDrawer } from "@/lib/hooks/use-exclusive-drawer";
import { useRoundData } from "@/lib/hooks/use-round-data";
import { useRoundNavigation } from "@/lib/hooks/use-round-navigation";
import type { Battle } from "@/lib/shared";
import { BattleStage } from "../battle-stage";
import { SiteHeader } from "../site-header";

interface CompletedBattleViewProps {
  battle: Battle;
  isAdmin: boolean;
  dbUserId: string | null;
  showCommenting: boolean;
  showVoting: boolean;
  votingCompletedRound: number | null;
  showMobileDrawer: boolean;
  setShowMobileDrawer: (open: boolean) => void;
  mobileActiveTab: "comments" | "voting";
  openCommentsDrawer: () => void;
  openVotingDrawer: () => void;
  onVote: (round: number, personaId: string) => Promise<boolean>;
  onComment: (content: string) => void;
  onToggleCommenting: (enabled: boolean) => void;
  onToggleVoting: (enabled: boolean) => void;
}

export function CompletedBattleView({
  battle,
  isAdmin,
  dbUserId,
  showCommenting,
  showVoting,
  votingCompletedRound,
  showMobileDrawer,
  setShowMobileDrawer,
  mobileActiveTab,
  openCommentsDrawer,
  openVotingDrawer,
  onVote,
  onComment,
  onToggleCommenting,
  onToggleVoting,
}: CompletedBattleViewProps) {
  const router = useRouter();

  // Round navigation
  const {
    selectedRound,
    canGoPrev,
    canGoNext,
    handlePrevRound,
    handleNextRound,
  } = useRoundNavigation();

  const { verses: roundVerses, score: roundScore } = useRoundData(
    battle,
    selectedRound,
  );

  // Drawer state for scores/song
  const [activeTab, setActiveTab] = useState<"scores" | "song" | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSongPlaying, setIsSongPlaying] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  // Ensure only one drawer is open at a time
  useExclusiveDrawer("replay-scores-song", isDrawerOpen, setIsDrawerOpen);
  useExclusiveDrawer(
    "mobile-settings",
    showSettingsDrawer,
    setShowSettingsDrawer,
  );
  // Check if current user is the battle creator
  const isCreator = dbUserId && battle.creator?.userId === dbUserId;

  // Allow song generation for creators or admins if no song exists yet
  const canGenerateSong =
    (isCreator || isAdmin) &&
    battle.status === "completed" &&
    !battle.generatedSong?.audioUrl;
  const showSongGenerator = canGenerateSong;
  const showSongPlayer =
    battle.status === "completed" && battle.generatedSong?.audioUrl;

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
    <>
      <SiteHeader />
      <div style={{ height: "var(--header-height)" }} />
      <div className="px-0 md:px-6">
        <div className="max-w-7xl mx-auto flex flex-col h-[calc(100dvh-var(--header-height))] md:flex-row">
          <div className="flex-1 flex flex-col min-h-0 relative">
            <BattleStage battle={battle} mode="replay" />

            {/* Control Bar with Scores, Song, and Options */}
            <BattleReplayControlBar
              battle={battle}
              activeTab={activeTab}
              isDrawerOpen={isDrawerOpen}
              showSongGenerator={showSongGenerator}
              showSongPlayer={!!showSongPlayer}
              isSongPlaying={isSongPlaying}
              onScoresClick={() => handleTabClick("scores")}
              onSongClick={
                showSongPlayer
                  ? handleSongButtonClick
                  : () => handleTabClick("song")
              }
              showCommenting={showCommenting}
              showVoting={showVoting}
              onToggleCommenting={onToggleCommenting}
              onToggleVoting={onToggleVoting}
              onCommentsClick={openCommentsDrawer}
              onVotingClick={openVotingDrawer}
              mobileActiveTab={mobileActiveTab}
              isMobileDrawerOpen={showMobileDrawer}
              onSettingsClick={() => setShowSettingsDrawer(true)}
              settingsActive={showSettingsDrawer}
            />

            {/* Scores/Song Drawer */}
            {(roundScore || showSongGenerator || showSongPlayer) && (
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
                excludeBottomControls={false}
                mobileOnly={false}
                position="absolute"
              >
                <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 touch-scroll-container pb-(--bottom-controls-height)">
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

                          <BattleScoreSection
                            battle={battle}
                            roundScore={roundScore}
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
            )}
          </div>

          <SidebarContainer
            battle={battle}
            onVote={onVote}
            onComment={onComment}
            showCommenting={showCommenting}
            showVoting={showVoting}
            isArchived={true}
            votingCompletedRound={votingCompletedRound}
            showMobileDrawer={showMobileDrawer}
            onMobileDrawerChange={setShowMobileDrawer}
            mobileActiveTab={mobileActiveTab}
            excludeBottomControls={true}
          />
        </div>
      </div>

      <BattleOptionsDrawer
        open={showSettingsDrawer}
        onOpenChange={setShowSettingsDrawer}
        showCommenting={showCommenting}
        showVoting={showVoting}
        onToggleCommenting={onToggleCommenting}
        onToggleVoting={onToggleVoting}
      />
    </>
  );
}
