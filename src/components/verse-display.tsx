/**
 * Verse display component with animated bars
 */

"use client";

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

  return (
    <div className="flex-1 p-6 md:p-8">
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {verse &&
            !isStreaming &&
            bars.map((bar, index) => (
              <motion.div
                key={`${verse.id}-${index}`}
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                className="verse-line"
              >
                <p
                  className="text-lg md:text-xl text-white font-medium leading-relaxed"
                  style={{ textShadow: `0 0 10px ${persona.accentColor}40` }}
                >
                  <span
                    className="text-sm mr-2 opacity-50"
                    style={{ color: persona.accentColor }}
                  >
                    {index + 1}.
                  </span>
                  {bar.text}
                </p>
              </motion.div>
            ))}

          {isStreaming &&
            streamingBars.map((line, index) => (
              <motion.div
                key={`streaming-${index}`}
                initial={{ opacity: 0, x: position === "left" ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.2 }}
              >
                <p
                  className="text-lg md:text-xl text-white font-medium leading-relaxed"
                  style={{ textShadow: `0 0 10px ${persona.accentColor}40` }}
                >
                  <span
                    className="text-sm mr-2 opacity-50"
                    style={{ color: persona.accentColor }}
                  >
                    {index + 1}.
                  </span>
                  {line}
                </p>
              </motion.div>
            ))}
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
    </div>
  );
}
