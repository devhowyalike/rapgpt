/**
 * Reusable control bar button components
 * Used across BattleControlBar and BattleReplayControlBar for DRY code
 */

"use client";

import { motion } from "framer-motion";
import {
  MessageSquare,
  Radio,
  Settings,
  StopCircle,
  ThumbsUp,
} from "lucide-react";
import { forwardRef, type ReactNode } from "react";
import { AnimatedEq } from "@/components/animated-eq";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// =============================================================================
// Control Bar Container
// =============================================================================

interface ControlBarContainerProps {
  children: ReactNode;
}

export function ControlBarContainer({ children }: ControlBarContainerProps) {
  return (
    <div className="relative z-50 p-4 bg-gray-900 border-t border-gray-800">
      <div className="max-w-4xl mx-auto flex flex-row items-center gap-3">
        {children}
      </div>
    </div>
  );
}

// =============================================================================
// Options Button (Desktop)
// =============================================================================

interface OptionsButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClick?: () => void;
}

export const OptionsButton = forwardRef<HTMLButtonElement, OptionsButtonProps>(
  ({ onClick, ...props }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onClick}
        className="px-3 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-bold flex items-center justify-center gap-2 transition-all"
        aria-label="Battle Options"
        {...props}
      >
        <Settings className="w-5 h-5" />
        <span className="hidden lg:inline font-medium text-sm">Options</span>
      </button>
    );
  }
);
OptionsButton.displayName = "OptionsButton";

// =============================================================================
// Go Live State Helper (shared between button and mobile fan)
// =============================================================================

interface GoLiveStateOptions {
  isLive: boolean;
  isLoadingPermissions?: boolean;
  isStartingLive?: boolean;
  isStoppingLive?: boolean;
}

export function getGoLiveState({
  isLive,
  isLoadingPermissions = false,
  isStartingLive = false,
  isStoppingLive = false,
}: GoLiveStateOptions) {
  const isLoading = isStartingLive || isStoppingLive;
  const label = isLive ? "End Live" : "Go Live";
  const icon = isLive ? (
    <StopCircle className="w-5 h-5" />
  ) : (
    <Radio className="w-5 h-5" />
  );

  return {
    label,
    icon,
    isLoading,
    isLoadingPermissions,
    isDisabled: isLoadingPermissions || isLoading,
  };
}

// =============================================================================
// Go Live Button
// =============================================================================

