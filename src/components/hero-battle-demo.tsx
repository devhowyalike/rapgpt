"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Bell, Music2, Play, Download } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

// =============================================================================
// Types & Data
// =============================================================================

type DemoState =
  | "intro"
  | "mc1-streaming"
  | "mc1-verse"
  | "mc2-streaming"
  | "mc2-verse"
  | "scoring"
  | "winner"
  | "song-style-select"
  | "song-generating"
  | "song-complete";

interface MCData {
  name: string;
  avatar: string;
  style: string;
  bio: string;
}

interface StateConfig {
  duration: number;
  activeMC: "mc1" | "mc2" | "both" | "none";
  round: number;
  showScoring?: boolean;
  showWinner?: boolean;
  showSongStyleSelect?: boolean;
  showSongGenerating?: boolean;
  showSongComplete?: boolean;
  streamingMC?: "mc1" | "mc2";
  mc1Lines?: number; // Number of lines to show for MC1
  mc2Lines?: number; // Number of lines to show for MC2
}

const MC1: MCData = {
  name: "Tyler, The Creator",
  avatar: "/avatars/tyler.webp",
  style: "GOLF le FLEUR*",
  bio: "@#$%! #$@&! %$#@!!!",
};

const MC2: MCData = {
  name: "Tim Dog",
  avatar: "/avatars/tim-dog.webp",
  style: "Boom Bap",
  bio: "Bronx all day, every day",
};

const VERSES = {
  mc1: [
    "Wolf Gang thinks they innovate? Man, that's a joke",
    "Your whole crew's just cosplay, I'm the original bloke",
    "You say my nose is fake? At least I own my disguise",
    "While you're playing dress-up with them manufactured lies",
  ],
  mc2: [
    "Talk about disguise? I transform, create whole personas",
    "Igor, Wolf Haley - each album's a new aroma",
    "Your bathrooms and stages can't compare to my vision",
    "I'm directing culture, you're just nostalgic transmission",
  ],
};

const STATE_CONFIGS: Record<DemoState, StateConfig> = {
  intro: {
    duration: 2200,
    activeMC: "mc1",
    round: 3,
    mc1Lines: 0,
    mc2Lines: 0,
  },
  "mc1-streaming": {
    duration: 3000,
    activeMC: "mc1",
    round: 3,
    streamingMC: "mc1",
    mc1Lines: 2, // Show first 2 lines streaming
    mc2Lines: 0,
  },
  "mc1-verse": {
    duration: 2500,
    activeMC: "mc1",
    round: 3,
    mc1Lines: 4, // Show all 4 lines
    mc2Lines: 0,
  },
  "mc2-streaming": {
    duration: 3000,
    activeMC: "mc2",
    round: 3,
    streamingMC: "mc2",
    mc1Lines: 4,
    mc2Lines: 2,
  },
  "mc2-verse": {
    duration: 2500,
    activeMC: "mc2",
    round: 3,
    mc1Lines: 4,
    mc2Lines: 4,
  },
  scoring: {
    duration: 1500,
    activeMC: "none",
    round: 3,
    showScoring: true,
    mc1Lines: 4,
    mc2Lines: 4,
  },
  winner: {
    duration: 3500,
    activeMC: "mc1",
    round: 3,
    showWinner: true,
    mc1Lines: 4,
    mc2Lines: 4,
  },
  "song-style-select": {
    duration: 3500,
    activeMC: "none",
    round: 3,
    showSongStyleSelect: true,
    mc1Lines: 4,
    mc2Lines: 4,
  },
  "song-generating": {
    duration: 4000,
    activeMC: "none",
    round: 3,
    showSongGenerating: true,
    mc1Lines: 4,
    mc2Lines: 4,
  },
  "song-complete": {
    duration: 4000,
    activeMC: "none",
    round: 3,
    showSongComplete: true,
    mc1Lines: 4,
    mc2Lines: 4,
  },
};

