import Link from "next/link";
import { getCurrentBattle } from "@/lib/battle-storage";
import { BattleController } from "@/components/battle-controller";
import { SiteHeader } from "@/components/site-header";
import { APP_TITLE, TAGLINE } from "@/lib/constants";
import { auth } from "@clerk/nextjs/server";

export default async function Home() {
  const currentBattle = await getCurrentBattle();
  const { sessionClaims } = await auth();
  const isAdmin = sessionClaims?.metadata?.role === "admin";
  const isAuthenticated = !!sessionClaims;

  if (currentBattle) {
    return <BattleController initialBattle={currentBattle} />;
  }

  return (
    <>
      <SiteHeader />
      <div style={{ height: "52px" }} />
      <div className="min-h-[calc(100vh-3.5rem)] bg-linear-to-b from-stage-darker to-stage-dark flex flex-col items-center justify-center p-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Logo */}
          <h1 className="text-6xl md:text-8xl font-bold tracking-wider">
            <span className="bg-linear-to-r from-yellow-400 via-red-500 to-purple-600 text-transparent bg-clip-text">
              {APP_TITLE}
            </span>
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto">
            AI Keystyle Rap Battles
          </p>

          {/* Coming Soon / No Active Battle */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8 mt-8">
            <h2 className="text-3xl font-(family-name:--font-bebas-neue) text-yellow-400 mb-4">
              No Live Battles Currently
            </h2>
            <p className="text-gray-400 mb-6">
              Check back soon for the next epic showdown, or browse past battles
              in the archive.
            </p>

            <div className="flex gap-4 justify-center flex-wrap">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/my-battles/new"
                    className="inline-block px-6 py-3 bg-linear-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 rounded-lg text-white font-bold transition-all"
                  >
                    Create Your Battle
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin/battles/new"
                      className="inline-block px-6 py-3 bg-linear-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 rounded-lg text-white font-bold transition-all"
                    >
                      Create Featured Battle
                    </Link>
                  )}
                </>
              ) : (
                <Link
                  href="/sign-in"
                  className="inline-block px-6 py-3 bg-linear-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 rounded-lg text-white font-bold transition-all"
                >
                  Sign In to Create Battles
                </Link>
              )}
              <Link
                href="/archive"
                className="inline-block px-6 py-3 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-white font-bold transition-all"
              >
                View Archive
              </Link>
            </div>
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
                Automated scoring + your votes determine the&nbsp;winner
              </p>
            </div>

            <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-6">
              <div className="text-4xl mb-3">💬</div>
              <h3 className="text-xl font-bold text-white mb-2">Live Chat</h3>
              <p className="text-gray-400 text-sm">
                Comment and react as the battle&nbsp;unfolds
              </p>
            </div>
          </div>

          {/* Tagline at bottom */}
          <div className="mt-12 pt-8 border-t border-gray-800">
            <p className="text-gray-500 text-lg">{TAGLINE}&trade;</p>
          </div>
        </div>
      </div>
    </>
  );
}
