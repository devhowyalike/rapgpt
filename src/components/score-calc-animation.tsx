"use client";

import { motion } from "framer-motion";

export function ScoreCalcAnimation() {
  return (
    <div className="flex items-center gap-1 h-5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 bg-white rounded-full"
          initial={{ height: "40%" }}
          animate={{
            height: ["40%", "100%", "40%"],
            backgroundColor: [
              "rgba(255, 255, 255, 0.5)",
              "rgba(255, 255, 255, 1)",
              "rgba(255, 255, 255, 0.5)",
            ],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
