/**
 * Control bar for completed/replay battles
 * Shows Scores, Song/MP3, and Options buttons
 */

"use client";

import type { Battle } from "@/lib/shared";
import { BattleOptionsDropdown } from "./battle-options-dropdown";
import {
  ControlBarContainer,
  OptionsButton,
  ScoresButton,
  SongButton,
} from "./control-bar-buttons";
import { MobileActionButtons } from "./mobile-action-buttons";

interface BattleReplayControlBarProps {
  battle: Battle;
  // Tab state
  activeTab: "scores" | "song" | null;
  isDrawerOpen: boolean;
  // Song state
  showSongGenerator: boolean;
  showSongPlayer: boolean;
  isSongPlaying: boolean;
  // Handlers
  onScoresClick: () => void;
  onSongClick: () => void;
  // Options
  showCommenting: boolean;
  showVoting: boolean;
  onToggleCommenting?: (enabled: boolean) => void;
  onToggleVoting?: (enabled: boolean) => void;
  // Mobile drawer handlers
  onCommentsClick?: () => void;
  onVotingClick?: () => void;
  settingsAction?: React.ReactNode;
}

export function BattleReplayControlBar({
  activeTab,
  isDrawerOpen,
  showSongGenerator,
  showSongPlayer,
  isSongPlaying,
  onScoresClick,
  onSongClick,
  showCommenting,
  showVoting,
  onToggleCommenting,
  onToggleVoting,
  onCommentsClick,
  onVotingClick,
  settingsAction,
}: BattleReplayControlBarProps) {
  const showSongButton = showSongGenerator || showSongPlayer;
  const isScoresActive = activeTab === "scores" && isDrawerOpen;
  const isSongActive = activeTab === "song" && isDrawerOpen;

  return (
    <ControlBarContainer>
      {/* Scores Button */}
      {/* Desktop */}
      <div className="hidden md:flex flex-1">
        <ScoresButton
          isActive={isScoresActive}
          onClick={onScoresClick}
          variant="desktop"
        />
      </div>
      {/* Mobile - Render directly */}
      <div className="md:hidden flex-1">
        <ScoresButton
          isActive={isScoresActive}
          onClick={onScoresClick}
          variant="mobile"
        />
      </div>

      {/* Song/MP3 Button */}
      {showSongButton && (
        <>
          {/* Desktop */}
          <div className="hidden md:flex flex-1">
            <SongButton
              isActive={isSongActive}
              isSongPlaying={isSongPlaying}
              showSongGenerator={showSongGenerator}
              onClick={onSongClick}
              variant="desktop"
            />
          </div>
          {/* Mobile - Render directly */}
          <div className="md:hidden flex-1">
            <SongButton
              isActive={isSongActive}
              isSongPlaying={isSongPlaying}
              showSongGenerator={showSongGenerator}
              onClick={onSongClick}
              variant="mobile"
            />
          </div>
        </>
      )}

      {/* Options Dropdown - Desktop Only */}
      <div className="hidden md:block">
        <BattleOptionsDropdown
          showCommenting={showCommenting}
          showVoting={showVoting}
          onToggleCommenting={onToggleCommenting}
          onToggleVoting={onToggleVoting}
          customTrigger={<OptionsButton />}
        />
      </div>

      {/* Mobile Action Menu (Fan) - Mobile Only */}
      <div className="md:hidden ml-auto">
        <MobileActionButtons
          isFixed={false}
          showCommenting={showCommenting}
          showVoting={showVoting}
          onCommentsClick={onCommentsClick || (() => {})}
          onVotingClick={onVotingClick || (() => {})}
          settingsAction={settingsAction}
          customActions={[]}
          className=""
          alignment="right"
        />
      </div>
    </ControlBarContainer>
  );
}
