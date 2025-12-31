"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Vote, Trophy, Timer } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

// =============================================================================
// Types & Data
// =============================================================================

type DemoState =
  | "idle"
  | "voting-active"
  | "first-vote"
  | "second-vote"
  | "third-vote"
  | "winner-reveal"
  | "reset";

interface StateConfig {
  label: string;
  duration: number;
  timerValue: number | null;
  player1Votes: number;
  player2Votes: number;
  userVotedFor: "player1" | "player2" | null;
  showWinner: boolean;
}

interface Persona {
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  hoverBorder: string;
}

const PERSONAS: Record<"player1" | "player2", Persona> = {
  player1: {
    name: "Dawn",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500",
    hoverBorder: "hover:border-blue-500",
  },
  player2: {
    name: "Shock G",
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500",
    hoverBorder: "hover:border-purple-500",
  },
};

const STATE_CONFIGS: Record<DemoState, StateConfig> = {
  idle: {
    label: "Waiting for votes...",
    duration: 1500,
    timerValue: null,
    player1Votes: 0,
    player2Votes: 0,
    userVotedFor: null,
    showWinner: false,
  },
  "voting-active": {
    label: "",
    duration: 1200,
    timerValue: 10,
    player1Votes: 0,
    player2Votes: 0,
    userVotedFor: null,
    showWinner: false,
  },
  "first-vote": {
    label: "",
    duration: 1000,
    timerValue: 8,
    player1Votes: 1,
    player2Votes: 0,
    userVotedFor: "player1",
    showWinner: false,
  },
  "second-vote": {
    label: "",
    duration: 1000,
    timerValue: 5,
    player1Votes: 2,
    player2Votes: 1,
    userVotedFor: "player1",
    showWinner: false,
  },
  "third-vote": {
    label: "",
    duration: 1200,
    timerValue: 2,
    player1Votes: 3,
    player2Votes: 2,
    userVotedFor: "player1",
    showWinner: false,
  },
  "winner-reveal": {
    label: "",
    duration: 2500,
    timerValue: null,
    player1Votes: 3,
    player2Votes: 2,
    userVotedFor: "player1",
    showWinner: true,
  },
  reset: {
    label: "",
    duration: 800,
    timerValue: null,
    player1Votes: 0,
    player2Votes: 0,
    userVotedFor: null,
    showWinner: false,
  },
};

const STATE_ORDER: DemoState[] = [
  "idle",
  "voting-active",
  "first-vote",
  "second-vote",
  "third-vote",
  "winner-reveal",
  "reset",
];

// =============================================================================
// Voting Timer
// =============================================================================

interface VotingTimerProps {
  timerValue: number;
  isMobile: boolean;
}

