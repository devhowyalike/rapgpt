"use client";

import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

interface BattleBellProps {
  currentRound: number;
  completedRounds: number;
}

export function BattleBell({ currentRound, completedRounds }: BattleBellProps) {
  const [isShaking, setIsShaking] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const triggerAnimation = () => {
    setIsShaking(true);
    setShowConfetti(true);

    // Reset shake after animation
    setTimeout(() => setIsShaking(false), 600);

    // Remove confetti after animation
    setTimeout(() => setShowConfetti(false), 2000);
  };

  const handleClick = () => {
    triggerAnimation();
  };

  // Trigger animation when round changes (round starts)
  useEffect(() => {
    if (currentRound > 0) {
      triggerAnimation();
    }
  }, [currentRound]);

  // Trigger animation when round completes (round ends)
  useEffect(() => {
    if (completedRounds > 0) {
      triggerAnimation();
    }
  }, [completedRounds]);

  return (
    <div className="relative">
      <motion.button
        onClick={handleClick}
        className="flex items-center justify-center text-yellow-400 hover:text-yellow-300 transition-colors cursor-pointer relative z-10"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: 1,
          scale: 1,
          rotate: isShaking ? [0, -15, 15, -15, 15, -10, 10, -5, 5, 0] : 0,
        }}
        transition={{
          opacity: { delay: 0.2 },
          scale: { delay: 0.2 },
          rotate: { duration: 0.6 },
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Bell className="w-8 h-8 md:w-12 md:h-12" />
      </motion.button>

      {/* Confetti particles */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => {
            const angle = (Math.PI * 2 * i) / 30;
            const velocity = 100 + Math.random() * 100;
            const colors = [
              "#fbbf24", // yellow-400
              "#ef4444", // red-500
              "#a855f7", // purple-500
              "#3b82f6", // blue-500
              "#10b981", // green-500
              "#ec4899", // pink-500
            ];
            const color = colors[Math.floor(Math.random() * colors.length)];

            return (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: "50%",
                  top: "50%",
                  width: "8px",
                  height: "8px",
                  backgroundColor: color,
                  borderRadius: Math.random() > 0.5 ? "50%" : "0%",
                }}
                initial={{
                  x: 0,
                  y: 0,
                  opacity: 1,
                  scale: 1,
                }}
                animate={{
                  x: Math.cos(angle) * velocity,
                  y: Math.sin(angle) * velocity - 50,
                  opacity: 0,
                  scale: 0,
                  rotate: Math.random() * 360,
                }}
                transition={{
                  duration: 1 + Math.random() * 0.5,
                  ease: "easeOut",
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
