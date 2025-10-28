import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { users, battles } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { decrypt } from "@/lib/auth/encryption";
import Link from "next/link";
import { Shield, User, Trash2, Star } from "lucide-react";

export default async function AdminDashboardPage() {
  // Check if user is admin
  const { sessionClaims } = await auth();

  if (sessionClaims?.metadata?.role !== "admin") {
    redirect("/");
  }

  // Fetch all users
  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));

  // Fetch all battles
  const allBattles = await db
    .select()
    .from(battles)
    .orderBy(desc(battles.createdAt));

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-purple-900 to-black">
      <div className="max-w-7xl mx-auto px-4 py-24">
        <div className="mb-8">
          <h1 className="font-bebas text-6xl text-white mb-2 flex items-center gap-3">
            <Shield className="text-purple-400" size={48} />
            Admin Dashboard
          </h1>
          <p className="text-gray-400 text-lg">Manage users and battles</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Management Section */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6">
            <h2 className="font-bebas text-3xl text-white mb-4 flex items-center gap-2">
              <User size={24} />
              Users ({allUsers.length})
            </h2>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {allUsers.map((user) => {
                const displayName = user.encryptedDisplayName
                  ? decrypt(user.encryptedDisplayName)
                  : user.encryptedName
                  ? decrypt(user.encryptedName)
                  : "Anonymous";

                const email = decrypt(user.encryptedEmail);

                return (
                  <div
                    key={user.id}
                    className="bg-gray-700/50 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {user.imageUrl && (
                        <img
                          src={user.imageUrl}
                          alt={displayName}
                          className="w-10 h-10 rounded-full"
                        />
                      )}
                      <div>
                        <div className="text-white font-semibold">
                          {displayName}
                        </div>
                        <div className="text-gray-400 text-sm">{email}</div>
                      </div>
                    </div>
                    <div>
                      {user.role === "admin" ? (
                        <span className="px-3 py-1 bg-purple-600 text-white text-sm rounded-full flex items-center gap-1">
                          <Shield size={14} />
                          Admin
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-600 text-gray-300 text-sm rounded-full">
                          User
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Battle Management Section */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bebas text-3xl text-white flex items-center gap-2">
                <Star size={24} />
                Battles ({allBattles.length})
              </h2>
              <Link
                href="/admin/battles/new"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Create Featured Battle
              </Link>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {allBattles.map((battle) => {
                const personas = {
                  left: battle.leftPersona as any,
                  right: battle.rightPersona as any,
                };

                return (
                  <div
                    key={battle.id}
                    className="bg-gray-700/50 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <Link
                          href={`/battle/${battle.id}`}
                          className="text-white font-semibold hover:text-purple-400 transition-colors"
                        >
                          {battle.title}
                        </Link>
                        <div className="text-gray-400 text-sm mt-1">
                          {personas.left.name} vs {personas.right.name}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              "Are you sure you want to delete this beef? This will also delete all votes and comments."
                            )
                          ) {
                            fetch(`/api/battle/${battle.id}/delete`, {
                              method: "DELETE",
                            }).then(() => {
                              window.location.reload();
                            });
                          }
                        }}
                        className="p-2 hover:bg-red-600 text-red-400 hover:text-white rounded transition-colors"
                        title="Delete battle"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          battle.isFeatured
                            ? "bg-purple-600/30 text-purple-300"
                            : "bg-gray-600/30 text-gray-400"
                        }`}
                      >
                        {battle.isFeatured ? "Featured" : "User Battle"}
                      </span>
                      <span className="text-gray-500">
                        {new Date(battle.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
