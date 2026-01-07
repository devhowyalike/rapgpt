"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Music2, Play, Download, Volume2, Zap } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

// =============================================================================
// Types & Data
// =============================================================================

type DemoState =
  | "idle"
  | "show-beats"
  | "select-beat"
  | "generating"
  | "progress-50"
  | "progress-90"
  | "song-ready"
  | "reset";

interface StateConfig {
  label: string;
  duration: number;
  showBeatSelection: boolean;
  selectedBeat: string | null;
  progress: number | null;
  showPlayer: boolean;
}

interface BeatStyle {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

const BEAT_STYLES: BeatStyle[] = [
  {
    id: "g-funk",
    name: "G-Funk",
    description: "West Coast smooth vibes",
    icon: "🎹",
    color: "from-purple-600 to-pink-600",
  },
  {
    id: "boom-bap",
    name: "Boom-Bap",
    description: "90s East Coast classic",
    icon: "🥁",
    color: "from-orange-600 to-red-600",
  },
  {
    id: "trap",
    name: "Trap",
    description: "Modern Atlanta sound",
    icon: "🔊",
    color: "from-blue-600 to-cyan-600",
  },
];

const STATE_CONFIGS: Record<DemoState, StateConfig> = {
  idle: {
    label: "Transform your battle into a track...",
    duration: 1500,
    showBeatSelection: false,
    selectedBeat: null,
    progress: null,
    showPlayer: false,
  },
  "show-beats": {
    label: "",
    duration: 1500,
    showBeatSelection: true,
    selectedBeat: null,
    progress: null,
    showPlayer: false,
  },
  "select-beat": {
    label: "",
    duration: 1200,
    showBeatSelection: true,
    selectedBeat: "g-funk",
    progress: null,
    showPlayer: false,
  },
  generating: {
    label: "",
    duration: 1200,
    showBeatSelection: false,
    selectedBeat: "g-funk",
    progress: 15,
    showPlayer: false,
  },
  "progress-50": {
    label: "",
    duration: 1200,
    showBeatSelection: false,
    selectedBeat: "g-funk",
    progress: 52,
    showPlayer: false,
  },
  "progress-90": {
    label: "",
    duration: 1000,
    showBeatSelection: false,
    selectedBeat: "g-funk",
    progress: 94,
    showPlayer: false,
  },
  "song-ready": {
    label: "",
    duration: 3000,
    showBeatSelection: false,
    selectedBeat: "g-funk",
    progress: null,
    showPlayer: true,
  },
  reset: {
    label: "",
    duration: 800,
    showBeatSelection: false,
    selectedBeat: null,
    progress: null,
    showPlayer: false,
  },
};

const STATE_ORDER_WITH_LOADING: DemoState[] = [
  "idle",
  "show-beats",
  "select-beat",
  "generating",
  "progress-50",
  "progress-90",
  "song-ready",
  "reset",
];

const STATE_ORDER_WITHOUT_LOADING: DemoState[] = [
  "show-beats",
  "select-beat",
  "generating",
  "progress-50",
  "progress-90",
  "song-ready",
  "reset",
];

// =============================================================================
// Beat Selection Card
// =============================================================================

interface BeatCardProps {
  beat: BeatStyle;
  isSelected: boolean;
  isMobile: boolean;
}

function BeatCard({ beat, isSelected, isMobile }: BeatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative rounded-lg border-2 transition-all text-left
        ${isMobile ? "p-2.5" : "p-3"}
        ${
          isSelected
            ? "border-yellow-400 bg-yellow-400/10"
            : "border-gray-700 bg-gray-800/50"
        }
      `}
    >
      <div className={`flex items-start ${isMobile ? "gap-2" : "gap-3"}`}>
        <span className={isMobile ? "text-xl" : "text-2xl"}>{beat.icon}</span>
        <div className="flex-1 min-w-0">
          <div
            className={`font-bold text-white ${
              isMobile ? "text-sm" : "text-base"
            }`}
          >
            {beat.name}
          </div>
          <div
            className={`text-gray-400 ${isMobile ? "text-[10px]" : "text-xs"}`}
          >
            {beat.description}
          </div>
        </div>
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1.5 right-1.5"
          >
            <Zap
              className={`text-yellow-400 ${
                isMobile ? "w-3.5 h-3.5" : "w-4 h-4"
              }`}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// =============================================================================
// Progress Display
// =============================================================================

interface ProgressDisplayProps {
  progress: number;
  isMobile: boolean;
}

function ProgressDisplay({ progress, isMobile }: ProgressDisplayProps) {
  if (isMobile) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <div className="flex items-center justify-center gap-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Music2 className="w-5 h-5 text-purple-400" />
          </motion.div>
          <span className="text-white font-medium text-sm">
            Generating Song... {progress}%
          </span>
        </div>

        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-linear-to-r from-yellow-400 to-orange-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <p className="text-gray-500 text-center text-[10px]">
          Creating your unique track with AI...
        </p>
      </motion.div>
    );
  }

  // Desktop: Vertical layout
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="flex items-center justify-center gap-2">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Music2 className="w-6 h-6 text-purple-400" />
        </motion.div>
        <span className="text-white font-medium text-base">
          Generating Song... {progress}%
        </span>
      </div>

      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-linear-to-r from-yellow-400 to-orange-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <p className="text-gray-500 text-center text-xs">
        Creating your unique track with AI...
      </p>
    </motion.div>
  );
}

// =============================================================================
// Song Player Display
// =============================================================================

interface SongPlayerDisplayProps {
  isMobile: boolean;
}

function SongPlayerDisplay({ isMobile }: SongPlayerDisplayProps) {
  if (isMobile) {
    // Mobile: Vertical compact layout
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-3"
      >
        {/* Album Art & Info */}
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="w-14 h-14 rounded-lg bg-linear-to-br from-purple-600 to-pink-600 flex items-center justify-center shrink-0 text-2xl"
          >
            🎹
          </motion.div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white truncate text-sm">
              Dawn vs Shock G - Battle
            </h3>
            <p className="text-gray-400 text-xs">G-Funk Style</p>
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-full bg-linear-to-r from-purple-600 to-pink-600 flex items-center justify-center shrink-0"
          >
            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
          </motion.button>

          <div className="flex-1">
            <div className="flex justify-between text-gray-400 mb-1 text-[10px]">
              <span>0:00</span>
              <span>3:24</span>
            </div>
            <div className="w-full h-1 bg-gray-700 rounded-full">
              <div className="w-0 h-full bg-white rounded-full" />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-full border border-gray-700 flex items-center justify-center shrink-0"
          >
            <Download className="w-4 h-4 text-gray-400" />
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // Desktop: Vertical layout
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-3"
    >
      {/* Album Art & Info */}
      <div className="flex items-center gap-4">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="w-14 h-14 rounded-lg bg-linear-to-br from-purple-600 to-pink-600 flex items-center justify-center shrink-0 text-2xl"
        >
          🎹
        </motion.div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white truncate text-sm">
            Dawn vs Shock G - Battle
          </h3>
          <p className="text-gray-400 text-xs">G-Funk Style</p>
        </div>
      </div>

      {/* Player Controls */}
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 rounded-full bg-linear-to-r from-purple-600 to-pink-600 flex items-center justify-center shrink-0"
        >
          <Play className="w-4 h-4 text-white fill-white ml-0.5" />
        </motion.button>

        <div className="flex-1">
          <div className="flex justify-between text-gray-400 mb-1 text-xs">
            <span>0:00</span>
            <span>3:24</span>
          </div>
          <div className="w-full h-1.5 bg-gray-700 rounded-full">
            <div className="w-0 h-full bg-white rounded-full" />
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 rounded-full border border-gray-700 flex items-center justify-center shrink-0"
        >
          <Download className="w-4 h-4 text-gray-400" />
        </motion.button>
      </div>
    </motion.div>
  );
}

// =============================================================================
// Mobile View
// =============================================================================

interface MobileViewProps {
  config: StateConfig;
  currentStateName: DemoState;
}

function MobileView({ config, currentStateName }: MobileViewProps) {
  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="/marketing/battle-system/rapgpt-battle-stage.webp"
          alt="Battle stage"
          fill
          className="object-cover object-center blur-sm scale-105 brightness-40"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-gray-900/95" />
      </div>

      {/* Idle State */}
      <AnimatePresence>
        {currentStateName === "idle" && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30"
            >
              {config.label}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Panel */}
      <AnimatePresence>
        {currentStateName !== "idle" && currentStateName !== "reset" && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-64 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 rounded-t-2xl flex flex-col"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-800 shrink-0">
              <Music2 className="w-4 h-4 text-green-400" />
              <span className="text-xs font-semibold text-white">
                {config.showPlayer ? "Generated Song" : "Make a Song"}
              </span>
            </div>

            {/* Content Area - Fixed height with centered content for progress/player */}
            <div className="flex-1 flex flex-col justify-center overflow-hidden">
              <AnimatePresence mode="wait">
                {/* Beat Selection */}
                {config.showBeatSelection && (
                  <motion.div
                    key="beats"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-3 space-y-2"
                  >
                    <p className="text-[10px] text-gray-400 font-medium">
                      Choose Your Beat Style
                    </p>
                    <div className="space-y-2">
                      {BEAT_STYLES.map((beat, index) => (
                        <motion.div
                          key={beat.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <BeatCard
                            beat={beat}
                            isSelected={config.selectedBeat === beat.id}
                            isMobile={true}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Progress - Centered */}
                {config.progress !== null && (
                  <motion.div
                    key="progress"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full px-3"
                  >
                    <ProgressDisplay
                      progress={config.progress}
                      isMobile={true}
                    />
                  </motion.div>
                )}

                {/* Player - Centered */}
                {config.showPlayer && (
                  <motion.div
                    key="player"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full px-3"
                  >
                    <SongPlayerDisplay isMobile={true} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// Desktop View
// =============================================================================

interface DesktopViewProps {
  config: StateConfig;
  currentStateName: DemoState;
}

function DesktopView({ config, currentStateName }: DesktopViewProps) {
  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="/marketing/battle-system/rapgpt-battle-stage.webp"
          alt="Battle stage"
          fill
          className="object-cover object-center blur-sm scale-105 brightness-50"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-gray-900/95" />
      </div>

      {/* Idle State */}
      <AnimatePresence>
        {currentStateName === "idle" && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-2 h-2 bg-green-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className="w-2 h-2 bg-green-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="w-2 h-2 bg-green-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                />
              </div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-green-500/20 text-green-300 border border-green-500/30"
              >
                {config.label}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Drawer */}
      <AnimatePresence>
        {currentStateName !== "idle" && currentStateName !== "reset" && (
          <motion.div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-52 bg-gray-900/95 backdrop-blur-sm border-t border-x border-gray-800 rounded-t-2xl flex flex-col"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-800 shrink-0">
              <Music2 className="w-5 h-5 text-green-400" />
              <span className="text-sm font-semibold text-white">
                {config.showPlayer ? "Generated Song" : "Make a Song"}
              </span>
            </div>

            {/* Content Area - Fixed height with centered content */}
            <div className="flex-1 flex flex-col justify-center overflow-hidden">
              <AnimatePresence mode="wait">
                {/* Beat Selection - Horizontal layout for desktop */}
                {config.showBeatSelection && (
                  <motion.div
                    key="beats"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-4 py-3 space-y-3"
                  >
                    <p className="text-xs text-gray-400 font-medium">
                      Choose Your Beat Style
                    </p>
                    <div className="flex gap-3">
                      {BEAT_STYLES.map((beat, index) => (
                        <motion.div
                          key={beat.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex-1"
                        >
                          <BeatCard
                            beat={beat}
                            isSelected={config.selectedBeat === beat.id}
                            isMobile={false}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Progress - Centered */}
                {config.progress !== null && (
                  <motion.div
                    key="progress"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-4"
                  >
                    <ProgressDisplay
                      progress={config.progress}
                      isMobile={false}
                    />
                  </motion.div>
                )}

                {/* Player - Centered */}
                {config.showPlayer && (
                  <motion.div
                    key="player"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-4"
                  >
                    <SongPlayerDisplay isMobile={false} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

interface MakeASongDemoProps {
  loadingScreen?: "enabled" | "disabled";
  isActive?: boolean;
}

export function MakeASongDemo({ loadingScreen = "disabled", isActive = true }: MakeASongDemoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stateIndex, setStateIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const stateOrder = loadingScreen === "enabled"
    ? STATE_ORDER_WITH_LOADING
    : STATE_ORDER_WITHOUT_LOADING;

  const currentStateName = stateOrder[stateIndex];
  const config = STATE_CONFIGS[currentStateName];

  const advanceState = useCallback(() => {
    setStateIndex((prev) => (prev + 1) % stateOrder.length);
  }, [stateOrder.length]);

  // Reset animation when becoming active
  const wasActiveRef = useRef(isActive);
  useEffect(() => {
    if (isActive && !wasActiveRef.current) {
      setStateIndex(0);
    }
    wasActiveRef.current = isActive;
  }, [isActive]);

  // Detect mobile based on container width
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const checkMobile = () => {
      setIsMobile(container.offsetWidth < 500);
    };

    checkMobile();
    const resizeObserver = new ResizeObserver(checkMobile);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  // Auto-advance
  useEffect(() => {
    if (!isActive) return;

    const timer = setTimeout(advanceState, config.duration);
    return () => clearTimeout(timer);
  }, [stateIndex, isActive, config.duration, advanceState]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 bg-gray-900 flex flex-col overflow-hidden"
    >
      {isMobile ? (
        <MobileView config={config} currentStateName={currentStateName} />
      ) : (
        <DesktopView config={config} currentStateName={currentStateName} />
      )}
    </div>
  );
}
