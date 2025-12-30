"use client";

import * as React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Music,
  Mic2,
  Clock,
  MessageSquare,
  Radio,
  Trophy,
  Map,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_TITLE, APP_URL } from "@/lib/constants";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";
import { BattleBarDemo } from "@/components/learn-more/battle-bar-demo";

type ColorKey = "red" | "yellow" | "green" | "blue" | "purple";

interface ScreenshotCarouselProps {
  isAuthenticated?: boolean;
  className?: string;
}

const COLOR_CLASSES: Record<
  ColorKey,
  {
    icon: string;
    bg: string;
    border: string;
    glow: string;
    text: string;
    accent: string;
  }
> = {
  red: {
    icon: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    glow: "bg-red-500/30",
    text: "text-red-400",
    accent: "from-red-500 to-orange-500",
  },
  yellow: {
    icon: "text-yellow-500",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    glow: "bg-yellow-500/30",
    text: "text-yellow-400",
    accent: "from-yellow-500 to-amber-500",
  },
  green: {
    icon: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    glow: "bg-green-500/30",
    text: "text-green-400",
    accent: "from-green-500 to-emerald-500",
  },
  blue: {
    icon: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    glow: "bg-blue-500/30",
    text: "text-blue-400",
    accent: "from-blue-500 to-cyan-500",
  },
  purple: {
    icon: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    glow: "bg-purple-500/30",
    text: "text-purple-400",
    accent: "from-purple-500 to-fuchsia-500",
  },
};

const FEATURES = [
  {
    key: "mcs",
    icon: <Mic2 className="w-5 h-5 md:w-6 md:h-6" />,
    title: "Choose Your MCs",
    description:
      "Select from a roster of unique AI personas, each with their own distinct flow, style, and personality.",
    color: "red" as ColorKey,
    screenshot: "/marketing/battle-system/rapgpt-player-select.webp",
  },
  {
    key: "stage",
    icon: <Map className="w-5 h-5 md:w-6 md:h-6" />,
    title: "Select Your Stage",
    description:
      "Choose the perfect backdrop for your battle, with locations from around the world.",
    color: "blue" as ColorKey,
    screenshot: "/marketing/battle-system/rapgpt-select-stage.webp",
  },
  {
    key: "rounds",
    icon: <Clock className="w-5 h-5 md:w-6 md:h-6" />,
    title: "3 Rounds, 8 Bars",
    description:
      "Each battle features 3 rounds with 8 bars per verse. Watch as MCs trade shots and react to each other.",
    color: "yellow" as ColorKey,
    screenshot: "/marketing/battle-system/rapgpt-rounds.webp",
  },
  {
    key: "admin",
    icon: <Zap className="w-5 h-5 md:w-6 md:h-6" />,
    title: "Dynamic Interface",
    description:
      "Control the battle's flow with the adaptive Battle Bar. Adjust options and pacing on the fly.",
    color: "purple" as ColorKey,
    screenshot: "/marketing/rap-gpt-screenshot.webp",
  },
  {
    key: "scoring",
    icon: <Trophy className="w-5 h-5 md:w-6 md:h-6" />,
    title: "Score",
    description:
      "See the final verdict as the scores are tallied. Detailed stats show who dominated the mic.",
    color: "green" as ColorKey,
    screenshot: "/marketing/battle-system/rapgpt-scoring.webp",
  },
  {
    key: "chat",
    icon: <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />,
    title: "Comments",
    description:
      "Join the crowd in the chatroom as the beef unfolds. React, comment, and hype your favorite MC.",
    color: "blue" as ColorKey,
    screenshot: "/marketing/battle-system/rapgpt-comments.webp",
  },
  {
    key: "watch",
    icon: <Radio className="w-5 h-5 md:w-6 md:h-6" />,
    title: "Go Live",
    description:
      "Stream your match live to a crowd, or simply spectate as a fan, as the battle evolves in real time.",
    color: "red" as ColorKey,
    screenshot: "/marketing/battle-system/rapgpt-battle-stage.webp",
  },
  {
    key: "voting",
    icon: <Zap className="w-5 h-5 md:w-6 md:h-6" />,
    title: "Voting",
    description:
      "Rock the vote after each round to impact the battle's outcome. Your voice shapes the competition.",
    color: "yellow" as ColorKey,
    screenshot: "/marketing/battle-system/rapgpt-voting.webp",
  },
  {
    key: "song",
    icon: <Music className="w-5 h-5 md:w-6 md:h-6" />,
    title: "Make it a Song",
    description:
      "Transform any battle into a full track with AI-generated vocals. Choose a beat style, and share your creation.",
    color: "green" as ColorKey,
    screenshot: "/marketing/battle-system/rapgpt-generate-song.webp",
  },
];

