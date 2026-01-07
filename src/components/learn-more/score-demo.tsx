"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Trophy } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { APP_TITLE } from "@/lib/constants";

// =============================================================================
// Types & Data
// =============================================================================

type DemoState =
  | "idle"
  | "scores-reveal"
  | "expanded"
  | "winner-highlight"
  | "reset";

interface StateConfig {
  label: string;
  duration: number;
  showScores: boolean;
  isExpanded: boolean;
  highlightWinner: boolean;
  isCalculating?: boolean;
}

// Mock persona data
const PERSONAS = {
  player1: {
    id: "player1",
    name: "Dawn from En Vogue",
    color: "rgb(var(--player1-color))",
  },
  player2: {
    id: "player2",
    name: "Shock G",
    color: "rgb(var(--player2-color))",
  },
};

// Mock score data
const MOCK_SCORES = {
  round: 3,
  winner: "player1" as "player1" | "player2" | "tie",
  positionScores: {
    player1: {
      totalScore: 8.7,
      automated: {
        total: 8.2,
        rhymeScheme: 8.5,
        wordplay: 8.1,
        flow: 8.0,
      },
      userVotes: 12,
    },
    player2: {
      totalScore: 7.9,
      automated: {
        total: 7.6,
        rhymeScheme: 7.8,
        wordplay: 7.5,
        flow: 7.4,
      },
      userVotes: 8,
    },
  },
};

const STATE_CONFIGS: Record<DemoState, StateConfig> = {
  idle: {
    label: "Calculating scores...",
    duration: 1800,
    showScores: true,
    isExpanded: false,
    highlightWinner: false,
    isCalculating: true,
  },
  "scores-reveal": {
    label: "Round 3 Complete!",
    duration: 1500,
    showScores: true,
    isExpanded: false,
    highlightWinner: false,
  },
  expanded: {
    label: "Score Breakdown",
    duration: 1800,
    showScores: true,
    isExpanded: true,
    highlightWinner: false,
  },
  "winner-highlight": {
    label: "Dawn from En Vogue takes the round!",
    duration: 2000,
    showScores: true,
    isExpanded: true,
    highlightWinner: true,
  },
  reset: {
    label: "",
    duration: 800,
    showScores: false,
    isExpanded: false,
    highlightWinner: false,
  },
};

const STATE_ORDER: DemoState[] = [
  "idle",
  "scores-reveal",
  "expanded",
  "winner-highlight",
  "reset",
];

// =============================================================================
// Loading Spinner
// =============================================================================

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center gap-2">
      <motion.div
        className="w-2 h-2 bg-yellow-400 rounded-full"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
      />
      <motion.div
        className="w-2 h-2 bg-yellow-400 rounded-full"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
      />
      <motion.div
        className="w-2 h-2 bg-yellow-400 rounded-full"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
      />
    </div>
  );
}

// =============================================================================
// Score Card Component
// =============================================================================

interface ScoreCardProps {
  persona: (typeof PERSONAS)["player1"];
  score: (typeof MOCK_SCORES.positionScores)["player1"];
  position: "player1" | "player2";
  isExpanded: boolean;
  isWinner: boolean;
  highlightWinner: boolean;
  animationDelay: number;
  isMobile: boolean;
}

