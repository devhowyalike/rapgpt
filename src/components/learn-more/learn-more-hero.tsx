import { Lightbulb, Mic2, Music, Zap } from "lucide-react";
import { PageTitle } from "@/components/page-title";
import { CreateBattleCTA } from "@/components/create-battle-cta";

interface LearnMoreHeroProps {
  isAuthenticated?: boolean;
}

export function LearnMoreHero({ isAuthenticated = false }: LearnMoreHeroProps) {
  const features = [
    { icon: Mic2, label: "Dream matchups", color: "text-red-500" },
    { icon: Music, label: "Make it a Song", color: "text-green-500" },
    { icon: Zap, label: "Live Events", color: "text-yellow-500" },
  ];

  return (
    <section className="relative pt-28 md:pt-32 pb-12 bg-black overflow-hidden">
      {/* Background Atmosphere - matching homepage */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-2/3 h-2/3 bg-red-600/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-2/3 h-2/3 bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('/assets/grid.svg')] bg-center mask-[linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)] opacity-20 pointer-events-none" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
            <Lightbulb className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Step in the Arena
            </span>
          </div>

          {/* Title with decorative emoji */}
          <div className="relative w-fit mx-auto">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10">
              <span className="text-[150px] md:text-[200px] opacity-20 rotate-12 block select-none pointer-events-none grayscale-0">
                🎤
              </span>
            </div>
            <PageTitle className="relative z-10">
              Advancing the{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-white via-gray-400 to-gray-600">
                Art of Beef
              </span>
            </PageTitle>
          </div>

          {/* Description */}
          <p className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-2xl">
            RapGPT is a live-streaming, community-driven AI battle arena.
          </p>

          <p className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-2xl">
            Choose your MCs to battle each other as they react and adapt in real
            time. Create dream matchups and see who comes out on top.
          </p>

          {/* CTA */}
          <div className="pt-2">
            <CreateBattleCTA isAuthenticated={isAuthenticated} />
          </div>

          {/* Features Row - matching homepage style */}
          <div className="pt-6 border-t border-white/5 w-full max-w-3xl">
            <div className="flex flex-wrap justify-center gap-8 md:gap-16">
              {features.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="inline-flex p-2 rounded-xl shrink-0 bg-white/5 border border-white/10">
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <span className="text-sm font-bold text-gray-300 uppercase tracking-wider">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
