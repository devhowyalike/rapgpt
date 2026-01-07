import { Mic2, Music, Zap } from "lucide-react";
import { PageTitle } from "@/components/page-title";
import { CreateBattleCTA } from "@/components/create-battle-cta";
import { APP_TITLE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { FeatureCard, type FeatureCardColor } from "@/components/feature-card";
import { GridBackground } from "@/components/grid-background";

export function LearnMoreHero() {
  const features: {
    icon: React.ReactNode;
    label: string;
    color: FeatureCardColor;
    description: string;
  }[] = [
    {
      icon: <Mic2 />,
      label: "Dream Matchups",
      color: "red",
      description:
        "Pit legendary artists against each other in epic rap battles",
    },
    {
      icon: <Zap />,
      label: "Live Events",
      color: "yellow",
      description: "Join real-time battles and vote for your favorite artists",
    },
    {
      icon: <Music />,
      label: "Make it a Song",
      color: "green",
      description:
        "Transform any battle into a full track with AI-generated beats",
    },
  ];

  return (
    <section className="relative pt-28 md:pt-32 pb-12 bg-black overflow-hidden">
      {/* Background Atmosphere - matching homepage */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-2/3 h-2/3 bg-red-600/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-2/3 h-2/3 bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />
        <GridBackground />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Title with decorative emoji */}
          <div className="relative w-fit mx-auto">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10">
              <span className="text-[150px] md:text-[200px] opacity-20 rotate-12 block select-none pointer-events-none grayscale-0">
                🎤
              </span>
            </div>
            <PageTitle className="relative z-10">
              <span className="text-transparent bg-clip-text bg-linear-to-r from-white via-gray-400 to-gray-600 text-pretty block">
                Advancing the Art of Beef
              </span>
            </PageTitle>
          </div>

          {/* Description */}
          <p className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-2xl text-balance">
            {APP_TITLE} is a live-streaming, community-driven AI battle arena.
          </p>

          {/* CTA */}
          <div className="pt-2">
            <CreateBattleCTA isAuthenticated={false} />
          </div>

          {/* Features */}
          <div className="pt-10 w-full max-w-4xl">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {features.map((item, i) => (
                <FeatureCard
                  key={i}
                  icon={item.icon}
                  title={item.label}
                  description={item.description}
                  color={item.color}
                  className={cn(i === 2 && "col-span-2 md:col-span-1")}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
