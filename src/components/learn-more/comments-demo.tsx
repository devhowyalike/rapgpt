"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

// =============================================================================
// Types & Data
// =============================================================================

type DemoState =
  | "idle"
  | "first-comment"
  | "second-comment"
  | "third-comment"
  | "fourth-comment"
  | "fifth-comment"
  | "reset";

interface StateConfig {
  label: string;
  duration: number;
  visibleComments: number;
}

interface Comment {
  id: number;
  user: string;
  message: string;
  avatar: string;
  color: string;
}

const COMMENTS: Comment[] = [
  {
    id: 1,
    user: "DJ_Spinz",
    message: "That bar was crazy! 🔥",
    avatar: "🎧",
    color: "text-purple-400",
  },
  {
    id: 2,
    user: "BeatMaster",
    message: "Dawn going OFF right now",
    avatar: "🎹",
    color: "text-blue-400",
  },
  {
    id: 3,
    user: "RhymeTime",
    message: "The wordplay is insane",
    avatar: "📝",
    color: "text-green-400",
  },
  {
    id: 4,
    user: "HipHopHead",
    message: "Shock G needs to step it up!",
    avatar: "🎤",
    color: "text-orange-400",
  },
  {
    id: 5,
    user: "VerseFiend",
    message: "THIS IS A BODY BAG 💀",
    avatar: "💯",
    color: "text-red-400",
  },
];

const STATE_CONFIGS: Record<DemoState, StateConfig> = {
  idle: {
    label: "Join the conversation...",
    duration: 1500,
    visibleComments: 0,
  },
  "first-comment": {
    label: "",
    duration: 1200,
    visibleComments: 1,
  },
  "second-comment": {
    label: "",
    duration: 1200,
    visibleComments: 2,
  },
  "third-comment": {
    label: "",
    duration: 1200,
    visibleComments: 3,
  },
  "fourth-comment": {
    label: "",
    duration: 1200,
    visibleComments: 4,
  },
  "fifth-comment": {
    label: "",
    duration: 2000,
    visibleComments: 5,
  },
  reset: {
    label: "",
    duration: 800,
    visibleComments: 0,
  },
};

const STATE_ORDER_WITH_LOADING: DemoState[] = [
  "idle",
  "first-comment",
  "second-comment",
  "third-comment",
  "fourth-comment",
  "fifth-comment",
  "reset",
];

const STATE_ORDER_WITHOUT_LOADING: DemoState[] = [
  "first-comment",
  "second-comment",
  "third-comment",
  "fourth-comment",
  "fifth-comment",
  "reset",
];

// =============================================================================
// Comment Item
// =============================================================================

interface CommentItemProps {
  comment: Comment;
  index: number;
  isMobile: boolean;
}

function CommentItem({ comment, index, isMobile }: CommentItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className={`flex items-start gap-2 ${
        isMobile ? "p-2" : "p-2.5"
      } bg-gray-800/50 rounded-lg`}
    >
      {/* Avatar */}
      <div
        className={`${
          isMobile ? "w-7 h-7 text-sm" : "w-8 h-8 text-base"
        } rounded-full bg-gray-700 flex items-center justify-center shrink-0`}
      >
        {comment.avatar}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <span
          className={`${isMobile ? "text-[11px]" : "text-xs"} font-semibold ${
            comment.color
          }`}
        >
          {comment.user}
        </span>
        <p
          className={`${
            isMobile ? "text-[11px]" : "text-xs"
          } text-gray-200 mt-0.5`}
        >
          {comment.message}
        </p>
      </div>
    </motion.div>
  );
}

// =============================================================================
// Comment Input
// =============================================================================

function CommentInput({ isMobile }: { isMobile: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 ${
        isMobile ? "p-2" : "p-3"
      } bg-gray-800/50 border-t border-gray-700`}
    >
      <div
        className={`flex-1 ${
          isMobile ? "px-2 py-1.5 text-[11px]" : "px-3 py-2 text-xs"
        } bg-gray-700/50 rounded-lg text-gray-500`}
      >
        Add a comment...
      </div>
      <button
        className={`${
          isMobile ? "p-1.5" : "p-2"
        } bg-blue-600 rounded-lg text-white`}
      >
        <Send className={isMobile ? "w-3 h-3" : "w-4 h-4"} />
      </button>
    </div>
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
  const visibleComments = COMMENTS.slice(0, config.visibleComments);

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

      {/* Loading State */}
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
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30"
            >
              {config.label}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comments Panel */}
      <AnimatePresence>
        {config.visibleComments > 0 && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 rounded-t-2xl"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-800">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold text-white">
                Live Chat
              </span>
            </div>

            {/* Comments List */}
            <div
              className="h-48 overflow-y-auto p-2 flex flex-col-reverse gap-1.5"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <div className="flex flex-col gap-1.5">
                {visibleComments.map((comment, index) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    index={index}
                    isMobile={true}
                  />
                ))}
              </div>
            </div>

            {/* Input */}
            <CommentInput isMobile={true} />
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
  const visibleComments = COMMENTS.slice(0, config.visibleComments);

  return (
    <div className="absolute inset-0 flex">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="/marketing/battle-system/rapgpt-battle-stage.webp"
          alt="Battle stage"
          fill
          className="object-cover object-center blur-sm scale-105 brightness-50"
        />
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-transparent to-gray-900/80" />
      </div>

      {/* Loading State */}
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

      {/* Comments Sidebar */}
      <AnimatePresence>
        {config.visibleComments > 0 && (
          <motion.div
            className="absolute right-0 top-0 bottom-0 w-72 bg-gray-900/95 backdrop-blur-sm border-l border-gray-800 flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-semibold text-white">
                Live Chat
              </span>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-hidden p-3 space-y-2">
              {visibleComments.map((comment, index) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  index={index}
                  isMobile={false}
                />
              ))}
            </div>

            {/* Input */}
            <CommentInput isMobile={false} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

interface CommentsDemoProps {
  loadingScreen?: "enabled" | "disabled";
  isActive?: boolean;
}

export function CommentsDemo({ loadingScreen = "disabled", isActive = true }: CommentsDemoProps) {
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
