"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  Play,
  Radio,
  Settings,
  StopCircle,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

// =============================================================================
// Types & Data
// =============================================================================

type DemoState =
  | "generate-start"
  | "generating"
  | "reading"
  | "voting"
  | "generate-next"
  | "calculating"
  | "reveal";

interface StateConfig {
  label: string;
  sublabel?: string;
  emoji?: string;
  icon?: React.ReactNode;
  gradient: string;
  duration: number; // ms before next state
  animate?: boolean;
  goLiveState?: "off" | "starting" | "live";
}

const STATE_CONFIGS: Record<DemoState, StateConfig> = {
  "generate-start": {
    label: "First:",
    sublabel: "Kendrick Lamar",
    icon: <Play className="w-5 h-5 shrink-0" />,
    gradient: "from-green-500 to-emerald-500",
    duration: 2200,
    goLiveState: "off",
  },
  generating: {
    label: "Kickin' ballistics...",
    emoji: "⚡",
    gradient: "from-teal-600 to-cyan-600",
    duration: 2800,
    animate: true,
    goLiveState: "starting",
  },
  reading: {
    label: "Begin Voting",
    icon: <CheckCircle className="w-5 h-5" />,
    gradient: "from-cyan-600 to-blue-600",
    duration: 2000,
    goLiveState: "live",
  },
  voting: {
    label: "Vote Now!",
    emoji: "⏱️",
    sublabel: "15s",
    gradient: "from-purple-600 to-pink-600",
    duration: 3000,
    goLiveState: "live",
  },
  "generate-next": {
    label: "Next:",
    sublabel: "Tim Dog",
    icon: <Play className="w-5 h-5 shrink-0" />,
    gradient: "from-green-500 to-emerald-500",
    duration: 2200,
    goLiveState: "live",
  },
  calculating: {
    label: "Calculating Score...",
    emoji: "🎯",
    gradient: "from-amber-600 to-yellow-600",
    duration: 2800,
    animate: true,
    goLiveState: "live",
  },
  reveal: {
    label: "Reveal Winner",
    icon: <ArrowRight className="w-5 h-5" />,
    gradient: "from-amber-500 to-orange-500",
    duration: 2500,
    goLiveState: "live",
  },
};

const STATE_ORDER: DemoState[] = [
  "generate-start",
  "generating",
  "reading",
  "voting",
  "generate-next",
  "calculating",
  "reveal",
];

// =============================================================================
// Score Calc Animation (matches actual component)
// =============================================================================

