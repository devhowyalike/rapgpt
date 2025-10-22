/**
 * Persona card component
 */

"use client";

import type { Persona } from "@/lib/shared";
import { motion } from "framer-motion";
import Image from "next/image";

interface PersonaCardProps {
  persona: Persona;
  position: "left" | "right";
  isActive?: boolean;
  className?: string;
}

export function PersonaCard({
  persona,
  position,
  isActive,
  className = "",
}: PersonaCardProps) {
  return (
    <motion.div
      className={`flex flex-row items-center gap-4 w-full ${className}`}
      initial={{ opacity: 0, x: position === "left" ? -50 : 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="relative shrink-0 rounded-full"
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
            className="absolute -inset-2 rounded-full"
            style={{ border: `2px solid ${persona.accentColor}` }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        )}
      </motion.div>

      <div className="text-left flex-1">
        <h3
          className="text-xl md:text-2xl font-bold font-(family-name:--font-bebas-neue)"
          style={{ color: persona.accentColor }}
        >
          {persona.name}
        </h3>
        <p className="text-xs md:text-sm text-gray-400">{persona.style}</p>
        <p className="text-xs md:text-sm text-gray-300 mt-1 w-full">
          {persona.bio}
        </p>
      </div>
    </motion.div>
  );
}
