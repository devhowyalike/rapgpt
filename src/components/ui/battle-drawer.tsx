"use client";

import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { X } from "lucide-react";
import { type ReactNode, useEffect } from "react";

interface BattleDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  /**
   * If true, excludes the bottom button area from the overlay
   * to allow bottom controls to remain clickable
   */
  excludeBottomControls?: boolean;
  /**
   * If true, drawer only appears on mobile (hidden on desktop)
   * If false, drawer appears on all screen sizes
   */
  mobileOnly?: boolean;
}

export function BattleDrawer({
  open,
  onOpenChange,
  title,
  children,
  excludeBottomControls = false,
  mobileOnly = true,
}: BattleDrawerProps) {
  const dragControls = useDragControls();

  // Close on Escape key like typical drawers/dialogs
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  return (
    <>
      {/* Animated Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            className={`fixed top-0 left-0 right-0 bg-black/60 backdrop-blur-sm z-40 ${
              mobileOnly ? "lg:hidden" : ""
            }`}
            style={
              excludeBottomControls
                ? { bottom: "var(--bottom-controls-height)" }
                : { bottom: 0 }
            }
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            onClick={() => onOpenChange(false)}
          />
        )}
      </AnimatePresence>

      {/* Content Drawer - Always mounted, never unmounted, all breakpoints */}
      <motion.div
        className={`fixed inset-x-0 z-50 bg-gray-900 border-t border-gray-800 rounded-t-2xl shadow-2xl max-h-[70vh] flex flex-col overflow-hidden max-w-3xl mx-auto ${
          mobileOnly ? "lg:hidden" : ""
        } ${!open ? "pointer-events-none" : "pointer-events-auto"}`}
        style={
          excludeBottomControls
            ? { bottom: "var(--bottom-controls-height)" }
            : { bottom: 0 }
        }
        initial={{ y: "100%" }}
        animate={{ y: open ? 0 : "100%" }}
        transition={{
          duration: 0.3,
          ease: [0.32, 0.72, 0, 1],
        }}
        drag={open ? "y" : false}
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0 }}
        dragElastic={{ top: 0, bottom: 0.2 }}
        dragMomentum={false}
        onDragEnd={(_, info) => {
          // Close drawer if swiped down past threshold or with sufficient velocity
          const shouldClose = info.offset.y > 100 || info.velocity.y > 500;
          if (shouldClose) {
            onOpenChange(false);
          }
        }}
      >
        {/* Swipe Handle - only show when open */}
        {open && (
          <div
            className="flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing touch-none"
            onPointerDown={(e) => dragControls.start(e)}
          >
            <div className="w-12 h-1 bg-gray-700 rounded-full" />
          </div>
        )}
        {/* Header - only show when open */}
        {open && (
          <div
            className="flex items-center justify-between px-4 pb-4 border-b border-gray-800 cursor-grab active:cursor-grabbing touch-none"
            onPointerDown={(e) => {
              // Don't start drag if clicking the close button
              if ((e.target as HTMLElement).closest("button")) {
                return;
              }
              dragControls.start(e);
            }}
          >
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <button
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        )}
        {/* Children - always mounted */}
        {children}
      </motion.div>
    </>
  );
}
