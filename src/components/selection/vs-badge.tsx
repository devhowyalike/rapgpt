"use client";

import { motion, AnimatePresence } from "framer-motion";

interface VsBadgeProps {
  visible: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function VsBadge({
  visible,
  size = "md",
  className = "",
}: VsBadgeProps) {
  const sizeClasses =
    size === "sm"
      ? "w-8 h-8 text-sm"
      : size === "lg"
        ? "w-28 h-28 text-4xl"
        : "w-10 h-10 text-base md:w-14 md:h-14 md:text-xl lg:w-20 lg:h-20 lg:text-3xl";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ scale: 0, rotate: -180, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          exit={{ scale: 0, rotate: 180, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={`absolute ${className}`}
        >
          {/* Background Glow */}
          <div
            className="absolute inset-0 bg-yellow-500/30 blur-xl rounded-full"
          />
          
          {/* Main Badge */}
          <div
            className={`relative ${sizeClasses} rounded-full bg-linear-to-br from-yellow-400 via-orange-500 to-red-600 flex items-center justify-center font-black text-white shadow-lg border-2 border-white/20`}
          >
            VS
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

