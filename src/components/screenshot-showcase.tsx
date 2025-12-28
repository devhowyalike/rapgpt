"use client";

import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import Image from "next/image";
import { useRef, useState, type ReactNode } from "react";
import {
  Zap,
  Music,
  Mic2,
  Clock,
  MessageSquare,
  Vote,
  Radio,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

type FeatureKey =
  | "mcs"
  | "rounds"
  | "song"
  | "watch"
  | "voting"
  | "chat"
  | "admin"
  | null;

type ColorKey = "red" | "yellow" | "green" | "blue" | "purple";

interface ScreenshotShowcaseProps {
  isAuthenticated?: boolean;
  className?: string;
}

// Extract color classes to a constant
const COLOR_CLASSES: Record<
  ColorKey,
  { icon: string; activeBg: string; activeBorder: string; glow: string }
> = {
  red: {
    icon: "text-red-500",
    activeBg: "bg-red-500/20",
    activeBorder: "border-red-500/50",
    glow: "bg-red-500/30",
  },
  yellow: {
    icon: "text-yellow-500",
    activeBg: "bg-yellow-500/20",
    activeBorder: "border-yellow-500/50",
    glow: "bg-yellow-500/30",
  },
  green: {
    icon: "text-green-500",
    activeBg: "bg-green-500/20",
    activeBorder: "border-green-500/50",
    glow: "bg-green-500/30",
  },
  blue: {
    icon: "text-blue-500",
    activeBg: "bg-blue-500/20",
    activeBorder: "border-blue-500/50",
    glow: "bg-blue-500/30",
  },
  purple: {
    icon: "text-purple-500",
    activeBg: "bg-purple-500/20",
    activeBorder: "border-purple-500/50",
    glow: "bg-purple-500/30",
  },
};

// Map feature keys to their colors for glow effect
const FEATURE_COLORS: Record<NonNullable<FeatureKey>, ColorKey> = {
  mcs: "red",
  watch: "red",
  rounds: "yellow",
  voting: "yellow",
  song: "green",
  chat: "blue",
  admin: "purple",
};

// Reusable overlay card styling
function OverlayCard({
  color,
  children,
  className,
}: {
  color: ColorKey;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-black/80 backdrop-blur-xl p-3 rounded-xl shadow-2xl",
        `border border-${color}-500/50 shadow-${color}-500/20`,
        className
      )}
    >
      {children}
    </div>
  );
}

const FEATURES = [
  {
    key: "mcs" as FeatureKey,
    icon: <Mic2 className="w-6 h-6" />,
    title: "Choose MC's",
    description: "Each with distinct flows and styles.",
    color: "red" as ColorKey,
  },
  {
    key: "rounds" as FeatureKey,
    icon: <Clock className="w-6 h-6" />,
    title: "3 Rounds",
    description: "8 bars per verse, alternating turns.",
    color: "yellow" as ColorKey,
  },
  {
    key: "song" as FeatureKey,
    icon: <Music className="w-6 h-6" />,
    title: "Make it a Song",
    description: "Select a style and stream it.",
    color: "green" as ColorKey,
  },
  {
    key: "watch" as FeatureKey,
    icon: <Radio className="w-6 h-6" />,
    title: "Watch Together",
    description: "Verses appear word-by-word as the battle unfolds.",
    color: "red" as ColorKey,
  },
  {
    key: "voting" as FeatureKey,
    icon: <Zap className="w-6 h-6" />,
    title: "Interactive Voting",
    description:
      "Participants vote after each round to impact the battle's outcome.",
    color: "yellow" as ColorKey,
  },
  {
    key: "chat" as FeatureKey,
    icon: <MessageSquare className="w-6 h-6" />,
    title: "Live Chat & Reactions",
    description: "Join the crowd in the chatroom as the beef unfolds.",
    color: "blue" as ColorKey,
  },
  {
    key: "admin" as FeatureKey,
    icon: <Trophy className="w-6 h-6" />,
    title: "Admin Control Panel",
    description:
      "As a host, you're in control. Start, stop, and control the battle's flow.",
    color: "purple" as ColorKey,
  },
];

const WAVEFORM_HEIGHTS = [3, 6, 4, 8, 5, 7, 3, 6, 4, 8, 5, 7, 4, 6, 3];
const CHAT_MESSAGES = ["🔥 That bar was insane!", "W for Humpty!", "🎤💀"];

