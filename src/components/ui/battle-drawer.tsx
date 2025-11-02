"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { type ReactNode } from "react";

interface BattleDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  /**
   * Control visibility at different breakpoints
   * - "mobile-only": Only show on mobile (md:hidden) - default
   * - "all": Show on all breakpoints
   */
  breakpoint?: "mobile-only" | "all";
  /**
   * If true, excludes the bottom button area from the overlay
   * to allow bottom controls to remain clickable
   */
  excludeBottomControls?: boolean;
}

export function BattleDrawer({
  open,
  onOpenChange,
  title,
  children,
  breakpoint = "mobile-only",
  excludeBottomControls = false,
}: BattleDrawerProps) {
  const hideOnDesktop = breakpoint === "mobile-only" ? "md:hidden" : "";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            {/* Animated Overlay */}
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className={`fixed top-0 left-0 right-0 bg-black/60 backdrop-blur-sm z-40 ${hideOnDesktop}`}
                style={
                  excludeBottomControls
                    ? { bottom: "var(--bottom-controls-height)" }
                    : { bottom: 0 }
                }
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              />
            </Dialog.Overlay>

            {/* Animated Content */}
            <Dialog.Content asChild forceMount>
              <motion.div
                className={`fixed inset-x-0 z-50 bg-gray-900 border-t border-gray-800 rounded-t-2xl shadow-2xl max-h-[70vh] flex flex-col ${hideOnDesktop}`}
                style={
                  excludeBottomControls
                    ? { bottom: "var(--bottom-controls-height)" }
                    : { bottom: 0 }
                }
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{
                  duration: 0.3,
                  ease: [0.32, 0.72, 0, 1], // Custom ease-out curve
                }}
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                  <Dialog.Title className="text-lg font-bold text-white">
                    {title}
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="text-gray-400 hover:text-white transition-colors">
                      <X size={24} />
                    </button>
                  </Dialog.Close>
                </div>
                {children}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