function ScoreCalcAnimation() {
  return (
    <div className="flex items-center gap-1 h-5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 bg-white rounded-full"
          initial={{ height: "40%" }}
          animate={{
            height: ["40%", "100%", "40%"],
            backgroundColor: [
              "rgba(255, 255, 255, 0.5)",
              "rgba(255, 255, 255, 1)",
              "rgba(255, 255, 255, 0.5)",
            ],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// =============================================================================
// Loading Spinner
// =============================================================================

function LoadingSpinner() {
  return (
    <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
  );
}

// =============================================================================
// Go Live Button Demo
// =============================================================================

interface GoLiveButtonDemoProps {
  state: "off" | "starting" | "live";
}

function GoLiveButtonDemo({ state }: GoLiveButtonDemoProps) {
  return (
    <div
      className={`
        px-3 h-[44px] sm:h-[52px] rounded-lg flex items-center justify-center gap-2 shrink-0 transition-colors duration-300
        min-w-[48px] sm:min-w-[110px]
        ${state === "live" ? "bg-red-600" : "bg-red-600/80"}
      `}
    >
      {state === "starting" ? (
        <LoadingSpinner />
      ) : state === "live" ? (
        <StopCircle className="w-5 h-5 text-white" />
      ) : (
        <Radio className="w-5 h-5 text-white" />
      )}
      <span className="hidden sm:inline text-white font-medium text-sm w-[58px]">
        {state === "live" ? "End Live" : "Go Live"}
      </span>
    </div>
  );
}

// =============================================================================
// Options Button Demo
// =============================================================================

function OptionsButtonDemo() {
  return (
    <div className="px-3 h-[44px] sm:h-[52px] bg-gray-700 rounded-lg flex items-center justify-center gap-2 shrink-0">
      <Settings className="w-5 h-5 text-white" />
      <span className="hidden sm:inline font-medium text-sm text-white">
        Options
      </span>
    </div>
  );
}

// =============================================================================
// Main Action Button Content
// =============================================================================

interface ActionButtonContentProps {
  config: StateConfig;
}

function ActionButtonContent({ config }: ActionButtonContentProps) {
  // Consistent container for all states
  const baseClasses = "flex items-center justify-center gap-2 h-6";

  if (config.label === "Calculating Score...") {
    return (
      <div className={baseClasses}>
        <ScoreCalcAnimation />
        <span className="text-base sm:text-lg font-medium">{config.label}</span>
      </div>
    );
  }

  if (config.animate) {
    return (
      <div className={baseClasses}>
        <LoadingSpinner />
        <span className="text-base sm:text-lg">{config.label}</span>
      </div>
    );
  }

  if (config.label === "Vote Now!") {
    return (
      <div className="flex items-center justify-center sm:justify-between gap-4 w-full h-6">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-xl leading-none flex items-center">
            {config.emoji}
          </span>
          <span className="text-base sm:text-lg font-medium">
            {config.label}
          </span>
        </div>
        <div className="hidden sm:flex items-center">
          <span className="text-xl font-bebas-neue leading-none">
            {config.sublabel}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={baseClasses}>
      {config.icon && (
        <span className="w-5 h-5 flex items-center justify-center">
          {config.icon}
        </span>
      )}
      <span className="text-base sm:text-lg font-medium whitespace-nowrap">
        {config.label}
        {config.sublabel && <span className="ml-1">{config.sublabel}</span>}
      </span>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function BattleBarDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stateIndex, setStateIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isInView, setIsInView] = useState(false);

  const currentStateName = STATE_ORDER[stateIndex];
  const config = STATE_CONFIGS[currentStateName];

  const advanceState = useCallback(() => {
    setStateIndex((prev) => (prev + 1) % STATE_ORDER.length);
  }, []);

  // Intersection Observer to detect when slide is visible
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const wasInView = isInView;
        const nowInView = entry.isIntersecting;

        setIsInView(nowInView);

        // Reset to first state when coming back into view
        if (!wasInView && nowInView) {
          setStateIndex(0);
        }
      },
      { threshold: 0.5 } // Trigger when 50% visible
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [isInView]);

  // Only run animation when in view and not paused
  useEffect(() => {
    if (isPaused || !isInView) return;

    const timer = setTimeout(advanceState, config.duration);
    return () => clearTimeout(timer);
  }, [stateIndex, isPaused, isInView, config.duration, advanceState]);

  return (
    <div
      ref={containerRef}
      className="w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Browser mockup content area */}
      <div className="aspect-16/10 bg-gray-900 flex flex-col">
        {/* Blurred screenshot background */}
        <div className="flex-1 relative overflow-hidden">
          <Image
            src="/marketing/battle-system/rapgpt-battle-stage.webp"
            alt="Battle stage"
            fill
            className="object-cover object-center blur-sm scale-105 brightness-50"
          />
          {/* Gradient overlay to fade toward the control bar */}
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-gray-900/90" />
        </div>

        {/* Control Bar */}
        <div className="p-2 sm:p-3 md:p-4 bg-gray-900 border-t border-gray-800">
          <div className="flex items-center gap-2 sm:gap-3 max-w-4xl mx-auto">
            {/* Main Action Button - fixed height container to prevent shifting */}
            <div className="flex-1 h-[44px] sm:h-[52px]">
              <motion.div
                key={`${stateIndex}-${currentStateName}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
                className={`
                  w-full h-full px-3 sm:px-4 rounded-lg text-white font-bold
                  bg-linear-to-r ${config.gradient}
                  flex items-center justify-center
                `}
              >
                <ActionButtonContent config={config} />
              </motion.div>
            </div>

            {/* Options Button - hidden on smallest screens */}
            <div className="hidden sm:block">
              <OptionsButtonDemo />
            </div>

            {/* Go Live Button */}
            <GoLiveButtonDemo state={config.goLiveState || "off"} />
          </div>
        </div>
      </div>

      {/* State indicator pills */}
      <div className="flex justify-center gap-1.5 mt-3 px-2">
        {STATE_ORDER.map((state, idx) => (
          <motion.button
            key={`${state}-${idx}`}
            onClick={() => setStateIndex(idx)}
            className={`
              h-1.5 rounded-full transition-all duration-300
              ${idx === stateIndex ? "w-6 sm:w-8" : "w-1.5 sm:w-2"}
            `}
            animate={{
              backgroundColor: idx === stateIndex ? "#a855f7" : "#374151",
            }}
          />
        ))}
      </div>
    </div>
  );
}
