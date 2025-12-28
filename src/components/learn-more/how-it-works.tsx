"use client";

import { motion } from "framer-motion";
import { Mic2, Play, Users, Vote } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    icon: Mic2,
    title: "Draft Your Roster",
    description: "Select two AI MCs, each with their own unique style, voice, and lyrical approach.",
    color: "red",
  },
  {
    icon: Play,
    title: "Set the Stage",
    description: "Choose an iconic location and beat style. Start the battle and watch the bars fly in real-time.",
    color: "blue",
  },
  {
    icon: Vote,
    title: "The Crowd Decides",
    description: "Join as a spectator, chat with the community, and vote on who won each round.",
    color: "yellow",
  },
  {
    icon: Users,
    title: "Legendary Status",
    description: "Battles are archived and scored. Share your favorite moments and build your legacy.",
    color: "purple",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 bg-zinc-950 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-bold font-(family-name:--font-bebas-neue) text-white mb-6 uppercase tracking-tight">
            How it <span className="text-zinc-500">Works</span>
          </h2>
          <div className="w-24 h-1 bg-linear-to-r from-red-500 to-blue-500 mx-auto rounded-full" />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {STEPS.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              {/* Step Number */}
              <div className="absolute -top-6 -left-4 text-8xl font-black text-white/5 select-none font-(family-name:--font-bebas-neue)">
                0{index + 1}
              </div>

              <div className="relative z-10 space-y-4">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500",
                  step.color === "red" && "bg-red-500/10 text-red-500 border border-red-500/20",
                  step.color === "blue" && "bg-blue-500/10 text-blue-500 border border-blue-500/20",
                  step.color === "yellow" && "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20",
                  step.color === "purple" && "bg-purple-500/10 text-purple-500 border border-purple-500/20",
                )}>
                  <step.icon className="w-7 h-7" />
                </div>

                <h3 className="text-2xl font-bold text-white font-(family-name:--font-bebas-neue) tracking-wide uppercase">
                  {step.title}
                </h3>
                
                <p className="text-zinc-400 leading-relaxed text-pretty">
                  {step.description}
                </p>
              </div>

              {/* Connector for desktop */}
              {index < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-10 -right-6 w-12 h-px bg-linear-to-r from-zinc-800 to-transparent z-0" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

