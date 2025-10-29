/**
 * Live indicator badge with viewer count
 */

"use client";

import { motion } from "framer-motion";
import { Users, Wifi } from "lucide-react";
import type { ConnectionStatus } from "@/lib/websocket/types";

interface LiveIndicatorProps {
  isLive?: boolean;
  viewerCount?: number;
  connectionStatus?: ConnectionStatus;
  className?: string;
}

export function LiveIndicator({
  isLive = false,
  viewerCount = 0,
  connectionStatus = "disconnected",
  className = "",
}: LiveIndicatorProps) {
  if (!isLive) return null;

  const isConnected = connectionStatus === "connected";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* LIVE Badge */}
      <motion.div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600 text-white font-bold text-sm"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="w-2 h-2 rounded-full bg-white"
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
        <span>LIVE</span>
      </motion.div>

      {/* Viewer Count */}
      {isConnected && viewerCount > 0 && (
        <motion.div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800 text-gray-300 text-sm"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Users className="w-3.5 h-3.5" />
          <span>{viewerCount.toLocaleString()}</span>
        </motion.div>
      )}

      {/* Connection Status */}
      {!isConnected && (
        <motion.div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-600/20 text-orange-400 text-sm"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Wifi className="w-3.5 h-3.5" />
          <span className="capitalize">{connectionStatus}</span>
        </motion.div>
      )}
    </div>
  );
}
