/**
 * Live toggle badge for battle header
 * Shows live status indicator that can be toggled by admins/owners
 */

"use client";

import { motion } from "framer-motion";
import { Loader2, Radio, Users, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConnectionStatus } from "@/lib/websocket/types";

interface LiveToggleBadgeProps {
  /** Whether the battle is currently live */
  isLive: boolean;
  /** Whether user can toggle live mode (owner or admin) */
  canToggle: boolean;
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

export function LiveToggleBadge({
  isLive,
  canToggle,
  isStarting = false,
  isStopping = false,
  connectionStatus = "disconnected",
  viewerCount = 0,
  onToggle,
  className = "",
}: LiveToggleBadgeProps) {
  const isLoading = isStarting || isStopping;
  const isConnected = connectionStatus === "connected";

  // If not live and can't toggle, don't show anything
  if (!isLive && !canToggle) {
    return null;
  }

  // If live and user can't toggle, show indicator only
  if (isLive && !canToggle) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <motion.div
          className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-600 text-white font-bold text-xs"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-white"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [1, 0.7, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          <span className="text-[10px]">LIVE</span>
        </motion.div>

        {isConnected && viewerCount > 0 && (
          <motion.div
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-800/80 text-gray-300 text-[10px]"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Users className="w-3 h-3" />
            <span>{viewerCount}</span>
          </motion.div>
        )}
      </div>
    );
  }

  // Toggleable badge for admins/owners
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <motion.button
        onClick={onToggle}
        disabled={isLoading}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-xs transition-all",
          isLive
            ? "bg-red-600 hover:bg-red-700 text-white"
            : "bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600",
          isLoading && "opacity-70 cursor-not-allowed",
        )}
        whileHover={!isLoading ? { scale: 1.02 } : undefined}
        whileTap={!isLoading ? { scale: 0.98 } : undefined}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        title={isLive ? "Stop live broadcast" : "Start live broadcast"}
      >
        {isLoading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : isLive ? (
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-white"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [1, 0.7, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        ) : (
          <Radio className="w-3 h-3" />
        )}
        <span className="text-[10px]">
          {isStarting
            ? "STARTING..."
            : isStopping
              ? "STOPPING..."
              : isLive
                ? "LIVE"
                : "GO LIVE"}
        </span>
      </motion.button>

      {/* Viewer count when live */}
      {isLive && isConnected && viewerCount > 0 && (
        <motion.div
          className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-800/80 text-gray-300 text-[10px]"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Users className="w-3 h-3" />
          <span>{viewerCount}</span>
        </motion.div>
      )}

      {/* Connection warning when live but not connected */}
      {isLive && !isConnected && connectionStatus !== "connecting" && (
        <motion.div
          className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-600/20 text-orange-400 text-[10px]"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Wifi className="w-3 h-3" />
          <span className="capitalize">{connectionStatus}</span>
        </motion.div>
      )}
    </div>
  );
}

