import { auth } from "@clerk/nextjs/server";
import { SiteHeader } from "@/components/site-header";
import { LearnMoreHero } from "@/components/learn-more/learn-more-hero";
import { HowItWorks } from "@/components/learn-more/how-it-works";
import { FeaturesHeader } from "@/components/learn-more/features-header";
import { ScreenshotCarousel } from "@/components/screenshot-carousel";
import { CreateBattleCTA } from "@/components/create-battle-cta";
import { APP_TITLE } from "@/lib/constants";

export const metadata = {
  title: `Learn More | ${APP_TITLE}`,
  description: `Learn how ${APP_TITLE} works. Create AI rap battles with unique personas, real-time lyrics, and audio.`,
};

export default async function LearnMorePage() {
  const { sessionClaims } = await auth();
  const isAuthenticated = !!sessionClaims;

  return (
    <>
      <SiteHeader />

      <LearnMoreHero isAuthenticated={isAuthenticated} />

      <HowItWorks />

      {/* Features Section */}
      <div className="bg-black pt-8 pb-8">
        <FeaturesHeader />
        <ScreenshotCarousel className="pb-4" />
      </div>

      {/* Bottom Section - matching homepage style */}
      <div className="bg-black flex flex-col items-center justify-center p-4 pt-2 pb-8">
        <div className="max-w-6xl mx-auto text-center space-y-6 w-full">
          {/* Bottom CTA */}
          <div className="flex justify-center pb-2 pt-0">
            <CreateBattleCTA
              isAuthenticated={isAuthenticated}
              title="Start Your First Battle"
            />
          </div>
        </div>
      </div>
    </>
  );
}
