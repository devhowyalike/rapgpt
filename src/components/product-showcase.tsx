"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { Mic2, Flame, Users, Sparkles, Trophy, Zap } from "lucide-react";
import { useRef } from "react";

export function ProductShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const rotate = useTransform(scrollYProgress, [0, 0.5, 1], [2, 0, -2]);

  return (
    <section
      ref={containerRef}
      className="bg-stage-dark pt-24 pb-32 relative overflow-hidden border-y border-white/5"
    >
      {/* Dynamic Background Atmosphere */}
      <motion.div
        style={{ y: y1 }}
        className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none z-0"
      />
      <motion.div
        style={{ y: y2 }}
        className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none z-0"
      />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-12 gap-16 items-center">
          {/* Left: Content and Context */}
          <div className="lg:col-span-5 space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest">
                <Zap className="w-3 h-3 fill-current" />
                <span>Real-time Generation</span>
              </div>

              <h2 className="text-5xl md:text-7xl font-bold font-(family-name:--font-bebas-neue) text-white leading-none">
                Experience the <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-red-500 via-purple-500 to-blue-500">
                  Future of Rap
                </span>
              </h2>

              <p className="text-xl text-zinc-400 leading-relaxed max-w-lg">
                Witness AI-driven flows that adapt, respond, and evolve. Our
                neural engine generates bar-for-bar heat in real-time.
              </p>

              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white font-bold font-(family-name:--font-bebas-neue) text-xl uppercase tracking-wide">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span>Ranked</span>
                  </div>
                  <p className="text-sm text-zinc-500">
                    Climb the leaderboards with your created tracks.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white font-bold font-(family-name:--font-bebas-neue) text-xl uppercase tracking-wide">
                    <Users className="w-5 h-5 text-blue-500" />
                    <span>Social</span>
                  </div>
                  <p className="text-sm text-zinc-500">
                    Join live rooms and impact the battle flow.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: The Showcase Mockup */}
          <div className="lg:col-span-7 perspective-1000">
            <motion.div
              style={{ rotateY: rotate, rotateX: rotate }}
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative group"
            >
              {/* Outer Glow */}
              <div className="absolute -inset-1 bg-linear-to-r from-red-500/20 via-purple-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-2xl transition-all duration-700 group-hover:border-white/20">
                {/* Browser Controls */}
                <div className="h-12 bg-zinc-900/90 border-b border-white/5 flex items-center px-6 gap-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-zinc-800 group-hover:bg-red-500 transition-colors duration-500" />
                    <div className="w-3 h-3 rounded-full bg-zinc-800 group-hover:bg-yellow-500 transition-colors duration-500 delay-75" />
                    <div className="w-3 h-3 rounded-full bg-zinc-800 group-hover:bg-green-500 transition-colors duration-500 delay-150" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] text-zinc-500 font-medium font-mono tracking-tight">
                      app.rapgpt.io/arena/live-session
                    </div>
                  </div>
                </div>

                {/* Screenshot with Scanline Effect */}
                <div className="relative aspect-[16/10] overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_4px,3px_100%] pointer-events-none z-20" />
                  <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.6)] z-10 pointer-events-none" />
                  <Image
                    src="/marketing/rap-gpt-screenshot.webp"
                    alt="RapGPT Platform Screenshot"
                    fill
                    className="object-cover transition-transform duration-1000 group-hover:scale-[1.05]"
                    priority
                  />
                </div>
              </div>

              {/* Floating UI Badges */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-6 -right-6 p-4 bg-zinc-900/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl z-30 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">
                    Heat Index
                  </div>
                  <div className="text-lg font-bold text-white font-(family-name:--font-bebas-neue) leading-none">
                    98.4%
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
                className="absolute -bottom-8 -left-8 p-4 bg-zinc-900/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl z-30 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-500">
                  <Mic2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">
                    Neural Flow
                  </div>
                  <div className="text-lg font-bold text-white font-(family-name:--font-bebas-neue) leading-none">
                    Active
                  </div>
                </div>
              </motion.div>

              {/* Background Accent Lines */}
              <div className="absolute -top-20 -left-20 w-40 h-40 border border-white/5 rounded-full pointer-events-none" />
              <div className="absolute -bottom-20 -right-20 w-60 h-60 border border-white/5 rounded-full pointer-events-none" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
