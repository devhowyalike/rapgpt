"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface VictoryConfettiProps {
  trigger: boolean;
}

export function VictoryConfetti({ trigger }: VictoryConfettiProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (trigger) {
      setShowConfetti(true);
      // Keep confetti for longer duration for victory
      const timer = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  if (!showConfetti) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {/* Generate more confetti particles for a grander effect */}
      {Array.from({ length: 80 }).map((_, i) => {
        // Randomize starting position across the width
        const startX = Math.random() * 100;
        // Random angle for more natural spread
        const angle = Math.PI / 4 + (Math.random() * Math.PI) / 2; // 45-135 degrees
        const velocity = 150 + Math.random() * 200;
        const colors = [
          "#fbbf24", // yellow-400
          "#facc15", // yellow-400
          "#ef4444", // red-500
          "#dc2626", // red-600
          "#a855f7", // purple-500
          "#9333ea", // purple-600
          "#3b82f6", // blue-500
          "#2563eb", // blue-600
          "#10b981", // green-500
          "#059669", // green-600
          "#ec4899", // pink-500
          "#db2777", // pink-600
          "#f97316", // orange-500
          "#ea580c", // orange-600
        ];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 8 + Math.random() * 8; // Vary size from 8-16px
        const delay = Math.random() * 0.5; // Stagger the start

        return (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${startX}%`,
              top: "50%",
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: color,
              borderRadius: Math.random() > 0.5 ? "50%" : "0%",
            }}
            initial={{
              x: 0,
              y: 0,
              opacity: 1,
              scale: 1,
              rotate: 0,
            }}
            animate={{
              x: Math.cos(angle) * velocity,
              y: Math.sin(angle) * velocity * -1, // Negative for upward motion
              opacity: 0,
              scale: 0,
              rotate: Math.random() * 720 - 360, // Spin in random direction
            }}
            transition={{
              duration: 2 + Math.random() * 1.5,
              ease: "easeOut",
              delay,
            }}
          />
        );
      })}

      {/* Add some larger star/sparkle particles */}
      {Array.from({ length: 20 }).map((_, i) => {
        const startX = Math.random() * 100;
        const angle = Math.PI / 4 + (Math.random() * Math.PI) / 2;
        const velocity = 100 + Math.random() * 150;
        const delay = Math.random() * 0.3;

        return (
          <motion.div
            key={`star-${i}`}
            className="absolute"
            style={{
              left: `${startX}%`,
              top: "50%",
              fontSize: "24px",
            }}
            initial={{
              x: 0,
              y: 0,
              opacity: 1,
              scale: 0,
            }}
            animate={{
              x: Math.cos(angle) * velocity,
              y: Math.sin(angle) * velocity * -1,
              opacity: 0,
              scale: 1.5,
              rotate: Math.random() * 720,
            }}
            transition={{
              duration: 2 + Math.random() * 1,
              ease: "easeOut",
              delay,
            }}
          >
            ⭐
          </motion.div>
        );
      })}
    </div>
  );
}