interface GoLiveButtonProps {
  isLive: boolean;
  isLoadingPermissions: boolean;
  isStartingLive: boolean;
  isStoppingLive: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export function GoLiveButton({
  isLive,
  isLoadingPermissions,
  isStartingLive,
  isStoppingLive,
  disabled = false,
  onClick,
}: GoLiveButtonProps) {
  const { label, isLoading, isDisabled } = getGoLiveState({
    isLive,
    isLoadingPermissions,
    isStartingLive,
    isStoppingLive,
  });
  const buttonDisabled = disabled || isDisabled;

  return (
    <button
      onClick={buttonDisabled ? undefined : onClick}
      disabled={buttonDisabled}
      className={`
        px-3 py-3 rounded-lg transition-all flex items-center justify-center gap-2
        ${
          isLoadingPermissions
            ? "bg-gray-800/50 cursor-wait"
            : isLive
            ? "bg-red-600 hover:bg-red-700"
            : "bg-red-600 hover:bg-red-700"
        }
      `}
      title={label}
    >
      {isLoadingPermissions ? (
        <div className="w-5 h-5 shrink-0 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
      ) : isLoading ? (
        <LoadingSpinner size="sm" />
      ) : isLive ? (
        <StopCircle className="w-5 h-5 shrink-0 text-white" />
      ) : (
        <Radio className="w-5 h-5 shrink-0 text-white" />
      )}
      <span className="hidden lg:inline text-white font-medium text-sm">
        {label}
      </span>
    </button>
  );
}

// =============================================================================
// Scores Button
// =============================================================================

interface ScoresButtonProps {
  isActive: boolean;
  onClick: () => void;
  variant: "desktop" | "mobile";
  className?: string;
}

export function ScoresButton({
  isActive,
  onClick,
  variant,
  className = "",
}: ScoresButtonProps) {
  if (variant === "mobile") {
    return (
      <button
        onClick={onClick}
        className={`
          flex-1 px-3 py-3 font-bold text-sm h-12
          rounded-lg border-2 transition-all duration-200 flex items-center justify-center gap-2 w-full
          ${
            isActive
              ? "bg-yellow-600 text-white border-yellow-500 shadow-lg shadow-yellow-500/30"
              : "bg-gray-800/80 border-gray-700/50 text-gray-300 hover:bg-gray-800 hover:border-gray-600"
          }
          ${className}
        `}
        aria-label="View Scores"
      >
        <span className="text-lg">📊</span>
        <span>Scores</span>
      </button>
    );
  }

  // Desktop variant
  return (
    <motion.button
      onClick={onClick}
      className={`
        flex-1 px-4 py-2.5 font-bold text-sm
        rounded-lg border-2 transition-all duration-200 flex items-center justify-center gap-2
        ${
          isActive
            ? "bg-linear-to-r from-yellow-600 to-orange-600 border-yellow-500 text-white shadow-lg shadow-yellow-500/30"
            : "bg-gray-800/60 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600"
        }
        ${className}
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="text-lg">📊</span>
      <span>Scores</span>
    </motion.button>
  );
}

// =============================================================================
// Song/MP3 Button
// =============================================================================

interface SongButtonProps {
  isActive: boolean;
  isSongPlaying: boolean;
  showSongGenerator: boolean;
  onClick: () => void;
  variant: "desktop" | "mobile";
}

export function SongButton({
  isActive,
  isSongPlaying,
  showSongGenerator,
  onClick,
  variant,
}: SongButtonProps) {
  const getButtonState = () => {
    if (isSongPlaying) return "playing";
    if (isActive) return "active";
    if (showSongGenerator) return "generator";
    return "default";
  };

  const state = getButtonState();

  if (variant === "mobile") {
    return (
      <button
        onClick={onClick}
        className={`
          flex-1 px-3 py-3 font-bold text-sm h-12
          rounded-lg border-2 transition-all duration-200 flex items-center justify-center gap-2 w-full
          ${
            state === "playing" || state === "active"
              ? "bg-green-600 text-white border-green-500 shadow-lg shadow-green-500/30"
              : state === "generator"
              ? "bg-green-900/40 border-green-600 text-green-400 animate-pulse"
              : "bg-gray-800/80 border-gray-700/50 text-gray-300 hover:bg-gray-800 hover:border-gray-600"
          }
        `}
        aria-label={showSongGenerator ? "Generate Song" : "Play Song"}
      >
        {showSongGenerator ? (
          <>
            <span className="text-lg" style={{ filter: "invert(1)" }}>
              🎵
            </span>
            <span className="whitespace-nowrap">Make MP3</span>
          </>
        ) : isSongPlaying ? (
          <>
            <AnimatedEq className="text-white" />
            <span>Pause</span>
          </>
        ) : (
          <>
            <span className="text-lg" style={{ filter: "invert(1)" }}>
              🎵
            </span>
            <span>Song</span>
          </>
        )}
      </button>
    );
  }

  // Desktop variant
  return (
    <motion.button
      onClick={onClick}
      className={`
        flex-1 px-4 py-2.5 font-bold text-sm
        rounded-lg border-2 transition-all duration-200 flex items-center justify-center gap-2
        ${
          state === "playing" || state === "active"
            ? "bg-linear-to-r from-green-600 to-emerald-600 border-green-500 text-white shadow-lg shadow-green-500/30"
            : state === "generator"
            ? "bg-linear-to-r from-green-700/40 to-emerald-700/40 border-green-600 text-green-300 hover:from-green-700/60 hover:to-emerald-700/60 hover:border-green-500 animate-pulse"
            : "bg-gray-800/60 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600"
        }
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {showSongGenerator ? (
        <>
          <span className="text-lg" style={{ filter: "invert(1)" }}>
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
          <span className="text-lg" style={{ filter: "invert(1)" }}>
            🎵
          </span>
          <span>Song</span>
        </>
      )}
    </motion.button>
  );
}

// =============================================================================
// Helper to create mobile action items
// =============================================================================

import type { MobileFanButtonAction } from "./mobile-fan-button";

interface BuildMobileFanActionsOptions {
  showCommenting: boolean;
  showVoting: boolean;
  /** For active battles, voting is only shown when live */
  requireLiveForVoting?: boolean;
  isLive?: boolean;
  onCommentsClick?: () => void;
  onVotingClick?: () => void;
  onSettingsClick?: () => void;
  mobileActiveTab?: "comments" | "voting" | null;
  isMobileDrawerOpen?: boolean;
  settingsActive?: boolean;
  // Go Live mobile action
  showGoLive?: boolean;
  isLoadingPermissions?: boolean;
  isStartingLive?: boolean;
  isStoppingLive?: boolean;
  onGoLiveClick?: () => void;
}

/**
 * Builds the mobile fan button actions array.
 * Centralizes the logic used by both BattleControlBar and BattleReplayControlBar.
 */
export function buildMobileFanActions({
  showCommenting,
  showVoting,
  requireLiveForVoting = false,
  isLive = false,
  onCommentsClick,
  onVotingClick,
  onSettingsClick,
  mobileActiveTab = null,
  isMobileDrawerOpen = false,
  settingsActive = false,
  showGoLive = false,
  isLoadingPermissions = false,
  isStartingLive = false,
  isStoppingLive = false,
  onGoLiveClick,
}: BuildMobileFanActionsOptions): MobileFanButtonAction[] {
  const actions: MobileFanButtonAction[] = [];

  // Go Live action (shown first for prominence)
  if (showGoLive && onGoLiveClick) {
    const goLiveState = getGoLiveState({
      isLive,
      isLoadingPermissions,
      isStartingLive,
      isStoppingLive,
    });
    actions.push({
      id: "go-live",
      label: goLiveState.label,
      icon: goLiveState.icon,
      onClick: onGoLiveClick,
      isActive: isLive,
      disabled: goLiveState.isDisabled,
      // Red when not live, red when live (ending)
      variant: isLive ? "danger" : "danger",
    });
  }

  if (showCommenting && onCommentsClick) {
    actions.push({
      id: "comments",
      label: "Comments",
      icon: <MessageSquare className="w-5 h-5" />,
      onClick: onCommentsClick,
      isActive: mobileActiveTab === "comments" && isMobileDrawerOpen,
    });
  }

  // For active battles, voting requires isLive; for replay, it doesn't
  const showVotingAction = requireLiveForVoting
    ? showVoting && isLive && onVotingClick
    : showVoting && onVotingClick;

  if (showVotingAction && onVotingClick) {
    actions.push({
      id: "voting",
      label: "Voting",
      icon: <ThumbsUp className="w-5 h-5" />,
      onClick: onVotingClick,
      isActive: mobileActiveTab === "voting" && isMobileDrawerOpen,
    });
  }

  if (onSettingsClick) {
    actions.push({
      id: "settings",
      label: "Settings",
      icon: <Settings className="w-5 h-5" />,
      onClick: onSettingsClick,
      isActive: settingsActive,
    });
  }

  return actions;
}
