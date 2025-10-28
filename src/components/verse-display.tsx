/**
 * Verse display component with animated bars
 */

"use client";

import { useRef, useEffect } from "react";
import type { Verse, Persona } from "@/lib/shared";
import { motion, AnimatePresence } from "framer-motion";

interface VerseDisplayProps {
  verse?: Verse;
  persona: Persona;
  position: "left" | "right";
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

  // Track if we just finished streaming to prevent re-animation
  const previousStreamingRef = useRef(false);
  const justFinishedStreaming = previousStreamingRef.current && !isStreaming;

  useEffect(() => {
    previousStreamingRef.current = isStreaming || false;
  }, [isStreaming]);

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
              <motion.div
                key={`${verse.id}-${index}`}
                initial={
                  justFinishedStreaming
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: 10 }
                }
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: justFinishedStreaming ? 0 : index * 0.05,
                }}
                className="verse-line flex"
              >
                <span
                  className="text-sm opacity-50 w-8 shrink-0"
                  style={{ color: persona.accentColor }}
                >
                  {index + 1}.
                </span>
                <p
                  className="text-lg md:text-xl text-white font-medium leading-relaxed flex-1"
                  style={{ textShadow: `0 0 10px ${persona.accentColor}40` }}
                >
                  {bar.text}
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {isStreaming && (
          <motion.div
            key="streaming"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {streamingBars.map((line, index) => (
              <motion.div
                key={`streaming-${index}`}
                initial={{ opacity: 0, x: position === "left" ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.2 }}
                className="flex"
              >
                <span
                  className="text-sm opacity-50 w-8 shrink-0"
                  style={{ color: persona.accentColor }}
                >
                  {index + 1}.
                </span>
                <p
                  className="text-lg md:text-xl text-white font-medium leading-relaxed flex-1"
                  style={{ textShadow: `0 0 10px ${persona.accentColor}40` }}
                >
                  {line}
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {!verse && !isStreaming && (
        <div className="flex items-center justify-center h-48">
          <p className="text-gray-500 text-center">
            Waiting for {persona.name} to drop their verse...
          </p>
        </div>
      )}

      {isStreaming && (
        <motion.div
          className="flex items-center gap-2 mt-4"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: persona.accentColor }}
          />
          <span className="text-sm" style={{ color: persona.accentColor }}>
            {persona.name} is spitting...
          </span>
        </motion.div>
      )}
    </div>
  );
}
