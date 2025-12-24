/**
 * Score display component
 */

"use client";

import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { APP_TITLE } from "@/lib/constants";
import type { Persona, RoundScore } from "@/lib/shared";

interface PersonaScoreCardProps {
  persona: Persona;
  score: RoundScore["positionScores"]["player1"];
  position: "player1" | "player2";
  isExpanded: boolean;
  animationDirection: number; // -20 for left, 20 for right
  animationDelay: number;
  votingEnabled: boolean;
  isWinner: boolean;
}

function PersonaScoreCard({
  persona,
  score,
  position,
  isExpanded,
  animationDirection,
  animationDelay,
  votingEnabled,
  isWinner,
}: PersonaScoreCardProps) {
  // Use position-based player colors instead of persona accent color
  const playerColor =
    position === "player1"
      ? "rgb(var(--player1-color))"
      : "rgb(var(--player2-color))";

  if (isExpanded) {
    return (
      <motion.div
        className="bg-gray-900/50 rounded-lg p-2 md:p-4 border-2"
        style={{ borderColor: `${playerColor}40` }}
        initial={{ opacity: 0, x: animationDirection }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: animationDelay }}
      >
        <div className="text-center">
          <div
            className="text-xs font-medium mb-1 md:mb-2 opacity-80 flex items-center justify-center gap-1"
            style={{ color: playerColor }}
          >
            <span>{persona.name}</span>
            {isWinner && <span className="text-yellow-400">👑</span>}
          </div>
          <div
            className="text-xl md:text-2xl font-bold font-(family-name:--font-bebas-neue)"
            style={{ color: playerColor }}
          >
            {score.totalScore.toFixed(1)}
          </div>
          {votingEnabled && (
            <div className="text-xs text-gray-400 mt-1">
              {APP_TITLE}: {score.automated.total.toFixed(1)} | Votes:{" "}
              {score.userVotes}
            </div>
          )}

          {/* Score Breakdown */}
          <div className="mt-2 md:mt-3 space-y-0.5 md:space-y-1 text-xs text-left">
            <div className="flex justify-between">
              <span className="text-gray-400">Rhyme:</span>
              <span className="text-white">
                {score.automated.rhymeScheme.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Wordplay:</span>
              <span className="text-white">
                {score.automated.wordplay.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Flow:</span>
              <span className="text-white">
                {score.automated.flow.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Collapsed view
  return (
    <motion.div
      className="bg-gray-900/50 rounded-lg p-2 md:p-4 border-2 flex flex-col items-center justify-center"
      style={{ borderColor: `${playerColor}40` }}
      initial={{ opacity: 0, x: animationDirection }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: animationDelay }}
    >
      <div
        className="text-xs font-medium mb-1 md:mb-2 opacity-80 flex items-center gap-1"
        style={{ color: playerColor }}
      >
        <span>{persona.name}</span>
        {isWinner && <span className="text-yellow-400">👑</span>}
      </div>
      <div
        className="text-xl md:text-2xl font-bold font-(family-name:--font-bebas-neue)"
        style={{ color: playerColor }}
      >
        {score.totalScore.toFixed(1)}
      </div>
    </motion.div>
  );
}

interface ScoreDisplayProps {
  roundScore: RoundScore;
  player1Persona: Persona;
  player2Persona: Persona;
  className?: string;
  votingEnabled?: boolean;
}

export function ScoreDisplay({
  roundScore,
  player1Persona,
  player2Persona,
  className = "",
  votingEnabled = true,
}: ScoreDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const player1Score = roundScore.positionScores.player1;
  const player2Score = roundScore.positionScores.player2;

  // Scroll the entire score section into view when expanded
  useEffect(() => {
    if (!isExpanded) return;
    // Small delay to let the expansion animation start
    const id = window.requestAnimationFrame(() => {
      containerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
    return () => window.cancelAnimationFrame(id);
  }, [isExpanded]);

  if (!player1Score || !player2Score) return null;

  return (
    <div ref={containerRef} className={className}>
      {/* Score Cards */}
      <div className="grid grid-cols-2 gap-2 md:gap-4">
        <PersonaScoreCard
          persona={player1Persona}
          score={player1Score}
          position="player1"
          isExpanded={isExpanded}
          animationDirection={-20}
          animationDelay={0.3}
          votingEnabled={votingEnabled}
          isWinner={roundScore.winner === "player1"}
        />
        <PersonaScoreCard
          persona={player2Persona}
          score={player2Score}
          position="player2"
          isExpanded={isExpanded}
          animationDirection={20}
          animationDelay={0.4}
          votingEnabled={votingEnabled}
          isWinner={roundScore.winner === "player2"}
        />
      </div>

      {/* Toggle Button - placed after cards, always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-center gap-2 py-3 mt-2 text-gray-400 hover:text-white transition-colors group outline-none"
      >
        <span className="text-sm font-medium">
          {isExpanded ? "Hide Details" : "Show Details"}
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 group-hover:transform group-hover:-translate-y-0.5 transition-transform" />
        ) : (
          <ChevronDown className="w-4 h-4 group-hover:transform group-hover:translate-y-0.5 transition-transform" />
        )}
      </button>
    </div>
  );
}
