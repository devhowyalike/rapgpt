import type { Variants } from "framer-motion";

// =============================================================================
// Player Color Utilities
// =============================================================================

export const PLAYER_COLORS = {
  player1: "59, 130, 246", // blue-500
  player2: "239, 68, 68", // red-500
} as const;

export type PlayerPosition = keyof typeof PLAYER_COLORS;

export const getPlayerColor = (position: PlayerPosition) =>
  `rgb(${PLAYER_COLORS[position]})`;

export const getPlayerColorWithAlpha = (position: PlayerPosition, alpha: number) =>
  `rgba(${PLAYER_COLORS[position]}, ${alpha})`;

// =============================================================================
// Confetti Colors
// =============================================================================

export const CONFETTI_COLORS = [
  "#fbbf24", "#facc15", "#ef4444", "#dc2626",
  "#a855f7", "#9333ea", "#3b82f6", "#2563eb",
  "#10b981", "#059669", "#ec4899", "#db2777",
  "#f97316", "#ea580c",
];

// =============================================================================
// Waveform Heights (deterministic for SSR)
// =============================================================================

export const WAVEFORM_HEIGHTS = [
  35, 55, 75, 45, 85, 65, 40, 70, 50, 80, 60, 45, 75, 55, 65, 40, 70, 85, 50, 60,
];

// =============================================================================
// Animation Variants
// =============================================================================

export const pulseVariants: Variants = {
  paused: { opacity: 0.8, scale: 1 },
  animate: {
    opacity: [0.5, 1, 0.5],
    scale: [1, 1.05, 1],
  },
};

export const fadeSlideVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

export const fadeScaleVariants: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

// Ring pulse animation for active persona
export const ringPulseAnimation = (isPaused: boolean) =>
  isPaused
    ? { scale: 1, opacity: 0.5 }
    : { scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] };

// Breathing dot animation for loading indicators
export const breathingDotAnimation = (isPaused: boolean) =>
  isPaused
    ? { scale: 1, opacity: 0.8 }
    : { scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] };

// =============================================================================
// Timing Utilities
// =============================================================================

export const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Calculates duration based on word count to ensure the next slide
 * starts exactly 500ms after the streaming animation finishes.
 */
export const calculateVerseDuration = (verse: readonly string[]) => {
  const wordCount = verse.join(" ").split(" ").filter(Boolean).length;
  // 0.12s per word delay + 0.2s for the last word's animation duration + 500ms pause
  return Math.ceil((wordCount * 0.12 + 0.2) * 1000 + 500);
};

// =============================================================================
// Beat Style Data
// =============================================================================

export const BEAT_STYLES = [
  {
    id: "g-funk",
    name: "G-Funk",
    description: "West Coast smooth",
    icon: "🎹",
    gradient: "from-purple-600 to-pink-600",
  },
  {
    id: "boom-bap",
    name: "Boom-Bap",
    description: "90s East Coast",
    icon: "🥁",
    gradient: "from-orange-600 to-red-600",
  },
  {
    id: "trap",
    name: "Trap",
    description: "Modern Atlanta",
    icon: "🔊",
    gradient: "from-blue-600 to-cyan-600",
  },
] as const;

export type BeatStyle = (typeof BEAT_STYLES)[number];

