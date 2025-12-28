import { auth } from "@clerk/nextjs/server";
import { SiteHeader } from "@/components/site-header";
import { LearnMoreHero } from "@/components/learn-more/learn-more-hero";
import { HowItWorks } from "@/components/learn-more/how-it-works";
import { ScreenshotShowcase } from "@/components/screenshot-showcase";
import { CreateBattleCTA } from "@/components/create-battle-cta";
import { APP_TITLE, MADE_BY, YEAR } from "@/lib/constants";

export default async function LearnMorePage() {
  const { sessionClaims } = await auth();
  const isAuthenticated = !!sessionClaims;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-500/30">
      <SiteHeader />

      <main>
        <LearnMoreHero />

        <HowItWorks />

        <div className="bg-zinc-950 py-24">
          <div className="container mx-auto px-4 text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold font-(family-name:--font-bebas-neue) text-white mb-6 uppercase tracking-tight">
              Interactive <span className="text-blue-500">Arena</span>
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
              Experience the heat of the battle with our fully interactive
              interface.
            </p>
          </div>
          <ScreenshotShowcase
            isAuthenticated={isAuthenticated}
            className="pt-0 md:pt-0 pb-0"
          />
        </div>

        {/* Final CTA Section */}
        <section className="py-32 relative overflow-hidden bg-black">
          <div className="absolute inset-0 bg-linear-to-b from-zinc-950 to-black" />

          <div className="container mx-auto px-4 relative z-10 text-center">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-5xl md:text-8xl font-bold font-(family-name:--font-bebas-neue) text-white mb-8 uppercase tracking-tighter leading-none">
                Ready to enter <br /> the{" "}
                <span className="text-red-600">Circle?</span>
              </h2>

              <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto">
                Join thousands of fans and start your own AI battle today. Free
                to start, legendary to master.
              </p>

              <div className="flex justify-center">
                <CreateBattleCTA
                  isAuthenticated={isAuthenticated}
                  title="Start Your First Battle"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Enhanced Footer */}
      <footer className="bg-black border-t border-white/5 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col items-center md:items-start gap-2">
              <div className="text-2xl font-bold font-(family-name:--font-bebas-neue) tracking-tighter text-white">
                {APP_TITLE}
              </div>
              <p className="text-zinc-500 text-sm">
                The next generation of AI rap battles.
              </p>
            </div>

            <div className="flex items-center gap-6">
              <p className="text-zinc-600 text-sm">
                &copy;{YEAR} {MADE_BY}. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
