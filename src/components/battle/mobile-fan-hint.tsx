"use client";

import { AnimatePresence, motion } from "framer-motion";

interface MobileFanHintProps {
  text: string;
  isVisible: boolean;
}

export function MobileFanHint({ text, isVisible }: MobileFanHintProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          className="absolute bottom-full mb-3 right-0 w-max max-w-[200px] origin-bottom-right"
        >
          <div className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-red-500 flex flex-col items-end">
            {text}
            <div className="absolute -bottom-1 right-[calc(var(--control-button-height)/2-4px)] w-2 h-2 bg-red-600 rotate-45 border-r border-b border-red-500" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
