import { getAllBattles } from "@/lib/battle-storage";
import Link from "next/link";
import { Radio } from "lucide-react";

// Revalidate every 5 seconds to show live status
export const revalidate = 5;

export default async function BattlesListPage() {
  const battles = await getAllBattles();
  const liveBattles = battles.filter((b) => b.isLive);
  const otherBattles = battles.filter((b) => !b.isLive);

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6">All Battles</h1>

      {battles.length === 0 ? (
        <div className="text-gray-400">No battles found. Create one first!</div>
      ) : (
        <div className="space-y-8">
          {/* Live Battles */}
          {liveBattles.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-red-400 mb-3 flex items-center gap-2">
                <Radio className="w-5 h-5" />
                Live Now ({liveBattles.length})
              </h2>
              <div className="space-y-4">
                {liveBattles.map((battle) => (
                  <div
                    key={battle.id}
                    className="bg-linear-to-br from-red-900/30 to-gray-800 border-2 border-red-500/50 p-4 rounded flex justify-between items-center"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <div className="font-bold text-red-400">
                          🔴 BROADCASTING
                        </div>
                      </div>
                      <div className="font-bold text-lg">{battle.title}</div>
                      <div className="text-sm text-gray-400">
                        {battle.personas.left.name} vs{" "}
                        {battle.personas.right.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Round {battle.currentRound}/3 | {battle.verses.length}{" "}
                        verses | {battle.comments.length} comments
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/battle/${battle.id}`}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                      >
                        View Live
                      </Link>
                      <Link
                        href={`/admin/battles/${battle.id}/control`}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-bold"
                      >
                        ⚡ Control Panel
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other Battles */}
          {otherBattles.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-400 mb-3">
                All Battles ({otherBattles.length})
              </h2>
              <div className="space-y-4">
                {otherBattles.map((battle) => (
                  <div
                    key={battle.id}
                    className="bg-gray-800 p-4 rounded flex justify-between items-center"
                  >
                    <div>
                      <div className="font-bold">{battle.title}</div>
                      <div className="text-sm text-gray-400">
                        {battle.personas.left.name} vs{" "}
                        {battle.personas.right.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        Status: {battle.status} | ID: {battle.id}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/battle/${battle.id}`}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                      >
                        View Battle
                      </Link>
                      <Link
                        href={`/admin/battles/${battle.id}/control`}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm"
                      >
                        Control Panel
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
  );
}
