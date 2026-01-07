"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Bell, Mic2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

// =============================================================================
// Types & Data
// =============================================================================

type DemoState =
  | "round1"
  | "round1-bars"
  | "round2"
  | "round2-bars"
  | "round3"
  | "round3-bars"
  | "complete";

interface StateConfig {
  round: number;
  completedRounds: number[];
  showBars: boolean;
  barCount: number;
  activePlayer: "player1" | "player2";
  duration: number;
}

const STATE_CONFIGS: Record<DemoState, StateConfig> = {
  round1: {
    round: 1,
    completedRounds: [],
    showBars: false,
    barCount: 0,
    activePlayer: "player1",
    duration: 1800,
  },
  "round1-bars": {
    round: 1,
    completedRounds: [],
    showBars: true,
    barCount: 8,
    activePlayer: "player1",
    duration: 2800,
  },
  round2: {
    round: 2,
    completedRounds: [1],
    showBars: false,
    barCount: 0,
    activePlayer: "player2",
    duration: 1600,
  },
  "round2-bars": {
    round: 2,
    completedRounds: [1],
    showBars: true,
    barCount: 8,
    activePlayer: "player2",
    duration: 2800,
  },
  round3: {
    round: 3,
    completedRounds: [1, 2],
    showBars: false,
    barCount: 0,
    activePlayer: "player1",
    duration: 1600,
  },
  "round3-bars": {
    round: 3,
    completedRounds: [1, 2],
    showBars: true,
    barCount: 8,
    activePlayer: "player1",
    duration: 2800,
  },
  complete: {
    round: 3,
    completedRounds: [1, 2, 3],
    showBars: false,
    barCount: 0,
    activePlayer: "player1",
    duration: 2200,
  },
};

const STATE_ORDER: DemoState[] = [
  "round1",
  "round1-bars",
  "round2",
  "round2-bars",
  "round3",
  "round3-bars",
  "complete",
];

const SAMPLE_BARS = [
  "I came to dominate, no hesitation in my fate",
  "Lyrical assassin, watch me demonstrate",
  "Every syllable precise, my flow is gold",
  "Stories in my verses that need to be told",
  "When I step to the mic, the crowd goes wild",
  "Been spittin' fire since I was a child",
  "From the heart of the city where legends made",
  "My legacy eternal, never gonna fade",
];

// =============================================================================
// Round Indicator Pill
// =============================================================================

interface RoundIndicatorProps {
  round: number;
  currentRound: number;
  isCompleted: boolean;
  isMobile: boolean;
}

function RoundIndicator({
  round,
  currentRound,
  isCompleted,
  isMobile,
}: RoundIndicatorProps) {
  const size = isMobile ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-xs";

  return (
    <motion.div
      className={`${size} rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
        isCompleted
          ? "bg-linear-to-br from-yellow-400 to-yellow-600 text-black"
          : round === currentRound
          ? "bg-linear-to-br from-blue-500 to-red-600 text-white ring-2 ring-blue-400/50"
          : "bg-gray-800 text-gray-500 border border-gray-700"
      }`}
      animate={
        round === currentRound && !isCompleted ? { scale: [1, 1.1, 1] } : {}
      }
      transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.5 }}
    >
      {isCompleted ? "✓" : round}
    </motion.div>
  );
}

// =============================================================================
// Verse Line
// =============================================================================

interface VerseLineProps {
  text: string;
  index: number;
  isPlayer1: boolean;
  isMobile: boolean;
}

function VerseLine({ text, index, isPlayer1, isMobile }: VerseLineProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className={`flex items-start gap-2 ${
        isMobile ? "text-[10px]" : "text-sm"
      }`}
    >
      <span className="text-gray-600 font-mono shrink-0 w-4 text-right">
        {index + 1}.
      </span>
      <span className={isPlayer1 ? "text-blue-300" : "text-red-500"}>
        {text}
      </span>
    </motion.div>
  );
}

// =============================================================================
// Main Demo Component
// =============================================================================

interface RoundsDemoProps {
  isActive?: boolean;
}

