"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { MobileFanHint } from "./mobile-fan-hint";

export interface MobileFanButtonAction {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  /** Custom variant for special styling (e.g., "danger" for red) */
  variant?: "default" | "danger";
}

interface MobileFanButtonProps {
  actions: MobileFanButtonAction[];
  className?: string;
  variant?: "floating" | "inline";
  bottomOffset?: string;
  hint?: string;
}

/**
 * Lightweight floating action button fan used on mobile.
 * Consumers supply explicit actions so this component stays decoupled
 * from battle-specific layout spacing concerns.
 */
export function MobileFanButton({
  actions,
  className = "",
  variant = "inline",
  bottomOffset,
  hint,
}: MobileFanButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const enabledActions = useMemo(
    () => actions.filter((action) => !action.disabled),
    [actions]
  );

  if (enabledActions.length === 0) {
    return null;
  }

  const isFloating = variant === "floating";
  const containerClass = [
    "relative z-40 flex items-end justify-center",
    isFloating ? "fixed left-1/2 -translate-x-1/2 xl:hidden" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="fan-overlay"
            className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm xl:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <div
        className={containerClass}
        style={
          isFloating
            ? {
                bottom: bottomOffset ?? "1.5rem",
              }
            : undefined
        }
      >
        <div className="relative">
          <AnimatePresence>
            {isOpen &&
              enabledActions.map((action, index) => {
                const offset = 64 * (index + 1);
                return (
                  <motion.button
                    key={action.id}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: -offset, scale: 0.5 }}
                    animate={{ opacity: 1, y: -offset, scale: 1 }}
                    exit={{ opacity: 0, y: -offset, scale: 0.5 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      action.onClick();
                      setIsOpen(false);
                    }}
                    className={`absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full border backdrop-blur-md shadow-lg flex items-center justify-center text-white ${
                      action.variant === "danger"
                        ? "bg-red-600 border-red-500 hover:bg-red-700"
                        : action.isActive
                        ? "bg-blue-600 border-blue-400"
                        : "bg-gray-900/90 border-gray-700 hover:bg-gray-800"
                    }`}
                    aria-label={action.label}
                  >
                    {action.icon}
                    <span className="sr-only">{action.label}</span>
                    <span className="pointer-events-none absolute right-full mr-2 whitespace-nowrap rounded-md bg-black/70 px-2 py-1 text-xs text-white shadow-lg">
                      {action.label}
                    </span>
                  </motion.button>
                );
              })}
          </AnimatePresence>

          <button
            type="button"
            onClick={() => {
              setIsOpen((prev) => !prev);
              setHasInteracted(true);
            }}
            className={`w-(--control-button-height) h-(--control-button-height) rounded-full border-2 border-gray-700 bg-gray-900 text-white shadow-xl flex items-center justify-center transition-transform ${
              isOpen ? "rotate-45" : "hover:scale-105"
            }`}
            aria-label={isOpen ? "Close actions" : "Open actions"}
          >
            <Plus className="w-6 h-6" strokeWidth={2.5} />
          </button>

          <MobileFanHint
            text={hint || ""}
            isVisible={!isOpen && !hasInteracted && !!hint}
          />
        </div>
      </div>
    </>
  );
}
