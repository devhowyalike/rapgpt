"use client";

import * as React from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  Zap,
  Music,
  Mic2,
  Clock,
  MessageSquare,
  Radio,
  Trophy,
  Map,
  Vote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_TITLE } from "@/lib/constants";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";
import { BrowserChrome } from "@/components/browser-chrome";

type ColorKey = "red" | "yellow" | "green" | "blue" | "purple";

interface FeatureCarouselProps {
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

// Demo component lazy loaders
const DEMO_COMPONENTS = {
  admin: dynamic(
    () =>
      import("@/components/learn-more/battle-bar-demo").then(
        (m) => m.BattleBarDemo
      ),
    { ssr: false }
  ),
  watch: dynamic(
    () =>
      import("@/components/learn-more/go-live-demo").then((m) => m.GoLiveDemo),
    { ssr: false }
  ),
  scoring: dynamic(
    () => import("@/components/learn-more/score-demo").then((m) => m.ScoreDemo),
    { ssr: false }
  ),
  chat: dynamic(
    () =>
      import("@/components/learn-more/comments-demo").then(
        (m) => m.CommentsDemo
      ),
    { ssr: false }
  ),
  voting: dynamic(
    () =>
      import("@/components/learn-more/voting-demo").then((m) => m.VotingDemo),
    { ssr: false }
  ),
  song: dynamic(
    () =>
      import("@/components/learn-more/make-a-song-demo").then(
        (m) => m.MakeASongDemo
      ),
    { ssr: false }
  ),
  mcs: dynamic(
    () =>
      import("@/components/learn-more/select-player-demo").then(
        (m) => m.SelectPlayerDemo
      ),
    { ssr: false }
  ),
  stage: dynamic(
    () =>
      import("@/components/learn-more/stage-select-demo").then(
        (m) => m.StageSelectDemo
      ),
    { ssr: false }
  ),
} as const;

type DemoKey =
  | "admin"
  | "watch"
  | "scoring"
  | "chat"
  | "voting"
  | "song"
  | "mcs"
  | "stage";

type Feature = {
  key: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: ColorKey;
  screenshot: string;
  demoKey?: DemoKey;
  browserContentClassName?: string;
};

const FEATURES: Feature[] = [
  {
    key: "mcs",
    icon: <Mic2 className="w-5 h-5 md:w-6 md:h-6" />,
    title: "Choose Your MCs",
    description:
      "Select from a roster of unique AI personas, each with their own distinct flow, style, and personality.",
    color: "red" as ColorKey,
    screenshot: "/marketing/battle-system/rapgpt-player-select.webp",
    demoKey: "mcs",
    browserContentClassName: "aspect-[16/14] md:aspect-16/10",
  },
  {
    key: "stage",
    icon: <Map className="w-5 h-5 md:w-6 md:h-6" />,
    title: "Select Your Stage",
    description:
      "Choose the perfect backdrop for your battle, with locations from around the world.",
    color: "blue" as ColorKey,
    screenshot: "/marketing/battle-system/rapgpt-select-stage.webp",
    demoKey: "stage",
    browserContentClassName: "aspect-[16/14] md:aspect-16/10",
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
    demoKey: "admin",
  },
  {
    key: "scoring",
    icon: <Trophy className="w-5 h-5 md:w-6 md:h-6" />,
    title: "Score",
    description:
      "See the final verdict as the scores are tallied. Detailed stats show who dominated the mic.",
    color: "green" as ColorKey,
    screenshot: "/marketing/battle-system/rapgpt-scoring.webp",
    demoKey: "scoring",
    browserContentClassName: "aspect-[16/14] md:aspect-16/10",
  },
  {
    key: "chat",
    icon: <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />,
    title: "Comments",
    description:
      "Join the crowd in the chatroom as the beef unfolds. React, comment, and hype your favorite MC.",
    color: "blue" as ColorKey,
    screenshot: "/marketing/battle-system/rapgpt-comments.webp",
    demoKey: "chat",
    browserContentClassName: "aspect-[16/14] md:aspect-16/10",
  },
  {
    key: "watch",
    icon: <Radio className="w-5 h-5 md:w-6 md:h-6" />,
    title: "Go Live",
    description:
      "Stream your match live to a crowd, or simply spectate as a fan, as the battle evolves in real time.",
    color: "red" as ColorKey,
    screenshot: "/marketing/battle-system/rapgpt-battle-stage.webp",
    demoKey: "watch",
  },
  {
    key: "voting",
    icon: <Vote className="w-5 h-5 md:w-6 md:h-6" />,
    title: "Voting",
    description:
      "Rock the vote after each round to impact the battle's outcome. Your voice shapes the competition.",
    color: "yellow" as ColorKey,
    screenshot: "/marketing/battle-system/rapgpt-voting.webp",
    demoKey: "voting",
    browserContentClassName: "aspect-[16/14] md:aspect-16/10",
  },
  {
    key: "song",
    icon: <Music className="w-5 h-5 md:w-6 md:h-6" />,
    title: "Make it a Song",
    description:
      "Transform any battle into a full track with AI-generated vocals. Choose a beat style, and share your creation.",
    color: "green" as ColorKey,
    screenshot: "/marketing/battle-system/rapgpt-generate-song.webp",
    demoKey: "song",
    browserContentClassName: "aspect-[16/14] md:aspect-16/10",
  },
];

function getCyclicDistance(a: number, b: number, length: number) {
  const diff = Math.abs(a - b);
  return Math.min(diff, length - diff);
}

function isIndexNearCurrent(
  index: number,
  current: number,
  length: number,
  distance: number
) {
  if (length <= 0) return false;
  return getCyclicDistance(index, current, length) <= distance;
}

function renderDemoComponent(
  demoKey: DemoKey | undefined,
  isActive: boolean
): React.ReactNode {
  if (!demoKey) return null;
  const DemoComponent = DEMO_COMPONENTS[demoKey];
  return DemoComponent ? <DemoComponent isActive={isActive} /> : null;
}

type FeatureSlideProps = {
  feature: Feature;
  index: number;
  isActive: boolean;
  shouldMountDemo: boolean;
  eagerImage: boolean;
};

const FeatureSlide = React.memo(
  function FeatureSlide({
    feature,
    index,
    isActive,
    shouldMountDemo,
    eagerImage,
  }: FeatureSlideProps) {
    const featureColors = COLOR_CLASSES[feature.color];

    return (
      <CarouselItem key={feature.key} className="pl-0">
        <div className="relative">
          {/* Browser Chrome Shell */}
          <BrowserChrome
            showAddressBar={false}
            contentClassName={feature.browserContentClassName ?? "aspect-16/10"}
          >
            {/* Always render the screenshot (cheap, lazy-loaded); mount the demo UI only for active/adjacent slides. */}
            <Image
              src={feature.screenshot}
              alt={`${APP_TITLE} - ${feature.title}`}
              fill
              className={cn(
                feature.key === "rounds"
                  ? "object-cover object-[calc(50%-5px)_top]"
                  : "object-contain"
              )}
              // `sizes` is critical here; without it Next may serve a much larger image than needed.
              sizes="(max-width: 768px) 100vw, 896px"
              priority={eagerImage && index < 3}
              loading={eagerImage ? "eager" : "lazy"}
            />
            {shouldMountDemo && renderDemoComponent(feature.demoKey, isActive)}
          </BrowserChrome>

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
  },
  // Prevent re-rendering *all* slides whenever `current` changes.
  // Only the active/adjacent slides should update.
  (prev, next) => {
    // Feature and index are stable per slide, so only check dynamic props
    return (
      prev.isActive === next.isActive &&
      prev.shouldMountDemo === next.shouldMountDemo &&
      prev.eagerImage === next.eagerImage
    );
  }
);

// Shared arrow button styles
const ARROW_BUTTON_CLASSES =
  "border-blue-500/50 bg-black/60 backdrop-blur-sm text-white hover:bg-blue-600 hover:border-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300";

// Mobile arrow button component
interface MobileArrowButtonProps {
  direction: "prev" | "next";
  onClick: () => void;
  ariaLabel: string;
}

function MobileArrowButton({
  direction,
  onClick,
  ariaLabel,
}: MobileArrowButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex md:hidden items-center justify-center size-9 rounded-full",
        ARROW_BUTTON_CLASSES
      )}
      aria-label={ariaLabel}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {direction === "prev" ? (
          <>
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </>
        ) : (
          <>
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </>
        )}
      </svg>
    </button>
  );
}

