import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import { LearnMoreHero } from "@/components/learn-more/learn-more-hero";
import { HowItWorks } from "@/components/learn-more/how-it-works";
import { FeaturesHeader } from "@/components/learn-more/features-header";
import { FeatureCarousel } from "@/components/feature-carousel";
import { CreateBattleCTA } from "@/components/create-battle-cta";
import { createMetadata } from "@/lib/metadata";
import { APP_TITLE } from "@/lib/constants";

export const metadata = createMetadata({
  title: "Learn More",
  description: `Explore the interface and features of ${APP_TITLE}. Choose your MCs, customize the rhimes, and watch it unfold.`,
  path: "/learn-more",
});

export default function LearnMorePage() {
  return (
    <>
      <SiteHeader />

      <LearnMoreHero />

      <HowItWorks />

      {/* Features Section */}
      <div className="bg-black pt-8 pb-8">
        <FeaturesHeader />
        <FeatureCarousel className="pb-4" />
      </div>

      {/* Bottom Section - matching homepage style */}
      <div className="bg-black flex flex-col items-center justify-center p-4 pt-2 pb-8">
        <div className="max-w-6xl mx-auto text-center space-y-6 w-full">
          {/* Bottom CTA */}
          <div className="flex justify-center pb-2 pt-0">
            <CreateBattleCTA
              isAuthenticated={false}
              title="Start Your First Battle"
            />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
