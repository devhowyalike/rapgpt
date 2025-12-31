"use client";

import { motion, AnimatePresence, useAnimation } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

// =============================================================================
// Types & Data
// =============================================================================

type DemoState =
  | "idle"
  | "show-grid"
  | "hover-stage-1"
  | "hover-stage-2"
  | "select-stage"
  | "reset";

interface StateConfig {
  label: string;
  duration: number;
  showContent: boolean;
  hoveredStageIndex: number | null;
  selectedStageIndex: number | null;
}

interface Stage {
  id: string;
  name: string;
  country: string;
  flag: string;
  backgroundImage: string;
}

const STAGES: Stage[] = [
  {
    id: "bronx",
    name: "1520 Sedgwick Avenue",
    country: "Bronx, NY",
    flag: "🇺🇸",
    backgroundImage: "/stages/sedgwick.webp",
  },
  {
    id: "bkBathroom",
    name: "Burger King Bathroom",
    country: "USA",
    flag: "🍔",
    backgroundImage: "/stages/bk-bathroom.webp",
  },
  {
    id: "oaklandCol",
    name: "Oakland Coliseum",
    country: "Oakland, CA",
    flag: "🇺🇸",
    backgroundImage: "/stages/coliseum.webp",
  },
  {
    id: "outback",
    name: "The Outback",
    country: "Australia",
    flag: "🇦🇺",
    backgroundImage: "/stages/outback.webp",
  },
];

const STATE_CONFIGS: Record<DemoState, StateConfig> = {
  idle: {
    label: "Choose your battlefield...",
    duration: 1500,
    showContent: false,
    hoveredStageIndex: null,
    selectedStageIndex: null,
  },
  "show-grid": {
    label: "",
    duration: 1500,
    showContent: true,
    hoveredStageIndex: null,
    selectedStageIndex: null,
  },
  "hover-stage-1": {
    label: "",
    duration: 1200,
    showContent: true,
    hoveredStageIndex: 0,
    selectedStageIndex: null,
  },
  "hover-stage-2": {
    label: "",
    duration: 1200,
    showContent: true,
    hoveredStageIndex: 2,
    selectedStageIndex: null,
  },
  "select-stage": {
    label: "",
    duration: 2500,
    showContent: true,
    hoveredStageIndex: null,
    selectedStageIndex: 2,
  },
  reset: {
    label: "",
    duration: 800,
    showContent: false,
    hoveredStageIndex: null,
    selectedStageIndex: null,
  },
};

const STATE_ORDER_WITH_LOADING: DemoState[] = [
  "idle",
  "show-grid",
  "hover-stage-1",
  "hover-stage-2",
  "select-stage",
  "reset",
];

const STATE_ORDER_WITHOUT_LOADING: DemoState[] = [
  "show-grid",
  "hover-stage-1",
  "hover-stage-2",
  "select-stage",
  "reset",
];

// =============================================================================
// Animation Variants
// =============================================================================

const gridContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const gridItemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
};

// =============================================================================
// Stage Grid Item
// =============================================================================

interface StageGridItemProps {
  stage: Stage;
  isHovered: boolean;
  isSelected: boolean;
  isMobile: boolean;
}