export function RoundsDemo({ isActive = true }: RoundsDemoProps) {
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

  const isPlayer1 = config.activePlayer === "player1";

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 bg-gray-950 flex flex-col overflow-hidden"
    >
      {/* Background - Battle stage with blur */}
      <div className="absolute inset-0">
        <Image
          src="/marketing/battle-system/rapgpt-battle-stage.webp"
          alt="Battle stage"
          fill
          className="object-cover object-center scale-110 brightness-[0.35]"
        />
        <div className="absolute inset-0 bg-linear-to-b from-gray-950/60 via-gray-950/40 to-gray-950/90" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header Bar - Stage info and Round Tracker */}
        <div
          className={`flex items-center justify-between bg-gray-900/90 backdrop-blur-sm border-b border-gray-800 ${
            isMobile ? "px-3 py-2" : "px-4 py-3"
          }`}
        >
          {/* Stage Info */}
          <div className="flex-1 min-w-0">
            <div
              className={`text-gray-500 uppercase tracking-wider ${
                isMobile ? "text-[8px]" : "text-[10px]"
              }`}
            >
              Stage
            </div>
            <div
              className={`font-bold text-white truncate ${
                isMobile ? "text-sm" : "text-base"
              }`}
            >
              Oakland Coliseum
            </div>
          </div>

          {/* Bell */}
          <motion.div
            className={isMobile ? "mx-2" : "mx-4"}
            animate={
              !config.showBars
                ? { rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.1, 1] }
                : {}
            }
            transition={{ duration: 0.5 }}
          >
            <Bell
              className={`text-yellow-400 fill-yellow-400/20 ${
                isMobile ? "w-5 h-5" : "w-6 h-6"
              }`}
            />
          </motion.div>

          {/* Round Tracker */}
          <div className="flex-1 flex justify-end">
            <div
              className={`flex items-center ${isMobile ? "gap-1" : "gap-2"}`}
            >
              <span
                className={`text-gray-500 uppercase tracking-wider mr-1 ${
                  isMobile ? "text-[8px]" : "text-[10px]"
                }`}
              >
                Round
              </span>
              {[1, 2, 3].map((round) => (
                <RoundIndicator
                  key={round}
                  round={round}
                  currentRound={config.round}
                  isCompleted={config.completedRounds.includes(round)}
                  isMobile={isMobile}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Main Battle Area */}
        <div className="flex-1 flex flex-col justify-center p-4">
          {/* Active Player Indicator */}
          <motion.div
            key={`${config.round}-${config.activePlayer}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center justify-center gap-2 mb-4 ${
              isMobile ? "gap-1.5" : "gap-2"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full overflow-hidden border-2 ${
                isPlayer1 ? "border-blue-400" : "border-red-400"
              }`}
            >
              <Image
                src={
                  isPlayer1
                    ? "/avatars/dawn-en-vogue.webp"
                    : "/avatars/shock-g.webp"
                }
                alt={isPlayer1 ? "Dawn" : "Shock G"}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Mic2
                className={`${isMobile ? "w-3 h-3" : "w-4 h-4"} ${
                  isPlayer1 ? "text-blue-400" : "text-red-400"
                }`}
              />
              <span
                className={`font-bold ${isMobile ? "text-sm" : "text-base"} ${
                  isPlayer1 ? "text-blue-400" : "text-red-400"
                }`}
              >
                {isPlayer1 ? "Dawn" : "Shock G"}
              </span>
            </div>
          </motion.div>

          {/* Verse Display Panel */}
          <motion.div
            className={`bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden ${
              isMobile ? "p-3" : "p-4"
            }`}
            animate={{
              borderColor: config.showBars
                ? isPlayer1
                  ? "rgba(96, 165, 250, 0.3)"
                  : "rgba(248, 113, 113, 0.3)"
                : "rgba(55, 65, 81, 1)",
            }}
            transition={{ duration: 0.3 }}
          >
            {/* Panel Header */}
            <div
              className={`flex items-center justify-between mb-3 pb-2 border-b border-gray-800 ${
                isMobile ? "mb-2 pb-1.5" : "mb-3 pb-2"
              }`}
            >
              <div className="flex items-center gap-2">
                <motion.div
                  className={`w-2 h-2 rounded-full ${
                    isPlayer1 ? "bg-blue-400" : "bg-red-400"
                  }`}
                  animate={
                    config.showBars ? { opacity: [1, 0.5, 1] } : { opacity: 1 }
                  }
                  transition={{
                    duration: 0.8,
                    repeat: config.showBars ? Infinity : 0,
                  }}
                />
                <span
                  className={`font-semibold ${
                    isMobile ? "text-xs" : "text-sm"
                  } ${isPlayer1 ? "text-blue-300" : "text-red-500"}`}
                >
                  Round {config.round} Verse
                </span>
              </div>
            </div>

            {/* Verse Content */}
            <div
              className={`space-y-1.5 ${
                isMobile ? "min-h-[140px]" : "min-h-[180px]"
              }`}
            >
              <AnimatePresence mode="wait">
                {config.showBars ? (
                  <motion.div
                    key={`bars-${config.round}-${config.activePlayer}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-1"
                  >
                    {SAMPLE_BARS.slice(0, config.barCount).map((bar, index) => (
                      <VerseLine
                        key={index}
                        text={bar}
                        index={index}
                        isPlayer1={isPlayer1}
                        isMobile={isMobile}
                      />
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key={`waiting-${config.round}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-full py-8"
                  >
                    {config.completedRounds.length === 3 ? (
                      <>
                        <motion.div
                          className={`font-bebas-neue font-bold ${
                            isMobile ? "text-2xl" : "text-3xl"
                          } bg-linear-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent`}
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                        >
                          BATTLE COMPLETE
                        </motion.div>
                        <span
                          className={`text-gray-500 mt-1 ${
                            isMobile ? "text-xs" : "text-sm"
                          }`}
                        >
                          3 Rounds • 48 Total Bars
                        </span>
                      </>
                    ) : (
                      <>
                        <motion.div
                          className={`font-bebas-neue font-bold ${
                            isMobile ? "text-3xl" : "text-4xl"
                          } bg-linear-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent`}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                        >
                          ROUND {config.round}
                        </motion.div>
                        <span
                          className={`text-gray-500 mt-1 ${
                            isMobile ? "text-xs" : "text-sm"
                          }`}
                        >
                          8 Bars Each MC
                        </span>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
