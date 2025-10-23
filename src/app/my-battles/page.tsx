import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { battles, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import Link from "next/link";
import { Plus, Share2, Trash2, ExternalLink } from "lucide-react";

export default async function MyBattlesPage() {
  // Require authentication
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    redirect("/sign-in");
  }

  // Get user from database
  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkUserId),
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-xl">
            User not found. Please try signing out and back in.
          </p>
        </div>
      </div>
    );
  }

  // Fetch user's battles
  const myBattles = await db
    .select()
    .from(battles)
    .where(and(eq(battles.createdBy, user.id), eq(battles.isFeatured, false)))
    .orderBy(desc(battles.createdAt));

  const shareUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "";

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-purple-900 to-black">
      <div className="max-w-6xl mx-auto px-4 py-24">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-bebas text-6xl text-white mb-2">My Battles</h1>
            <p className="text-gray-400 text-lg">
              Create and manage your personal battles
            </p>
          </div>
          <Link
            href="/my-battles/new"
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold"
          >
            <Plus size={20} />
            Create Battle
          </Link>
        </div>

        {myBattles.length === 0 ? (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-12 text-center">
            <h2 className="font-bebas text-3xl text-white mb-4">
              No Battles Yet
            </h2>
            <p className="text-gray-400 mb-6">
              Create your first battle to see it here
            </p>
            <Link
              href="/my-battles/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold"
            >
              <Plus size={20} />
              Create Your First Battle
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {myBattles.map((battle) => {
              const personas = {
                left: battle.leftPersona as any,
                right: battle.rightPersona as any,
              };

              const battleUrl = `${shareUrl}/battle/${battle.id}`;

              return (
                <div
                  key={battle.id}
                  className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/40 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <Link
                        href={`/battle/${battle.id}`}
                        className="font-bebas text-3xl text-white hover:text-purple-400 transition-colors flex items-center gap-2"
                      >
                        {battle.title}
                        <ExternalLink size={20} />
                      </Link>
                      <p className="text-gray-400 mt-1">
                        {personas.left.name} vs {personas.right.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm mb-4">
                    <span
                      className={`px-3 py-1 rounded ${
                        battle.status === "completed"
                          ? "bg-green-600/30 text-green-300"
                          : battle.status === "ongoing"
                          ? "bg-yellow-600/30 text-yellow-300"
                          : "bg-gray-600/30 text-gray-400"
                      }`}
                    >
                      {battle.status}
                    </span>
                    <span className="text-gray-500">
                      Created {new Date(battle.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(battleUrl);
                        alert("Link copied to clipboard!");
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      <Share2 size={16} />
                      Share Link
                    </button>

                    <Link
                      href={`/battle/${battle.id}`}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                      View Battle
                    </Link>

                    <button
                      onClick={() => {
                        if (
                          confirm(
                            "Are you sure you want to delete this battle? This will also delete all votes and comments."
                          )
                        ) {
                          fetch(`/api/battle/${battle.id}/delete`, {
                            method: "DELETE",
                          }).then(() => {
                            window.location.reload();
                          });
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors ml-auto"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
