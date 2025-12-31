"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

// =============================================================================
// Types & Data
// =============================================================================

type DemoState =
  | "idle"
  | "select-p1"
  | "p1-selected"
  | "select-p2"
  | "p2-selected"
  | "vs-reveal"
  | "reset";

interface StateConfig {
  label: string;
  duration: number;
  player1Selected: boolean;
  player2Selected: boolean;
  hoveredPlayer: 1 | 2 | null;
  hoveredPersonaIndex: number | null;
  showVs: boolean;
}

interface Persona {
  id: string;
  name: string;
  avatar: string;
  style: string;
}

const PERSONAS: Persona[] = [
  {
    id: "dawn",
    name: "Dawn",
    avatar: "/avatars/dawn-en-vogue.webp",
    style: "Lyrical Assassin",
  },
  {
    id: "shock-g",
    name: "Shock G",
    avatar: "/avatars/shock-g.webp",
    style: "Digital Underground",
  },
  {
    id: "humpty",
    name: "Humpty",
    avatar: "/avatars/humpty-hump.webp",
    style: "The Humpty Dance",
  },
  {
    id: "lady-muse",
    name: "Lady Muse",
    avatar: "/avatars/lady-muse.webp",
    style: "Poetic Flow",
  },
  {
    id: "kenny-k",
    name: "Kenny K",
    avatar: "/avatars/kenny-k.webp",
    style: "Street Poet",
  },
  {
    id: "tim-dog",
    name: "Tim Dog",
    avatar: "/avatars/tim-dog.webp",
    style: "Bronx Bomber",
  },
];

const PLAYER1_PERSONA = PERSONAS[0]; // Dawn
const PLAYER2_PERSONA = PERSONAS[1]; // Shock G

const STATE_CONFIGS: Record<DemoState, StateConfig> = {
  idle: {
    label: "Select Your MCs...",
    duration: 1500,
    player1Selected: false,
    player2Selected: false,
    hoveredPlayer: null,
    hoveredPersonaIndex: null,
    showVs: false,
  },
  "select-p1": {
    label: "",
    duration: 1200,
    player1Selected: false,
    player2Selected: false,
    hoveredPlayer: 1,
    hoveredPersonaIndex: 0,
    showVs: false,
  },
  "p1-selected": {
    label: "",
    duration: 1000,
    player1Selected: true,
    player2Selected: false,
    hoveredPlayer: null,
    hoveredPersonaIndex: null,
    showVs: false,
  },
  "select-p2": {
    label: "",
    duration: 1200,
    player1Selected: true,
    player2Selected: false,
    hoveredPlayer: 2,
    hoveredPersonaIndex: 1,
    showVs: false,
  },
  "p2-selected": {
    label: "",
    duration: 800,
    player1Selected: true,
    player2Selected: true,
    hoveredPlayer: null,
    hoveredPersonaIndex: null,
    showVs: false,
  },
  "vs-reveal": {
    label: "",
    duration: 2000,
    player1Selected: true,
    player2Selected: true,
    hoveredPlayer: null,
    hoveredPersonaIndex: null,
    showVs: true,
  },
  reset: {
    label: "",
    duration: 600,
    player1Selected: false,
    player2Selected: false,
    hoveredPlayer: null,
    hoveredPersonaIndex: null,
    showVs: false,
  },
};

const STATE_ORDER: DemoState[] = [
  "idle",
  "select-p1",
  "p1-selected",
  "select-p2",
  "p2-selected",
  "vs-reveal",
  "reset",
];

// =============================================================================
// Player Card
// =============================================================================

interface PlayerCardProps {
  player: Persona | null;
  side: "left" | "right";
  isActive: boolean;
  isMobile: boolean;
}

function PlayerCard({ player, side, isActive, isMobile }: PlayerCardProps) {
  const isPlayer1 = side === "left";
  const borderColor = isPlayer1 ? "border-blue-500" : "border-red-500";
  const glowColor = isPlayer1 ? "bg-blue-500/20" : "bg-red-500/20";
  const textColor = isPlayer1 ? "text-blue-400" : "text-red-400";
  const shadowColor = isPlayer1
    ? "rgba(59, 130, 246, 0.6)"
    : "rgba(239, 68, 68, 0.6)";

  return (
    <div className={`flex flex-col items-center ${isMobile ? "w-20" : "w-40"}`}>
      {/* Style label */}
      <p
        className={`${player ? textColor : "text-transparent"} ${
          isMobile ? "text-[10px]" : "text-base"
        } font-semibold mb-2 text-center`}
      >
        {player?.style || "Placeholder"}
      </p>

      {/* Avatar */}
      <div className="relative">
        {player && (
          <div
            className={`absolute inset-0 ${glowColor} blur-xl rounded-full animate-pulse`}
          />
        )}
        {isActive && (
          <div className="absolute inset-0 pointer-events-none z-20">
            <svg
              className="absolute inset-0 w-full h-full animate-[snake-ring_3s_linear_infinite]"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="48"
                fill="none"
                stroke={isPlayer1 ? "#3b82f6" : "#ef4444"}
                strokeWidth="4"
                strokeDasharray="75 225"
                strokeLinecap="round"
                opacity="0.9"
              />
            </svg>
          </div>
        )}
        <div
          className={`relative ${
            isMobile ? "w-14 h-14" : "w-36 h-36"
          } rounded-full border-4 ${
            isActive ? "border-transparent" : player ? borderColor : "border-gray-700 border-dashed"
          } overflow-hidden bg-linear-to-br from-gray-800 to-gray-900`}
          style={{
            boxShadow: player ? `0 0 30px ${shadowColor}` : "none",
          }}
        >
          {player ? (
            <Image
              src={player.avatar}
              alt={player.name}
              width={144}
              height={144}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600 text-2xl">
              ?
            </div>
          )}
        </div>
      </div>

      {/* Name */}
      <p
        className={`${player ? "text-white" : "text-gray-600"} font-bold ${
          isMobile ? "text-xs mt-1" : "text-xl mt-3"
        } uppercase tracking-wide text-center`}
      >
        {player?.name || (isPlayer1 ? "PLAYER 1" : "PLAYER 2")}
      </p>
    </div>
  );
}

