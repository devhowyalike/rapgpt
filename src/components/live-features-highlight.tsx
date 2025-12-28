"use client";

import { motion } from "framer-motion";
import { MessageSquare, Radio, Trophy, Zap } from "lucide-react";
import { CreateBattleCTA } from "./create-battle-cta";

interface LiveFeaturesHighlightProps {
  isAuthenticated: boolean;
}

export function LiveFeaturesHighlight({
  isAuthenticated,
}: LiveFeaturesHighlightProps) {
  const features = [
    {
      icon: <Radio className="w-6 h-6" />,
      title: "Watch Together",
      description: "Verses appear word-by-word as the battle unfolds.",
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Interactive Voting",
      description:
        "Participants vote after each round to impact the battle's outcome.",
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Live Chat & Reactions",
      description: "Join the crowd in the chatroom as the beef unfolds.",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      title: "Admin Control Panel",
      description:
        "As a host, you're in control. Start, stop, and control the battle's flow.",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <section className="pt-8 pb-16 px-4 relative overflow-hidden bg-black border-none">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-linear-to-l from-red-500/5 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/3 h-full bg-linear-to-r from-blue-500/5 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium mb-6"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span>Stream Live</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold font-(family-name:--font-bebas-neue) text-white leading-tight mb-6"
          >
            Take the Battle <span className="text-red-500">Live</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto text-pretty"
          >
            Stream your battles in real-time for anyone to join.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * index }}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={`p-2.5 rounded-xl ${feature.bg} ${feature.color} shrink-0 group-hover:scale-110 transition-transform`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white font-(family-name:--font-bebas-neue) tracking-wide uppercase">
                  {feature.title}
                </h3>
              </div>
              <p className="text-gray-400 leading-relaxed text-pretty">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-6 p-8 rounded-3xl bg-linear-to-r from-red-500/10 via-purple-500/10 to-blue-500/10 border border-white/10">
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-12 h-12 rounded-full border-2 border-black bg-gray-800 overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-linear-to-br from-gray-700 to-gray-900 flex items-center justify-center text-xs font-bold text-white">
                    MC {i}
                  </div>
                </div>
              ))}
              <div className="w-12 h-12 rounded-full border-2 border-black bg-red-500 flex items-center justify-center text-xs font-bold text-white z-10">
                +84
              </div>
            </div>
            <div className="text-left">
              <div className="text-white font-bold text-lg">
                Step in the Arena
              </div>
              <div className="text-gray-400 text-sm">Try it out for free</div>
            </div>
            <CreateBattleCTA
              isAuthenticated={isAuthenticated}
              title="Start Live Battle"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