function ScoreCard({
  persona,
  score,
  position,
  isExpanded,
  isWinner,
  highlightWinner,
  animationDelay,
  isMobile,
}: ScoreCardProps) {
  const playerColor =
    position === "player1"
      ? "rgb(var(--player1-color))"
      : "rgb(var(--player2-color))";

  const animationDirection = position === "player1" ? -20 : 20;

  return (
    <motion.div
      className={`bg-gray-900/50 rounded-lg ${
        isMobile ? "p-2" : "p-2 md:p-4"
      } border-2 transition-all duration-300 overflow-hidden`}
      style={{
        borderColor:
          highlightWinner && isWinner ? playerColor : `${playerColor}40`,
        boxShadow:
          highlightWinner && isWinner
            ? `0 0 20px ${playerColor}40, 0 0 40px ${playerColor}20`
            : "none",
      }}
      initial={{ x: animationDirection }}
      animate={{ x: 0 }}
      transition={{ duration: 0.25, delay: animationDelay }}
    >
      <div className="text-center">
        {/* Persona name with crown */}
        <div
          className={`${
            isMobile ? "text-[10px]" : "text-xs"
          } font-medium mb-1 opacity-80 flex items-center justify-center`}
          style={{ color: playerColor }}
        >
          <span className="relative">
            {persona.name}
            <AnimatePresence>
              {highlightWinner && isWinner && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute left-full ml-1 top-1/2 -translate-y-1/2 text-yellow-400"
                >
                  👑
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </div>

        {/* Total Score */}
        <motion.div
          className={`${
            isMobile ? "text-lg" : "text-xl md:text-2xl"
          } font-bold font-(family-name:--font-bebas-neue)`}
          style={{ color: playerColor }}
          initial={false}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {score.totalScore.toFixed(1)}
        </motion.div>

        {/* Vote breakdown - only show if expanded */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div
                className={`${
                  isMobile ? "text-[9px]" : "text-xs"
                } text-gray-400 mt-1`}
              >
                {APP_TITLE}: {score.automated.total.toFixed(1)} | Votes:{" "}
                {score.userVotes}
              </div>

              {/* Score Breakdown */}
              <div
                className={`mt-2 space-y-0.5 ${
                  isMobile ? "text-[9px]" : "text-xs"
                } text-left`}
              >
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// =============================================================================
// Mobile Drawer View
// =============================================================================

interface MobileDrawerViewProps {
  config: StateConfig;
  currentStateName: DemoState;
}

function MobileDrawerView({ config, currentStateName }: MobileDrawerViewProps) {
  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Blurred background */}
      <div className="absolute inset-0">
        <Image
          src="/marketing/battle-system/rapgpt-battle-stage.webp"
          alt="Battle stage"
          fill
          className="object-cover object-center blur-sm scale-105 brightness-40"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-gray-900/90" />
      </div>

      {/* Score Drawer */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 rounded-t-2xl shadow-2xl"
        initial={{ y: "100%" }}
        animate={{ y: config.showScores ? 0 : "100%" }}
        transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
      >
        {/* Swipe Handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-gray-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-3 pb-3 border-b border-gray-800">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            Round {MOCK_SCORES.round} Scores
          </h2>
        </div>

        {/* Content */}
        <div className="p-3 min-h-[140px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {config.isCalculating ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3"
              >
                <LoadingSpinner />
                <div className="px-3 py-1.5 rounded-lg text-xs font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                  {config.label}
                </div>
              </motion.div>
            ) : config.showScores ? (
              <motion.div
                key="scores"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full"
              >
                <div className="grid grid-cols-2 gap-2">
                  <ScoreCard
                    persona={PERSONAS.player1}
                    score={MOCK_SCORES.positionScores.player1}
                    position="player1"
                    isExpanded={config.isExpanded}
                    isWinner={MOCK_SCORES.winner === "player1"}
                    highlightWinner={config.highlightWinner}
                    animationDelay={0.05}
                    isMobile={true}
                  />
                  <ScoreCard
                    persona={PERSONAS.player2}
                    score={MOCK_SCORES.positionScores.player2}
                    position="player2"
                    isExpanded={config.isExpanded}
                    isWinner={MOCK_SCORES.winner === "player2"}
                    highlightWinner={config.highlightWinner}
                    animationDelay={0.1}
                    isMobile={true}
                  />
                </div>

                {/* Toggle Button */}
                <div className="flex items-center justify-center gap-2 py-2 mt-2 text-gray-400">
                  <span className="text-xs font-medium">
                    {config.isExpanded ? "Hide Details" : "Show Details"}
                  </span>
                  {config.isExpanded ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// =============================================================================
// Desktop View
// =============================================================================

interface DesktopViewProps {
  config: StateConfig;
  currentStateName: DemoState;
}

function DesktopView({ config, currentStateName }: DesktopViewProps) {
  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Blurred background */}
      <div className="absolute inset-0">
        <Image
          src="/marketing/battle-system/rapgpt-battle-stage.webp"
          alt="Battle stage"
          fill
          className="object-cover object-center blur-sm scale-105 brightness-50"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-gray-900/90" />
      </div>

      {/* Score Section */}
      <AnimatePresence>
        {config.showScores && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 p-4 md:p-6 border-t border-gray-800 bg-gray-900/30 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="max-w-md mx-auto min-h-[172px] flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {config.isCalculating ? (
                  <motion.div
                    key="loading-desktop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center gap-4 h-[172px]"
                  >
                    <LoadingSpinner />
                    <div className="px-4 py-2 rounded-lg text-sm font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                      {config.label}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="scores-desktop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full"
                  >
                    {/* Header */}
                    <motion.h3
                      className="text-lg md:text-xl font-(family-name:--font-bebas-neue) text-center mb-3 text-yellow-400 flex items-center justify-center gap-2"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25, delay: 0.1 }}
                    >
                      <Trophy className="w-5 h-5" />
                      ROUND {MOCK_SCORES.round} SCORES
                    </motion.h3>

                    {/* Score Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      <ScoreCard
                        persona={PERSONAS.player1}
                        score={MOCK_SCORES.positionScores.player1}
                        position="player1"
                        isExpanded={config.isExpanded}
                        isWinner={MOCK_SCORES.winner === "player1"}
                        highlightWinner={config.highlightWinner}
                        animationDelay={0.15}
                        isMobile={false}
                      />
                      <ScoreCard
                        persona={PERSONAS.player2}
                        score={MOCK_SCORES.positionScores.player2}
                        position="player2"
                        isExpanded={config.isExpanded}
                        isWinner={MOCK_SCORES.winner === "player2"}
                        highlightWinner={config.highlightWinner}
                        animationDelay={0.2}
                        isMobile={false}
                      />
                    </div>

                    {/* Toggle Button */}
                    <motion.div
                      className="flex items-center justify-center gap-2 py-2 mt-2 text-gray-400"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.25 }}
                    >
                      <span className="text-sm font-medium">
                        {config.isExpanded ? "Hide Details" : "Show Details"}
                      </span>
                      {config.isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

interface ScoreDemoProps {
  isActive?: boolean;
}

export function ScoreDemo({ isActive = true }: ScoreDemoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stateIndex, setStateIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const currentStateName = STATE_ORDER[stateIndex];
  const config = STATE_CONFIGS[currentStateName];

  const advanceState = useCallback(() => {
    setStateIndex((prev) => (prev + 1) % STATE_ORDER.length);
  }, []);

  // Reset animation when becoming active
  const wasActiveRef = useRef(isActive);
  useEffect(() => {
    if (isActive && !wasActiveRef.current) {
      setStateIndex(0);
    }
    wasActiveRef.current = isActive;
  }, [isActive]);

  // Detect mobile based on container width
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const checkMobile = () => {
      // Use container width to determine if we should show mobile or desktop view
      setIsMobile(container.offsetWidth < 500);
    };

    checkMobile();
    const resizeObserver = new ResizeObserver(checkMobile);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  // Auto-advance
  useEffect(() => {
    if (!isActive) return;

    const timer = setTimeout(advanceState, config.duration);
    return () => clearTimeout(timer);
  }, [stateIndex, isActive, config.duration, advanceState]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 bg-gray-900 flex flex-col overflow-hidden"
      style={
        {
          "--player1-color": "59 130 246", // blue-500
          "--player2-color": "239 68 68", // red-500
        } as React.CSSProperties
      }
    >
      {isMobile ? (
        <MobileDrawerView config={config} currentStateName={currentStateName} />
      ) : (
        <DesktopView config={config} currentStateName={currentStateName} />
      )}
    </div>
  );
}