export function ScreenshotShowcase({
  isAuthenticated = false,
  className,
}: ScreenshotShowcaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeFeature, setActiveFeature] = useState<FeatureKey>(null);

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

  const getGlowColor = () => {
    if (!activeFeature) return "bg-red-500/20";
    return COLOR_CLASSES[FEATURE_COLORS[activeFeature]].glow;
  };

  return (
    <section
      ref={containerRef}
      className={cn(
        "relative pt-28 md:pt-32 pb-12 bg-black overflow-hidden",
        className
      )}
    >
      {/* Dynamic Background Atmosphere */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-2/3 h-2/3 bg-red-600/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-2/3 h-2/3 bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />

        {/* Grid Pattern with smoother fade */}
        <div className="absolute inset-0 bg-[url('/assets/grid.svg')] bg-center mask-[linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)] opacity-20 pointer-events-none" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-16 items-start">
          {/* Top/Right Column: Interactive Screenshot (Shown first on mobile) */}
          <div className="w-full lg:col-span-7 order-1 lg:order-2 lg:sticky lg:top-32">
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
                <div className="relative rounded-2xl md:rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-stage-dark">
                  {/* Fake Browser Header */}
                  <div className="h-8 md:h-10 bg-zinc-900/80 border-b border-white/5 flex items-center px-4 md:px-6 gap-2">
                    <div className="flex gap-1 md:gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 md:w-2.5 md:h-2.5 rounded-full bg-zinc-800"
                        />
                      ))}
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
                          key="mcs"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.3 }}
                          className="absolute z-10 left-[3%] top-[18%]"
                        >
                          <OverlayCard color="red" className="p-1.5 md:p-3">
                            <div className="flex items-center gap-1.5 md:gap-2">
                              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                                <Mic2 className="w-3 h-3 md:w-4 md:h-4 text-red-400" />
                              </div>
                              <div>
                                <div className="text-[8px] md:text-[10px] text-red-400 uppercase tracking-widest font-bold">
                                  MC Profiles
                                </div>
                                <div className="text-xs md:text-sm text-white font-medium">
                                  Unique Personas
                                </div>
                              </div>
                            </div>
                          </OverlayCard>
                          {/* Connecting line */}
                          <div className="absolute top-1/2 -right-4 md:-right-8 w-4 md:w-8 h-px bg-linear-to-r from-red-500/50 to-transparent" />
                        </motion.div>
                      )}

                      {/* Rounds Highlight Overlay */}
                      {activeFeature === "rounds" && (
                        <motion.div
                          key="rounds"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className="absolute z-10 right-[5%] md:right-[20%] top-[10%]"
                        >
                          <OverlayCard color="yellow" className="p-1.5 md:p-3">
                            <div className="flex items-center gap-2 md:gap-3">
                              <div className="flex gap-0.5 md:gap-1">
                                {[1, 2, 3].map((round) => (
                                  <div
                                    key={round}
                                    className={cn(
                                      "w-4 h-4 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[8px] md:text-xs font-bold",
                                      round === 1
                                        ? "bg-yellow-500 text-black"
                                        : "bg-zinc-700 text-zinc-400"
                                    )}
                                  >
                                    {round}
                                  </div>
                                ))}
                              </div>
                              <div>
                                <div className="text-[8px] md:text-[10px] text-yellow-400 uppercase tracking-widest font-bold">
                                  Battle Rounds
                                </div>
                                <div className="text-xs md:text-sm text-white font-medium">
                                  8 Bars Each
                                </div>
                              </div>
                            </div>
                          </OverlayCard>
                        </motion.div>
                      )}

                      {/* Song/Music Highlight Overlay */}
                      {activeFeature === "song" && (
                        <motion.div
                          key="song"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.3 }}
                          className="absolute z-10 left-[10%] md:left-[15%] bottom-[10%] md:bottom-[15%]"
                        >
                          <OverlayCard color="green" className="p-1.5 md:p-3">
                            <div className="flex items-center gap-2 md:gap-3">
                              <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                <Music className="w-3 h-3 md:w-4 md:h-4 text-white" />
                              </div>
                              <div>
                                <div className="text-[8px] md:text-[10px] text-green-400 uppercase tracking-widest font-bold">
                                  Export Audio
                                </div>
                                <div className="text-xs md:text-sm text-white font-medium">
                                  Stream or Download
                                </div>
                              </div>
                            </div>
                            {/* Fake waveform */}
                            <div className="mt-1 md:mt-2 flex items-end gap-0.5 h-3 md:h-4">
                              {WAVEFORM_HEIGHTS.map((h, i) => (
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
                                  className="w-0.5 md:w-1 bg-green-500/60 rounded-full"
                                />
                              ))}
                            </div>
                          </OverlayCard>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Reflection / Bottom Glow */}
                <div
                  className={cn(
                    "absolute -bottom-8 md:-bottom-12 inset-x-8 md:inset-x-12 h-16 md:h-24 blur-[40px] md:blur-[60px] rounded-full opacity-50 transition-colors duration-500",
                    getGlowColor()
                  )}
                />
              </div>

              {/* Comments Panel Preview - appears on chat */}
              <AnimatePresence>
                {activeFeature === "chat" && (
                  <motion.div
                    key="chat-panel"
                    initial={{ opacity: 0, x: 20, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.9 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="absolute -right-2 md:-right-6 top-1/4 z-20 flex flex-col gap-1.5 md:gap-2 bg-zinc-900/95 backdrop-blur-xl p-2 md:p-3 rounded-xl md:rounded-2xl shadow-2xl border border-blue-500/30 shadow-blue-500/10 max-w-[140px] md:max-w-none"
                  >
                    <div className="flex items-center gap-1.5 md:gap-2 text-blue-400">
                      <MessageSquare className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="text-[9px] md:text-[11px] uppercase tracking-widest font-bold">
                        Live Chat
                      </span>
                    </div>
                    <div className="space-y-1 md:space-y-1.5">
                      {CHAT_MESSAGES.map((msg, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.15 }}
                          className="text-[9px] md:text-xs text-zinc-400 bg-zinc-800/50 px-1.5 md:px-2 py-0.5 md:py-1 rounded"
                        >
                          {msg}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Vote Panel - appears on voting */}
              <AnimatePresence>
                {activeFeature === "voting" && (
                  <motion.div
                    key="voting-panel"
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.9 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="absolute -right-2 md:-right-6 bottom-1/4 z-20 flex flex-col gap-1.5 md:gap-2 bg-zinc-900/95 backdrop-blur-xl p-2 md:p-3 rounded-xl md:rounded-2xl shadow-2xl border border-yellow-500/30 shadow-yellow-500/10"
                  >
                    <div className="flex items-center gap-1.5 md:gap-2 text-yellow-400">
                      <Vote className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="text-[9px] md:text-[11px] uppercase tracking-widest font-bold">
                        Community
                      </span>
                    </div>
                    <div className="flex gap-2 md:gap-3">
                      {[
                        { value: "847", label: "Votes" },
                        { value: "12", label: "Remixes" },
                      ].map(({ value, label }) => (
                        <div key={label} className="text-center">
                          <div className="text-sm md:text-xl font-bold text-white leading-tight">
                            {value}
                          </div>
                          <div className="text-[8px] md:text-[10px] text-zinc-500 uppercase">
                            {label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Watch Feature Overlay - added for watch */}
              <AnimatePresence>
                {activeFeature === "watch" && (
                  <motion.div
                    key="watch-overlay"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute inset-0 z-30 flex items-center justify-center bg-black/20 backdrop-blur-[2px] pointer-events-none rounded-2xl md:rounded-3xl"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="bg-red-500/20 border border-red-500/50 p-4 rounded-full"
                    >
                      <Radio className="w-8 h-8 md:w-12 md:h-12 text-red-500" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Bottom/Left Column: Content (Shown second on mobile) */}
          <div className="w-full lg:col-span-5 space-y-6 flex flex-col items-center lg:items-start text-center lg:text-left order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-6 flex flex-col items-center lg:items-start w-full"
            >
              {/* Features List */}
              <div className="space-y-3 md:space-y-4 flex flex-col items-center lg:items-start border-t border-white/5 pt-6 w-full max-w-md relative">
                <div className="flex justify-center lg:justify-start items-center w-full mb-2">
                  <span className="text-[10px] md:text-xs text-zinc-500 uppercase tracking-[0.2em] font-bold">
                    Core Features
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2 w-full">
                  {FEATURES.map((feature) => {
                    const isActive = activeFeature === feature.key;
                    const colors = COLOR_CLASSES[feature.color];

                    return (
                      <motion.button
                        key={feature.key}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        onMouseEnter={() => {
                          if (window.innerWidth >= 1024) {
                            setActiveFeature(feature.key);
                          }
                        }}
                        onClick={() => {
                          setActiveFeature(
                            activeFeature === feature.key ? null : feature.key
                          );
                        }}
                        className={cn(
                          "flex items-center gap-3 md:gap-4 w-full cursor-pointer transition-all duration-300 p-2 md:p-3 rounded-xl",
                          isActive ? "bg-white/5 ring-1 ring-white/10" : "hover:bg-white/5"
                        )}
                      >
                        <div
                          className={cn(
                            "inline-flex p-2 md:p-2.5 rounded-lg shrink-0 transition-all duration-300",
                            isActive
                              ? `${colors.activeBg} ${colors.activeBorder} border`
                              : "bg-white/5 border border-white/10"
                          )}
                        >
                          <span className={cn("w-5 h-5 md:w-6 md:h-6", colors.icon)}>
                            {feature.icon}
                          </span>
                        </div>
                        <div className="text-left">
                          <h3
                            className={cn(
                              "text-lg md:text-xl font-bold font-(family-name:--font-bebas-neue) tracking-wide uppercase leading-tight transition-colors duration-300",
                              isActive ? "text-white" : "text-zinc-300"
                            )}
                          >
                            {feature.title}
                          </h3>
                          <p
                            className={cn(
                              "text-xs md:text-base leading-relaxed transition-colors duration-300 line-clamp-1 md:line-clamp-none",
                              isActive ? "text-zinc-300" : "text-zinc-500"
                            )}
                          >
                            {feature.description}
                          </p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
