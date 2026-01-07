"use client";

import { Clock, Mic2, Music, Pause, Play, Users } from "lucide-react";
import { RapGPTLogo } from "./rapgpt-logo";
import { CreateBattleCTA } from "./create-battle-cta";
import { TAGLINE_2 } from "@/lib/constants";
import Link from "next/link";
import { HeroBattleDemo, type HeroBattleDemoRef } from "./hero-battle-demo";
import { BrowserChrome } from "./browser-chrome";
import { useState, useRef } from "react";
import { FeatureCard, type FeatureCardColor } from "./feature-card";

interface ScreenshotShowcaseStaticProps {
  isAuthenticated?: boolean;
}

export function ScreenshotShowcaseStatic({
  isAuthenticated = false,
}: ScreenshotShowcaseStaticProps) {
  const [isPaused, setIsPaused] = useState(false);
  const demoRef = useRef<HeroBattleDemoRef>(null);

  const features: {
    icon: React.ReactNode;
    title: React.ReactNode;
    description: string;
    color: FeatureCardColor;
  }[] = [
    {
      icon: <Mic2 className="w-6 h-6" />,
      title: (
        <>
          Choose MC<span className="text-[0.7em] lowercase">s</span>
        </>
      ),
      description: "Each with distinct flows and styles.",
      color: "red",
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "3 Rounds",
      description: "8 bars per verse, alternating turns.",
      color: "yellow",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Go Live",
      description: "Stream with voting and comments.",
      color: "blue",
    },
    {
      icon: <Music className="w-6 h-6" />,
      title: "Make it a Song",
      description: "Select a style and generate it with AI.",
      color: "green",
    },
  ];

  return (
    <section className="relative pt-28 md:pt-32 pb-12 bg-black overflow-hidden">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-2/3 h-2/3 bg-red-600/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-2/3 h-2/3 bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('/assets/grid.svg')] bg-center mask-[linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)] opacity-20 pointer-events-none" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          {/* Left Column: Content */}
          <div className="lg:col-span-5 space-y-6 flex flex-col items-center text-center">
            <div className="space-y-4 md:space-y-6 flex flex-col items-center">
              <div className="space-y-4 flex flex-col items-center">
                <div className="flex flex-col items-center">
                  <div className="relative w-fit mx-auto">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10">
                      <span className="text-[200px] md:text-[300px] opacity-20 rotate-12 block select-none pointer-events-none grayscale-0">
                        🎤
                      </span>
                    </div>
                    <RapGPTLogo size="xl" className="relative z-10" />
                  </div>

                  <p className="text-lg md:text-xl text-gray-400 leading-relaxed -mt-1 mb-2">
                    {TAGLINE_2}&trade;
                  </p>
                </div>

                <div className="pt-1 flex justify-center">
                  <CreateBattleCTA isAuthenticated={isAuthenticated} />
                </div>
              </div>

              <div className="space-y-4 flex flex-col items-center border-t border-white/5 pt-4 md:pt-6">
                <div className="inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
                  <span className="text-sm font-medium text-yellow-400 tracking-wide uppercase">
                    AI Powered Freestyle Battles
                  </span>
                </div>

                <div className="space-y-2 md:space-y-4 max-w-lg">
                  <p className="text-xl text-zinc-400 leading-relaxed text-pretty">
                    Choose your AI MCs, stream the battle live. Turn verses into
                    a song with beats and vocals.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Animated Battle Demo */}
          <div className="lg:col-span-7">
            <div className="block group mb-4">
              <div className="relative">
                {/* Browser Chrome Shell */}
                <BrowserChrome
                  className="group-hover:border-white/20 group-hover:shadow-[0_0_60px_rgba(245,158,11,0.15)]"
                  contentClassName="bg-stage-dark"
                  showAddressBar={false}
                >
                  {/* Animated Battle Demo */}
                  <HeroBattleDemo
                    ref={demoRef}
                    isPaused={isPaused}
                    setIsPaused={setIsPaused}
                  />
                </BrowserChrome>
              </div>
            </div>

            {/* Simulation Notice & Controls */}
            <div className="relative flex items-center justify-between sm:justify-center gap-3">
              <span className="text-[10px] text-zinc-300 uppercase tracking-widest opacity-40">
                Simulated for demonstration
              </span>

              {/* Controls Group - Arrows + Play/Pause */}
              <div className="flex items-center gap-2 sm:absolute sm:right-0">
                {/* Previous Arrow */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    demoRef.current?.goToPrev();
                  }}
                  className="flex items-center justify-center size-7 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 transition-all group/prev"
                  aria-label="Previous slide"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-zinc-500 group-hover/prev:text-zinc-400 transition-colors"
                  >
                    <path d="m12 19-7-7 7-7" />
                    <path d="M19 12H5" />
                  </svg>
                </button>

                {/* Next Arrow */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    demoRef.current?.goToNext();
                  }}
                  className="flex items-center justify-center size-7 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 transition-all group/next"
                  aria-label="Next slide"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-zinc-500 group-hover/next:text-zinc-400 transition-colors"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </button>

                {/* Play/Pause Icon Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsPaused(!isPaused);
                  }}
                  className="flex items-center justify-center size-7 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 transition-all group/pause"
                  aria-label={isPaused ? "Resume" : "Pause"}
                >
                  {isPaused ? (
                    <Play className="w-3 h-3 text-zinc-500 fill-current group-hover/pause:text-yellow-400 transition-colors" />
                  ) : (
                    <Pause className="w-3 h-3 text-zinc-500 fill-current group-hover/pause:text-zinc-400 transition-colors" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Features Row (Static) */}
        <div className="mt-8 pt-4 border-none w-full">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-4">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                color={feature.color}
              />
            ))}
          </div>

          {/* Learn More Link */}
          <div className="text-center mt-6">
            <Link
              href="/learn-more"
              className="text-white/80 font-bold text-xl font-(family-name:--font-bebas-neue) tracking-wider uppercase hover:text-white transition-colors underline underline-offset-4"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
