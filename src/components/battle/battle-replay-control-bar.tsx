/**
 * Control bar for completed/replay battles
 * Shows Scores, Song/MP3, and Options buttons
 */

"use client";

import { MessageSquare, Settings, ThumbsUp } from "lucide-react";
import type { Battle } from "@/lib/shared";
import { BattleOptionsDropdown } from "./battle-options-dropdown";
import {
  ControlBarContainer,
  OptionsButton,
  ScoresButton,
  SongButton,
} from "./control-bar-buttons";
import {
  MobileFanButton,
  type MobileFanButtonAction,
} from "./mobile-fan-button";

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
  onCommentsClick?: () => void;
  onVotingClick?: () => void;
  mobileActiveTab?: "comments" | "voting" | null;
  onSettingsClick?: () => void;
  settingsActive?: boolean;
  isMobileDrawerOpen?: boolean;
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
  mobileActiveTab = null,
  onSettingsClick,
  settingsActive = false,
  isMobileDrawerOpen = false,
}: BattleReplayControlBarProps) {
  const showSongButton = showSongGenerator || showSongPlayer;
  const isScoresActive = activeTab === "scores" && isDrawerOpen;
  const isSongActive = activeTab === "song" && isDrawerOpen;

  const mobileFanActions: MobileFanButtonAction[] = [];
  if (showCommenting && onCommentsClick) {
    mobileFanActions.push({
      id: "comments",
      label: "Comments",
      icon: <MessageSquare className="w-5 h-5" />,
      onClick: onCommentsClick,
      isActive: mobileActiveTab === "comments" && isMobileDrawerOpen,
    });
  }
  if (showVoting && onVotingClick) {
    mobileFanActions.push({
      id: "voting",
      label: "Voting",
      icon: <ThumbsUp className="w-5 h-5" />,
      onClick: onVotingClick,
      isActive: mobileActiveTab === "voting" && isMobileDrawerOpen,
    });
  }
  if (onSettingsClick) {
    mobileFanActions.push({
      id: "settings",
      label: "Settings",
      icon: <Settings className="w-5 h-5" />,
      onClick: onSettingsClick,
      isActive: settingsActive,
    });
  }

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

      {/* Options Dropdown */}
      <div className="hidden xl:block">
        <BattleOptionsDropdown
          showCommenting={showCommenting}
          showVoting={showVoting}
          onToggleCommenting={onToggleCommenting}
          onToggleVoting={onToggleVoting}
          customTrigger={<OptionsButton />}
        />
      </div>
      {mobileFanActions.length > 0 && (
        <div className="xl:hidden ml-auto">
          <MobileFanButton actions={mobileFanActions} />
        </div>
      )}
    </ControlBarContainer>
  );
}
