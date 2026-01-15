"use client";

import { Eye, EyeOff, Music, Search, Shield, Swords, User, UserX, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { DeleteBattleButton } from "@/components/admin/delete-battle-button";
import { DeleteUserButton } from "@/components/admin/delete-user-button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { BattleDB, UserDB } from "@/lib/db/schema";

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
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredUsers = React.useMemo(() => {
    if (!searchTerm) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(
      (u) =>
        u.displayName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  const selectedUser = users.find((u) => u.id === selectedUserId);
  const filteredBattles = userBattles.filter((battle) => !battle.isFeatured);

  const handleUserClick = async (userId: string) => {
    if (selectedUserId === userId) return;
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
    <div className="flex flex-col lg:flex-row gap-8 lg:h-[750px] min-h-[600px]">
      {/* Sidebar: User List */}
      <div className="w-full lg:w-[400px] flex flex-col gap-4 h-full">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4 flex flex-col gap-4 h-full overflow-hidden">
          <div className="flex items-center justify-between">
            <h2 className="font-bebas text-3xl text-white flex items-center gap-2">
              <User size={24} className="text-purple-400" />
              Users ({users.length})
            </h2>
          </div>

          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              size={18}
            />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-900/50 border border-gray-700 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No users found
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isSelected = selectedUserId === user.id;
                return (
                  <button
                    key={user.id}
                    onClick={() => handleUserClick(user.id)}
                    className={`w-full text-left group flex items-center gap-3 p-3 rounded-lg transition-all ${
                      isSelected
                        ? "bg-purple-600/20 border border-purple-500/40"
                        : "hover:bg-gray-700/50 border border-transparent"
                    }`}
                  >
                    <div className="relative w-10 h-10 shrink-0">
                      {user.imageUrl ? (
                        <Image
                          src={user.imageUrl}
                          alt={user.displayName}
                          fill
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-700 rounded-full flex items-center justify-center">
                          <User size={20} className="text-gray-500" />
                        </div>
                      )}
                      {user.role === "admin" && (
                        <div className="absolute -top-1 -right-1 bg-purple-600 rounded-full p-0.5 border border-gray-900">
                          <Shield size={10} className="text-white" />
                        </div>
                      )}
                    </div>
                                <div className="min-w-0 flex-1">
                                      <div className="flex items-center justify-between gap-2">
                                        <div
                                          className={`font-semibold truncate ${
                                            user.isDeleted
                                              ? "text-red-400 line-through"
                                              : isSelected
                                                ? "text-purple-400"
                                                : "text-white"
                                          }`}
                                        >
                                          {user.displayName}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          {user.isDeleted && (
                                            <span className="flex items-center gap-1 text-[10px] bg-red-900/50 text-red-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider border border-red-500/30">
                                              <UserX size={10} />
                                              Deleted
                                            </span>
                                          )}
                                          {user.id === currentUserId && (
                                            <span className="text-[10px] bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                                              You
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="text-gray-500 text-xs truncate">
                                        {user.email}
                                      </div>
                                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Main Content: User Details & Battles */}
      <div className="flex-1 min-w-0 h-full">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 h-full flex flex-col overflow-hidden">
          {!selectedUser ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-4">
              <div className="w-20 h-20 bg-gray-900/50 rounded-full flex items-center justify-center border border-gray-800">
                <User size={40} className="opacity-20" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-400 mb-1">
                  No User Selected
                </h3>
                <p>Select a user from the list to manage their battles</p>
              </div>
            </div>
          ) : (
            <>
              {/* Selected User Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-700/50">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 shrink-0">
                    {selectedUser.imageUrl ? (
                      <Image
                        src={selectedUser.imageUrl}
                        alt={selectedUser.displayName}
                        fill
                        className="rounded-full object-cover ring-2 ring-purple-500/20 ring-offset-2 ring-offset-gray-900"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-700 rounded-full flex items-center justify-center ring-2 ring-purple-500/20 ring-offset-2 ring-offset-gray-900">
                        <User size={32} className="text-gray-500" />
                      </div>
                    )}
                  </div>
                  <div>
                                    <div className="flex items-center gap-3">
                                      <h2 className={`text-3xl font-bebas ${selectedUser.isDeleted ? "text-red-400 line-through" : "text-white"}`}>
                                        {selectedUser.displayName}
                                      </h2>
                                      {selectedUser.isDeleted && (
                                        <span className="flex items-center gap-1.5 text-xs bg-red-900/50 text-red-400 px-2 py-1 rounded uppercase font-bold tracking-wider border border-red-500/30">
                                          <UserX size={12} />
                                          Account Deleted
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-400">
                                      <span>{selectedUser.email}</span>
                                      <span className="w-1 h-1 bg-gray-600 rounded-full" />
                                      <span className="capitalize">{selectedUser.role}</span>
                                      {selectedUser.isDeleted && selectedUser.deletedAt && (
                                        <>
                                          <span className="w-1 h-1 bg-gray-600 rounded-full" />
                                          <span className="text-red-400">
                                            Deleted {new Date(selectedUser.deletedAt).toLocaleDateString()}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/profile/${selectedUser.id}`}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                  >
                    <Eye size={16} />
                    View Profile
                  </Link>
                  {selectedUser.id !== currentUserId &&
                    selectedUser.role !== "admin" && (
                      <DeleteUserButton
                        userId={selectedUser.id}
                        userName={selectedUser.displayName}
                        userEmail={selectedUser.email}
                      />
                    )}
                </div>
              </div>

              {/* Battles List Section */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bebas text-2xl text-white flex items-center gap-2">
                    <Swords size={20} className="text-purple-400" />
                    Battles ({filteredBattles.length})
                  </h3>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 pr-2 space-y-3 custom-scrollbar">
                  {isLoadingBattles ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500">
                      <LoadingSpinner size="xl" variant="accent" />
                      <p>Loading user's battles...</p>
                    </div>
                  ) : filteredBattles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500 border-2 border-dashed border-gray-700 rounded-xl">
                      <Swords size={40} className="opacity-20" />
                      <p className="text-pretty">This user hasn't created any battles yet</p>
                    </div>
                  ) : (
                    filteredBattles.map((battle) => {
                      const personas = {
                        player1: battle.player1Persona as any,
                        player2: battle.player2Persona as any,
                      };

                      return (
                        <div
                          key={battle.id}
                          className={`group relative rounded-xl p-4 transition-all ${
                            battle.isLive
                              ? "bg-red-900/10 border border-red-500/30"
                              : "bg-gray-900/40 border border-gray-700 hover:border-purple-500/30"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                {battle.isLive && (
                                  <span className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold uppercase rounded border border-red-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    Live
                                  </span>
                                )}
                                <Link
                                  href={`/battle/${battle.id}`}
                                  className="text-white font-semibold hover:text-purple-400 transition-colors truncate block"
                                >
                                  {battle.title}
                                </Link>
                              </div>

                              <div className="flex items-center gap-3 text-sm text-gray-400 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <div className="relative w-6 h-6 shrink-0">
                                    <Image
                                      src={personas.player1.avatar}
                                      alt={personas.player1.name}
                                      fill
                                      className="rounded-full object-cover border border-white/10"
                                    />
                                  </div>
                                  <span
                                    className="font-medium"
                                    style={{
                                      color: personas.player1.accentColor,
                                    }}
                                  >
                                    {personas.player1.name}
                                  </span>
                                </div>
                                <span className="text-gray-600 font-bold">
                                  VS
                                </span>
                                <div className="flex items-center gap-2">
                                  <div className="relative w-6 h-6 shrink-0">
                                    <Image
                                      src={personas.player2.avatar}
                                      alt={personas.player2.name}
                                      fill
                                      className="rounded-full object-cover border border-white/10"
                                    />
                                  </div>
                                  <span
                                    className="font-medium"
                                    style={{
                                      color: personas.player2.accentColor,
                                    }}
                                  >
                                    {personas.player2.name}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 mt-4 flex-wrap">
                                <span className="text-gray-500 text-xs">
                                  {new Date(
                                    battle.createdAt
                                  ).toLocaleDateString()}
                                </span>
                                <span className="w-1 h-1 bg-gray-700 rounded-full" />
                                <div
                                  className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${
                                    battle.isPublic
                                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                                      : "bg-gray-700/50 text-gray-500 border-gray-600/30"
                                  }`}
                                >
                                  {battle.isPublic ? (
                                    <>
                                      <Eye size={10} />
                                      Public
                                    </>
                                  ) : (
                                    <>
                                      <EyeOff size={10} />
                                      Private
                                    </>
                                  )}
                                </div>
                                {battle.generatedSong && (
                                  <div className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                                    <Music size={10} />
                                    Music
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link
                                href={`/admin/battles/${battle.id}`}
                                className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors border border-gray-700"
                                title="Admin Details"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              <DeleteBattleButton
                                battleId={battle.id}
                                battleTitle={battle.title}
                                onDeleteSuccess={() =>
                                  handleBattleDeleted(battle.id)
                                }
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
