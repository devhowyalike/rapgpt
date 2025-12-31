"use client";

import { memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import Image from "next/image";

import type { MCData, PausableProps, PlayerPositionProps } from "./types";
import type { PlayerPosition } from "./utils";
import { useVisibleWordCount } from "./hooks";
import { getPlayerColor, ringPulseAnimation } from "./utils";

// =============================================================================
// Stage Header Component
// =============================================================================

interface StageHeaderProps extends PausableProps {
  currentRound: number;
  completedRounds: number[];
}

export const StageHeader = memo(function StageHeader({
  currentRound,
  completedRounds,
  isPaused,
}: StageHeaderProps) {
  return (
    <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
      {/* Stage Info */}
      <div className="flex-1 min-w-0">
        <div className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">
          Stage:
        </div>
        <div className="text-sm sm:text-lg font-bold text-white truncate">
          Oakland Coliseum
        </div>
      </div>

      {/* Bell */}
      <div className="mx-2 sm:mx-4">
        <motion.div
          animate={{
            rotate:
              currentRound > 0 && !isPaused ? [0, -15, 15, -10, 10, 0] : 0,
            scale: currentRound > 0 && !isPaused ? [1, 1.1, 1] : 1,
          }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Bell className="w-5 h-5 sm:w-7 sm:h-7 text-yellow-400 fill-yellow-400/20" />
        </motion.div>
      </div>

      {/* Round Tracker */}
      <div className="flex-1 flex justify-end">
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mr-1">
            Round
          </span>
          {[1, 2, 3].map((round) => (
            <RoundIndicator
              key={round}
              round={round}
              currentRound={currentRound}
              isCompleted={completedRounds.includes(round)}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

// =============================================================================
// Round Indicator (extracted for clarity)
// =============================================================================

interface RoundIndicatorProps {
  round: number;
  currentRound: number;
  isCompleted: boolean;
}

function RoundIndicator({
  round,
  currentRound,
  isCompleted,
}: RoundIndicatorProps) {
  const baseClasses =
    "w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all duration-300";

  const stateClasses = isCompleted
    ? "bg-linear-to-br from-yellow-400 to-yellow-600 text-black"
    : round === currentRound
    ? "bg-linear-to-br from-blue-500 to-purple-600 text-white"
    : "bg-gray-800 text-gray-500 border-2 border-gray-700";

  return (
    <div className={`${baseClasses} ${stateClasses}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={isCompleted ? "check" : "num"}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.2 }}
        >
          {isCompleted ? "✓" : round}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// Persona Card Component
// =============================================================================

interface PersonaCardDemoProps extends PausableProps, PlayerPositionProps {
  mc: MCData;
  isActive: boolean;
}

export const PersonaCardDemo = memo(function PersonaCardDemo({
  mc,
  position,
  isActive,
  isPaused,
}: PersonaCardDemoProps) {
  const playerColor = getPlayerColor(position);

  return (
    <div className="flex items-center gap-4 p-2 sm:p-3 border-b border-gray-800 bg-gray-900">
      {/* Avatar with active ring */}
      <PersonaAvatar
        avatar={mc.avatar}
        name={mc.name}
        isActive={isActive}
        isPaused={isPaused}
        playerColor={playerColor}
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3
            className="text-lg font-bold font-(family-name:--font-bebas-neue) truncate"
            style={{ color: playerColor }}
          >
            {mc.name}
          </h3>
        </div>
        <p className="text-xs text-gray-400 truncate">
          {mc.style}
        </p>
        <p className="text-xs text-gray-300 truncate hidden sm:block">
          {mc.bio}
        </p>
      </div>
    </div>
  );
});

// =============================================================================
// Persona Avatar (extracted for clarity)
// =============================================================================

interface PersonaAvatarProps extends PausableProps {
  avatar: string;
  name: string;
  isActive: boolean;
  playerColor: string;
}

function PersonaAvatar({
  avatar,
  name,
  isActive,
  isPaused,
  playerColor,
}: PersonaAvatarProps) {
  return (
    <div className="relative shrink-0">
      <motion.div
        className="relative rounded-full"
        animate={{
          scale: isActive && !isPaused ? 1.05 : 1,
          boxShadow: isActive && !isPaused ? `0 0 20px ${playerColor}` : "none",
        }}
        transition={{ duration: 0.3 }}
      >
        <div
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 sm:border-[3px] bg-gray-800"
          style={{ borderColor: playerColor }}
        >
          <Image
            src={avatar}
            alt={name}
            width={56}
            height={56}
            className="w-full h-full object-cover"
          />
        </div>

        {isActive && (
          <motion.div
            className="absolute -inset-1 rounded-full pointer-events-none"
            style={{ border: `2px solid ${playerColor}` }}
            animate={ringPulseAnimation(isPaused)}
            transition={{
              duration: 2,
              repeat: isPaused ? 0 : Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </motion.div>
    </div>
  );
}

// =============================================================================
// Verse Display Component
// =============================================================================

interface VerseDemoProps extends PausableProps, PlayerPositionProps {
  lines: string[];
  visibleCount: number;
  isStreaming?: boolean;
  showIndicator?: boolean;
  mcName: string;
  shortMcName?: string;
}

export const VerseDemo = memo(function VerseDemo({
  lines,
  visibleCount,
  position,
  isStreaming,
  showIndicator,
  mcName,
  shortMcName,
  isPaused,
}: VerseDemoProps) {
  const playerColor = getPlayerColor(position);
  const { visibleWordCount } = useVisibleWordCount({
    isPaused,
    enabled: isStreaming && visibleCount > 0,
  });

  const visibleLines = lines.slice(0, visibleCount);

  // Pre-calculate cumulative word counts to avoid mutation during render
  // This ensures pure function behavior for React Strict Mode & concurrent rendering
  // Note: filter(Boolean) ensures consistency with calculateVerseDuration in utils.ts
  const lineStartWordIndices = useMemo(() => {
    let cumulative = 0;
    return visibleLines.map((line) => {
      const startIndex = cumulative;
      cumulative += line.split(" ").filter(Boolean).length;
      return startIndex;
    });
  }, [visibleLines]);

  return (
    <div className="flex-1 p-2 sm:p-4 space-y-1.5 sm:space-y-2 overflow-hidden text-pretty">
      <AnimatePresence mode="wait">
        {visibleLines.map((line, lineIndex) => (
          <VerseLine
            key={`${position}-${lineIndex}`}
            line={line}
            lineIndex={lineIndex}
            lineStartWordIndex={lineStartWordIndices[lineIndex]}
            position={position}
            isStreaming={isStreaming}
            visibleWordCount={visibleWordCount}
            playerColor={playerColor}
            isPaused={isPaused}
          />
        ))}
      </AnimatePresence>

      {/* Streaming indicator */}
      {isStreaming && showIndicator && visibleCount < lines.length && (
        <StreamingIndicator
          mcName={mcName}
          shortMcName={shortMcName}
          playerColor={playerColor}
          isPaused={isPaused}
        />
      )}

      {/* Empty state */}
      {visibleCount === 0 && !isStreaming && (
        <div className="flex items-center justify-center h-full">
          <p className="text-[10px] sm:text-xs text-gray-500 text-center text-pretty">
            Waiting for {mcName} to drop their verse...
          </p>
        </div>
      )}
    </div>
  );
});

// =============================================================================
// Verse Line (extracted for clarity)
// =============================================================================

interface VerseLineProps {
  line: string;
  lineIndex: number;
  lineStartWordIndex: number;
  position: PlayerPosition;
  isStreaming?: boolean;
  visibleWordCount: number;
  playerColor: string;
  isPaused: boolean;
}

const VerseLine = memo(function VerseLine({
  line,
  lineIndex,
  lineStartWordIndex,
  position,
  isStreaming,
  visibleWordCount,
  playerColor,
  isPaused,
}: VerseLineProps) {
  const words = useMemo(() => line.split(" ").filter(Boolean), [line]);
  // Use > (not >=) to match word visibility check: visibleWordCount > globalWordIndex
  // This ensures line numbers appear exactly when the first word of that line appears
  const lineNumberVisible =
    !isStreaming || visibleWordCount > lineStartWordIndex;

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: position === "player1" ? -20 : 20,
        scale: 0.95,
      }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{
        opacity: 0,
        x: position === "player1" ? -10 : 10,
        scale: 0.95,
        transition: { duration: 0.2 },
      }}
      transition={{ type: "spring", stiffness: 400, damping: 25, mass: 1 }}
      className="flex"
    >
      <span
        className="text-sm w-5 sm:w-6 shrink-0 transition-opacity duration-200"
        style={{
          color: playerColor,
          opacity: lineNumberVisible ? 0.5 : 0,
        }}
      >
        {lineIndex + 1}.
      </span>
      <div
        className="text-base text-white font-medium leading-relaxed flex-1"
        style={{ textShadow: `0 0 8px ${playerColor}40` }}
      >
        {words.map((word, wordIndex) => {
          const globalWordIndex = lineStartWordIndex + wordIndex;
          const isVisible = !isStreaming || visibleWordCount > globalWordIndex;

          return (
            <span
              key={`word-${lineIndex}-${wordIndex}`}
              className={`demo-word ${isVisible ? "visible" : ""} ${
                !isStreaming ? "instant" : ""
              } ${isPaused ? "paused" : ""}`}
            >
              {word}
            </span>
          );
        })}
      </div>
    </motion.div>
  );
});

// =============================================================================
// Streaming Indicator
// =============================================================================

interface StreamingIndicatorProps extends PausableProps {
  mcName: string;
  shortMcName?: string;
  playerColor: string;
}

function StreamingIndicator({
  mcName,
  shortMcName,
  playerColor,
  isPaused,
}: StreamingIndicatorProps) {
  return (
    <motion.div
      className="flex items-center gap-2 mt-2"
      animate={isPaused ? { opacity: 0.8 } : { opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: isPaused ? 0 : Infinity }}
    >
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: playerColor }}
      />
      <span className="text-sm" style={{ color: playerColor }}>
        {mcName} is spitting...
      </span>
    </motion.div>
  );
}