function StageGridItem({
  stage,
  isHovered,
  isSelected,
  isMobile,
}: StageGridItemProps) {
  return (
    <motion.div
      variants={gridItemVariants}
      className={`
        relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-300
        ${isMobile ? "w-full" : "w-full"}
        ${
          isSelected
            ? "border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)] scale-105 z-10"
            : isHovered
            ? "border-white/50 scale-105 z-10"
            : "border-white/10"
        }
      `}
    >
      <Image
        src={stage.backgroundImage}
        alt={stage.name}
        fill
        className="object-cover"
      />
      {/* Overlay Gradient */}
      <div
        className={`absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent transition-opacity ${
          isHovered ? "opacity-40" : "opacity-60"
        }`}
      />

      {/* Name Label */}
      <div
        className={`absolute bottom-0 left-0 right-0 font-bold text-center truncate text-white/90 ${
          isMobile ? "p-1 text-[8px]" : "p-1.5 text-xs"
        }`}
      >
        {stage.name}
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-yellow-500/20 flex items-center justify-center backdrop-blur-[1px]"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold shadow-lg ${
              isMobile ? "w-5 h-5 text-xs" : "w-6 h-6 text-sm"
            }`}
          >
            ✓
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}

// =============================================================================
// Random Button
// =============================================================================

function RandomButton({ isMobile }: { isMobile: boolean }) {
  return (
    <motion.div
      variants={gridItemVariants}
      className={`
        relative aspect-square rounded-lg overflow-hidden border-2 border-purple-500/50
        bg-purple-900/30 flex flex-col items-center justify-center gap-1
        ${isMobile ? "w-full" : "w-full"}
      `}
    >
      <span className={isMobile ? "text-lg" : "text-xl"}>🎲</span>
      <span
        className={`font-bold text-purple-200 ${
          isMobile ? "text-[7px]" : "text-[10px]"
        }`}
      >
        RANDOM
      </span>
    </motion.div>
  );
}

// =============================================================================
// Stage Preview
// =============================================================================

interface StagePreviewProps {
  stage: Stage | null;
  isMobile: boolean;
}

function StagePreview({ stage, isMobile }: StagePreviewProps) {
  return (
    <div
      className={`relative w-full rounded-xl overflow-hidden border border-white/10 bg-black/50 ${
        isMobile ? "aspect-video" : "aspect-video"
      }`}
    >
      <AnimatePresence mode="wait">
        {stage ? (
          <motion.div
            key={stage.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <Image
              src={stage.backgroundImage}
              alt={stage.name}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent" />

            {/* Stage Info */}
            <div
              className={`absolute bottom-0 left-0 right-0 ${
                isMobile ? "px-3 pb-2" : "px-4 pb-3"
              }`}
            >
              <div
                className={`inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-1.5 ${
                  isMobile ? "px-2 py-0.5 text-xs" : "px-2.5 py-0.5 text-sm"
                }`}
              >
                <span>{stage.flag}</span>
                <span className="font-medium text-gray-200">
                  {stage.country}
                </span>
              </div>
              <h2
                className={`font-bold font-bebas-neue tracking-wide text-white ${
                  isMobile ? "text-lg" : "text-2xl"
                }`}
              >
                {stage.name}
              </h2>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-white/20"
          >
            <span className={isMobile ? "text-3xl mb-2" : "text-4xl mb-2"}>
              🏟️
            </span>
            <span
              className={`font-medium uppercase tracking-widest ${
                isMobile ? "text-[10px]" : "text-xs"
              }`}
            >
              Select a stage...
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// Mobile View
// =============================================================================

interface MobileViewProps {
  config: StateConfig;
  currentStateName: DemoState;
  gridControls: ReturnType<typeof useAnimation>;
}

function MobileView({ config, currentStateName, gridControls }: MobileViewProps) {
  const displayStage =
    config.hoveredStageIndex !== null
      ? STAGES[config.hoveredStageIndex]
      : config.selectedStageIndex !== null
      ? STAGES[config.selectedStageIndex]
      : null;

  return (
    <div className="absolute inset-0 flex flex-col bg-black">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-purple-900/20 via-black to-black" />
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl" />

      {/* Loading State */}
      <AnimatePresence>
        {currentStateName === "idle" && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
            >
              {config.label}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <AnimatePresence>
        {config.showContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col justify-center relative z-10 p-3"
          >
            {/* Preview Area */}
            <div className="mb-2">
              <StagePreview stage={displayStage} isMobile={true} />
            </div>

            {/* Stage Grid */}
            <motion.div
              className="grid grid-cols-5 gap-1.5"
              variants={gridContainerVariants}
              initial="hidden"
              animate={gridControls}
            >
              {STAGES.map((stage, index) => (
                <StageGridItem
                  key={stage.id}
                  stage={stage}
                  isHovered={config.hoveredStageIndex === index}
                  isSelected={config.selectedStageIndex === index}
                  isMobile={true}
                />
              ))}
              <RandomButton isMobile={true} />
            </motion.div>
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
  gridControls: ReturnType<typeof useAnimation>;
}

function DesktopView({ config, currentStateName, gridControls }: DesktopViewProps) {
  const displayStage =
    config.hoveredStageIndex !== null
      ? STAGES[config.hoveredStageIndex]
      : config.selectedStageIndex !== null
      ? STAGES[config.selectedStageIndex]
      : null;

  return (
    <div className="absolute inset-0 flex flex-col bg-black">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-purple-900/20 via-black to-black" />
      <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />

      {/* Loading State */}
      <AnimatePresence>
        {currentStateName === "idle" && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-2 h-2 bg-yellow-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className="w-2 h-2 bg-yellow-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="w-2 h-2 bg-yellow-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                />
              </div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
              >
                {config.label}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <AnimatePresence>
        {config.showContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col justify-center relative z-10 px-8 py-4"
          >
            {/* Preview Area */}
            <div className="mb-4 max-w-xl mx-auto w-full">
              <StagePreview stage={displayStage} isMobile={false} />
            </div>

            {/* Stage Grid */}
            <motion.div
              className="grid grid-cols-5 gap-3 max-w-xl mx-auto w-full"
              variants={gridContainerVariants}
              initial="hidden"
              animate={gridControls}
            >
              {STAGES.map((stage, index) => (
                <StageGridItem
                  key={stage.id}
                  stage={stage}
                  isHovered={config.hoveredStageIndex === index}
                  isSelected={config.selectedStageIndex === index}
                  isMobile={false}
                />
              ))}
              <RandomButton isMobile={false} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

interface StageSelectDemoProps {
  loadingScreen?: "enabled" | "disabled";
  isActive?: boolean;
}

export function StageSelectDemo({
  loadingScreen = "disabled",
  isActive = true,
}: StageSelectDemoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stateIndex, setStateIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const gridControls = useAnimation();

  const stateOrder =
    loadingScreen === "enabled"
      ? STATE_ORDER_WITH_LOADING
      : STATE_ORDER_WITHOUT_LOADING;

  const currentStateName = stateOrder[stateIndex];
  const config = STATE_CONFIGS[currentStateName];

  // Replay grid animation
  const replayGridAnimation = useCallback(async () => {
    await gridControls.set("hidden");
    await gridControls.start("visible");
  }, [gridControls]);

  const advanceState = useCallback(() => {
    setStateIndex((prev) => {
      const nextIndex = (prev + 1) % stateOrder.length;
      // Replay animation when looping back to start
      if (nextIndex === 0) {
        replayGridAnimation();
      }
      return nextIndex;
    });
  }, [stateOrder.length, replayGridAnimation]);

  // Reset animation when becoming active
  const wasActiveRef = useRef(isActive);
  useEffect(() => {
    if (isActive && !wasActiveRef.current) {
      setStateIndex(0);
      replayGridAnimation();
    }
    wasActiveRef.current = isActive;
  }, [isActive, replayGridAnimation]);

  // Initial animation on mount
  useEffect(() => {
    if (isActive) {
      gridControls.start("visible");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      className="absolute inset-0 bg-black flex flex-col overflow-hidden"
    >
      {isMobile ? (
        <MobileView config={config} currentStateName={currentStateName} gridControls={gridControls} />
      ) : (
        <DesktopView config={config} currentStateName={currentStateName} gridControls={gridControls} />
      )}
    </div>
  );
}
