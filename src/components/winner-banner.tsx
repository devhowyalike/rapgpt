"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { getWinnerPosition } from "@/lib/battle-engine";
import type { Battle } from "@/lib/shared";
import { VictoryConfetti } from "./victory-confetti";

interface WinnerBannerProps {
  battle: Battle;
  collapsed?: boolean;
}

export function WinnerBanner({ battle, collapsed = false }: WinnerBannerProps) {
  const winnerNameRef = useRef<HTMLSpanElement | null>(null);
  const [confettiOrigin, setConfettiOrigin] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Calculate confetti origin from winner name element position
  const updateConfettiOrigin = useCallback(() => {
    if (winnerNameRef.current) {
      const rect = winnerNameRef.current.getBoundingClientRect();
      setConfettiOrigin({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    }
  }, []);

  // Update confetti origin when winner name is rendered
  useEffect(() => {
    if (battle.winner && !collapsed) {
      // Small delay to ensure the element is rendered and positioned
      const timeoutId = setTimeout(updateConfettiOrigin, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [battle.winner, collapsed, updateConfettiOrigin]);
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
    const winnerPosition = getWinnerPosition(battle);
    const winnerName =
      winnerPosition === "player1"
        ? battle.personas.player1.name
        : battle.personas.player2.name;

    return (
      <motion.div
        className="relative text-center md:text-left transition-all duration-300 gpu-accel"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
      >
        {!collapsed && (
          <VictoryConfetti
            trigger={confettiOrigin !== null}
            origin={confettiOrigin ?? undefined}
          />
        )}
        <div
          className={`font-bold text-yellow-400 font-(family-name:--font-bebas-neue) whitespace-nowrap relative z-10 transition-all duration-300 ${
            collapsed
              ? "text-2xl md:text-lg"
              : "text-3xl md:text-4xl lg:text-5xl"
          }`}
        >
          {collapsed ? (
            `🏆 ${winnerName}`
          ) : (
            <>
              🏆 WINNER: <span ref={winnerNameRef}>{winnerName}</span> 🏆
            </>
          )}
        </div>
      </motion.div>
    );
  }

  return null;
}
