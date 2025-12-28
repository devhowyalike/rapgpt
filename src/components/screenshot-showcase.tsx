"use client";

import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";
import { Zap, Music, Mic2, Sword } from "lucide-react";
import { RapGPTLogo } from "./rapgpt-logo";
import { CreateBattleCTA } from "./create-battle-cta";
import { TAGLINE_2 } from "@/lib/constants";

interface ScreenshotShowcaseProps {
  isAuthenticated?: boolean;
}

export function ScreenshotShowcase({
  isAuthenticated = false,
}: ScreenshotShowcaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const springConfig = { stiffness: 100, damping: 30, restDelta: 0.001 };

  const rotateX = useSpring(
    useTransform(scrollYProgress, [0, 0.4], [10, 0]),
    springConfig
  );
  const scale = useSpring(
    useTransform(scrollYProgress, [0, 0.4], [0.9, 1]),
    springConfig
  );
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.15, 0.85, 1],
    [0, 1, 1, 0]
  );

  const features = [
    {
      icon: <Sword className="w-6 h-6 text-red-500" />,
      title: "Choose MC's",
      description: "Each with distinct flows and styles.",
    },
    {
      icon: <Mic2 className="w-6 h-6 text-yellow-500" />,
      title: "3 Rounds",
      description: "8 bars per verse, alternating turns.",
    },
    {
      icon: <Music className="w-6 h-6 text-green-500" />,
      title: "Make it a Song",
      description: "Select a style and stream it.",
    },
  ];

  return (
    <section
      ref={containerRef}
      className="relative pt-24 md:pt-32 pb-12 bg-black overflow-hidden"
    >
      {/* Dynamic Background Atmosphere */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-2/3 h-2/3 bg-red-600/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-2/3 h-2/3 bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />

        {/* Grid Pattern with smoother fade */}
        <div className="absolute inset-0 bg-[url('/assets/grid.svg')] bg-center mask-[linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)] opacity-10 pointer-events-none" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-12 gap-16 items-center">
          {/* Left Column: Content */}
          <div className="lg:col-span-5 space-y-6 flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-6 flex flex-col items-center"
            >
              <div className="space-y-4 flex flex-col items-center">
                <div className="relative w-fit mx-auto">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10">
                    <span className="text-[200px] md:text-[300px] opacity-15 rotate-12 block select-none pointer-events-none grayscale-0">
                      🎤
                    </span>
                  </div>
                  <RapGPTLogo size="xl" className="relative z-10" />
                </div>

                <p className="text-lg md:text-xl text-gray-400 leading-relaxed">
                  {TAGLINE_2}&trade;
                </p>

                <div className="pt-1 flex justify-center">
                  <CreateBattleCTA isAuthenticated={isAuthenticated} />
                </div>
              </div>

              <div className="space-y-4 flex flex-col items-center border-t border-white/5 pt-6">
                <div className="inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
                  <span className="text-sm font-medium text-yellow-400 tracking-wide uppercase">
                    AI Powered Freestyle Battles
                  </span>
                </div>

                <p className="text-xl text-zinc-400 leading-relaxed max-w-lg">
                  Witness AI-driven flows that adapt, respond, and evolve. Our
                  neural engine generates bar-for-bar heat in real-time.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Interactive Screenshot */}
          <div className="lg:col-span-7">
            <motion.div
              style={{
                perspective: "1200px",
                rotateX,
                scale,
                opacity,
              }}
              className="relative group"
            >
              {/* Main Screenshot with Reflection Effect */}
              <div className="relative">
                {/* Ambient Shadow/Glow */}
                <div className="absolute -inset-4 bg-linear-to-r from-red-500/20 via-purple-500/20 to-blue-500/20 rounded-[2.5rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                {/* The "Device" Frame */}
                <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-stage-dark">
                  {/* Fake Browser Header */}
                  <div className="h-10 bg-zinc-900/80 border-b border-white/5 flex items-center px-6 gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                    </div>
                    <div className="mx-auto flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-white/5">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] text-zinc-500 font-mono">
                        rapgpt.io/battle/live
                      </span>
                    </div>
                  </div>

                  {/* Screenshot Content */}
                  <div className="relative w-full">
                    <Image
                      src="/marketing/rap-gpt-screenshot.webp"
                      alt="RapGPT Platform Screenshot"
                      width={1200}
                      height={800}
                      className="w-full h-auto transition-transform duration-1000 group-hover:scale-[1.02]"
                      priority
                    />

                    {/* Internal UI Overlays */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                  </div>
                </div>

                {/* Reflection / Bottom Glow */}
                <div className="absolute -bottom-12 inset-x-12 h-24 bg-red-500/20 blur-[60px] rounded-full opacity-50" />
              </div>

              {/* Floating Feature Cards */}
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -left-4 md:-left-8 bottom-1/3 z-20 hidden xl:flex items-center gap-4 bg-zinc-900/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl"
              >
                <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-500">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 uppercase font-black tracking-widest leading-none mb-1">
                    Neural Flow
                  </div>
                  <div className="text-sm font-bold text-white uppercase font-(family-name:--font-bebas-neue) leading-none">
                    Lyrics Evolve
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Horizontal Features Row */}
        <div className="mt-8 pt-4 border-none">
          <div className="flex flex-col md:flex-row flex-wrap justify-center items-start gap-x-16 gap-y-8">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="flex items-start gap-4 group max-w-sm"
              >
                <div className="inline-flex p-3 rounded-xl bg-white/5 border border-white/10 group-hover:border-white/20 group-hover:bg-white/10 transition-all shrink-0 mt-0.5">
                  {feature.icon}
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-2xl font-bold text-white font-(family-name:--font-bebas-neue) tracking-wide uppercase leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-base text-zinc-400 leading-relaxed text-pretty group-hover:text-zinc-300 transition-colors">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
