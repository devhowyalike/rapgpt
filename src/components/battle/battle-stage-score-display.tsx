/**
 * Score display section for battle stage
 * Shows animated score reveal at the end of each round
 */

"use client";

import { motion } from "framer-motion";
import type { Battle, RoundScore } from "@/lib/shared";
import { BattleScoreSection } from "./battle-score-section";

interface BattleStageScoreDisplayProps {
  battle: Battle;
  roundScore: RoundScore;
  scoreSectionRef: React.RefObject<HTMLDivElement | null>;
}

export function BattleStageScoreDisplay({
  battle,
  roundScore,
  scoreSectionRef,
}: BattleStageScoreDisplayProps) {
  return (
    <motion.div
      ref={scoreSectionRef}
      className="p-4 md:p-6 border-t border-gray-800 bg-gray-900/30"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="max-w-4xl mx-auto">
        <motion.h3
          className="text-xl md:text-2xl font-(family-name:--font-bebas-neue) text-center mb-4 text-yellow-400"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          ROUND {roundScore.round} SCORES
        </motion.h3>
        <BattleScoreSection battle={battle} roundScore={roundScore} />
      </div>
    </motion.div>
  );
}

