"use client";

import * as React from "react";
import Link from "next/link";
import { Shield, User, Star, Music, Eye, EyeOff } from "lucide-react";
import { DeleteBattleButton } from "@/components/admin/delete-battle-button";
import { DeleteUserButton } from "@/components/admin/delete-user-button";
import type { UserDB, BattleDB } from "@/lib/db/schema";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface AdminDashboardClientProps {
  users: Array<UserDB & { displayName: string; email: string }>;
  currentUserId?: string;
}

export function AdminDashboardClient({
  users,
  currentUserId,
}: AdminDashboardClientProps) {
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(
    null
  );
  const [userBattles, setUserBattles] = React.useState<BattleDB[]>([]);
  const [isLoadingBattles, setIsLoadingBattles] = React.useState(false);

  const selectedUser = users.find((u) => u.id === selectedUserId);

  const handleUserClick = async (userId: string) => {
    setSelectedUserId(userId);
    setIsLoadingBattles(true);
    try {
      const response = await fetch(`/api/user/${userId}/battles`);
      if (response.ok) {
        const data = await response.json();
        setUserBattles(data.battles);
      } else {
        console.error("Failed to fetch user battles");
        setUserBattles([]);
      }
    } catch (error) {
      console.error("Error fetching user battles:", error);
      setUserBattles([]);
    } finally {
      setIsLoadingBattles(false);
    }
  };

  const handleBattleDeleted = (battleId: string) => {
    setUserBattles((prev) => prev.filter((battle) => battle.id !== battleId));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* User Management Section */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6">
        <h2 className="font-bebas text-3xl text-white mb-4 flex items-center gap-2">
          <User size={24} />
          Users ({users.length})
        </h2>

        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 py-1">
          {users.map((user) => {
            const isSelected = selectedUserId === user.id;
            return (
              <div
                key={user.id}
                className={`w-full bg-gray-700/50 rounded-lg p-4 transition-all ${
                  isSelected
                    ? "border-2 border-purple-500 bg-gray-600/50"
                    : "border-2 border-transparent"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => handleUserClick(user.id)}
                    className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
                  >
                    {user.imageUrl && (
                      <img
                        src={user.imageUrl}
                        alt={user.displayName}
                        className="w-10 h-10 rounded-full"
                      />
                    )}
                    <div className="text-left">
                      <div className="text-white font-semibold">
                        {user.displayName}
                      </div>
                      <div className="text-gray-400 text-sm">{user.email}</div>
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
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
                    {/* Only show delete button if not the current user and not an admin */}
                    {user.id !== currentUserId && user.role !== "admin" && (
                      <DeleteUserButton
                        userId={user.id}
                        userName={user.displayName}
                        userEmail={user.email}
                      />
                    )}
                  </div>
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
            {selectedUser ? (
              <>
                {selectedUser.displayName}'s Battles ({userBattles.length})
              </>
            ) : (
              <>Select a User</>
            )}
          </h2>
        </div>

        {!selectedUser ? (
          <div className="flex items-center justify-center h-[400px] text-gray-400">
            <div className="text-center">
              <User size={48} className="mx-auto mb-4 opacity-50" />
              <p>Select a user to view their battles</p>
            </div>
          </div>
        ) : isLoadingBattles ? (
          <div className="flex items-center justify-center h-[400px] text-gray-400">
            <div className="text-center">
              <LoadingSpinner size="xl" variant="accent" className="mx-auto mb-4" />
              <p>Loading battles...</p>
            </div>
          </div>
        ) : userBattles.length === 0 ? (
          <div className="flex items-center justify-center h-[400px] text-gray-400">
            <div className="text-center">
              <Star size={48} className="mx-auto mb-4 opacity-50" />
              <p>This user has no battles yet</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {userBattles.map((battle) => {
              const personas = {
                player1: battle.player1Persona as any,
                player2: battle.player2Persona as any,
              };

              return (
                <div
                  key={battle.id}
                  className={`rounded-lg p-4 ${
                    battle.isLive
                      ? "bg-red-900/20 border border-red-500/30"
                      : "bg-gray-700/50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      {battle.isLive && (
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-red-400 text-xs font-bold uppercase">
                            Live Now
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/battle/${battle.id}`}
                          className="text-white font-semibold hover:text-purple-400 transition-colors underline underline-offset-2"
                        >
                          {battle.title}
                        </Link>
                      </div>
                      <div className="text-gray-400 text-sm mt-1">
                        {personas.player1.name} vs. {personas.player2.name}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/battles/${battle.id}`}
                        className="p-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                        title="View Battle Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <DeleteBattleButton
                        battleId={battle.id}
                        battleTitle={battle.title}
                        onDeleteSuccess={() => handleBattleDeleted(battle.id)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        battle.isFeatured
                          ? "bg-purple-600/30 text-purple-300"
                          : "bg-gray-600/30 text-gray-400"
                      }`}
                    >
                      {battle.isFeatured ? "Featured" : "User Battle"}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                        battle.isPublic
                          ? "bg-green-600/20 text-green-400"
                          : "bg-gray-600/30 text-gray-500"
                      }`}
                    >
                      {battle.isPublic ? (
                        <>
                          <Eye className="w-3 h-3" />
                          Public
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" />
                          Private
                        </>
                      )}
                    </span>
                    {battle.generatedSong && (
                      <span className="px-2 py-1 rounded text-xs flex items-center gap-1 bg-green-600/20 text-green-400 border border-green-500/30">
                        <Music className="w-3 h-3" />
                        Music Generated
                      </span>
                    )}
                    <span className="text-gray-500">
                      {new Date(battle.createdAt).toLocaleDateString()}
                    </span>
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
