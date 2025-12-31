import { auth } from "@clerk/nextjs/server";
import { Calendar } from "lucide-react";
import { CreateBattleCTA } from "@/components/create-battle-cta";
import { LiveBattlesDisplay } from "@/components/live-battles-display";
import { LiveFeaturesHighlight } from "@/components/live-features-highlight";
import { MakeSongHighlight } from "@/components/make-song-highlight";
import { PersonaGallery } from "@/components/persona-gallery";
import { ScreenshotShowcaseStatic } from "@/components/product-demo";
import { SiteHeader } from "@/components/site-header";
import { getUserByClerkId } from "@/lib/auth/sync-user";
import { getLiveBattles } from "@/lib/battle-storage";

// Revalidate every 10 seconds to show live battles
export const revalidate = 10;
export const dynamic = "force-dynamic";

export default async function Home() {
  const liveBattles = await getLiveBattles();
  const { sessionClaims, userId: clerkUserId } = await auth();
  const isAuthenticated = !!sessionClaims;

  let currentUserId = null;
  if (clerkUserId) {
    const user = await getUserByClerkId(clerkUserId);
    if (user) {
      currentUserId = user.id;
    }
  }

  return (
    <>
      <SiteHeader />

      <ScreenshotShowcaseStatic isAuthenticated={isAuthenticated} />

      {/* Live Battles if active (Moved from old features grid) */}
      {liveBattles.length > 0 && (
        <div className="bg-black flex flex-col items-center justify-center p-6 pb-8 relative overflow-hidden">
          {/* Background Atmosphere to bridge the gap */}
          <div className="absolute inset-0 bg-linear-to-b from-black via-red-500/5 to-black pointer-events-none" />
          <div className="max-w-6xl mx-auto text-center w-full relative z-10">
            <LiveBattlesDisplay
              initialBattles={liveBattles}
              currentUserId={currentUserId}
            />
          </div>
        </div>
      )}

      {/* Make Song Highlight */}
      <MakeSongHighlight isAuthenticated={isAuthenticated} />

      {/* Live Experience Highlight */}
      <LiveFeaturesHighlight isAuthenticated={isAuthenticated} />

      <div className="bg-black flex flex-col items-center justify-center p-6 pt-6 pb-4">
        <div className="max-w-6xl mx-auto text-center space-y-4 w-full">
          {/* Persona Gallery */}
          <PersonaGallery hideAltPersonas={true} />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="bg-black flex flex-col items-center justify-center p-6 pt-4 pb-8">
        <div className="max-w-6xl mx-auto text-center space-y-6 w-full">
          {/* Bottom CTA */}
          <div className="flex justify-center pb-2 pt-0">
            <CreateBattleCTA
              isAuthenticated={isAuthenticated}
              title="Select Your Fighter"
            />
          </div>

          {/* Live Battles or Coming Soon */}
          {liveBattles.length === 0 && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 max-w-md mx-auto mt-8">
              {/* Calendar Display */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                  <Calendar
                    className="text-yellow-400"
                    size={32}
                    strokeWidth={1.5}
                  />
                </div>
              </div>

              <h2 className="text-2xl font-(family-name:--font-bebas-neue) text-yellow-400 mb-2">
                Upcoming Live Battles
              </h2>
              <p className="text-gray-400 text-sm mb-4">
                Participate in a live AI battle arena featuring surprise guests
                and new roster additions.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
