/**
 * Reusable control bar button components
 * Used across BattleControlBar and BattleReplayControlBar for DRY code
 */

"use client";

import { motion } from "framer-motion";
import { Radio, Settings, StopCircle } from "lucide-react";
import { type ReactNode, forwardRef } from "react";
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
    <div className="relative z-60 p-4 bg-gray-900 border-t border-gray-800">
      <div className="max-w-4xl mx-auto flex flex-row gap-3">{children}</div>
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
// Go Live Button
// =============================================================================

interface GoLiveButtonProps {
  isLive: boolean;
  isLoadingPermissions: boolean;
  isStartingLive: boolean;
  isStoppingLive: boolean;
  disabled?: boolean;
  onClick: () => void;
  variant: "desktop" | "mobile";
}

export function GoLiveButton({
  isLive,
  isLoadingPermissions,
  isStartingLive,
  isStoppingLive,
  disabled = false,
  onClick,
  variant,
}: GoLiveButtonProps) {
  const isLoading = isStartingLive || isStoppingLive;
  const isDisabled = disabled || isLoadingPermissions || isLoading;

  if (variant === "mobile") {
    return (
      <button
        onClick={isDisabled ? undefined : onClick}
        disabled={isDisabled}
        className={`
          w-14 h-14 rounded-full shadow-xl transition-all border-2 flex items-center justify-center backdrop-blur-md
          ${
            isLoadingPermissions
              ? "bg-gray-800/50 border-gray-700 cursor-wait"
              : isLive
              ? "bg-gray-700 hover:bg-gray-600 border-gray-500"
              : "bg-red-600 hover:bg-red-700 border-red-500"
          }
        `}
        title={isLive ? "End Live" : "Go Live"}
      >
        {isLoadingPermissions ? (
          <div className="w-6 h-6 shrink-0 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
        ) : isLoading ? (
          <LoadingSpinner size="sm" />
        ) : isLive ? (
          <StopCircle className="w-6 h-6 shrink-0 text-white" />
        ) : (
          <Radio className="w-6 h-6 shrink-0 text-white" />
        )}
      </button>
    );
  }

  // Desktop variant
  return (
    <button
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      className={`
        px-3 py-3 rounded-lg transition-all flex items-center justify-center gap-2
        ${
          isLoadingPermissions
            ? "bg-gray-800/50 cursor-wait"
            : isLive
            ? "bg-gray-700 hover:bg-gray-600"
            : "bg-red-600 hover:bg-red-700"
        }
      `}
      title={isLive ? "End Live" : "Go Live"}
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
        {isLive ? "End Live" : "Go Live"}
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
}

export function ScoresButton({
  isActive,
  onClick,
  variant,
}: ScoresButtonProps) {
  if (variant === "mobile") {
    return (
      <button
        onClick={onClick}
        className={`
          w-14 h-14 rounded-full shadow-xl transition-all border-2 flex items-center justify-center backdrop-blur-md
          ${
            isActive
              ? "bg-yellow-600/90 text-white border-yellow-400/50"
              : "bg-gray-800/80 text-gray-300 border-gray-700/50 hover:bg-yellow-600/90 hover:text-white hover:border-yellow-500/50"
          }
        `}
        aria-label="View Scores"
      >
        <span className="text-xl">📊</span>
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
          w-14 h-14 rounded-full shadow-xl transition-all border-2 flex items-center justify-center backdrop-blur-md
          ${
            state === "playing" || state === "active"
              ? "bg-green-600/90 text-white border-green-400/50"
              : state === "generator"
              ? "bg-green-700/60 text-green-300 border-green-500/50 animate-pulse"
              : "bg-gray-800/80 text-gray-300 border-gray-700/50 hover:bg-green-600/90 hover:text-white hover:border-green-500/50"
          }
        `}
        aria-label={showSongGenerator ? "Generate Song" : "Play Song"}
      >
        {isSongPlaying ? (
          <AnimatedEq className="text-white" />
        ) : (
          <span className="text-xl" style={{ filter: "invert(1)" }}>
            🎵
          </span>
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

export interface MobileActionItem {
  id: string;
  component: ReactNode;
  label: string;
}

export function createGoLiveAction(
  props: Omit<GoLiveButtonProps, "variant"> & { onShowConfirmation: () => void }
): MobileActionItem {
  const { isLive, onShowConfirmation, ...rest } = props;
  return {
    id: "go-live",
    component: (
      <GoLiveButton
        {...rest}
        isLive={isLive}
        onClick={isLive ? rest.onClick : onShowConfirmation}
        variant="mobile"
      />
    ),
    label: isLive ? "End Live" : "Go Live",
  };
}

export function createScoresAction(
  props: Omit<ScoresButtonProps, "variant">
): MobileActionItem {
  return {
    id: "scores",
    component: <ScoresButton {...props} variant="mobile" />,
    label: "Scores",
  };
}

export function createSongAction(
  props: Omit<SongButtonProps, "variant">
): MobileActionItem {
  return {
    id: "song",
    component: <SongButton {...props} variant="mobile" />,
    label: props.showSongGenerator
      ? "Make MP3"
      : props.isSongPlaying
      ? "Pause"
      : "Song",
  };
}
