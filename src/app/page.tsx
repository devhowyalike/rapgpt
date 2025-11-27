import { getLiveBattles } from "@/lib/battle-storage";
import { SiteHeader } from "@/components/site-header";
import { LiveBattlesDisplay } from "@/components/live-battles-display";
import { PersonaGallery } from "@/components/persona-gallery";
import { MakeSongHighlight } from "@/components/make-song-highlight";
import { CreateBattleCTA } from "@/components/create-battle-cta";
import { APP_TITLE, MADE_BY, TAGLINE, YEAR } from "@/lib/constants";
import { auth } from "@clerk/nextjs/server";
import { Calendar } from "lucide-react";
import { FeatureCard } from "@/components/feature-card";

// Revalidate every 10 seconds to show live battles
export const revalidate = 10;
export const dynamic = "force-dynamic";

export default async function Home() {
  const liveBattles = await getLiveBattles();
  const { sessionClaims } = await auth();
  const isAuthenticated = !!sessionClaims;

  return (
    <>
      <SiteHeader />

      {/* New Hero Section (Preserved) */}
      <section className="relative pt-20 pb-6 md:pt-32 md:pb-8 overflow-hidden bg-black text-white selection:bg-yellow-500/30">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-purple-900/20 via-black to-black z-0" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl z-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm animate-slide-up">
            <span className="text-sm font-medium text-yellow-400 tracking-wide uppercase">
              AI Powered Freestyle Battles
            </span>
          </div>

          <div className="relative w-fit mx-auto mb-6">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 animate-slide-up [animation-delay:100ms]">
              <span className="text-[250px] md:text-[450px] opacity-15 rotate-12 block select-none pointer-events-none grayscale-0">
                🎤
              </span>
            </div>
            <h1 className="text-7xl md:text-9xl font-bold tracking-tighter font-(family-name:--font-bebas-neue) animate-slide-up [animation-delay:100ms] relative z-10">
              <span className="bg-linear-to-r from-white via-gray-200 to-gray-400 text-transparent bg-clip-text">
                {APP_TITLE}
              </span>
            </h1>
          </div>

          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up [animation-delay:200ms]">
            {TAGLINE}&trade;
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up [animation-delay:300ms]">
            <CreateBattleCTA isAuthenticated={isAuthenticated} />
          </div>
        </div>
      </section>

      {/* Reverted Original Content - Split for Full Width Highlight */}
      <div className="bg-linear-to-b from-stage-darker to-stage-dark flex flex-col items-center justify-center p-6 pt-0 pb-12">
        <div className="max-w-6xl mx-auto text-center space-y-8 w-full">
          {/* Live Battles if active */}
          <LiveBattlesDisplay initialBattles={liveBattles} />

          {/* Original Features Grid */}
          <div className="flex flex-wrap justify-center gap-6 mt-6">
            <FeatureCard
              icon="⚔️"
              title="Choose MC's"
              description="Each with distinct flows and styles."
            />

            <FeatureCard
              icon="🎤"
              title="3 Rounds"
              description="8 bars per verse, alternating turns."
            />

            <FeatureCard
              icon="🏆"
              title="You Decide"
              description={<>Vote and crown the&nbsp;winner!</>}
            />

            <FeatureCard
              icon="💬"
              title="Live Chat"
              description="Chat and react in real-time."
            />

            <FeatureCard
              icon="🎵"
              title="Make it a Song"
              description="Select a style and stream it."
            />
          </div>
        </div>
      </div>

      {/* Make Song Highlight */}
      <MakeSongHighlight isAuthenticated={isAuthenticated} />

      <div className="bg-stage-dark flex flex-col items-center justify-center p-6 pt-12 pb-0">
        <div className="max-w-6xl mx-auto text-center space-y-8 w-full">
          {/* Persona Gallery */}
          <PersonaGallery hideAltPersonas={true} />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="bg-stage-dark flex flex-col items-center justify-center p-6 pt-12 pb-12">
        <div className="max-w-6xl mx-auto text-center space-y-8 w-full">
          {/* Bottom CTA */}
          <div className="flex justify-center pb-4 pt-4">
            <CreateBattleCTA
              isAuthenticated={isAuthenticated}
              title="Select Your Fighter"
            />
          </div>

          {/* Live Battles or Coming Soon */}
          {liveBattles.length === 0 && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8 mt-8">
              {/* Calendar Display */}
              <div className="flex justify-center mb-6">
                <Calendar
                  className="text-yellow-400"
                  size={120}
                  strokeWidth={1.5}
                />
              </div>

              <h2 className="text-3xl font-(family-name:--font-bebas-neue) text-yellow-400 mb-4">
                Upcoming Live Battles — Stay Tuned!
              </h2>
              <p className="text-gray-400 mb-6">
                Participate in a live AI battle arena featuring surprise guests
                and new roster additions.
              </p>
            </div>
          )}

          {/* Tagline at bottom */}
          <div className="mt-12">
            <p className="text-gray-500 text-lg">
              &copy;{YEAR}, {MADE_BY}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
