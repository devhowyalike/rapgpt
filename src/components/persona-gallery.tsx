"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { VictoryConfetti } from "@/components/victory-confetti";
import { GridBackground } from "@/components/grid-background";
import {
  getAllClientPersonas,
  getPrimaryClientPersonas,
} from "@/lib/shared/personas/client";

interface PersonaGalleryProps {
  hideAltPersonas?: boolean;
  hideHeader?: boolean;
  showAllOnMobile?: boolean;
}

export function PersonaGallery({
  hideAltPersonas = true,
  hideHeader = false,
  showAllOnMobile = false,
}: PersonaGalleryProps) {
  const personas = (
    hideAltPersonas ? getPrimaryClientPersonas() : getAllClientPersonas()
  ).reverse();
  const [confettiKey, setConfettiKey] = useState(0);
  const [clickOrigin, setClickOrigin] = useState<
    { x: number; y: number } | undefined
  >(undefined);

  const handlePersonaClick = (e: React.MouseEvent) => {
    setClickOrigin({ x: e.clientX, y: e.clientY });
    setConfettiKey((prev) => prev + 1);
  };

  return (
    <section className="pt-0 pb-0 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {confettiKey > 0 && (
        <VictoryConfetti
          key={confettiKey}
          trigger={true}
          origin={clickOrigin}
        />
      )}
      {!hideHeader && (
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold font-(family-name:--font-bebas-neue) mb-4 text-white">
            Choose Your MC
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Select your lyricists, each with their own unique flow, style, and
            personality.
          </p>
        </div>
      )}

      <div className="relative">
        <div className="flex flex-wrap justify-center gap-6 sm:pb-0">
          {personas.map((persona, index) => (
            <motion.div
              key={persona.id}
              onClick={handlePersonaClick}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`group relative bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden hover:border-purple-500/50 transition-colors duration-300 flex-col w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] xl:w-[calc(25%-18px)] ${
                showAllOnMobile || index < 5 ? "flex" : "hidden sm:flex"
              }`}
            >
              <GridBackground intensity="subtle" />

              {/* Background Glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at center, ${
                    persona.accentColor || "#8b5cf6"
                  } 0%, transparent 70%)`,
                }}
              />

              <div className="p-6 flex flex-col items-center text-center relative z-10 grow">
                {/* Avatar */}
                <div
                  className="relative w-24 h-24 mb-4 rounded-full border-2 border-gray-700 group-hover:scale-105 transition-transform duration-300 overflow-hidden shrink-0"
                  style={{ borderColor: persona.accentColor || "#8b5cf6" }}
                >
                  <Image
                    src={persona.avatar}
                    alt={persona.name}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Name & Style */}
                <h3 className="text-2xl font-bold font-(family-name:--font-bebas-neue) text-white mb-1">
                  {persona.name}
                </h3>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300 mb-3 border border-gray-700">
                  {persona.style}
                </span>

                {/* Bio */}
                <p className="text-sm text-gray-400 line-clamp-3 text-pretty">
                  {persona.bio}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile Fadeout Overlay - only when not showing all */}
        {!showAllOnMobile && (
          <div className="absolute bottom-0 left-0 right-0 h-64 bg-linear-to-t from-black to-transparent sm:hidden pointer-events-none z-20" />
        )}
      </div>

      {/* "And More" Text - Only shown when hiding alt personas */}
      {hideAltPersonas && (
        <motion.div
          className="flex justify-center pt-4 z-30 relative"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: personas.length * 0.1 }}
          viewport={{ once: true }}
        >
          <Link
            href="/roster"
            className="text-white/80 font-bold text-xl font-(family-name:--font-bebas-neue) tracking-wider text-uppercase hover:text-white transition-colors underline underline-offset-4"
          >
            And More!
          </Link>
        </motion.div>
      )}
    </section>
  );
}
