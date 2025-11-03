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
  const isCompleted = currentRound <= completedRounds;

  return (
    <>
      {/* Mobile: Show only current round text */}
      <div className={`md:hidden flex items-center justify-center ${className}`}>
        <span className="text-sm text-gray-400 font-medium">
          Round {currentRound} of {ROUNDS_PER_BATTLE}
        </span>
      </div>

      {/* Desktop: Show all rounds */}
      <div className={`hidden md:flex items-center justify-center gap-3 pt-2 ${className}`}>
        {Array.from({ length: ROUNDS_PER_BATTLE }).map((_, index) => {
          const round = index + 1;
          const isRoundCompleted = round <= completedRounds;
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
                  w-16 h-16 rounded-full
                  flex items-center justify-center
                  font-[family-name:var(--font-bebas-neue)]
                  text-2xl
                  transition-colors duration-300
                  ${
                    isRoundCompleted
                      ? "bg-linear-to-br from-yellow-400 to-yellow-600 text-black"
                      : ""
                  }
                  ${
                    isCurrent && !isRoundCompleted
                      ? "bg-linear-to-br from-blue-500 to-purple-600 text-white"
                      : ""
                  }
                  ${
                    !isCurrent && !isRoundCompleted
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
                {isRoundCompleted ? "✓" : round}
              </motion.div>
              <span className="text-sm text-gray-400 font-medium">
                ROUND {round}
              </span>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}
