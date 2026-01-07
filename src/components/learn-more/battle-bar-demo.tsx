"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  MessageSquare,
  Play,
  Plus,
  Radio,
  Settings,
  StopCircle,
  ThumbsUp,
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
  fanOpen?: boolean; // Whether fan menu should be open in mobile view
}

const STATE_CONFIGS: Record<DemoState, StateConfig> = {
  "generate-start": {
    label: "First:",
    sublabel: "Kendrick Lamar",
    icon: <Play className="w-5 h-5 shrink-0" />,
    gradient: "from-green-500 to-emerald-500",
    duration: 2200,
    goLiveState: "off",
    fanOpen: false,
  },
  generating: {
    label: "Kickin' ballistics...",
    emoji: "⚡",
    gradient: "from-teal-600 to-cyan-600",
    duration: 2800,
    animate: true,
    goLiveState: "starting",
    fanOpen: false,
  },
  reading: {
    label: "Begin Voting",
    icon: <CheckCircle className="w-5 h-5" />,
    gradient: "from-cyan-600 to-blue-600",
    duration: 2000,
    goLiveState: "live",
    fanOpen: true, // Show fan open here
  },
  voting: {
    label: "Vote Now!",
    emoji: "⏱️",
    sublabel: "15s",
    gradient: "from-purple-600 to-pink-600",
    duration: 3000,
    goLiveState: "live",
    fanOpen: true, // Keep fan open during voting
  },
  "generate-next": {
    label: "Next:",
    sublabel: "Tim Dog",
    icon: <Play className="w-5 h-5 shrink-0" />,
    gradient: "from-green-500 to-emerald-500",
    duration: 2200,
    goLiveState: "live",
    fanOpen: false,
  },
  calculating: {
    label: "Calculating Score...",
    emoji: "🎯",
    gradient: "from-amber-600 to-yellow-600",
    duration: 2800,
    animate: true,
    goLiveState: "live",
    fanOpen: false,
  },
  reveal: {
    label: "Reveal Winner",
    icon: <ArrowRight className="w-5 h-5" />,
    gradient: "from-amber-500 to-orange-500",
    duration: 2500,
    goLiveState: "live",
    fanOpen: true, // Show fan open at reveal
  },
};

