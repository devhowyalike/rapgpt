import Link from "next/link";
import { getLiveBattles, getFeaturedBattles } from "@/lib/battle-storage";
import { SiteHeader } from "@/components/site-header";
import { LiveBattlesDisplay } from "@/components/live-battles-display";
import { APP_TITLE, TAGLINE } from "@/lib/constants";
import { auth } from "@clerk/nextjs/server";
import { Calendar } from "lucide-react";

// Revalidate every 10 seconds to show live battles
export const revalidate = 10;
export const dynamic = "force-dynamic";

export default async function Home() {
  const liveBattles = await getLiveBattles();
  const { sessionClaims } = await auth();
  const isAdmin = sessionClaims?.metadata?.role === "admin";
  const isAuthenticated = !!sessionClaims;
  
  // Check if there are any archived battles (completed battles with liveStartedAt)
  const featuredBattles = await getFeaturedBattles();
  const hasArchivedBattles = featuredBattles.some(
    (b) => b.status === "completed" && b.liveStartedAt
  );

  return (
    <>
      <SiteHeader />
      <div style={{ height: "var(--header-height)" }} />
      <div className="min-h-[calc(100vh-var(--header-height))] bg-linear-to-b from-stage-darker to-stage-dark flex flex-col items-center justify-center p-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Logo */}
          <h1 className="text-6xl md:text-8xl font-bold tracking-wider">
            <span className="bg-linear-to-r from-yellow-400 via-red-500 to-purple-600 text-transparent bg-clip-text">
              {APP_TITLE}
            </span>
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto">
            Live AI Keystyle Rap Battles
          </p>

          {/* Create Your Own Battles Promotional Card */}
          <div className="mt-8 bg-linear-to-r from-yellow-500/10 via-red-500/10 to-purple-600/10 border-2 border-yellow-500/30 rounded-lg p-8">
            <div className="text-5xl mb-4">🤖 🐄 🎤</div>
            <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-linear-to-r from-yellow-400 via-red-500 to-purple-600 mb-4">
              e-Beef is Served
            </h2>
            <p className="text-gray-300 text-lg mb-6 max-w-2xl mx-auto">
              Choose your favorite rappers, former message board personalities,
              fictional video game characters, and R&B royalty to face off in
              epic real-time AI rap battles.
            </p>
            {isAuthenticated ? (
              <Link
                href="/new-battle"
                className="inline-block px-8 py-4 bg-linear-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 rounded-lg text-white font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
              >
                Start Beefin'
              </Link>
            ) : (
              <Link
                href="/sign-in"
                className="inline-block px-8 py-4 bg-linear-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 rounded-lg text-white font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
              >
                Sign In to Create
              </Link>
            )}
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-6">
              <div className="text-4xl mb-3">🎤</div>
              <h3 className="text-xl font-bold text-white mb-2">3 Rounds</h3>
              <p className="text-gray-400 text-sm">
                8 bars per verse, alternating turns, pure&nbsp;skill
              </p>
            </div>

            <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-6">
              <div className="text-4xl mb-3">🏆</div>
              <h3 className="text-xl font-bold text-white mb-2">You Decide</h3>
              <p className="text-gray-400 text-sm">
                Automated scoring powers every battle. Vote in live events to
                crown the&nbsp;winner!
              </p>
            </div>

            <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-6">
              <div className="text-4xl mb-3">💬</div>
              <h3 className="text-xl font-bold text-white mb-2">Live Chat</h3>
              <p className="text-gray-400 text-sm">
                Join live battles to chat and react in real-time
              </p>
            </div>
          </div>

          {/* Live Battles or Coming Soon */}
          <LiveBattlesDisplay initialBattles={liveBattles} />

          {liveBattles.length === 0 && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8 mt-12">
              {/* Calendar Display */}
              <div className="flex justify-center mb-6">
                <Calendar
                  className="text-yellow-400 opacity-60"
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

              {hasArchivedBattles && (
                <div className="flex gap-4 justify-center flex-wrap">
                  <Link
                    href="/archive"
                    className="inline-block px-6 py-3 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-white font-bold transition-all"
                  >
                    View Archive
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Tagline at bottom */}
          <div className="mt-12">
            <p className="text-gray-500 text-lg">{TAGLINE}&trade;</p>
          </div>
        </div>
      </div>
    </>
  );
}
