import { auth } from "@clerk/nextjs/server";
import { ScreenshotShowcase } from "@/components/screenshot-showcase";
import { SiteHeader } from "@/components/site-header";
import { MADE_BY, YEAR } from "@/lib/constants";

export default async function LearnMorePage() {
  const { sessionClaims } = await auth();
  const isAuthenticated = !!sessionClaims;

  return (
    <>
      <SiteHeader />

      <ScreenshotShowcase isAuthenticated={isAuthenticated} />

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