export function FeatureCarousel({ className }: FeatureCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;

    React.startTransition(() => {
      setCurrent(api.selectedScrollSnap());
    });

    const onSelect = () => {
      React.startTransition(() => {
        setCurrent(api.selectedScrollSnap());
      });
    };

    api.on("select", onSelect);

    return () => {
      api.off("select", onSelect);
    };
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
          className="w-full"
        >
          <CarouselContent className="ml-0 will-change-transform">
            {FEATURES.map((feature, index) => {
              const shouldMountDemo = feature.demoKey
                ? isIndexNearCurrent(index, current, FEATURES.length, 1)
                : false;
              const isActive = current === index;
              const eagerImage = isIndexNearCurrent(
                index,
                current,
                FEATURES.length,
                1
              );
              return (
                <FeatureSlide
                  key={feature.key}
                  feature={feature}
                  index={index}
                  isActive={isActive}
                  shouldMountDemo={shouldMountDemo}
                  eagerImage={eagerImage}
                />
              );
            })}
          </CarouselContent>

          {/* Desktop arrows - hidden on mobile */}
          <CarouselPrevious
            className={cn(
              "hidden md:flex md:-left-12 lg:-left-16 md:size-10 lg:size-12",
              ARROW_BUTTON_CLASSES,
              "md:[&_svg]:size-6 lg:[&_svg]:size-7 z-20"
            )}
          />
          <CarouselNext
            className={cn(
              "hidden md:flex md:-right-12 lg:-right-16 md:size-10 lg:size-12",
              ARROW_BUTTON_CLASSES,
              "md:[&_svg]:size-6 lg:[&_svg]:size-7 z-20"
            )}
          />
        </Carousel>

        {/* Navigation: Dots with mobile arrows on sides */}
        <div className="flex items-center justify-center gap-3 mt-6 md:mt-8">
          <MobileArrowButton
            direction="prev"
            onClick={() => api?.scrollPrev()}
            ariaLabel="Previous slide"
          />

          {/* Dot Indicators */}
          <div className="flex items-center justify-center gap-2">
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

          <MobileArrowButton
            direction="next"
            onClick={() => api?.scrollNext()}
            ariaLabel="Next slide"
          />
        </div>

        {/* Keyboard hint */}
        {/* <p className="text-center text-zinc-600 text-xs mt-4 hidden md:block">
          Use arrow keys or swipe to navigate
        </p> */}
      </div>
    </section>
  );
}
