"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Radio,
  StopCircle,
  Users,
  Eye,
  MessageCircle,
  Heart,
  Flame,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

// =============================================================================
// Types & Data
// =============================================================================

type DemoState =
  | "idle"
  | "starting"
  | "live-initial"
  | "viewers-join"
  | "chat-active"
  | "peak-hype"
  | "ending";

interface StateConfig {
  label: string;
  buttonState: "off" | "starting" | "live";
  viewerCount: number;
  duration: number;
  chatMessages?: ChatMessage[];
  showPulse?: boolean;
}

interface ChatMessage {
  id: number;
  user: string;
  message: string;
  emoji?: string;
  delay: number;
}

const CHAT_POOL: ChatMessage[] = [
  { id: 1, user: "215_LIVE", message: "Let's gooo!", emoji: "🔥", delay: 0 },
  {
    id: 2,
    user: "ceecee",
    message: "This is fire",
    emoji: "🎤",
    delay: 200,
  },
  { id: 3, user: "AngerFalcon", message: "Bars!", emoji: "💯", delay: 400 },
  { id: 4, user: "Moderhater", message: "He snapped", emoji: "⚡", delay: 100 },
  { id: 5, user: "KennyK", message: "W", emoji: "👑", delay: 300 },
  {
    id: 6,
    user: "Lady-Muse",
    message: "I'd steal this tape!",
    emoji: "🥶",
    delay: 150,
  },
];

const STATE_CONFIGS: Record<DemoState, StateConfig> = {
  idle: {
    label: "Press Go Live to start streaming",
    buttonState: "off",
    viewerCount: 0,
    duration: 2500,
  },
  starting: {
    label: "Connecting to battle...",
    buttonState: "starting",
    viewerCount: 0,
    duration: 1800,
  },
  "live-initial": {
    label: "You're live! Waiting for viewers...",
    buttonState: "live",
    viewerCount: 1,
    duration: 2200,
    showPulse: true,
  },
  "viewers-join": {
    label: "Viewers are joining!",
    buttonState: "live",
    viewerCount: 12,
    duration: 2500,
    chatMessages: [CHAT_POOL[0], CHAT_POOL[1]],
    showPulse: true,
  },
  "chat-active": {
    label: "Chat is heating up!",
    buttonState: "live",
    viewerCount: 47,
    duration: 2800,
    chatMessages: [CHAT_POOL[2], CHAT_POOL[3], CHAT_POOL[4]],
    showPulse: true,
  },
  "peak-hype": {
    label: "🔥 All world!",
    buttonState: "live",
    viewerCount: 128,
    duration: 3000,
    chatMessages: [CHAT_POOL[0], CHAT_POOL[5], CHAT_POOL[2], CHAT_POOL[4]],
    showPulse: true,
  },
  ending: {
    label: "Ending stream...",
    buttonState: "starting",
    viewerCount: 128,
    duration: 1500,
  },
};

const STATE_ORDER: DemoState[] = [
  "idle",
  "starting",
  "live-initial",
  "viewers-join",
  "chat-active",
  "peak-hype",
  "ending",
];

// =============================================================================
// Loading Spinner
// =============================================================================

function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" }) {
  const sizeClasses = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  return (
    <div
      className={`${sizeClasses} rounded-full border-2 border-white/30 border-t-white animate-spin`}
    />
  );
}

// =============================================================================
// Go Live Button
// =============================================================================

interface GoLiveButtonProps {
  state: "off" | "starting" | "live";
  showPulse?: boolean;
}

