/**
 * Unified live status badge
 * Combines live indicator, connection status, and viewer count into a single badge
 */

"use client";

import { motion } from "framer-motion";
import { Loader2, Radio, Users, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConnectionStatus } from "@/lib/websocket/types";

interface LiveStatusBadgeProps {
  /** Whether the battle is currently live */
  isLive: boolean;
  /** Whether user can toggle live mode (owner or admin) */
  canToggle?: boolean;
  /** Whether live mode is being started */
  isStarting?: boolean;
  /** Whether live mode is being stopped */
  isStopping?: boolean;
  /** WebSocket connection status */
  connectionStatus?: ConnectionStatus;
  /** Number of viewers watching */
  viewerCount?: number;
  /** Callback when toggle is clicked */
  onToggle?: () => void;
  /** Additional class names */
  className?: string;
}

export function LiveStatusBadge({
  isLive,
  canToggle = false,
  isStarting = false,
  isStopping = false,
  connectionStatus = "disconnected",
  viewerCount = 0,
  onToggle,
  className = "",
}: LiveStatusBadgeProps) {
  const isLoading = isStarting || isStopping;
  const isConnected = connectionStatus === "connected";
  const isConnecting = connectionStatus === "connecting";
  const hasConnectionIssue = isLive && !isConnected && !isConnecting;

  // If not live and can't toggle, don't show anything
  if (!isLive && !canToggle) {
    return null;
  }

  // Determine badge styling based on state
  const getBadgeStyles = () => {
    if (!isLive) {
      return {
        bg: "bg-gray-800/90 hover:bg-gray-700",
        border: "border border-gray-600",
        text: "text-gray-300",
        glow: "",
      };
    }

    if (isConnecting) {
      return {
        bg: "bg-amber-600/90",
        border: "",
        text: "text-white",
        glow: "",
      };
    }

    if (hasConnectionIssue) {
      return {
        bg: "bg-orange-600/90",
        border: "",
        text: "text-white",
        glow: "",
      };
    }

    return {
      bg: "bg-red-600",
      border: "",
      text: "text-white",
      glow: "shadow-[0_0_12px_rgba(220,38,38,0.5)]",
    };
  };

  const styles = getBadgeStyles();

  // Status text - show "DISCONNECT" when live and toggleable
  const statusText = isStarting
    ? "STARTING..."
    : isStopping
    ? "STOPPING..."
    : !isLive
    ? "GO LIVE"
    : isConnecting
    ? "CONNECTING"
    : hasConnectionIssue
    ? "RECONNECTING"
    : "LIVE";

  // Render status icon inline
  const renderStatusIcon = () => {
    if (isLoading) {
      return <Loader2 className="w-3 h-3 animate-spin" />;
    }

    if (!isLive) {
      return <Radio className="w-3 h-3" />;
    }

    if (isConnecting) {
      return <Loader2 className="w-3 h-3 animate-spin opacity-70" />;
    }

    if (hasConnectionIssue) {
      return <WifiOff className="w-3 h-3" />;
    }

    // Pulsing dot for live + connected
    return (
      <motion.div
        className="w-2 h-2 rounded-full bg-white"
        animate={{
          scale: [1, 1.4, 1],
          opacity: [1, 0.6, 1],
        }}
        transition={{
          duration: 1.2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
    );
  };

  // Show viewer count only when live and connected with viewers
  const showViewers = isLive && isConnected && viewerCount > 0;

  // Format viewer count
  const formattedViewerCount = viewerCount > 999 ? "999+" : viewerCount;

  const badgeContent = (
    <div className="flex items-center gap-1.5">
      {renderStatusIcon()}
      <span className="text-[10px] font-bold tracking-wide">{statusText}</span>
      {showViewers && (
        <div className="flex items-center gap-1 pl-2 ml-2 border-l border-white/30">
          <Users className="w-3 h-3 opacity-80" />
          <span className="text-[10px] tabular-nums">
            {formattedViewerCount}
          </span>
        </div>
      )}
    </div>
  );

  const isClickable = canToggle && onToggle;

  const badgeClasses = cn(
    "flex items-center px-2.5 py-1.5 rounded-full font-bold transition-all duration-500",
    styles.bg,
    styles.border,
    styles.text,
    styles.glow,
    isClickable ? "cursor-pointer" : "cursor-default",
    isLoading && "opacity-70 cursor-not-allowed",
    className
  );

  // Clickable badge for admins/owners
  if (canToggle && onToggle) {
    return (
      <button
        onClick={onToggle}
        disabled={isLoading}
        className={badgeClasses}
        title={
          isLive
            ? hasConnectionIssue
              ? "Connection issue - click to retry"
              : "Stop live broadcast"
            : "Start live broadcast"
        }
      >
        {badgeContent}
      </button>
    );
  }

  // Read-only badge for viewers
  return <div className={badgeClasses}>{badgeContent}</div>;
}