// =============================================================================
// Persona Grid Item
// =============================================================================

interface PersonaGridItemProps {
  persona: Persona;
  isHovered: boolean;
  isSelected: boolean;
  selectedBy: 1 | 2 | null;
  isMobile: boolean;
}

function PersonaGridItem({
  persona,
  isHovered,
  isSelected,
  selectedBy,
  isMobile,
}: PersonaGridItemProps) {
  const borderColor =
    selectedBy === 1
      ? "border-blue-500"
      : selectedBy === 2
      ? "border-red-500"
      : isHovered
      ? "border-yellow-400"
      : "border-gray-700";

  const shadowStyle =
    selectedBy === 1
      ? "shadow-[0_0_20px_rgba(59,130,246,0.6)]"
      : selectedBy === 2
      ? "shadow-[0_0_20px_rgba(239,68,68,0.6)]"
      : isHovered
      ? "shadow-[0_0_15px_rgba(250,204,21,0.5)]"
      : "";

  return (
    <motion.div
      animate={{
        scale: isHovered ? 1.1 : isSelected ? 1.05 : 1,
        zIndex: isHovered || isSelected ? 10 : 1,
      }}
      transition={{ duration: 0.2 }}
      className="relative"
    >
      {/* Selection indicator */}
      {isSelected && selectedBy && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`absolute -top-1 -right-1 z-20 ${
            isMobile ? "w-4 h-4 text-[8px]" : "w-7 h-7 text-sm"
          } rounded-full ${
            selectedBy === 1 ? "bg-blue-500" : "bg-red-500"
          } flex items-center justify-center text-white font-bold`}
        >
          P{selectedBy}
        </motion.div>
      )}

      <div
        className={`${
          isMobile ? "w-10 h-10" : "w-20 h-20"
        } rounded-lg border-2 ${borderColor} ${shadowStyle} overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 transition-all duration-200`}
      >
        <Image
          src={persona.avatar}
          alt={persona.name}
          width={56}
          height={56}
          className="w-full h-full object-cover"
        />
      </div>
    </motion.div>
  );
}

// =============================================================================
// VS Badge
// =============================================================================

