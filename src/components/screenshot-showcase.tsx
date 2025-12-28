"use client";

import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { Zap, Music, Mic2, Clock, MessageSquare, Vote } from "lucide-react";
import { RapGPTLogo } from "./rapgpt-logo";
import { CreateBattleCTA } from "./create-battle-cta";
import { TAGLINE_2 } from "@/lib/constants";

type FeatureKey = "mcs" | "rounds" | "song" | null;

interface ScreenshotShowcaseProps {
  isAuthenticated?: boolean;
}

export function ScreenshotShowcase({
  isAuthenticated = false,
}: ScreenshotShowcaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeFeature, setActiveFeature] = useState<FeatureKey>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

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

  // Auto-cycle through features
  useEffect(() => {
    if (!isAutoPlaying) return;

    const featureOrder: FeatureKey[] = ["mcs", "rounds", "song"];
    let currentIndex = 0;

    const interval = setInterval(() => {
      setActiveFeature(featureOrder[currentIndex]);
      currentIndex = (currentIndex + 1) % featureOrder.length;
    }, 3000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handleFeatureHover = (key: FeatureKey) => {
    setIsAutoPlaying(false);
    setActiveFeature(key);
  };

  const handleFeatureLeave = () => {
    // Resume auto-play after a delay
    setTimeout(() => setIsAutoPlaying(true), 2000);
  };

  const features = [
    {
      key: "mcs" as FeatureKey,
      icon: <Mic2 className="w-6 h-6" />,
      title: "Choose MC's",
      description: "Each with distinct flows and styles.",
      color: "red",
    },
    {
      key: "rounds" as FeatureKey,
      icon: <Clock className="w-6 h-6" />,
      title: "3 Rounds",
      description: "8 bars per verse, alternating turns.",
      color: "yellow",
    },
    {
      key: "song" as FeatureKey,
      icon: <Music className="w-6 h-6" />,
      title: "Make it a Song",
      description: "Select a style and stream it.",
      color: "green",
    },
  ];

  return (
    <section
      ref={containerRef}
      className="relative pt-28 md:pt-32 pb-12 bg-black overflow-hidden"
    >
      {/* Dynamic Background Atmosphere */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-2/3 h-2/3 bg-red-600/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-2/3 h-2/3 bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />

        {/* Grid Pattern with smoother fade */}
        <div className="absolute inset-0 bg-[url('/assets/grid.svg')] bg-center mask-[linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)] opacity-20 pointer-events-none" />
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
                <div className="flex flex-col items-center">
                  <div className="relative w-fit mx-auto">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10">
                    <span className="text-[200px] md:text-[300px] opacity-10 rotate-12 block select-none pointer-events-none grayscale-0">
                      🎤
                    </span>
                    </div>
                    <RapGPTLogo size="xl" className="relative z-10" />
                  </div>

                  <p className="text-lg md:text-xl text-gray-400 leading-relaxed -mt-1 mb-2">
                    {TAGLINE_2}&trade;
                  </p>
                </div>

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

                <div className="space-y-4 max-w-lg">
                  <p className="text-xl text-zinc-400 leading-relaxed">
                    MCs react to the battle and adapt to each other in real
                    time.
                  </p>
                  <p className="text-xl text-zinc-400 leading-relaxed">
                    Turn the battle into a song you can stream or download.
                  </p>
                </div>
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
              className="relative"
            >
              {/* Main Screenshot with Reflection Effect */}
              <div className="relative">
                {/* The "Device" Frame */}
                <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-stage-dark">
                  {/* Fake Browser Header */}
                  <div className="h-10 bg-zinc-900/80 border-b border-white/5 flex items-center px-6 gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                      <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                    </div>
                  </div>

                  {/* Screenshot Content */}
                  <div className="relative w-full">
                    <Image
                      src="/marketing/rap-gpt-screenshot.webp"
                      alt="RapGPT Platform Screenshot"
                      width={1200}
                      height={800}
                      className="w-full h-auto"
                      priority
                    />

                    {/* Internal UI Overlays */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                    {/* Interactive Overlays */}
                    <AnimatePresence>
                      {/* MC Highlight Overlay */}
                      {activeFeature === "mcs" && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.3 }}
                          className="absolute left-[3%] top-[18%] z-10"
                        >
                          <div className="bg-black/80 backdrop-blur-xl border border-red-500/50 p-3 rounded-xl shadow-2xl shadow-red-500/20">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                                <Mic2 className="w-4 h-4 text-red-400" />
                              </div>
                              <div>
                                <div className="text-[9px] text-red-400 uppercase tracking-widest font-bold">
                                  MC Profiles
                                </div>
                                <div className="text-xs text-white font-medium">
                                  Unique Personas
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* Connecting line */}
                          <div className="absolute top-1/2 -right-8 w-8 h-px bg-linear-to-r from-red-500/50 to-transparent" />
                        </motion.div>
                      )}

                      {/* Rounds Highlight Overlay */}
                      {activeFeature === "rounds" && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className="absolute right-[20%] top-[10%] z-10"
                        >
                          <div className="bg-black/80 backdrop-blur-xl border border-yellow-500/50 p-3 rounded-xl shadow-2xl shadow-yellow-500/20">
                            <div className="flex items-center gap-3">
                              <div className="flex gap-1">
                                {[1, 2, 3].map((round) => (
                                  <div
                                    key={round}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                      round === 1
                                        ? "bg-yellow-500 text-black"
                                        : "bg-zinc-700 text-zinc-400"
                                    }`}
                                  >
                                    {round}
                                  </div>
                                ))}
                              </div>
                              <div>
                                <div className="text-[9px] text-yellow-400 uppercase tracking-widest font-bold">
                                  Battle Rounds
                                </div>
                                <div className="text-xs text-white font-medium">
                                  8 Bars Each
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Song/Music Highlight Overlay */}
                      {activeFeature === "song" && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.3 }}
                          className="absolute left-[15%] bottom-[15%] z-10"
                        >
                          <div className="bg-black/80 backdrop-blur-xl border border-green-500/50 p-3 rounded-xl shadow-2xl shadow-green-500/20">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                <Music className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <div className="text-[9px] text-green-400 uppercase tracking-widest font-bold">
                                  Export Audio
                                </div>
                                <div className="text-xs text-white font-medium">
                                  Stream or Download
                                </div>
                              </div>
                            </div>
                            {/* Fake waveform */}
                            <div className="mt-2 flex items-end gap-0.5 h-4">
                              {[
                                3, 6, 4, 8, 5, 7, 3, 6, 4, 8, 5, 7, 4, 6, 3,
                              ].map((h, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ height: 2 }}
                                  animate={{ height: h * 2 }}
                                  transition={{
                                    duration: 0.5,
                                    delay: i * 0.05,
                                    repeat: Infinity,
                                    repeatType: "reverse",
                                  }}
                                  className="w-1 bg-green-500/60 rounded-full"
                                />
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Reflection / Bottom Glow */}
                <div
                  className={`absolute -bottom-12 inset-x-12 h-24 blur-[60px] rounded-full opacity-50 transition-colors duration-500 ${
                    activeFeature === "mcs"
                      ? "bg-red-500/30"
                      : activeFeature === "rounds"
                      ? "bg-yellow-500/30"
                      : activeFeature === "song"
                      ? "bg-green-500/30"
                      : "bg-red-500/20"
                  }`}
                />
              </div>

              {/* Neural Flow Floating Card - appears on rounds */}
              <AnimatePresence>
                {activeFeature === "rounds" && (
                  <motion.div
                    initial={{ opacity: 0, x: -20, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -20, scale: 0.9 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="absolute -left-4 md:-left-8 bottom-1/3 z-20 hidden xl:flex items-center gap-4 bg-zinc-900/90 backdrop-blur-xl border border-yellow-500/30 p-4 rounded-2xl shadow-2xl shadow-yellow-500/10"
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
                )}
              </AnimatePresence>

              {/* Comments Panel Preview - appears on mcs */}
              <AnimatePresence>
                {activeFeature === "mcs" && (
                  <motion.div
                    initial={{ opacity: 0, x: 20, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.9 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="absolute -right-4 md:-right-6 top-1/4 z-20 hidden xl:flex flex-col gap-2 bg-zinc-900/90 backdrop-blur-xl border border-red-500/30 p-3 rounded-2xl shadow-2xl shadow-red-500/10"
                  >
                    <div className="flex items-center gap-2 text-red-400">
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-[10px] uppercase tracking-widest font-bold">
                        Live Chat
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {["🔥 That bar was insane!", "W for Humpty!", "🎤💀"].map(
                        (msg, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.15 }}
                            className="text-[10px] text-zinc-400 bg-zinc-800/50 px-2 py-1 rounded"
                          >
                            {msg}
                          </motion.div>
                        )
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Vote Panel - appears on song */}
              <AnimatePresence>
                {activeFeature === "song" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.9 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="absolute -right-4 md:-right-6 bottom-1/4 z-20 hidden xl:flex flex-col gap-2 bg-zinc-900/90 backdrop-blur-xl border border-green-500/30 p-3 rounded-2xl shadow-2xl shadow-green-500/10"
                  >
                    <div className="flex items-center gap-2 text-green-400">
                      <Vote className="w-4 h-4" />
                      <span className="text-[10px] uppercase tracking-widest font-bold">
                        Community
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">847</div>
                        <div className="text-[8px] text-zinc-500 uppercase">
                          Votes
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">12</div>
                        <div className="text-[8px] text-zinc-500 uppercase">
                          Remixes
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>

        {/* Interactive Features Row */}
        <div className="mt-8 pt-4 border-none">
          <div className="flex flex-col md:flex-row flex-wrap justify-center items-center md:items-start gap-x-16 gap-y-10">
            {features.map((feature, i) => {
              const isActive = activeFeature === feature.key;
              const colorClasses = {
                red: {
                  icon: "text-red-500",
                  activeBg: "bg-red-500/20",
                  activeBorder: "border-red-500/50",
                  shadow: "shadow-red-500/20",
                  ring: "ring-red-500/30",
                },
                yellow: {
                  icon: "text-yellow-500",
                  activeBg: "bg-yellow-500/20",
                  activeBorder: "border-yellow-500/50",
                  shadow: "shadow-yellow-500/20",
                  ring: "ring-yellow-500/30",
                },
                green: {
                  icon: "text-green-500",
                  activeBg: "bg-green-500/20",
                  activeBorder: "border-green-500/50",
                  shadow: "shadow-green-500/20",
                  ring: "ring-green-500/30",
                },
              };
              const colors =
                colorClasses[feature.color as keyof typeof colorClasses];

              return (
                <motion.button
                  key={feature.key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  onMouseEnter={() => handleFeatureHover(feature.key)}
                  onMouseLeave={handleFeatureLeave}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setActiveFeature(
                      activeFeature === feature.key ? null : feature.key
                    );
                  }}
                  className={`flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-4 group max-w-sm cursor-pointer transition-all duration-300 p-3 -m-3 rounded-2xl ${
                    isActive ? "bg-white/5" : "hover:bg-white/2"
                  }`}
                >
                  <motion.div
                    animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.3 }}
                    className={`inline-flex p-3 rounded-xl shrink-0 transition-all duration-300 ${
                      isActive
                        ? `${colors.activeBg} ${colors.activeBorder} border shadow-lg ${colors.shadow} ring-2 ${colors.ring}`
                        : "bg-white/5 border border-white/10 group-hover:border-white/20 group-hover:bg-white/10"
                    }`}
                  >
                    <span className={colors.icon}>{feature.icon}</span>
                  </motion.div>
                  <div className="space-y-1.5">
                    <h3
                      className={`text-2xl font-bold font-(family-name:--font-bebas-neue) tracking-wide uppercase leading-tight transition-colors duration-300 ${
                        isActive ? "text-white" : "text-zinc-300"
                      }`}
                    >
                      {feature.title}
                    </h3>
                    <p
                      className={`text-base leading-relaxed text-pretty transition-colors duration-300 ${
                        isActive ? "text-zinc-300" : "text-zinc-500"
                      }`}
                    >
                      {feature.description}
                    </p>
                    {/* Active indicator */}
                    <motion.div
                      initial={false}
                      animate={{
                        width: isActive ? "100%" : "0%",
                        opacity: isActive ? 1 : 0,
                      }}
                      transition={{ duration: 0.3 }}
                      className={`h-0.5 rounded-full ${
                        feature.color === "red"
                          ? "bg-red-500"
                          : feature.color === "yellow"
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                    />
                  </div>
                </motion.button>
              );
            })}
          </div>
          {/* Hint text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center text-xs text-zinc-600 mt-6"
          >
            Hover or tap features to explore
          </motion.p>
        </div>
      </div>
    </section>
  );
}
