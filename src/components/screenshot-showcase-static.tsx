"use client";

import { Clock, Mic2, Music, Lightbulb, Pause, Play } from "lucide-react";
import { RapGPTLogo } from "./rapgpt-logo";
import { CreateBattleCTA } from "./create-battle-cta";
import { APP_TITLE, TAGLINE_2 } from "@/lib/constants";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HeroBattleDemo, type HeroBattleDemoRef } from "./hero-battle-demo";
import { BrowserChrome } from "./browser-chrome";
import { useState, useRef } from "react";

interface ScreenshotShowcaseStaticProps {
  isAuthenticated?: boolean;
}

export function ScreenshotShowcaseStatic({
  isAuthenticated = false,
}: ScreenshotShowcaseStaticProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [suppressHoverOverlay, setSuppressHoverOverlay] = useState(false);
  const demoRef = useRef<HeroBattleDemoRef>(null);
  const router = useRouter();
  const features = [
    {
      icon: <Mic2 className="w-6 h-6" />,
      title: "Choose MC's",
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
      icon: <Music className="w-6 h-6" />,
      title: "Make it a Song",
      description: "Select a style and stream it.",
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
                    Choose your AI MCs. Battle alone or stream it live. Turn
                    verses into a song with beats and vocals.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Animated Battle Demo */}
          <div className="lg:col-span-7">
            <div
              className="block group mb-4 cursor-pointer"
              onClick={() => {
                if (isPaused) {
                  setSuppressHoverOverlay(true);
                  setIsPaused(false);
                } else {
                  router.push("/learn-more");
                }
              }}
              onMouseLeave={() => setSuppressHoverOverlay(false)}
            >
              <div className="relative">
                {/* Browser Chrome Shell */}
                <BrowserChrome
                  className="group-hover:border-white/20 group-hover:shadow-[0_0_60px_rgba(245,158,11,0.15)]"
                  contentClassName="bg-stage-dark"
                  showAddressBar={false}
                  headerRight={
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsPaused(!isPaused);
                      }}
                      className="flex sm:hidden items-center gap-1.5 px-2 py-0.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all group/pause"
                    >
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wider group-hover/pause:text-zinc-400 transition-colors">
                        {isPaused ? "Resume" : "Pause"}
                      </span>
                      {isPaused ? (
                        <Play className="w-2 h-2 text-zinc-500 fill-current group-hover/pause:text-yellow-400 transition-colors" />
                      ) : (
                        <Pause className="w-2 h-2 text-zinc-500 fill-current group-hover/pause:text-zinc-400 transition-colors" />
                      )}
                    </button>
                  }
                >
                  {/* Animated Battle Demo */}
                  <HeroBattleDemo
                    ref={demoRef}
                    isPaused={isPaused}
                    setIsPaused={setIsPaused}
                    ignoreHoverPause={suppressHoverOverlay}
                  />
                </BrowserChrome>

                {/* Hover hint - only show when not paused and not suppressed */}
                {!isPaused && !suppressHoverOverlay && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-40">
                    <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/40 px-8 py-4 rounded-full text-lg text-white font-bold shadow-[0_0_40px_rgba(0,0,0,0.7),0_0_20px_rgba(255,255,255,0.1)] transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-yellow-400/10">
                        <Lightbulb className="w-5 h-5 text-yellow-400 fill-yellow-400/20" />
                      </div>
                      Explore Features
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Simulation Notice & Controls */}
            <div className="flex items-center justify-center gap-3 sm:relative sm:min-h-[24px]">
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

              <span className="text-[10px] text-zinc-300 uppercase tracking-widest opacity-40">
                &mdash; Simulated for demonstration &mdash;
              </span>

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

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsPaused(!isPaused);
                }}
                className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 transition-all group/pause sm:absolute sm:right-0"
              >
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider group-hover/pause:text-zinc-400 transition-colors">
                  {isPaused ? "Resume" : "Pause"}
                </span>
                {isPaused ? (
                  <Play className="w-2.5 h-2.5 text-zinc-500 fill-current group-hover/pause:text-yellow-400 transition-colors" />
                ) : (
                  <Pause className="w-2.5 h-2.5 text-zinc-500 fill-current group-hover/pause:text-zinc-400 transition-colors" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Features Row (Static) */}
        <div className="mt-8 pt-4 border-none">
          <div className="grid grid-cols-2 md:flex md:flex-row md:flex-wrap justify-center items-center md:items-start gap-x-16 gap-y-10">
            {features.map((feature, index) => {
              const colorClasses = {
                red: "text-red-500",
                yellow: "text-yellow-500",
                green: "text-green-500",
              };
              const iconColor =
                colorClasses[feature.color as keyof typeof colorClasses];

              return (
                <div
                  key={feature.title}
                  className={`flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-4 max-w-sm p-3 -m-3 rounded-2xl ${
                    index === 2 ? "col-span-2 justify-self-center" : ""
                  }`}
                >
                  <div className="inline-flex p-3 rounded-xl shrink-0 bg-white/5 border border-white/10">
                    <span className={iconColor}>{feature.icon}</span>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-2xl font-bold font-(family-name:--font-bebas-neue) tracking-wide uppercase leading-tight text-zinc-300">
                      {feature.title}
                    </h3>
                    <p className="text-base leading-relaxed text-pretty text-zinc-500">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Learn More Link */}
          <div className="text-center mt-6">
            <Link
              href="/learn-more"
              className="text-base text-zinc-500 hover:text-zinc-400 transition-colors underline underline-offset-4"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
