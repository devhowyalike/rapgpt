/**
 * Control bar for completed/replay battles
 * Shows Scores, Song/MP3, and Options buttons
 */

"use client";

import type { Battle } from "@/lib/shared";
import { BattleOptionsDropdown } from "./battle-options-dropdown";
import {
  buildMobileFanActions,
  ControlBarContainer,
  OptionsButton,
  ScoresButton,
  SongButton,
} from "./control-bar-buttons";
import { MobileFanButton } from "./mobile-fan-button";

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
  /** Whether the current user can manage the battle (owner or admin) */
  canManage?: boolean;
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
  canManage = false,
}: BattleReplayControlBarProps) {
  const showSongButton = showSongGenerator || showSongPlayer;
  const isScoresActive = activeTab === "scores" && isDrawerOpen;
  const isSongActive = activeTab === "song" && isDrawerOpen;

  const mobileFanActions = buildMobileFanActions({
    showCommenting,
    showVoting,
    requireLiveForVoting: false, // Replay mode shows voting without requiring live
    onCommentsClick,
    onVotingClick,
    onSettingsClick: canManage ? onSettingsClick : undefined, // Only show settings to battle manager
    mobileActiveTab,
    isMobileDrawerOpen,
    settingsActive,
  });

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

      {/* Options Dropdown - Only visible to battle manager (owner/admin) */}
      {canManage && (
        <div className="hidden xl:block">
          <BattleOptionsDropdown
            showCommenting={showCommenting}
            showVoting={showVoting}
            onToggleCommenting={onToggleCommenting}
            onToggleVoting={onToggleVoting}
            customTrigger={<OptionsButton />}
          />
        </div>
      )}
      {mobileFanActions.length > 0 && (
        <div className="xl:hidden ml-auto">
          <MobileFanButton actions={mobileFanActions} />
        </div>
      )}
    </ControlBarContainer>
  );
}
