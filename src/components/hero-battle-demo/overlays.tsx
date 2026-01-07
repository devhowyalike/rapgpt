"use client";

import { APP_TITLE } from "@/lib/constants";
import { motion } from "framer-motion";
import { Music2, Download, Pause, Share2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import type { MCData, PausableProps } from "./types";
import { useAnimationProgress } from "./hooks";
import {
  CONFETTI_COLORS,
  WAVEFORM_HEIGHTS,
  BEAT_STYLES,
  fadeVariants,
  fadeScaleVariants,
  fadeSlideVariants,
  breathingDotAnimation,
  formatTime,
} from "./utils";

// =============================================================================
// Overlay Container (shared wrapper for consistent positioning)
// =============================================================================

interface OverlayContainerProps {
  children: React.ReactNode;
  variants?: typeof fadeVariants;
}

function OverlayContainer({
  children,
  variants = fadeScaleVariants,
}: OverlayContainerProps) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="absolute inset-0 flex items-center justify-center z-20"
    >
      {children}
    </motion.div>
  );
}

// =============================================================================
// Scoring Overlay
// =============================================================================

export function ScoringOverlay({ isPaused }: PausableProps) {
  return (
    <OverlayContainer variants={fadeVariants}>
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-400"
              animate={breathingDotAnimation(isPaused)}
              transition={{
                duration: 0.8,
                repeat: isPaused ? 0 : Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
        <p className="text-lg sm:text-2xl font-bold text-yellow-400 font-(family-name:--font-bebas-neue) tracking-wide">
          Calculating Scores...
        </p>
      </div>
    </OverlayContainer>
  );
}

// =============================================================================
// Contained Confetti Canvas
// =============================================================================

function ContainedConfetti({ isPaused }: PausableProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(isPaused);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

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
    const w = canvas.clientWidth || canvas.width / dpr;
    const h = canvas.clientHeight || canvas.height / dpr;
    const startX = w * 0.55;
    const startY = h / 2;
    const PARTICLE_COUNT = 60;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 200;

      particles.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 8,
        color:
          CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed:
          (Math.random() > 0.5 ? 1 : -1) *
          (Math.PI * (0.5 + Math.random() * 2)),
        shape: Math.random() > 0.5 ? "circle" : "rect",
        life: 0,
        maxLife: 2 + Math.random() * 1.5,
      });
    }

    let prev = performance.now();
    let rafId: number;
    const gravity = 150;
    const drag = 0.001;
    const width = () => canvas.clientWidth || canvas.width / dpr;
    const height = () => canvas.clientHeight || canvas.height / dpr;

    const frame = () => {
      const t = performance.now();
      const dt = Math.min(0.032, (t - prev) / 1000);
      prev = t;

      if (!isPausedRef.current) {
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

// =============================================================================
// Winner Overlay
// =============================================================================

interface WinnerOverlayProps extends PausableProps {
  mc: MCData;
}

export function WinnerOverlay({ mc, isPaused }: WinnerOverlayProps) {
  return (
    <OverlayContainer>
      <ContainedConfetti isPaused={isPaused} />
      <div className="flex flex-col items-center gap-4 text-center px-4 relative z-10">
        <motion.span
          className="text-5xl sm:text-7xl"
          animate={{ rotate: [0, -12, 12, -5, 5, -2, 2, 0] }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          🏆
        </motion.span>
        <p className="text-3xl sm:text-5xl font-bold text-yellow-400 font-(family-name:--font-bebas-neue) tracking-wider">
          WINNER: {mc.name}
        </p>
      </div>
    </OverlayContainer>
  );
}

// =============================================================================
// Song Style Select Overlay
// =============================================================================

export function SongStyleSelectOverlay() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setSelectedIndex(1), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <OverlayContainer variants={fadeSlideVariants}>
      <div className="flex flex-col gap-3 px-4 py-4 mx-4 rounded-xl bg-gray-900/95 border border-gray-700 max-w-xs w-full">
        <div className="text-center mb-1">
          <p className="text-sm sm:text-base font-bold text-white">
            Make it a Song
          </p>
          <p className="text-[10px] sm:text-xs text-gray-400">
            Choose a beat for your battle track
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {BEAT_STYLES.map((style, index) => (
            <div
              key={style.id}
              className={`
                relative flex items-center gap-3 p-2.5 rounded-lg cursor-pointer
                ${
                  selectedIndex === index
                    ? `bg-linear-to-r ${style.gradient} shadow-lg`
                    : "bg-gray-800/80"
                }
              `}
            >
              <div
                className={`
                  w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-lg sm:text-xl
                  ${selectedIndex === index ? "bg-white/20" : "bg-gray-700"}
                `}
              >
                {style.icon}
              </div>
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
              {selectedIndex === index && (
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                  <span className="text-xs">✓</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div
          className={`
            mt-1 py-2.5 rounded-lg text-center text-sm font-bold
            ${
              selectedIndex !== null
                ? `bg-linear-to-r ${BEAT_STYLES[selectedIndex].gradient} text-white`
                : "bg-gray-700 text-gray-400 opacity-50"
            }
          `}
        >
          <div className="flex items-center justify-center gap-2">
            <Music2 className="w-4 h-4" />
            <span>Generate Song</span>
          </div>
        </div>
      </div>
    </OverlayContainer>
  );
}

// =============================================================================
// Song Generating Overlay
// =============================================================================

export function SongGeneratingOverlay({ isPaused }: PausableProps) {
  const { progress } = useAnimationProgress({
    duration: 3500,
    isPaused,
  });

  return (
    <OverlayContainer>
      <div className="flex flex-col items-center gap-4 px-6 py-5 mx-4 rounded-xl bg-gray-900/90 border border-gray-700 max-w-xs w-full">
        <motion.div
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-linear-to-br from-orange-500 to-red-600 flex items-center justify-center"
          animate={
            isPaused
              ? { scale: 1, rotate: 0 }
              : { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }
          }
          transition={{
            duration: 1.5,
            repeat: isPaused ? 0 : Infinity,
            ease: "easeInOut",
          }}
        >
          <Music2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
        </motion.div>

        <div className="text-center">
          <p className="text-sm sm:text-base font-bold text-white mb-1">
            Generating Your Song
          </p>
          <p className="text-[10px] sm:text-xs text-gray-400">
            Boom-Bap • 90s East Coast style
          </p>
        </div>

        <div className="w-full">
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-linear-to-r from-yellow-400 to-orange-500 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: isPaused ? 0 : 0.1 }}
            />
          </div>
          <p className="text-[10px] sm:text-xs text-gray-500 text-center mt-2">
            {Math.round(progress)}% complete
          </p>
        </div>
      </div>
    </OverlayContainer>
  );
}

// =============================================================================
// Song Complete Overlay (Mini Player)
// =============================================================================

export function SongCompleteOverlay({ isPaused }: PausableProps) {
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => (prev >= 45 ? 0 : prev + 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <OverlayContainer variants={fadeSlideVariants}>
      <div className="flex flex-col gap-3 px-4 py-4 mx-4 rounded-xl bg-linear-to-br from-gray-900 to-gray-950 border border-gray-700 max-w-md w-full">
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
              Boom-Bap • Generated by {APP_TITLE}
            </p>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="p-1.5 bg-green-500/20 rounded-full text-green-400 hover:bg-green-500/30 transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </motion.div>
        </div>

        {/* Waveform - CSS-animated for performance */}
        <div className="h-10 sm:h-12 flex items-end justify-between gap-0.5 px-1">
          {WAVEFORM_HEIGHTS.map((height, i) => (
            <div
              key={i}
              className={`demo-waveform-bar ${!isPaused ? "animating" : ""}`}
              style={{
                height: `${height}%`,
                animationDelay: `${i * 40}ms`,
              }}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <motion.div
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white text-black flex items-center justify-center shrink-0"
            whileHover={{ scale: 1.05 }}
          >
            <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          </motion.div>

          <div className="flex-1 flex items-center gap-2">
            <span className="text-[10px] sm:text-xs text-gray-400 font-mono w-8">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${(currentTime / 45) * 100}%` }}
                transition={{ duration: isPaused ? 0 : 0.1 }}
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
      </div>
    </OverlayContainer>
  );
}

// =============================================================================
// Pause Overlay (optimized - single blur layer)
// =============================================================================

interface PauseOverlayProps {
  onUnpause?: () => void;
}

export function PauseOverlay({ onUnpause }: PauseOverlayProps) {
  return (
    <motion.div
      key="pause-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-40 flex items-end justify-end p-4 sm:p-6 pointer-events-none"
    >
      {/* Invisible overlay for click-to-unpause functionality */}
      <div 
        className="absolute inset-0 cursor-pointer pointer-events-auto"
        onClick={(e) => {
          e.stopPropagation();
          onUnpause?.();
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, x: 10 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.9, x: 10 }}
        transition={{ duration: 0.15, delay: 0.05 }}
        className="relative z-10 bg-black/50 backdrop-blur-sm border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-xl cursor-pointer pointer-events-auto hover:bg-black/70 transition-colors group"
        onClick={(e) => {
          e.stopPropagation();
          onUnpause?.();
        }}
      >
        <Pause className="w-4 h-4 text-yellow-400 fill-yellow-400 opacity-80 group-hover:opacity-100 transition-opacity" />
        <span className="text-sm font-bold text-white/80 group-hover:text-white font-(family-name:--font-bebas-neue) tracking-widest uppercase transition-colors">
          Paused
        </span>
      </motion.div>
    </motion.div>
  );
}

// =============================================================================
// Frost Overlay (for post-battle states)
// =============================================================================

export function FrostOverlay() {
  return (
    <motion.div
      key="post-battle-frost"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 pointer-events-none"
    />
  );
}
