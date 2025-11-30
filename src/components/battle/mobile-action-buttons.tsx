/**
 * Mobile floating action buttons for comments and voting with a fan effect
 */

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, Plus, Settings, ThumbsUp, X } from "lucide-react";
import { useState } from "react";
import type { DrawerTab } from "@/lib/hooks/use-mobile-drawer";

interface MobileActionButtonsProps {
  showCommenting: boolean;
  showVoting: boolean;
  onCommentsClick: () => void;
  onVotingClick: () => void;
  activeTab?: DrawerTab;
  isDrawerOpen?: boolean;
  bottomOffset?: string;
  className?: string;
  settingsAction?: React.ReactNode;
  customActions?: Array<{
    id: string;
    component: React.ReactNode;
    label?: string;
  }>;
  isFixed?: boolean;
  alignment?: "center" | "right";
}

interface ActionItem {
  id: string;
  component: React.ReactNode;
  label?: string;
}

export function MobileActionButtons({
  showCommenting,
  showVoting,
  onCommentsClick,
  onVotingClick,
  activeTab,
  isDrawerOpen = false,
  bottomOffset,
  className = "",
  settingsAction,
  customActions = [],
  isFixed = true,
  alignment = "center",
}: MobileActionButtonsProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Collect all available actions
  const rawActions: (ActionItem | null | false | undefined)[] = [
    ...customActions,
    settingsAction
      ? {
          id: "settings",
          component: settingsAction,
          label: "Settings",
        }
      : null,
    showCommenting
      ? {
          id: "comments",
          label: "Comments",
          component: (
            <button
              onClick={(e) => {
                onCommentsClick();
                setIsOpen(false);
              }}
              className={`
            w-14 h-14 rounded-full shadow-xl transition-all border-2 flex items-center justify-center backdrop-blur-md
            ${
              isDrawerOpen && activeTab === "comments"
                ? "bg-blue-600/90 text-white border-blue-400/50"
                : "bg-gray-800/80 text-gray-300 border-gray-700/50 hover:bg-blue-600/90 hover:text-white hover:border-blue-500/50"
            }
          `}
              aria-label="Open Comments"
            >
              <MessageSquare className="w-6 h-6" strokeWidth={2.5} />
            </button>
          ),
        }
      : null,
    showVoting
      ? {
          id: "voting",
          label: "Vote",
          component: (
            <button
              onClick={(e) => {
                onVotingClick();
                setIsOpen(false);
              }}
              className={`
            w-14 h-14 rounded-full shadow-xl transition-all border-2 flex items-center justify-center backdrop-blur-md
            ${
              isDrawerOpen && activeTab === "voting"
                ? "bg-purple-600/90 text-white border-purple-400/50"
                : "bg-gray-800/80 text-gray-300 border-gray-700/50 hover:bg-purple-600/90 hover:text-white hover:border-purple-500/50"
            }
          `}
              aria-label="Open Voting"
            >
              <ThumbsUp className="w-6 h-6" strokeWidth={2.5} />
            </button>
          ),
        }
      : null,
  ];

  const actions = rawActions.filter((action): action is ActionItem =>
    Boolean(action)
  );

  if (actions.length === 0) {
    return null;
  }

  // Calculate positions for vertical column
  const getPosition = (index: number) => {
    // Stack upwards with a gap
    // Button size is roughly 56px (w-14). Let's use 64px spacing.
    const step = 64;
    return {
      x: 0,
      y: -(step * (index + 1)),
    };
  };

  return (
    <>
      {/* Backdrop to close when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/80 backdrop-blur-[2px]"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`
          ${isFixed ? "fixed left-1/2 -translate-x-1/2" : "relative"} 
          flex items-end justify-center z-40 
          ${isFixed ? "md:hidden" : ""} 
          ${className}
        `}
        style={
          isFixed && bottomOffset
            ? { bottom: bottomOffset }
            : isFixed
            ? { bottom: "1.5rem" }
            : undefined
        }
      >
        <div className="relative">
          <AnimatePresence>
            {isOpen &&
              actions.map((action, index) => {
                const pos = getPosition(index);
                return (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, y: 0, scale: 0.5 }}
                    animate={{
                      opacity: 1,
                      x: pos.x,
                      y: pos.y,
                      scale: 1,
                    }}
                    exit={{ opacity: 0, y: 0, scale: 0.5 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                      delay: index * 0.05,
                    }}
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-14 flex items-center justify-center"
                    // Ensure button click events pass through
                    style={{ transformOrigin: "center center" }}
                  >
                    {action.label && (
                      <div className="absolute right-full mr-3 px-3 py-1.5 bg-black/80 text-white text-sm font-medium rounded-lg whitespace-nowrap backdrop-blur-md border border-white/10 shadow-lg pointer-events-none">
                        {action.label}
                      </div>
                    )}
                    {action.component}
                  </motion.div>
                );
              })}
          </AnimatePresence>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`
              w-12 h-12 rounded-full shadow-xl transition-colors border-2 flex items-center justify-center backdrop-blur-md relative z-50
              ${
                isOpen
                  ? "bg-gray-700 text-white border-gray-600 rotate-90"
                  : "bg-gray-900 text-white border-gray-700 hover:scale-105"
              }
            `}
            style={{ transition: "all 0.3s ease" }}
            aria-label={isOpen ? "Close Menu" : "Open Menu"}
          >
            {/* Icon rotation handled by parent button rotation or swapping icons */}
            <motion.div
              initial={false}
              animate={{ rotate: isOpen ? 45 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <Plus className="w-6 h-6" strokeWidth={2.5} />
            </motion.div>
          </button>
        </div>
      </div>
    </>
  );
}
