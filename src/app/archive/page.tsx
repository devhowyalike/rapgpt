import Link from "next/link";
import { getAllBattles } from "@/lib/battle-storage";

// Always fetch fresh data to immediately reflect battle completions
export const revalidate = 0;

export default async function ArchivePage() {
  const battles = await getAllBattles();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-linear-to-b from-stage-darker to-stage-dark">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-white transition-colors mb-4 inline-block"
          >
            ← Back to Home
          </Link>

          <h1 className="text-5xl md:text-7xl font-(family-name:--font-bebas-neue) tracking-wider mb-4">
            <span className="bg-linear-to-r from-yellow-400 via-red-500 to-purple-600 text-transparent bg-clip-text">
              Battle Archive
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            Relive the greatest AI keystyle battles
          </p>
        </div>

        {/* Battles Grid */}
        {battles.length === 0 ? (
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-12 text-center">
            <p className="text-gray-400 text-lg">
              No battles yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {battles.map((battle) => {
              const winner = battle.winner
                ? battle.personas.left.id === battle.winner
                  ? battle.personas.left
                  : battle.personas.right
                : null;

              return (
                <Link
                  key={battle.id}
                  href={`/battle/${battle.id}`}
                  className="block bg-gray-900/50 border border-gray-800 rounded-lg p-6 hover:border-gray-600 transition-all hover:scale-[1.02]"
                >
                  {/* Battle Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-(family-name:--font-bebas-neue) text-white">
                        {battle.title}
                      </h2>
                      <p className="text-sm text-gray-400">
                        {new Date(battle.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </p>
                    </div>
                    <div
                      className={`
                        px-3 py-1 rounded-full text-xs font-medium
                        ${
                          battle.status === "completed"
                            ? "bg-green-900 text-green-300"
                            : ""
                        }
                        ${
                          battle.status === "ongoing"
                            ? "bg-blue-900 text-blue-300"
                            : ""
                        }
                        ${
                          battle.status === "upcoming"
                            ? "bg-yellow-900 text-yellow-300"
                            : ""
                        }
                        ${
                          battle.status === "incomplete"
                            ? "bg-red-900 text-red-300"
                            : ""
                        }
                      `}
                    >
                      {battle.status === "incomplete"
                        ? "INCOMPLETE"
                        : battle.status.toUpperCase()}
                    </div>
                  </div>

                  {/* Personas */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
                        style={{
                          backgroundColor:
                            battle.personas.left.accentColor + "40",
                          color: battle.personas.left.accentColor,
                        }}
                      >
                        {battle.personas.left.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div
                          className="font-medium truncate"
                          style={{ color: battle.personas.left.accentColor }}
                        >
                          {battle.personas.left.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {battle.personas.left.style}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
                        style={{
                          backgroundColor:
                            battle.personas.right.accentColor + "40",
                          color: battle.personas.right.accentColor,
                        }}
                      >
                        {battle.personas.right.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div
                          className="font-medium truncate"
                          style={{ color: battle.personas.right.accentColor }}
                        >
                          {battle.personas.right.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {battle.personas.right.style}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Winner or Incomplete Notice */}
                  {battle.status === "incomplete" ? (
                    <div className="border-t border-gray-800 pt-4 mt-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">⚠️</span>
                        <div>
                          <div className="text-xs text-gray-400">STATUS</div>
                          <div className="font-bold text-lg text-red-400">
                            Match was cancelled
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : winner ? (
                    <div className="border-t border-gray-800 pt-4 mt-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🏆</span>
                        <div>
                          <div className="text-xs text-gray-400">WINNER</div>
                          <div
                            className="font-bold text-lg"
                            style={{ color: winner.accentColor }}
                          >
                            {winner.name}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Stats */}
                  <div className="flex gap-4 text-sm text-gray-400 mt-4 pt-4 border-t border-gray-800">
                    <div>
                      <span className="font-medium">
                        {battle.verses.length}
                      </span>{" "}
                      verses
                    </div>
                    <div>
                      <span className="font-medium">
                        {battle.comments.length}
                      </span>{" "}
                      comments
                    </div>
                    <div>
                      <span className="font-medium">
                        {battle.scores.length}
                      </span>{" "}
                      rounds
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