export function ScreenshotCarousel({ className }: ScreenshotCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // Global keyboard navigation
  React.useEffect(() => {
    if (!api) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        api.scrollPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        api.scrollNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [api]);

  const scrollTo = React.useCallback(
    (index: number) => {
      api?.scrollTo(index);
    },
    [api]
  );

  return (
    <section className={cn("relative bg-black overflow-hidden", className)}>
      <div className="max-w-4xl mx-auto px-4 relative z-10">
        {/* Main Carousel */}
        <Carousel
          setApi={setApi}
          opts={{
            align: "center",
            loop: true,
          }}
          className="w-full focus:outline-none"
          tabIndex={0}
        >
          <CarouselContent className="ml-0">
            {FEATURES.map((feature, index) => {
              const featureColors = COLOR_CLASSES[feature.color];
              return (
                <CarouselItem key={feature.key} className="pl-0">
                  <div className="relative">
                    {/* Screenshot Container */}
                    <div className="relative rounded-2xl md:rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-950">
                      {/* Browser Chrome */}
                      <div className="h-8 md:h-10 bg-zinc-900/80 border-b border-white/5 flex items-center px-4 md:px-6">
                        <div className="flex gap-1.5">
                          <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-zinc-700" />
                          <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-zinc-700" />
                          <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-zinc-700" />
                        </div>
                        {/* URL Bar */}
                        <div className="flex-1 mx-4">
                          <div className="max-w-xs mx-auto h-5 md:h-6 bg-zinc-800/50 rounded-md flex items-center justify-center">
                            <span className="text-[10px] md:text-xs text-zinc-500 truncate px-2">
                              {APP_URL}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Screenshot or Interactive Demo */}
                      <div className="relative w-full aspect-16/10 overflow-hidden bg-zinc-950">
                        {feature.key === "admin" ? (
                          /* Interactive Battle Bar Demo for Dynamic Interface slide */
                          <AnimatePresence mode="wait">
                            <motion.div
                              key="battle-bar-demo"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.4 }}
                              className="absolute inset-0"
                            >
                              <BattleBarDemo />
                            </motion.div>
                          </AnimatePresence>
                        ) : (
                          /* Static Screenshot for other slides */
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={feature.screenshot}
                              initial={{ opacity: 0, scale: 1.02 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.4 }}
                              className="absolute inset-0"
                            >
                              <Image
                                src={feature.screenshot}
                                alt={`${APP_TITLE} - ${feature.title}`}
                                fill
                                className={cn(
                                  feature.key === "voting"
                                    ? "object-cover object-[calc(50%-5px)_top] w-[55%]! left-[22.5%]! right-auto!"
                                    : feature.key === "chat"
                                    ? "object-cover object-[calc(50%-5px)_bottom] w-[55%]! left-[22.5%]! right-auto!"
                                    : feature.key === "scoring"
                                    ? "object-cover object-[calc(50%-5px)_bottom]"
                                    : feature.key === "rounds"
                                    ? "object-cover object-[calc(50%-5px)_top]"
                                    : feature.key === "stage"
                                    ? "object-cover object-[calc(50%-5px)_50%]"
                                    : feature.key === "song"
                                    ? "object-cover object-[calc(50%-5px)_bottom]"
                                    : "object-contain"
                                )}
                                priority={index === 0}
                              />
                            </motion.div>
                          </AnimatePresence>
                        )}
                      </div>
                    </div>

                    {/* Feature Info - Moved below the screenshot */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="mt-3 px-2 md:max-w-lg mx-auto relative z-10"
                    >
                      <div
                        className={cn(
                          "flex items-start gap-4 p-4 rounded-xl bg-zinc-900/40 border",
                          featureColors.border
                        )}
                      >
                        <div
                          className={cn(
                            "flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-lg shrink-0 mt-1",
                            `bg-linear-to-br ${featureColors.accent}`
                          )}
                        >
                          <span className="text-white scale-90 md:scale-100">
                            {feature.icon}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-lg md:text-xl font-bold text-white leading-tight">
                              {feature.title}
                            </h3>
                          </div>
                          <p className="text-sm md:text-base text-zinc-400 mt-1 text-pretty">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Glow Effect */}
                    <div
                      className={cn(
                        "absolute -bottom-6 md:-bottom-10 inset-x-8 md:inset-x-16 h-12 md:h-20 blur-2xl md:blur-3xl rounded-full opacity-50 -z-10",
                        featureColors.glow
                      )}
                    />
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>

          <CarouselPrevious className="flex left-4 md:-left-12 lg:-left-16 size-9 md:size-10 lg:size-12 border-blue-500/50 bg-black/60 backdrop-blur-sm text-white hover:bg-blue-600 hover:border-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300 [&_svg]:size-5 md:[&_svg]:size-6 lg:[&_svg]:size-7 z-20" />
          <CarouselNext className="flex right-4 md:-right-12 lg:-right-16 size-9 md:size-10 lg:size-12 border-blue-500/50 bg-black/60 backdrop-blur-sm text-white hover:bg-blue-600 hover:border-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300 [&_svg]:size-5 md:[&_svg]:size-6 lg:[&_svg]:size-7 z-20" />
        </Carousel>

        {/* Dot Indicators */}
        <div className="flex items-center justify-center gap-2 mt-6 md:mt-8">
          {FEATURES.map((feature, index) => {
            const dotColors = COLOR_CLASSES[feature.color];
            const isActive = current === index;
            return (
              <button
                key={feature.key}
                onClick={() => scrollTo(index)}
                className={cn(
                  "relative h-2 rounded-full transition-all duration-300",
                  isActive ? "w-8 md:w-10" : "w-2 hover:w-3"
                )}
                aria-label={`Go to slide ${index + 1}: ${feature.title}`}
              >
                <span
                  className={cn(
                    "absolute inset-0 rounded-full transition-all duration-300",
                    isActive
                      ? `bg-linear-to-r ${dotColors.accent}`
                      : "bg-zinc-700 hover:bg-zinc-600"
                  )}
                />
              </button>
            );
          })}
        </div>

        {/* Keyboard hint */}
        {/* <p className="text-center text-zinc-600 text-xs mt-4 hidden md:block">
          Use arrow keys or swipe to navigate
        </p> */}
      </div>
    </section>
  );
}
