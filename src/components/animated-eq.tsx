/**
 * Animated Equalizer Component
 * Shows animated bars to indicate audio playback
 */

"use client";

import { motion } from "framer-motion";

interface AnimatedEqProps {
  className?: string;
}

export function AnimatedEq({ className = "" }: AnimatedEqProps) {
  return (
    <div className={`flex items-center gap-[2px] h-4 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-[3px] h-full bg-current origin-bottom rounded-full"
          animate={{
            scaleY: [0.3, 1, 0.5, 1, 0.3],
          }}
          transition={{
            duration: 1.2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  );
}
