"use client";

import { motion } from "framer-motion";
import { APP_TITLE } from "@/lib/constants";

export function FeaturesHeader() {
  return (
    <div className="container mx-auto px-4 text-center mb-8 md:mb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="inline-flex items-center gap-4 px-6 pt-3 pb-2 md:px-8 md:pt-4 md:pb-3 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8 group hover:bg-blue-500/20 transition-colors"
      >
        <h2 className="text-3xl md:text-6xl font-bold font-(family-name:--font-bebas-neue) text-white leading-none tracking-tight uppercase">
          <span className="text-blue-500">Features</span>
        </h2>
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="text-gray-400 max-w-2xl mx-auto text-lg text-pretty"
      >
        Explore the {APP_TITLE} interface and features.
      </motion.p>
    </div>
  );
}

