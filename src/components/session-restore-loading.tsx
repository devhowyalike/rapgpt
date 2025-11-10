"use client";

import { motion } from "framer-motion";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface SessionRestoreLoadingProps {
  /**
   * The title text to display. Defaults to "Restoring Battle"
   */
  title?: string;
  /**
   * The subtitle text to display. Defaults to "Loading your previous selections..."
   */
  subtitle?: string;
}

/**
 * Loading screen shown when restoring data from sessionStorage.
 * Displays a spinner with customizable title and subtitle text.
 */
export function SessionRestoreLoading({
  title = "Restoring Battle",
  subtitle = "Loading your previous selections...",
}: SessionRestoreLoadingProps) {
  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center bg-linear-to-b from-gray-950 via-gray-900 to-gray-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <div className="mb-6">
          <LoadingSpinner size="2xl" variant="highlight" className="inline-block" />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-yellow-400 mb-2 uppercase">
          {title}
        </h2>
        <p className="text-gray-400 text-sm md:text-base">{subtitle}</p>
      </motion.div>
    </div>
  );
}