function GoLiveButton({ state, showPulse }: GoLiveButtonProps) {
  const isLive = showPulse && state === "live";

  return (
    <div className="relative">
      {/* Pulse ring when live - always render but animate visibility */}
      <AnimatePresence>
        {isLive && (
          <motion.div
            key="pulse-ring"
            className="absolute inset-0 rounded-lg bg-red-500 pointer-events-none"
            initial={{ opacity: 0, scale: 1 }}
            animate={{
              opacity: [0.5, 0],
              scale: [1, 1.25],
            }}
            exit={{ opacity: 0, scale: 1 }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeOut",
              repeatDelay: 0.3,
            }}
          />
        )}
      </AnimatePresence>
      <motion.div
        layout
        className={`
          relative px-4 h-[44px] sm:h-[52px] rounded-lg flex items-center justify-center gap-2 shrink-0 
          transition-colors duration-300 cursor-pointer
          ${
            state === "live"
              ? "bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
              : "bg-red-600/80 hover:bg-red-600"
          }
        `}
      >
        <AnimatePresence mode="wait">
          {state === "starting" ? (
            <motion.div
              key="spinner"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <LoadingSpinner />
            </motion.div>
          ) : state === "live" ? (
            <motion.div
              key="stop"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2"
            >
              <StopCircle className="w-5 h-5 text-white" />
              <span className="hidden sm:inline text-white font-medium text-sm">
                End Live
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="radio"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2"
            >
              <Radio className="w-5 h-5 text-white" />
              <span className="hidden sm:inline text-white font-medium text-sm">
                Go Live
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// =============================================================================
// Viewer Counter
// =============================================================================

interface ViewerCounterProps {
  count: number;
  isLive: boolean;
}

function ViewerCounter({ count, isLive }: ViewerCounterProps) {
  return (
    <AnimatePresence>
      {isLive && count > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-lg"
        >
          <Eye className="w-4 h-4 text-red-400" />
          <motion.span
            key={count}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white font-medium text-sm tabular-nums"
          >
            {count.toLocaleString()}
          </motion.span>
          <span className="text-white/60 text-sm hidden sm:inline">
            watching
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// Live Chat Overlay
// =============================================================================

interface LiveChatProps {
  messages: ChatMessage[];
  isVisible: boolean;
}

function LiveChat({ messages, isVisible }: LiveChatProps) {
  return (
    <AnimatePresence>
      {isVisible && messages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-20 right-4 w-64 sm:w-72 space-y-1.5 pointer-events-none"
        >
          {messages.map((msg, idx) => (
            <motion.div
              key={`${msg.id}-${idx}`}
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: msg.delay / 1000 }}
              className="flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-sm"
            >
              <span className="text-purple-400 font-medium shrink-0">
                {msg.user}
              </span>
              <span className="text-white/90 truncate">{msg.message}</span>
              {msg.emoji && <span className="shrink-0">{msg.emoji}</span>}
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// Live Badge
// =============================================================================

function LiveBadge({ isLive }: { isLive: boolean }) {
  return (
    <AnimatePresence>
      {isLive && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-red-600 rounded-md shadow-lg"
        >
          <motion.div
            className="w-2 h-2 bg-white rounded-full"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span className="text-white font-bold text-sm tracking-wide">
            LIVE
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// Reaction Burst
// =============================================================================

function ReactionBurst({ isActive }: { isActive: boolean }) {
  const reactions = [Heart, Flame, Zap, Users];

  return (
    <AnimatePresence>
      {isActive && (
        <div className="absolute bottom-24 left-4 pointer-events-none">
          {reactions.map((Icon, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 0, x: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: [-20 * idx, -60 - 30 * idx],
                x: [0, (idx % 2 === 0 ? 1 : -1) * (10 + idx * 5)],
                scale: [0, 1, 1, 0.5],
              }}
              transition={{
                duration: 2,
                delay: idx * 0.3,
                repeat: Infinity,
                repeatDelay: 1,
              }}
              className="absolute"
            >
              <Icon
                className={`w-5 h-5 ${
                  idx === 0
                    ? "text-red-500"
                    : idx === 1
                    ? "text-orange-500"
                    : idx === 2
                    ? "text-yellow-500"
                    : "text-purple-500"
                }`}
              />
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// Status Label
// =============================================================================

function StatusLabel({ label, isLive }: { label: string; isLive: boolean }) {
  return (
    <motion.div
      key={label}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`
        px-4 py-2 rounded-lg text-sm font-medium
        ${
          isLive
            ? "bg-red-500/20 text-red-300 border border-red-500/30"
            : "bg-white/10 text-white/80"
        }
      `}
    >
      {label}
    </motion.div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function GoLiveDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stateIndex, setStateIndex] = useState(0);
  const [isInView, setIsInView] = useState(false);

  const currentStateName = STATE_ORDER[stateIndex];
  const config = STATE_CONFIGS[currentStateName];
  const isLive = config.buttonState === "live";

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
      { threshold: 0.5 }
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

  return (
    <div ref={containerRef} className="w-full">
      {/* Browser mockup content area */}
      <div className="aspect-4/5 sm:aspect-16/10 bg-gray-900 flex flex-col relative overflow-hidden">
        {/* Blurred screenshot background */}
        <div className="absolute inset-0">
          <Image
            src="/marketing/battle-system/rapgpt-battle-stage.webp"
            alt="Battle stage"
            fill
            className="object-cover object-center blur-sm scale-105 brightness-50"
          />
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-gray-900/90" />

          {/* Live color overlay */}
          <AnimatePresence>
            {isLive && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-red-900/10"
              />
            )}
          </AnimatePresence>
        </div>

        {/* Live Badge */}
        <LiveBadge isLive={isLive} />

        {/* Viewer Counter */}
        <div className="absolute top-4 right-4 z-10">
          <ViewerCounter count={config.viewerCount} isLive={isLive} />
        </div>

        {/* Reaction Burst */}
        <ReactionBurst isActive={currentStateName === "peak-hype"} />

        {/* Live Chat */}
        <LiveChat
          messages={config.chatMessages || []}
          isVisible={isLive && !!config.chatMessages}
        />

        {/* Control Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-linear-to-t from-gray-900 via-gray-900/95 to-transparent pt-12">
          <div className="flex items-center justify-between gap-3 max-w-4xl mx-auto">
            {/* Status Label */}
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                <StatusLabel
                  key={currentStateName}
                  label={config.label}
                  isLive={isLive}
                />
              </AnimatePresence>
            </div>

            {/* Go Live Button */}
            <GoLiveButton
              state={config.buttonState}
              showPulse={config.showPulse}
            />
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
              backgroundColor:
                idx === stateIndex
                  ? "#ef4444" // red-500 to match Go Live theme
                  : "#374151", // gray-700
            }}
          />
        ))}
      </div>
    </div>
  );
}
