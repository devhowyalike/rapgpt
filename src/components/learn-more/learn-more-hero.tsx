"use client";

import { motion } from "framer-motion";
import { Lightbulb, Mic2, Music, Zap } from "lucide-react";

export function LearnMoreHero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-black">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />
        </div>
        <div className="absolute inset-0 bg-[url('/assets/grid.svg')] bg-center mask-[linear-gradient(to_bottom,transparent,white_20%,white_80%,transparent)] opacity-20 pointer-events-none" />
      </div>

      <div className="container mx-auto px-4 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8"
        >
          <Lightbulb className="w-4 h-4 text-yellow-400" />
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
            Inside the Arena
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mb-6"
        >
          <h1 className="text-5xl md:text-8xl font-bold font-(family-name:--font-bebas-neue) text-white tracking-tight leading-[0.9] uppercase">
            Elevating the <span className="text-transparent bg-clip-text bg-linear-to-r from-white via-zinc-400 to-zinc-600">Art of Beef</span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-2xl text-zinc-400 max-w-3xl mx-auto leading-relaxed mb-12 text-pretty"
        >
          RapGPT isn't just a generator. It's a live-streaming, 
          community-driven AI battle arena where flows collide and legends are born.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-8 md:gap-16"
        >
          {[
            { icon: Mic2, label: "AI Flows", color: "text-red-500" },
            { icon: Music, label: "Studio Quality", color: "text-green-500" },
            { icon: Zap, label: "Live Events", color: "text-yellow-500" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <item.icon className={`w-5 h-5 ${item.color}`} />
              <span className="text-sm font-bold text-white uppercase tracking-wider">
                {item.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

