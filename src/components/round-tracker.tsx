/**
 * Round tracker component
 */

"use client";

import { motion } from "framer-motion";
import { ROUNDS_PER_BATTLE } from "@/lib/shared";

interface RoundTrackerProps {
  currentRound: number;
  completedRounds: number;
  className?: string;
}

export function RoundTracker({
  currentRound,
  completedRounds,
  className = "",
}: RoundTrackerProps) {
  return (
    <div className={`flex items-center justify-center gap-3 pt-2 ${className}`}>
      {Array.from({ length: ROUNDS_PER_BATTLE }).map((_, index) => {
        const round = index + 1;
        const isCompleted = round <= completedRounds;
        const isCurrent = round === currentRound;

        return (
          <motion.div
            key={round}
            className="flex flex-col items-center gap-1"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <motion.div
              className={`
                w-12 h-12 md:w-16 md:h-16 rounded-full
                flex items-center justify-center
                font-[family-name:var(--font-bebas-neue)]
                text-xl md:text-2xl
                transition-colors duration-300
                ${
                  isCompleted
                    ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-black"
                    : ""
                }
                ${
                  isCurrent && !isCompleted
                    ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                    : ""
                }
                ${
                  !isCurrent && !isCompleted
                    ? "bg-gray-800 text-gray-500 border-2 border-gray-700"
                    : ""
                }
              `}
              animate={
                isCurrent
                  ? {
                      scale: [1, 1.1, 1],
                      boxShadow: [
                        "0 0 0px rgba(59, 130, 246, 0.5)",
                        "0 0 20px rgba(59, 130, 246, 0.8)",
                        "0 0 0px rgba(59, 130, 246, 0.5)",
                      ],
                    }
                  : {}
              }
              transition={{
                duration: 2,
                repeat: isCurrent ? Number.POSITIVE_INFINITY : 0,
                ease: "easeInOut",
              }}
            >
              {isCompleted ? "✓" : round}
            </motion.div>
            <span className="text-xs md:text-sm text-gray-400 font-medium">
              ROUND {round}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