const STATE_ORDER: DemoState[] = [
  "generating",
  "generate-start",
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
// Mobile Fan Demo (Non-Interactive)
// =============================================================================

interface MobileFanDemoProps {
  isOpen: boolean;
  isLive: boolean;
}

const FAN_ACTIONS = [
  {
    id: "go-live",
    label: "Go Live",
    icon: <Radio className="w-5 h-5" />,
    variant: "danger" as const,
  },
  {
    id: "comments",
    label: "Comments",
    icon: <MessageSquare className="w-5 h-5" />,
    variant: "default" as const,
  },
  {
    id: "voting",
    label: "Voting",
    icon: <ThumbsUp className="w-5 h-5" />,
    variant: "active" as const,
  },
  {
    id: "settings",
    label: "Options",
    icon: <Settings className="w-5 h-5" />,
    variant: "default" as const,
  },
];

function MobileFanDemo({ isOpen, isLive }: MobileFanDemoProps) {
  return (
    <div className="relative z-40 flex items-end justify-center">
      <div className="relative">
        {/* Fan action buttons */}
        <AnimatePresence>
          {isOpen &&
            FAN_ACTIONS.map((action, index) => {
              const offset = 52 * (index + 1);
              return (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, y: -offset, scale: 0.5 }}
                  animate={{ opacity: 1, y: -offset, scale: 1 }}
                  exit={{ opacity: 0, y: -offset, scale: 0.5 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: index * 0.05,
                  }}
                  className={`absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-full border backdrop-blur-md shadow-lg flex items-center justify-center ${
                    action.variant === "danger"
                      ? isLive
                        ? "bg-red-600 border-red-500 text-white"
                        : "bg-red-600/90 border-red-500 text-white"
                      : action.variant === "active"
                      ? "bg-blue-600 border-blue-400 text-white"
                      : "bg-gray-900/90 border-gray-700 text-white"
                  }`}
                >
                  {action.icon}
                  {/* Label tooltip */}
                  <span className="pointer-events-none absolute right-full mr-2 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-[10px] text-white shadow-lg">
                    {action.id === "go-live" && isLive ? "End Live" : action.label}
                  </span>
                </motion.div>
              );
            })}
        </AnimatePresence>

        {/* Main trigger button */}
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-11 h-11 rounded-full border-2 border-gray-700 bg-gray-900 text-white shadow-xl flex items-center justify-center"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
        </motion.div>
      </div>
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

interface BattleBarDemoProps {
  isActive?: boolean;
}

export function BattleBarDemo({ isActive = true }: BattleBarDemoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stateIndex, setStateIndex] = useState(0);

  const currentStateName = STATE_ORDER[stateIndex];
  const config = STATE_CONFIGS[currentStateName];

  const advanceState = useCallback(() => {
    setStateIndex((prev) => (prev + 1) % STATE_ORDER.length);
  }, []);

  // Reset animation when becoming active
  const wasActiveRef = useRef(isActive);
  useEffect(() => {
    if (isActive && !wasActiveRef.current) {
      setStateIndex(0);
    }
    wasActiveRef.current = isActive;
  }, [isActive]);

  // Only run animation when active
  useEffect(() => {
    if (!isActive) return;

    const timer = setTimeout(advanceState, config.duration);
    return () => clearTimeout(timer);
  }, [stateIndex, isActive, config.duration, advanceState]);

  const isFanOpen = config.fanOpen ?? false;
  const isLive = config.goLiveState === "live";

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 bg-gray-900 flex flex-col"
    >
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

        {/* Mobile Fan Overlay (when open) */}
        <AnimatePresence>
          {isFanOpen && (
            <motion.div
              key="fan-overlay"
              className="absolute inset-0 bg-black/60 backdrop-blur-sm sm:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Control Bar - hidden on mobile */}
      <div className="hidden sm:block p-2 sm:p-3 md:p-4 bg-gray-900 border-t border-gray-800">
        <div className="flex items-center gap-2 sm:gap-3 max-w-4xl mx-auto">
          {/* Main Action Button - fixed height container with perspective for 3D effect */}
          <div 
            className="flex-1 h-[44px] sm:h-[52px] relative"
            style={{ perspective: "600px" }}
          >
            <AnimatePresence mode="popLayout">
              <motion.div
                key={`${stateIndex}-${currentStateName}`}
                initial={{ 
                  rotateX: 90,
                  opacity: 0,
                  y: "50%",
                }}
                animate={{ 
                  rotateX: 0,
                  opacity: 1,
                  y: 0,
                }}
                exit={{ 
                  rotateX: -90,
                  opacity: 0,
                  y: "-50%",
                }}
                transition={{ 
                  duration: 0.5,
                  ease: [0.4, 0, 0.2, 1],
                }}
                style={{
                  transformOrigin: "center center",
                  backfaceVisibility: "hidden",
                }}
                className={`
                  absolute inset-0 px-3 sm:px-4 rounded-lg text-white font-bold
                  bg-linear-to-r ${config.gradient}
                  flex items-center justify-center
                `}
              >
                <ActionButtonContent config={config} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Options Button */}
          <OptionsButtonDemo />

          {/* Go Live Button */}
          <GoLiveButtonDemo state={config.goLiveState || "off"} />
        </div>
      </div>

      {/* Mobile Control Bar - only shown on mobile */}
      <div className="sm:hidden p-3 bg-gray-900 border-t border-gray-800">
        <div className="flex items-center justify-between gap-3">
          {/* Simplified action button for mobile */}
          <div 
            className="flex-1 h-[44px] relative"
            style={{ perspective: "600px" }}
          >
            <AnimatePresence mode="popLayout">
              <motion.div
                key={`mobile-${stateIndex}-${currentStateName}`}
                initial={{ 
                  rotateX: 90,
                  opacity: 0,
                  y: "50%",
                }}
                animate={{ 
                  rotateX: 0,
                  opacity: 1,
                  y: 0,
                }}
                exit={{ 
                  rotateX: -90,
                  opacity: 0,
                  y: "-50%",
                }}
                transition={{ 
                  duration: 0.5,
                  ease: [0.4, 0, 0.2, 1],
                }}
                style={{
                  transformOrigin: "center center",
                  backfaceVisibility: "hidden",
                }}
                className={`
                  absolute inset-0 px-3 rounded-lg text-white font-bold text-sm
                  bg-linear-to-r ${config.gradient}
                  flex items-center justify-center
                `}
              >
                <ActionButtonContent config={config} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Mobile Fan Button */}
          <MobileFanDemo isOpen={isFanOpen} isLive={isLive} />
        </div>
      </div>
    </div>
  );
}
