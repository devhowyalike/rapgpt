import { auth } from "@clerk/nextjs/server";
import { SiteHeader } from "@/components/site-header";
import { LearnMoreHero } from "@/components/learn-more/learn-more-hero";
import { HowItWorks } from "@/components/learn-more/how-it-works";
import { ScreenshotShowcase } from "@/components/screenshot-showcase";
import { CreateBattleCTA } from "@/components/create-battle-cta";
import { APP_TITLE } from "@/lib/constants";

export const metadata = {
  title: "Learn More | RapGPT",
  description:
    "Learn how RapGPT works. Create AI rap battles with unique personas, real-time lyrics, and audio.",
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
        <div className="container mx-auto px-4 text-center mb-6 md:mb-16">
          <h2 className="text-4xl md:text-6xl font-bold font-(family-name:--font-bebas-neue) text-white mb-6 uppercase tracking-tight">
            <span className="text-blue-500">Features</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Explore the {APP_TITLE} interface and features.
          </p>
        </div>
        <ScreenshotShowcase
          isAuthenticated={isAuthenticated}
          className="pt-0 md:pt-0 pb-0"
        />
      </div>

      {/* Bottom Section - matching homepage style */}
      <div className="bg-black flex flex-col items-center justify-center p-6 pt-4 pb-8">
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
