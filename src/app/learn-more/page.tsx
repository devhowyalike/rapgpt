import { auth } from "@clerk/nextjs/server";
import { Lightbulb } from "lucide-react";
import { ScreenshotShowcase } from "@/components/screenshot-showcase";
import { SiteHeader } from "@/components/site-header";
import { PageHero } from "@/components/page-hero";
import { APP_TITLE, MADE_BY, YEAR } from "@/lib/constants";

export default async function LearnMorePage() {
  const { sessionClaims } = await auth();
  const isAuthenticated = !!sessionClaims;

  return (
    <>
      <SiteHeader />

      <PageHero className="pb-4 md:pb-6">
        <h1 className="text-4xl md:text-6xl font-bebas mb-4 animate-slide-up flex flex-col items-center justify-center gap-3">
          <Lightbulb className="w-8 h-8 md:w-12 md:h-12 text-white" />
          Features of {APP_TITLE}
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed animate-slide-up [animation-delay:100ms] px-4 text-pretty">
          Everything you need to know about the arena.
        </p>
      </PageHero>

      <ScreenshotShowcase
        isAuthenticated={isAuthenticated}
        className="pt-0 md:pt-0"
      />

      {/* Footer */}
      <div className="bg-black flex flex-col items-center justify-center p-6 pb-8">
        <div className="max-w-6xl mx-auto text-center w-full">
          <p className="text-gray-500 text-lg">
            &copy;{YEAR}, {MADE_BY}
          </p>
        </div>
      </div>
    </>
  );
}
