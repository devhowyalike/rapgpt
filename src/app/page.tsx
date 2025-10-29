import Link from "next/link";
import { getCurrentBattle, getLiveBattles } from "@/lib/battle-storage";
import { BattleController } from "@/components/battle-controller";
import { SiteHeader } from "@/components/site-header";
import { APP_TITLE, TAGLINE } from "@/lib/constants";
import { auth } from "@clerk/nextjs/server";
import { Calendar, Radio, Users, Clock } from "lucide-react";

// Revalidate every 10 seconds to show live battles
export const revalidate = 10;

export default async function Home() {
  const currentBattle = await getCurrentBattle();
  const liveBattles = await getLiveBattles();
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

          {/* Live Battles or Coming Soon */}
          {liveBattles.length > 0 ? (
            <div className="space-y-6 mt-12">
              {liveBattles.map((battle) => (
                <div
                  key={battle.id}
                  className="bg-linear-to-br from-red-900/30 via-gray-900/50 to-gray-900/50 border-2 border-red-500/50 rounded-lg p-8 shadow-2xl hover:border-red-400/70 transition-all"
                >
                  {/* Live Indicator */}
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-600/20 rounded-full">
                      <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-red-500 font-bold text-lg">
                        🔴 LIVE NOW
                      </span>
                    </div>
                  </div>

                  {/* Battle Title */}
                  <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 text-transparent bg-clip-text bg-linear-to-r from-red-400 via-yellow-400 to-purple-500">
                    {battle.title}
                  </h2>

                  {/* Matchup */}
                  <div className="flex items-center justify-center gap-4 md:gap-8 mb-6 flex-wrap">
                    <div className="text-center">
                      <div className="text-5xl mb-2">
                        {battle.personas.left.avatar || "🎤"}
                      </div>
                      <div className="text-lg font-bold text-white">
                        {battle.personas.left.name}
                      </div>
                      <div className="text-sm text-gray-400">
                        {battle.personas.left.style}
                      </div>
                    </div>

                    <div className="text-4xl font-bold text-red-500">VS</div>

                    <div className="text-center">
                      <div className="text-5xl mb-2">
                        {battle.personas.right.avatar || "🎤"}
                      </div>
                      <div className="text-lg font-bold text-white">
                        {battle.personas.right.name}
                      </div>
                      <div className="text-sm text-gray-400">
                        {battle.personas.right.style}
                      </div>
                    </div>
                  </div>

                  {/* Battle Stats */}
                  <div className="flex items-center justify-center gap-6 mb-6 flex-wrap text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Round {battle.currentRound}/3</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{battle.verses.length} verses</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4" />
                      <span>{battle.comments.length} comments</span>
                    </div>
                  </div>

                  {/* Watch Button */}
                  <div className="flex justify-center">
                    <Link
                      href={`/battle/${battle.id}`}
                      className="inline-flex items-center gap-2 px-8 py-4 bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg text-white font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
                    >
                      <Radio className="w-5 h-5" />
                      Watch Live
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
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

              <div className="flex gap-4 justify-center flex-wrap">
                {isAdmin && (
                  <Link
                    href="/admin/battles/new"
                    className="inline-block px-6 py-3 bg-linear-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 rounded-lg text-white font-bold transition-all"
                  >
                    Create Featured Battle
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