function VsBadge({
  visible,
  isMobile,
}: {
  visible: boolean;
  isMobile: boolean;
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 180 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="relative"
        >
          <div
            className={`absolute inset-0 bg-yellow-500/30 blur-xl rounded-full`}
          />
          <div
            className={`relative ${
              isMobile ? "w-8 h-8 text-sm" : "w-20 h-20 text-3xl"
            } rounded-full bg-linear-to-br from-yellow-400 via-orange-500 to-red-600 flex items-center justify-center font-black text-white shadow-lg`}
          >
            VS
          </div>
        </motion.div>
      )}
    </AnimatePresence>
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
  const player1 = config.player1Selected ? PLAYER1_PERSONA : null;
  const player2 = config.player2Selected ? PLAYER2_PERSONA : null;
  const hoveredP1 =
    config.hoveredPlayer === 1 ? PERSONAS[config.hoveredPersonaIndex!] : null;
  const hoveredP2 =
    config.hoveredPlayer === 2 ? PERSONAS[config.hoveredPersonaIndex!] : null;

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
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30"
            >
              {config.label}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <AnimatePresence>
        {currentStateName !== "idle" && currentStateName !== "reset" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col justify-center relative z-10 p-3"
          >
            {/* Header */}
            <div className="text-center mb-3">
              <h2 className="text-lg font-bold tracking-wide font-sans">
                {config.player2Selected ? (
                  <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 text-transparent bg-clip-text">
                    READY TO BATTLE
                  </span>
                ) : config.player1Selected ? (
                  <>
                    <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 text-transparent bg-clip-text">
                      SELECT{" "}
                    </span>
                    <span className="text-red-400">PLAYER 2</span>
                  </>
                ) : (
                  <>
                    <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 text-transparent bg-clip-text">
                      SELECT{" "}
                    </span>
                    <span className="text-blue-400">PLAYER 1</span>
                  </>
                )}
              </h2>
            </div>

            {/* Players Preview */}
            <div className="flex justify-center items-center gap-4 mb-4">
              <PlayerCard
                player={hoveredP1 || player1}
                side="left"
                isActive={config.hoveredPlayer === 1}
                isMobile={true}
              />

              <VsBadge visible={config.showVs} isMobile={true} />

              {!config.showVs && (
                <div className="w-8 h-8 flex items-center justify-center text-gray-600 text-sm">
                  VS
                </div>
              )}

              <PlayerCard
                player={hoveredP2 || player2}
                side="right"
                isActive={config.hoveredPlayer === 2}
                isMobile={true}
              />
            </div>

            {/* Character Grid */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-3">
              <div className="grid grid-cols-6 gap-2 justify-items-center">
                {PERSONAS.map((persona, index) => {
                  const isP1 = player1?.id === persona.id;
                  const isP2 = player2?.id === persona.id;
                  const selectedBy = isP1 ? 1 : isP2 ? 2 : null;
                  const isHovered = config.hoveredPersonaIndex === index;

                  return (
                    <PersonaGridItem
                      key={persona.id}
                      persona={persona}
                      isHovered={isHovered}
                      isSelected={isP1 || isP2}
                      selectedBy={selectedBy}
                      isMobile={true}
                    />
                  );
                })}
              </div>
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
  const player1 = config.player1Selected ? PLAYER1_PERSONA : null;
  const player2 = config.player2Selected ? PLAYER2_PERSONA : null;
  const hoveredP1 =
    config.hoveredPlayer === 1 ? PERSONAS[config.hoveredPersonaIndex!] : null;
  const hoveredP2 =
    config.hoveredPlayer === 2 ? PERSONAS[config.hoveredPersonaIndex!] : null;

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
                  className="w-2 h-2 bg-blue-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className="w-2 h-2 bg-blue-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="w-2 h-2 bg-blue-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                />
              </div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30"
              >
                {config.label}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <AnimatePresence>
        {currentStateName !== "idle" && currentStateName !== "reset" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col justify-center relative z-10 p-4"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold tracking-wide font-sans">
                {config.player2Selected ? (
                  <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 text-transparent bg-clip-text">
                    READY TO BATTLE
                  </span>
                ) : config.player1Selected ? (
                  <>
                    <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 text-transparent bg-clip-text">
                      SELECT{" "}
                    </span>
                    <span className="text-red-400">PLAYER 2</span>
                  </>
                ) : (
                  <>
                    <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 text-transparent bg-clip-text">
                      SELECT{" "}
                    </span>
                    <span className="text-blue-400">PLAYER 1</span>
                  </>
                )}
              </h2>
            </div>

            {/* Players Preview */}
            <div className="flex justify-center items-center gap-16 mb-10">
              <PlayerCard
                player={hoveredP1 || player1}
                side="left"
                isActive={config.hoveredPlayer === 1}
                isMobile={false}
              />

              <div className="w-20 h-20 flex items-center justify-center">
                <VsBadge visible={config.showVs} isMobile={false} />
                {!config.showVs && (
                  <span className="text-gray-600 text-2xl font-bold">VS</span>
                )}
              </div>

              <PlayerCard
                player={hoveredP2 || player2}
                side="right"
                isActive={config.hoveredPlayer === 2}
                isMobile={false}
              />
            </div>

            {/* Character Grid */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 max-w-xl mx-auto w-full">
              <div className="grid grid-cols-6 gap-5 justify-items-center">
                {PERSONAS.map((persona, index) => {
                  const isP1 = player1?.id === persona.id;
                  const isP2 = player2?.id === persona.id;
                  const selectedBy = isP1 ? 1 : isP2 ? 2 : null;
                  const isHovered = config.hoveredPersonaIndex === index;

                  return (
                    <PersonaGridItem
                      key={persona.id}
                      persona={persona}
                      isHovered={isHovered}
                      isSelected={isP1 || isP2}
                      selectedBy={selectedBy}
                      isMobile={false}
                    />
                  );
                })}
              </div>
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

export function SelectPlayerDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stateIndex, setStateIndex] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const currentStateName = STATE_ORDER[stateIndex];
  const config = STATE_CONFIGS[currentStateName];

  const advanceState = useCallback(() => {
    setStateIndex((prev) => (prev + 1) % STATE_ORDER.length);
  }, []);

  const isInViewRef = useRef(false);

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

  // Intersection Observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const wasInView = isInViewRef.current;
        const nowInView = entry.isIntersecting;

        isInViewRef.current = nowInView;
        setIsInView(nowInView);

        if (!wasInView && nowInView) {
          setStateIndex(0);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Auto-advance
  useEffect(() => {
    if (!isInView) return;

    const timer = setTimeout(advanceState, config.duration);
    return () => clearTimeout(timer);
  }, [stateIndex, isInView, config.duration, advanceState]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 bg-black flex flex-col overflow-hidden"
    >
      {isMobile ? (
        <MobileView config={config} currentStateName={currentStateName} />
      ) : (
        <DesktopView config={config} currentStateName={currentStateName} />
      )}
    </div>
  );
}
