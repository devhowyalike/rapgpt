import { getAllBattles } from "@/lib/battle-storage";
import Link from "next/link";
import { Radio, Shield } from "lucide-react";
import { checkRole } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";

// Revalidate every 5 seconds to show live status
export const revalidate = 5;
export const dynamic = "force-dynamic";

export default async function BattlesListPage() {
  // Check if user is admin
  const isAdmin = await checkRole("admin");
  if (!isAdmin) {
    redirect("/");
  }

  const battles = await getAllBattles();
  const liveBattles = battles.filter((b) => b.isLive);
  const otherBattles = battles.filter((b) => !b.isLive);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-purple-900 to-black">
      <SiteHeader />
      <div className="max-w-7xl mx-auto px-4 py-24">
        <div className="mb-8">
          <h1 className="font-bebas text-6xl text-white mb-2 flex items-center gap-3">
            <Shield className="text-purple-400" size={48} />
            All Battles
          </h1>
          <p className="text-gray-400 text-lg">
            Monitor and manage all battles
          </p>
        </div>

        {battles.length === 0 ? (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6">
            <p className="text-gray-400">
              No battles found. Create one first!
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Live Battles */}
            {liveBattles.length > 0 && (
              <div className="bg-gray-800/50 backdrop-blur-sm border border-red-500/30 rounded-lg p-6">
                <h2 className="font-bebas text-3xl text-white mb-4 flex items-center gap-2">
                  <Radio className="w-6 h-6 text-red-400" />
                  <span className="text-red-400">
                    Live Now ({liveBattles.length})
                  </span>
                </h2>
                <div className="space-y-4">
                  {liveBattles.map((battle) => (
                    <div
                      key={battle.id}
                      className="bg-red-900/20 border border-red-500/30 p-6 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-red-400 text-xs font-bold uppercase">
                              Broadcasting
                            </span>
                          </div>
                          <h3 className="font-bebas text-2xl text-white mb-2">
                            {battle.title}
                          </h3>
                          <div className="text-gray-400 mb-2">
                            {battle.personas.left.name} vs{" "}
                            {battle.personas.right.name}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Round {battle.currentRound}/3</span>
                            <span>•</span>
                            <span>{battle.verses.length} verses</span>
                            <span>•</span>
                            <span>{battle.comments.length} comments</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-400 mt-2">
                            <span>
                              Created by:{" "}
                              {battle.creator?.displayName || "Unknown"}
                            </span>
                            <span>•</span>
                            <span>
                              {new Date(battle.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Link
                          href={`/battle/${battle.id}`}
                          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          View Live
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other Battles */}
            {otherBattles.length > 0 && (
              <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6">
                <h2 className="font-bebas text-3xl text-white mb-4">
                  All Battles ({otherBattles.length})
                </h2>
                <div className="space-y-4">
                  {otherBattles.map((battle) => (
                    <div
                      key={battle.id}
                      className="bg-gray-700/50 p-6 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-bebas text-2xl text-white mb-2">
                            {battle.title}
                          </h3>
                          <div className="text-gray-400 mb-2">
                            {battle.personas.left.name} vs{" "}
                            {battle.personas.right.name}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Status: {battle.status}</span>
                            <span>•</span>
                            <span>ID: {battle.id}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-400 mt-2">
                            <span>
                              Created by:{" "}
                              {battle.creator?.displayName || "Unknown"}
                            </span>
                            <span>•</span>
                            <span>
                              {new Date(battle.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Link
                          href={`/battle/${battle.id}`}
                          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          View Battle
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