function VotingTimer({ timerValue, isMobile }: VotingTimerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`bg-linear-to-r from-purple-600 to-blue-600 rounded-lg ${
        isMobile ? "p-3" : "p-4"
      }`}
    >
      <div className="text-center">
        <div
          className={`text-white font-medium mb-1 flex items-center justify-center gap-1.5 ${
            isMobile ? "text-xs" : "text-sm"
          }`}
        >
          <Timer className={isMobile ? "w-3 h-3" : "w-4 h-4"} />
          VOTING ACTIVE
        </div>
        <div
          className={`font-bold text-white mb-1 font-bebas-neue ${
            isMobile ? "text-2xl" : "text-3xl"
          }`}
        >
          {timerValue}s
        </div>
        <div className={`text-white/80 ${isMobile ? "text-[10px]" : "text-xs"}`}>
          Vote now!
        </div>
        <div
          className={`bg-white/20 rounded-full overflow-hidden ${
            isMobile ? "mt-2 h-1" : "mt-3 h-1.5"
          }`}
        >
          <motion.div
            className="h-full bg-white rounded-full"
            initial={{ width: "100%" }}
            animate={{ width: `${(timerValue / 10) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// Vote Button
// =============================================================================

interface VoteButtonProps {
  position: "player1" | "player2";
  votes: number;
  isUserVote: boolean;
  isWinner: boolean;
  showWinner: boolean;
  isMobile: boolean;
}

function VoteButton({
  position,
  votes,
  isUserVote,
  isWinner,
  showWinner,
  isMobile,
}: VoteButtonProps) {
  const persona = PERSONAS[position];

  return (
    <motion.div
      layout
      transition={{
        layout: { type: "spring", stiffness: 350, damping: 25, delay: 0.1 },
      }}
    >
      <motion.button
        className={`
          w-full rounded-lg border-2 transition-all
          ${isMobile ? "p-2.5" : "p-3"}
          ${
            isUserVote
              ? "bg-linear-to-r from-yellow-500/20 to-amber-500/20 border-yellow-400 shadow-lg shadow-yellow-400/20"
              : `bg-black/20 border-gray-700 ${persona.hoverBorder}`
          }
        `}
        animate={
          isUserVote
            ? { scale: [1, 1.02, 1] }
            : isWinner && showWinner
            ? { scale: [1, 1.05, 1] }
            : {}
        }
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span
              className={`font-medium truncate ${persona.color} ${
                isMobile ? "text-sm" : "text-base"
              }`}
            >
              {persona.name}
            </span>
            {isUserVote && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`text-yellow-400 font-bold bg-yellow-400/10 border border-yellow-400/20 rounded-sm shrink-0 uppercase tracking-tight ${
                  isMobile ? "text-[8px] px-1 py-0.5" : "text-[10px] px-1.5 py-0.5"
                }`}
              >
                Your Vote
              </motion.span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <motion.span
              key={votes}
              initial={{ scale: 1.2, color: "#fbbf24" }}
              animate={{ scale: 1, color: "#9ca3af" }}
              className={`text-gray-400 ${isMobile ? "text-xs" : "text-sm"}`}
            >
              {votes} {votes === 1 ? "vote" : "votes"}
            </motion.span>
            <AnimatePresence>
              {isWinner && showWinner && (
                <motion.span
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="shrink-0"
                >
                  <Trophy
                    className={`text-yellow-400 ${
                      isMobile ? "w-4 h-4" : "w-5 h-5"
                    }`}
                  />
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.button>
    </motion.div>
  );
}

// =============================================================================
// Mobile View
// =============================================================================

interface MobileViewProps {
  config: StateConfig;
  currentStateName: DemoState;
}

function MobileView({ config, currentStateName }: MobileViewProps) {
  // Sort by votes (winner first)
  const sortedPositions: ("player1" | "player2")[] =
    config.player1Votes >= config.player2Votes
      ? ["player1", "player2"]
      : ["player2", "player1"];

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="/marketing/battle-system/rapgpt-battle-stage.webp"
          alt="Battle stage"
          fill
          className="object-cover object-center blur-sm scale-105 brightness-40"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-gray-900/95" />
      </div>

      {/* Loading State */}
      <AnimatePresence>
        {currentStateName === "idle" && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30"
            >
              {config.label}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voting Panel */}
      <AnimatePresence>
        {currentStateName !== "idle" && currentStateName !== "reset" && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 rounded-t-2xl"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-800">
              <Vote className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold text-white">
                Round 1 Voting
              </span>
            </div>

            {/* Content */}
            <div className="p-3 space-y-3">
              {/* Timer */}
              <AnimatePresence>
                {config.timerValue !== null && (
                  <VotingTimer timerValue={config.timerValue} isMobile={true} />
                )}
              </AnimatePresence>

              {/* Vote Buttons */}
              <div className="space-y-2">
                {sortedPositions.map((position) => (
                  <VoteButton
                    key={position}
                    position={position}
                    votes={
                      position === "player1"
                        ? config.player1Votes
                        : config.player2Votes
                    }
                    isUserVote={config.userVotedFor === position}
                    isWinner={
                      position === "player1"
                        ? config.player1Votes > config.player2Votes
                        : config.player2Votes > config.player1Votes
                    }
                    showWinner={config.showWinner}
                    isMobile={true}
                  />
                ))}
              </div>

              {/* Winner announcement */}
              <AnimatePresence>
                {config.showWinner && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-2"
                  >
                    <span className="text-xs font-medium text-yellow-400">
                      Dawn wins Round 1!
                    </span>
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
// Desktop View
// =============================================================================

interface DesktopViewProps {
  config: StateConfig;
  currentStateName: DemoState;
}

function DesktopView({ config, currentStateName }: DesktopViewProps) {
  // Sort by votes (winner first)
  const sortedPositions: ("player1" | "player2")[] =
    config.player1Votes >= config.player2Votes
      ? ["player1", "player2"]
      : ["player2", "player1"];

  return (
    <div className="absolute inset-0 flex">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="/marketing/battle-system/rapgpt-battle-stage.webp"
          alt="Battle stage"
          fill
          className="object-cover object-center blur-sm scale-105 brightness-50"
        />
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-transparent to-gray-900/80" />
      </div>

      {/* Loading State */}
      <AnimatePresence>
        {currentStateName === "idle" && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-2 h-2 bg-purple-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className="w-2 h-2 bg-purple-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="w-2 h-2 bg-purple-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                />
              </div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30"
              >
                {config.label}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voting Sidebar */}
      <AnimatePresence>
        {currentStateName !== "idle" && currentStateName !== "reset" && (
          <motion.div
            className="absolute right-0 top-0 bottom-0 w-72 bg-gray-900/95 backdrop-blur-sm border-l border-gray-800 flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800">
              <Vote className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-semibold text-white">
                Round 1 Voting
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 space-y-4">
              {/* Timer */}
              <AnimatePresence>
                {config.timerValue !== null && (
                  <VotingTimer timerValue={config.timerValue} isMobile={false} />
                )}
              </AnimatePresence>

              {/* Vote Buttons */}
              <div className="space-y-3">
                {sortedPositions.map((position) => (
                  <VoteButton
                    key={position}
                    position={position}
                    votes={
                      position === "player1"
                        ? config.player1Votes
                        : config.player2Votes
                    }
                    isUserVote={config.userVotedFor === position}
                    isWinner={
                      position === "player1"
                        ? config.player1Votes > config.player2Votes
                        : config.player2Votes > config.player1Votes
                    }
                    showWinner={config.showWinner}
                    isMobile={false}
                  />
                ))}
              </div>

              {/* Winner announcement */}
              <AnimatePresence>
                {config.showWinner && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-3"
                  >
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg"
                    >
                      <Trophy className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm font-medium text-yellow-400">
                        Dawn wins Round 1!
                      </span>
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

export function VotingDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stateIndex, setStateIndex] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const currentStateName = STATE_ORDER[stateIndex];
  const config = STATE_CONFIGS[currentStateName];

  const advanceState = useCallback(() => {
    setStateIndex((prev) => (prev + 1) % STATE_ORDER.length);
  }, []);

  const isInViewRef = useRef(false);

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

  // Intersection Observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const wasInView = isInViewRef.current;
        const nowInView = entry.isIntersecting;

        isInViewRef.current = nowInView;
        setIsInView(nowInView);

        if (!wasInView && nowInView) {
          setStateIndex(0);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Auto-advance
  useEffect(() => {
    if (!isInView) return;

    const timer = setTimeout(advanceState, config.duration);
    return () => clearTimeout(timer);
  }, [stateIndex, isInView, config.duration, advanceState]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 bg-gray-900 flex flex-col overflow-hidden"
    >
      {isMobile ? (
        <MobileView config={config} currentStateName={currentStateName} />
      ) : (
        <DesktopView config={config} currentStateName={currentStateName} />
      )}
    </div>
  );
}
