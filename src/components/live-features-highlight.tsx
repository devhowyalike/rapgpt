"use client";

import { motion } from "framer-motion";
import { MessageSquare, Radio, Trophy, Zap } from "lucide-react";
import { CreateBattleCTA } from "./create-battle-cta";
import { FeatureCard, type FeatureCardColor } from "./feature-card";

interface LiveFeaturesHighlightProps {
  isAuthenticated: boolean;
}

export function LiveFeaturesHighlight({
  isAuthenticated,
}: LiveFeaturesHighlightProps) {
  const features: {
    icon: React.ReactNode;
    title: string;
    description: string;
    color: FeatureCardColor;
  }[] = [
    {
      icon: <Radio className="w-6 h-6" />,
      title: "Watch Together",
      description: "Verses appear word-by-word as the battle unfolds.",
      color: "red",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Voting",
      description:
        "Viewers can vote after each round to impact the battle's outcome.",
      color: "yellow",
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Live Chat",
      description: "Join the crowd in the chatroom as the beef unfolds.",
      color: "blue",
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      title: "Admin Panel",
      description: "As the host, you control the flow of the battle.",
      color: "purple",
    },
  ];

  return (
    <section className="pt-16 pb-10 px-4 relative overflow-hidden bg-black border-none">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-linear-to-l from-red-500/5 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/3 h-full bg-linear-to-r from-blue-500/5 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-4 px-6 pt-3 pb-2 md:px-8 md:pt-4 md:pb-3 rounded-full bg-red-500/10 border border-red-500/20 mb-8 group hover:bg-red-500/20 transition-colors"
          >
            <span className="relative flex h-3 w-3 md:h-4 md:w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 md:h-4 md:w-4 bg-red-500"></span>
            </span>
            <h2 className="text-3xl md:text-6xl font-bold font-(family-name:--font-bebas-neue) text-white leading-none tracking-tight uppercase">
              Take the Battle <span className="text-red-500">Live</span>
            </h2>
          </motion.div>

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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * index }}
            >
              <FeatureCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                color={feature.color}
                showGridBackground
              />
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
          <div className="inline-flex flex-col sm:flex-row items-center gap-6 p-8 rounded-3xl bg-linear-to-r from-red-500/10 via-purple-500/10 to-blue-500/10 border border-white/10 relative overflow-hidden">
            {/* Grid Background */}
            <div className="absolute inset-0 bg-[url('/assets/grid.svg')] bg-center mask-[linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)] opacity-10 pointer-events-none" />

            <div className="flex -space-x-4 relative z-10">
              {[
                "/marketing/avatars/adventurer-1766980363322.svg",
                "/marketing/avatars/adventurerNeutral-1766980376476.svg",
                "/marketing/avatars/bigSmile-1766980388157.svg",
                "/marketing/avatars/pixelArt-1766980354480.svg",
              ].map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`MC ${i + 1}`}
                  className="w-12 h-12 rounded-full border-2 border-black bg-gray-800"
                />
              ))}
              <div className="w-12 h-12 rounded-full border-2 border-black bg-red-500 flex flex-col items-center justify-center text-xs font-bold text-white z-10 leading-tight">
                <span>+</span>
                <span>You</span>
              </div>
            </div>
            <div className="text-center sm:text-left relative z-10">
              <div className="text-white font-bold text-lg">
                Step in the Arena
              </div>
              <div className="text-gray-400 text-sm">Try it out for free</div>
            </div>
            <div className="relative z-10">
              <CreateBattleCTA
                isAuthenticated={isAuthenticated}
                title="Start Live Battle"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
