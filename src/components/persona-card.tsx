/**
 * Persona card component
 */

"use client";

import type { Persona } from "@/lib/shared";
import { motion } from "framer-motion";
import Image from "next/image";

interface PersonaCardProps {
  persona: Persona;
  position?: "left" | "right";
  isActive?: boolean;
  isRoundWinner?: boolean;
  className?: string;
  selected?: boolean;
  label?: string;
}

export function PersonaCard({
  persona,
  position,
  isActive,
  isRoundWinner,
  className = "",
  selected,
  label,
}: PersonaCardProps) {
  return (
    <motion.div
      className={`flex flex-row items-center gap-4 w-full ${
        selected ? "ring-2 ring-purple-500" : ""
      } ${className}`}
      initial={{
        opacity: 0,
        x: position ? (position === "left" ? -50 : 50) : 0,
      }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Wrapper div to contain the glow effects */}
      <div className="relative shrink-0 p-2" style={{ isolation: "isolate" }}>
        <motion.div
          className="relative rounded-full"
          animate={{
            scale: isActive ? 1.05 : 1,
            boxShadow: isActive ? `0 0 30px ${persona.accentColor}` : "none",
          }}
          transition={{ duration: 0.3 }}
        >
          <div
            className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-4 bg-gray-800"
            style={{ borderColor: persona.accentColor }}
          >
            {/* Placeholder - in production, use actual images */}
            <div
              className="w-full h-full flex items-center justify-center text-2xl md:text-3xl font-bold text-white"
              style={{ backgroundColor: persona.accentColor + "40" }}
            >
              {persona.name.charAt(0)}
            </div>
          </div>

          {isActive && (
            <motion.div
              className="absolute -inset-2 rounded-full pointer-events-none"
              style={{ border: `2px solid ${persona.accentColor}` }}
              animate={{
                scale: [1, 1.08, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
          )}

          {label && (
            <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center">
              {label}
            </div>
          )}
        </motion.div>
      </div>

      <div className="text-left flex-1">
        <div className="flex items-center gap-2">
          <h3
            className="text-xl md:text-2xl font-bold font-(family-name:--font-bebas-neue)"
            style={{ color: persona.accentColor }}
          >
            {persona.name}
          </h3>
          {isRoundWinner && (
            <motion.div
              className="px-2.5 py-0.5 rounded-full bg-linear-to-r from-purple-600 to-purple-800 text-white font-bold text-xs flex items-center gap-1"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <span>Round</span>
              <span className="text-sm">👑</span>
            </motion.div>
          )}
        </div>
        <p className="text-xs md:text-sm text-gray-400 text-pretty">
          {persona.style}
        </p>
        <p className="text-xs md:text-sm text-gray-300 mt-1 w-full text-pretty">
          {persona.bio}
        </p>
      </div>
    </motion.div>
  );
}
