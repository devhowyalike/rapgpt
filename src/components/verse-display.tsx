/**
 * Verse display component with animated bars
 */

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import type { Persona, PersonaPosition, Verse } from "@/lib/shared";

interface VerseDisplayProps {
  verse?: Verse;
  persona: Persona;
  position: PersonaPosition;
  isStreaming?: boolean;
  streamingText?: string;
}

export function VerseDisplay({
  verse,
  persona,
  position,
  isStreaming,
  streamingText,
}: VerseDisplayProps) {
  const bars = verse?.bars || [];
  const streamingBars =
    streamingText?.split("\n").filter((line) => line.trim()) || [];

  // Use position-based player colors instead of persona accent color
  const playerColor =
    position === "player1"
      ? "rgb(var(--player1-color))"
      : "rgb(var(--player2-color))";

  // Ref for streaming container to enable auto-scrolling
  const streamingContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when streaming text updates
  useEffect(() => {
    if (isStreaming && streamingContainerRef.current) {
      streamingContainerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [streamingText, isStreaming]);

  return (
    <div className="flex-1 p-6 md:p-8">
      <AnimatePresence mode="wait">
        {verse && !isStreaming && (
          <motion.div
            key={verse.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {bars.map((bar, index) => (
              <div
                key={`${verse.id}-${index}`}
                className={
                  "verse-line flex" + (index === bars.length - 1 ? " pb-2" : "")
                }
              >
                <span
                  className="text-sm opacity-50 w-8 shrink-0"
                  style={{ color: playerColor }}
                >
                  {index + 1}.
                </span>
                <p
                  className="text-lg md:text-xl text-white font-medium leading-relaxed flex-1"
                  style={{ textShadow: `0 0 10px ${playerColor}40` }}
                >
                  {bar.text}
                </p>
              </div>
            ))}
          </motion.div>
        )}

        {isStreaming && (
          <motion.div
            key="streaming"
            ref={streamingContainerRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="space-y-3 pb-12 md:pb-16"
          >
            {streamingBars.map((line, index) => (
              <motion.div
                key={`streaming-${index}`}
                initial={{ opacity: 0, x: position === "player1" ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.2 }}
                className="flex"
              >
                <span
                  className="text-sm opacity-50 w-8 shrink-0"
                  style={{ color: playerColor }}
                >
                  {index + 1}.
                </span>
                <p
                  className="text-lg md:text-xl text-white font-medium leading-relaxed flex-1"
                  style={{ textShadow: `0 0 10px ${playerColor}40` }}
                >
                  {line}
                </p>
              </motion.div>
            ))}
            {streamingBars.length === 0 && (
              <motion.div
                className="flex items-center gap-2 mt-4"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: playerColor }}
                />
                <span className="text-sm" style={{ color: playerColor }}>
                  {persona.name} is spitting...
                </span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!verse && !isStreaming && (
        <div className="flex justify-center">
          <p className="text-gray-500 text-center text-pretty">
            Waiting for {persona.name} to drop their verse...
          </p>
        </div>
      )}

      {isStreaming && null}
    </div>
  );
}
