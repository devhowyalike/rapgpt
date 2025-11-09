"use client";

import type { Battle } from "@/lib/shared";
import { motion } from "framer-motion";
import { VictoryConfetti } from "./victory-confetti";

interface WinnerBannerProps {
  battle: Battle;
  collapsed?: boolean;
}

export function WinnerBanner({ battle, collapsed = false }: WinnerBannerProps) {
  if (battle.status === "paused") {
    return (
      <motion.div
        className="text-center md:text-left transition-all duration-300 gpu-accel"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
      >
        <div
          className={`font-bold text-orange-400 font-(family-name:--font-bebas-neue) whitespace-nowrap transition-all duration-300 ${
            collapsed ? "text-base md:text-lg" : "text-2xl md:text-3xl"
          }`}
        >
          {collapsed ? "⏸️ PAUSED" : "⏸️ MATCH PAUSED ⏸️"}
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
        className="relative text-center md:text-left transition-all duration-300 gpu-accel"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
      >
        {!collapsed && <VictoryConfetti trigger={true} />}
        <div
          className={`font-bold text-yellow-400 font-(family-name:--font-bebas-neue) whitespace-nowrap relative z-10 transition-all duration-300 ${
            collapsed
              ? "text-2xl md:text-lg"
              : "text-3xl md:text-4xl lg:text-5xl"
          }`}
        >
          {collapsed ? `🏆 ${winnerName}` : `🏆 WINNER: ${winnerName} 🏆`}
        </div>
      </motion.div>
    );
  }

  return null;
}
