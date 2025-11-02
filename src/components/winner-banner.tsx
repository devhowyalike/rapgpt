"use client";

import type { Battle } from "@/lib/shared";
import { motion } from "framer-motion";
import { VictoryConfetti } from "./victory-confetti";

interface WinnerBannerProps {
  battle: Battle;
}

export function WinnerBanner({ battle }: WinnerBannerProps) {
  if (battle.status === "incomplete") {
    return (
      <motion.div
        className="mt-2 text-center md:text-left"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="text-2xl md:text-3xl font-bold text-orange-400 font-(family-name:--font-bebas-neue) whitespace-nowrap">
          ⏸️ MATCH PAUSED ⏸️
        </div>
      </motion.div>
    );
  }

  if (battle.winner) {
    const winnerName =
      battle.personas.left.id === battle.winner
        ? battle.personas.left.name
        : battle.personas.right.name;

    return (
      <motion.div
        className="mt-2 relative text-center md:text-left"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <VictoryConfetti trigger={true} />
        <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-yellow-400 font-(family-name:--font-bebas-neue) whitespace-nowrap relative z-10">
          🏆 WINNER: {winnerName} 🏆
        </div>
      </motion.div>
    );
  }

  return null;
}