const STATE_ORDER: DemoState[] = [
  "intro",
  "mc1-streaming",
  "mc1-verse",
  "mc2-streaming",
  "mc2-verse",
  "scoring",
  "winner",
  "song-style-select",
  "song-generating",
  "song-complete",
];

// CSS variables for player colors (matching the real battle stage)
const PLAYER1_COLOR = "59, 130, 246"; // blue-500
const PLAYER2_COLOR = "239, 68, 68"; // red-500

// =============================================================================
// Stage Header Component
// =============================================================================

interface StageHeaderProps {
  currentRound: number;
  completedRounds: number[];
}

function StageHeader({ currentRound, completedRounds }: StageHeaderProps) {
  return (
    <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
      {/* Stage Info */}
      <div className="flex-1 min-w-0">
        <div className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">
          Stage:
        </div>
        <div className="text-sm sm:text-lg font-bold text-white truncate">
          Oakland Coliseum
        </div>
        <div className="text-[10px] sm:text-xs text-gray-400 flex items-center gap-1">
          <span>🇺🇸</span>
          <span className="truncate">Oakland, CA</span>
        </div>
      </div>

      {/* Bell */}
      <div className="mx-2 sm:mx-4">
        <motion.div
          animate={{
            rotate: currentRound > 0 ? [0, -15, 15, -10, 10, 0] : 0,
            scale: currentRound > 0 ? [1, 1.1, 1] : 1,
          }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Bell className="w-5 h-5 sm:w-7 sm:h-7 text-yellow-400 fill-yellow-400/20" />
        </motion.div>
      </div>

      {/* Round Tracker */}
      <div className="flex-1 flex justify-end">
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mr-1">
            Round
          </span>
          {[1, 2, 3].map((round) => (
            <div
              key={round}
              className={`w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all duration-300 ${
                completedRounds.includes(round)
                  ? "bg-linear-to-br from-yellow-400 to-yellow-600 text-black"
                  : round === currentRound
                  ? "bg-linear-to-br from-blue-500 to-purple-600 text-white"
                  : "bg-gray-800 text-gray-500 border-2 border-gray-700"
              }`}
            >
              {completedRounds.includes(round) ? "✓" : round}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Persona Card Component (Matching Real Design)
// =============================================================================

interface PersonaCardDemoProps {
  mc: MCData;
  position: "player1" | "player2";
  isActive: boolean;
  isWinner?: boolean;
}

function PersonaCardDemo({
  mc,
  position,
  isActive,
  isWinner,
}: PersonaCardDemoProps) {
  const playerColor =
    position === "player1" ? `rgb(${PLAYER1_COLOR})` : `rgb(${PLAYER2_COLOR})`;

  return (
    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border-b border-gray-800 bg-gray-900">
      {/* Avatar */}
      <div className="relative shrink-0">
        <motion.div
          className="relative rounded-full"
          animate={{
            scale: isActive ? 1.05 : 1,
            boxShadow: isActive ? `0 0 20px ${playerColor}` : "none",
          }}
          transition={{ duration: 0.3 }}
        >
          <div
            className="w-10 h-10 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 sm:border-[3px] bg-gray-800"
            style={{ borderColor: playerColor }}
          >
            <Image
              src={mc.avatar}
              alt={mc.name}
              width={56}
              height={56}
              className="w-full h-full object-cover"
            />
          </div>

          {isActive && (
            <motion.div
              className="absolute -inset-1 rounded-full pointer-events-none"
              style={{ border: `2px solid ${playerColor}` }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
        </motion.div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3
            className="text-sm sm:text-lg font-bold font-(family-name:--font-bebas-neue) truncate"
            style={{ color: playerColor }}
          >
            {mc.name}
          </h3>
        </div>
        <p className="text-[10px] sm:text-xs text-gray-400 truncate">
          {mc.style}
        </p>
        <p className="text-[10px] sm:text-xs text-gray-300 truncate hidden sm:block">
          {mc.bio}
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// Verse Display Component (Matching Real Design)
// =============================================================================

interface VerseDemoProps {
  lines: string[];
  visibleCount: number;
  position: "player1" | "player2";
  isStreaming?: boolean;
  mcName: string;
}

function VerseDemo({
  lines,
  visibleCount,
  position,
  isStreaming,
  mcName,
}: VerseDemoProps) {
  const playerColor =
    position === "player1" ? `rgb(${PLAYER1_COLOR})` : `rgb(${PLAYER2_COLOR})`;

  const visibleLines = lines.slice(0, visibleCount);

  return (
    <div className="flex-1 p-2 sm:p-4 space-y-1.5 sm:space-y-2 overflow-hidden">
      <AnimatePresence mode="popLayout">
        {visibleLines.map((line, index) => (
          <motion.div
            key={`${position}-${index}`}
            initial={{ opacity: 0, x: position === "player1" ? -15 : 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{
              delay: isStreaming ? index * 0.15 : 0,
              duration: 0.3,
            }}
            className="flex"
          >
            <span
              className="text-[10px] sm:text-sm opacity-50 w-4 sm:w-6 shrink-0"
              style={{ color: playerColor }}
            >
              {index + 1}.
            </span>
            <p
              className="text-xs sm:text-base text-white font-medium leading-relaxed flex-1"
              style={{ textShadow: `0 0 8px ${playerColor}40` }}
            >
              {line}
            </p>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Streaming indicator */}
      {isStreaming && visibleCount < lines.length && (
        <motion.div
          className="flex items-center gap-2 mt-2"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div
            className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full"
            style={{ backgroundColor: playerColor }}
          />
          <span
            className="text-[10px] sm:text-xs"
            style={{ color: playerColor }}
          >
            {mcName} is spitting...
          </span>
        </motion.div>
      )}

      {/* Empty state */}
      {visibleCount === 0 && !isStreaming && (
        <div className="flex items-center justify-center h-full">
          <p className="text-[10px] sm:text-xs text-gray-500 text-center text-pretty">
            Waiting for {mcName} to drop their verse...
          </p>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Scoring Overlay
// =============================================================================

function ScoringOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-400"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
        <p className="text-sm sm:text-lg font-bold text-yellow-400 font-(family-name:--font-bebas-neue) tracking-wide">
          Calculating Scores...
        </p>
      </div>
    </motion.div>
  );
}

// =============================================================================
// Winner Overlay with Contained Confetti
// =============================================================================

interface WinnerOverlayProps {
  mc: MCData;
}

const CONFETTI_COLORS = [
  "#fbbf24",
  "#facc15",
  "#ef4444",
  "#dc2626",
  "#a855f7",
  "#9333ea",
  "#3b82f6",
  "#2563eb",
  "#10b981",
  "#059669",
  "#ec4899",
  "#db2777",
  "#f97316",
  "#ea580c",
];

function ContainedConfetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    const fitCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    fitCanvas();

    type Particle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      rotation: number;
      rotationSpeed: number;
      shape: "rect" | "circle";
      life: number;
      maxLife: number;
    };

    const particles: Particle[] = [];
    const width = () => canvas.clientWidth || canvas.width / dpr;
    const height = () => canvas.clientHeight || canvas.height / dpr;

    // Create particles from center
    for (let i = 0; i < 80; i++) {
      const w = width();
      const h = height();
      const startX = w / 2;
      const startY = h / 2;

      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 200;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = 3 + Math.random() * 8;
      const color =
        CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      const rotation = Math.random() * Math.PI * 2;
      const rotationSpeed =
        (Math.random() > 0.5 ? 1 : -1) * (Math.PI * (0.5 + Math.random() * 2));
      const maxLife = 2 + Math.random() * 1.5;

      particles.push({
        x: startX,
        y: startY,
        vx,
        vy,
        size,
        color,
        rotation,
        rotationSpeed,
        shape: Math.random() > 0.5 ? "circle" : "rect",
        life: 0,
        maxLife,
      });
    }

    let prev = performance.now();
    let rafId: number;
    const gravity = 150;
    const drag = 0.001;

    const frame = () => {
      const t = performance.now();
      const dt = Math.min(0.032, (t - prev) / 1000);
      prev = t;

      ctx.clearRect(0, 0, width(), height());

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.vx *= 1 - drag;
        p.vy *= 1 - drag;
        p.vy += gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rotation += p.rotationSpeed * dt;
        p.life += dt;

        const alpha =
          p.life < p.maxLife * 0.7
            ? 1
            : Math.max(0, 1 - (p.life - p.maxLife * 0.7) / (p.maxLife * 0.3));

        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        ctx.globalAlpha = 1;

        if (p.life > p.maxLife) {
          particles.splice(i, 1);
        }
      }

      if (particles.length > 0) {
        rafId = requestAnimationFrame(frame);
      }
    };

    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden z-0"
    >
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}

function WinnerOverlay({ mc }: WinnerOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10 overflow-hidden"
    >
      <ContainedConfetti />
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 12 }}
        className="flex flex-col items-center gap-2 text-center px-4 relative z-10"
      >
        <motion.span
          className="text-3xl sm:text-4xl"
          animate={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
        >
          🏆
        </motion.span>
        <p className="text-lg sm:text-2xl font-bold text-yellow-400 font-(family-name:--font-bebas-neue)">
          WINNER: {mc.name}
        </p>
      </motion.div>
    </motion.div>
  );
}

// =============================================================================
// Song Style Select Overlay
// =============================================================================

const BEAT_STYLES = [
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
];

function SongStyleSelectOverlay() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Auto-select boom-bap after a delay to simulate selection
  useEffect(() => {
    const timer = setTimeout(() => {
      setSelectedIndex(1); // Select Boom-Bap
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-10"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 15 }}
        className="flex flex-col gap-3 px-4 py-4 mx-4 rounded-xl bg-gray-900/95 border border-gray-700 max-w-xs w-full"
      >
        {/* Header */}
        <div className="text-center mb-1">
          <p className="text-sm sm:text-base font-bold text-white">
            Pick Your Style
          </p>
          <p className="text-[10px] sm:text-xs text-gray-400">
            Choose a beat for your battle track
          </p>
        </div>

        {/* Beat Style Options */}
        <div className="flex flex-col gap-2">
          {BEAT_STYLES.map((style, index) => (
            <motion.div
              key={style.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                relative flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all
                ${
                  selectedIndex === index
                    ? `bg-linear-to-r ${style.gradient} shadow-lg`
                    : "bg-gray-800/80 hover:bg-gray-700/80"
                }
              `}
            >
              {/* Icon */}
              <div
                className={`
                  w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-lg sm:text-xl
                  ${selectedIndex === index ? "bg-white/20" : "bg-gray-700"}
                `}
              >
                {style.icon}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-bold ${
                    selectedIndex === index ? "text-white" : "text-gray-200"
                  }`}
                >
                  {style.name}
                </p>
                <p
                  className={`text-[10px] sm:text-xs ${
                    selectedIndex === index ? "text-white/80" : "text-gray-400"
                  }`}
                >
                  {style.description}
                </p>
              </div>

              {/* Selected indicator */}
              {selectedIndex === index && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-5 h-5 rounded-full bg-white flex items-center justify-center"
                >
                  <span className="text-xs">✓</span>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Generate Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: selectedIndex !== null ? 1 : 0.5 }}
          className={`
            mt-1 py-2.5 rounded-lg text-center text-sm font-bold transition-all
            ${
              selectedIndex !== null
                ? `bg-linear-to-r ${BEAT_STYLES[selectedIndex].gradient} text-white`
                : "bg-gray-700 text-gray-400"
            }
          `}
        >
          <div className="flex items-center justify-center gap-2">
            <Music2 className="w-4 h-4" />
            <span>Generate Track</span>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// =============================================================================
// Song Generating Overlay
// =============================================================================

function SongGeneratingOverlay() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress from 0 to 100 over the duration
    const startTime = performance.now();
    const duration = 3500; // slightly less than state duration for smooth transition

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const newProgress = Math.min(100, (elapsed / duration) * 100);
      setProgress(newProgress);

      if (newProgress < 100) {
        requestAnimationFrame(animate);
      }
    };

    const rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-10"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 15 }}
        className="flex flex-col items-center gap-4 px-6 py-5 mx-4 rounded-xl bg-gray-900/90 border border-gray-700 max-w-xs w-full"
      >
        {/* Icon */}
        <motion.div
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-linear-to-br from-orange-500 to-red-600 flex items-center justify-center"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Music2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
        </motion.div>

        {/* Text */}
        <div className="text-center">
          <p className="text-sm sm:text-base font-bold text-white mb-1">
            Generating Your Track
          </p>
          <p className="text-[10px] sm:text-xs text-gray-400">
            Boom-Bap • 90s East Coast classic
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full">
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-linear-to-r from-yellow-400 to-orange-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] sm:text-xs text-gray-500 text-center mt-2">
            {Math.round(progress)}% complete
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// =============================================================================
// Song Complete Overlay (Mini Player)
// =============================================================================

// Deterministic waveform heights for consistent rendering
const WAVEFORM_HEIGHTS = [
  35, 55, 75, 45, 85, 65, 40, 70, 50, 80, 60, 45, 75, 55, 65, 40, 70, 85, 50,
  60,
];

function SongCompleteOverlay() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Auto-play animation
  useEffect(() => {
    const timer = setTimeout(() => setIsPlaying(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Simulate playback time
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => (prev >= 45 ? 0 : prev + 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-10"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 15 }}
        className="flex flex-col gap-3 px-4 py-4 mx-4 rounded-xl bg-linear-to-br from-gray-900 to-gray-950 border border-gray-700 max-w-md w-full"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden shrink-0 border border-white/10 shadow-lg">
            <Image
              src="/marketing/album-cover-example.webp"
              alt="Album Cover"
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm sm:text-base font-bold text-white truncate">
              Tyler, The Creator vs Tim Dog
            </p>
            <p className="text-[10px] sm:text-xs text-gray-400">
              Battle Remix • Boom-Bap
            </p>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="text-green-400 text-[10px] sm:text-xs font-medium px-2 py-0.5 bg-green-500/20 rounded-full"
          >
            Ready
          </motion.div>
        </div>

        {/* Waveform */}
        <div className="h-10 sm:h-12 flex items-end justify-between gap-0.5 px-1">
          {WAVEFORM_HEIGHTS.map((height, i) => (
            <motion.div
              key={i}
              className="flex-1 rounded-t-sm bg-orange-500/60"
              animate={{
                height: isPlaying
                  ? [`${height}%`, `${height * 0.6}%`, `${height}%`]
                  : `${height}%`,
                opacity: isPlaying ? [0.6, 1, 0.6] : 0.4,
              }}
              transition={{
                duration: 0.8,
                repeat: isPlaying ? Infinity : 0,
                delay: i * 0.05,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white text-black flex items-center justify-center shrink-0"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Play
              className={`w-4 h-4 sm:w-5 sm:h-5 ${
                isPlaying ? "ml-0" : "ml-0.5"
              } fill-current`}
            />
          </motion.button>

          <div className="flex-1 flex items-center gap-2">
            <span className="text-[10px] sm:text-xs text-gray-400 font-mono w-8">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                style={{ width: `${(currentTime / 45) * 100}%` }}
              />
            </div>
            <span className="text-[10px] sm:text-xs text-gray-400 font-mono w-8">
              0:45
            </span>
          </div>

          <motion.button
            className="p-2 rounded-full hover:bg-white/10 text-gray-400"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function HeroBattleDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stateIndex, setStateIndex] = useState(0);
  const [isInView, setIsInView] = useState(false);

  const currentStateName = STATE_ORDER[stateIndex];
  const config = STATE_CONFIGS[currentStateName];

  const advanceState = useCallback(() => {
    setStateIndex((prev) => (prev + 1) % STATE_ORDER.length);
  }, []);

  // Intersection Observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const wasInView = isInView;
        const nowInView = entry.isIntersecting;

        setIsInView(nowInView);

        if (!wasInView && nowInView) {
          setStateIndex(0);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [isInView]);

  // Auto-advance
  useEffect(() => {
    if (!isInView) return;

    const timer = setTimeout(advanceState, config.duration);
    return () => clearTimeout(timer);
  }, [stateIndex, isInView, config.duration, advanceState]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isInView) return;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        setStateIndex((prev) => (prev + 1) % STATE_ORDER.length);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setStateIndex((prev) =>
          prev === 0 ? STATE_ORDER.length - 1 : prev - 1
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isInView]);

  const completedRounds =
    currentStateName === "winner" ||
    currentStateName === "song-style-select" ||
    currentStateName === "song-generating" ||
    currentStateName === "song-complete"
      ? [1, 2, 3]
      : [1, 2];

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-16/10 overflow-hidden"
      style={
        {
          "--player1-color": PLAYER1_COLOR,
          "--player2-color": PLAYER2_COLOR,
        } as React.CSSProperties
      }
    >
      {/* Background - matching battle stage gradient */}
      <div className="absolute inset-0 bg-linear-to-b from-gray-900 via-gray-950 to-black" />

      {/* Stage Header */}
      <StageHeader
        currentRound={config.round}
        completedRounds={completedRounds}
      />

      {/* Split View - Two Columns */}
      <div className="absolute top-[52px] sm:top-[68px] bottom-8 left-0 right-0 grid grid-cols-2">
        {/* Player 1 (Left) */}
        <div className="flex flex-col border-r border-gray-800/50 overflow-hidden">
          <PersonaCardDemo
            mc={MC1}
            position="player1"
            isActive={config.activeMC === "mc1" || config.activeMC === "both"}
            isWinner={config.showWinner}
          />
          <VerseDemo
            lines={VERSES.mc1}
            visibleCount={config.mc1Lines || 0}
            position="player1"
            isStreaming={config.streamingMC === "mc1"}
            mcName={MC1.name}
          />
        </div>

        {/* Player 2 (Right) */}
        <div className="flex flex-col overflow-hidden">
          <PersonaCardDemo
            mc={MC2}
            position="player2"
            isActive={config.activeMC === "mc2" || config.activeMC === "both"}
          />
          <VerseDemo
            lines={VERSES.mc2}
            visibleCount={config.mc2Lines || 0}
            position="player2"
            isStreaming={config.streamingMC === "mc2"}
            mcName={MC2.name}
          />
        </div>
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {config.showScoring && <ScoringOverlay />}
        {config.showWinner && <WinnerOverlay mc={MC1} />}
        {config.showSongStyleSelect && <SongStyleSelectOverlay />}
        {config.showSongGenerating && <SongGeneratingOverlay />}
        {config.showSongComplete && <SongCompleteOverlay />}
      </AnimatePresence>

      {/* State indicator pills */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-20">
        {STATE_ORDER.map((state, idx) => (
          <motion.button
            key={`${state}-${idx}`}
            onClick={() => setStateIndex(idx)}
            className={`
              h-1 rounded-full transition-all duration-300
              ${idx === stateIndex ? "w-4 sm:w-6" : "w-1 sm:w-1.5"}
            `}
            animate={{
              backgroundColor:
                idx === stateIndex
                  ? "#facc15" // yellow-400
                  : "#374151", // gray-700
            }}
          />
        ))}
      </div>

      {/* Frost overlay on hover */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-30" />
    </div>
  );
}
