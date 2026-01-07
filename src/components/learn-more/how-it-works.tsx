"use client";

import { motion } from "framer-motion";
import { Mic2, Music2, Play, Vote } from "lucide-react";
import Link from "next/link";
import { GridBackground } from "@/components/grid-background";

const STEPS: {
  icon: any;
  title: React.ReactNode;
  description: React.ReactNode;
  color: string;
  bg: string;
}[] = [
  {
    icon: Mic2,
    title: (
      <>
        Choose Your MC<span className="text-[0.7em] lowercase">s</span>
      </>
    ),
    description: (
      <>
        Select two AI MCs from a{" "}
        <Link href="/roster" className="underline">
          growing roster
        </Link>
        , each with their own unique style and voice.
      </>
    ),
    color: "text-red-400",
    bg: "bg-red-500/10",
  },
  {
    icon: Play,
    title: "Set the Stage",
    description:
      "Choose an iconic location to battle in. Watch the bars stream in real-time.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Vote,
    title: "The Crowd Decides",
    description:
      "Join as a spectator, chat with the community, and vote on who won each round.",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
  },
  {
    icon: Music2,
    title: "Make it a song",
    description:
      "Turn your battle into a full track with AI-generated beats and vocals. Download and share.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
];

export function HowItWorks() {
  return (
    <section className="pt-8 pb-8 px-4 relative overflow-hidden bg-black border-none">
      {/* Background Elements - matching homepage */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-linear-to-l from-red-500/5 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/3 h-full bg-linear-to-r from-blue-500/5 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-10 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-4 px-6 pt-3 pb-2 md:px-8 md:pt-4 md:pb-3 rounded-full bg-yellow-500/10 border border-yellow-500/20 mb-8 group hover:bg-yellow-500/20 transition-colors"
          >
            <h2 className="text-3xl md:text-6xl font-bold font-(family-name:--font-bebas-neue) text-white leading-none tracking-tight uppercase">
              How it <span className="text-yellow-400">Works</span>
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto text-pretty"
          >
            From the stage to the studio in four simple steps.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {STEPS.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * index }}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors group flex flex-col items-center text-center md:items-start md:text-left relative overflow-hidden"
            >
              <GridBackground intensity="subtle" />

              {/* Step Number */}
              <div className="absolute -top-2 -right-2 text-7xl font-black text-white/5 select-none font-(family-name:--font-bebas-neue)">
                0{index + 1}
              </div>

              <div className="flex flex-col md:flex-row items-center gap-4 mb-4 relative z-10">
                <div
                  className={`p-2.5 rounded-xl ${step.bg} ${step.color} shrink-0 group-hover:scale-110 transition-transform`}
                >
                  <step.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white font-(family-name:--font-bebas-neue) tracking-wide uppercase">
                  {step.title}
                </h3>
              </div>
              <p className="text-gray-400 leading-relaxed text-pretty relative z-10">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
