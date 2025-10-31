"use client";

import { useState, useEffect } from "react";
import { getAllPersonas } from "@/lib/shared/personas";
import type { Persona } from "@/lib/shared/battle-types";
import { useRouter } from "next/navigation";
import { SiteHeader } from "./site-header";
import { useAuth } from "@clerk/nextjs";
import { Switch } from "./ui/switch";
import { Radio, ThumbsUp, MessageSquare } from "lucide-react";

export function CharacterSelect() {
  const [player1, setPlayer1] = useState<Persona | null>(null);
  const [player2, setPlayer2] = useState<Persona | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createAsLive, setCreateAsLive] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [votingEnabled, setVotingEnabled] = useState(true);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const router = useRouter();

  // Check if features are globally enabled via env flags
  const isVotingGloballyEnabled = process.env.NEXT_PUBLIC_USER_BATTLE_VOTING !== 'false';
  const isCommentsGloballyEnabled = process.env.NEXT_PUBLIC_USER_BATTLE_COMMENTING !== 'false';

  // Check if user is admin
  const { userId, isLoaded } = useAuth();

  // Check admin status from database
  useEffect(() => {
    if (!userId || !isLoaded) {
      setIsAdmin(false);
      return;
    }

    const checkAdminStatus = async () => {
      try {
        const response = await fetch("/api/user/me");
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.user?.role === "admin");
        }
      } catch (error) {
        console.error("Failed to check admin status:", error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [userId, isLoaded]);

  const personas = getAllPersonas();

  const handlePersonaClick = (persona: Persona) => {
    if (!player1) {
      setPlayer1(persona);
    } else if (!player2 && persona.id !== player1.id) {
      setPlayer2(persona);
    } else if (player1.id === persona.id) {
      setPlayer1(null);
    } else if (player2?.id === persona.id) {
      setPlayer2(null);
    }
  };

  const isSelected = (persona: Persona) => {
    return player1?.id === persona.id || player2?.id === persona.id;
  };

  const getSelectionLabel = (persona: Persona) => {
    if (player1?.id === persona.id) return "P1";
    if (player2?.id === persona.id) return "P2";
    return null;
  };

  const handleStartBattle = async () => {
    if (!player1 || !player2) return;

    setIsCreating(true);

    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch("/api/battle/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leftPersonaId: player1.id,
          rightPersonaId: player2.id,
          isFeatured: createAsLive, // Only true if admin and toggle enabled
          votingEnabled,
          commentsEnabled,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create battle");
      }

      const { battleId } = await response.json();

      // If creating as live battle (admin), redirect to control panel
      // Otherwise, redirect to battle page
      if (createAsLive) {
        router.push(`/admin/battles/${battleId}/control`);
      } else {
        router.push(`/battle/${battleId}`);
      }

      // Don't reset isCreating here - let the navigation happen
      // If navigation fails, the finally block won't execute
    } catch (error) {
      console.error("Error creating battle:", error);

      // More specific error messages
      if (error instanceof Error && error.name === "AbortError") {
        alert("Request timed out. Please check your connection and try again.");
      } else if (error instanceof Error) {
        alert(error.message || "Failed to create battle. Please try again.");
      } else {
        alert("Failed to create battle. Please try again.");
      }

      // Reset state on error
      setIsCreating(false);
    }
  };

  return (
    <>
      <SiteHeader />
      <div style={{ height: "52px" }} />
      <div className="min-h-[calc(100vh-3.5rem)] bg-linear-to-b from-gray-950 via-gray-900 to-black flex flex-col items-center p-6 py-12">
        {/* Header */}
        <div className="w-full max-w-7xl mx-auto mb-8">
          <h1 className="text-5xl md:text-7xl font-bold text-center mb-4">
            <span className="bg-linear-to-r from-yellow-400 via-red-500 to-purple-600 text-transparent bg-clip-text">
              SELECT YOUR FIGHTERS
            </span>
          </h1>
          <p className="text-center text-gray-400 text-lg">
            Choose two personas to battle. Click to select Player 1, then Player
            2. Click again to deselect.
          </p>
        </div>

        {/* Selection Display */}
        <div className="w-full max-w-7xl mx-auto mb-8 grid grid-cols-2 gap-8">
          {/* Player 1 */}
          <div className="bg-linear-to-br from-blue-900/30 to-blue-950/30 border-2 border-blue-500 rounded-lg p-6 relative">
            <div className="text-blue-400 font-bold text-xl mb-4 text-center">
              PLAYER 1
            </div>
            <div className="text-center h-[220px] flex flex-col items-center justify-center py-4">
              {player1 ? (
                <>
                  <div className="w-24 h-24 shrink-0 mb-4 rounded-full border-4 border-blue-500 overflow-hidden bg-gray-800 flex items-center justify-center text-4xl text-white">
                    {player1.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className="text-white font-bold text-2xl mb-2">
                    {player1.name}
                  </div>
                  <div className="text-gray-400 text-sm">{player1.style}</div>
                </>
              ) : (
                <>
                  <div className="w-24 h-24 shrink-0 mb-4 rounded-full border-4 border-gray-700 overflow-hidden bg-gray-800 flex items-center justify-center text-6xl text-gray-600">
                    ?
                  </div>
                  <div className="text-gray-600 font-bold text-2xl mb-2">
                    No Selection
                  </div>
                  <div className="text-gray-600 text-sm animate-pulse">
                    Waiting for selection...
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Player 2 */}
          <div className="bg-linear-to-br from-red-900/30 to-red-950/30 border-2 border-red-500 rounded-lg p-6 relative">
            <div className="text-red-400 font-bold text-xl mb-4 text-center">
              PLAYER 2
            </div>
            <div className="text-center h-[220px] flex flex-col items-center justify-center py-4">
              {player2 ? (
                <>
                  <div className="w-24 h-24 shrink-0 mb-4 rounded-full border-4 border-red-500 overflow-hidden bg-gray-800 flex items-center justify-center text-4xl text-white">
                    {player2.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className="text-white font-bold text-2xl mb-2">
                    {player2.name}
                  </div>
                  <div className="text-gray-400 text-sm">{player2.style}</div>
                </>
              ) : (
                <>
                  <div className="w-24 h-24 shrink-0 mb-4 rounded-full border-4 border-gray-700 overflow-hidden bg-gray-800 flex items-center justify-center text-6xl text-gray-600">
                    ?
                  </div>
                  <div className="text-gray-600 font-bold text-2xl mb-2">
                    No Selection
                  </div>
                  <div className="text-gray-600 text-sm animate-pulse">
                    Waiting for selection...
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Character Grid */}
        <div className="w-full max-w-7xl mx-auto mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {personas.map((persona) => {
              const selected = isSelected(persona);
              const label = getSelectionLabel(persona);

              return (
                <button
                  key={persona.id}
                  onClick={() => handlePersonaClick(persona)}
                  className={`
                    relative group flex flex-col h-full
                    bg-linear-to-b from-gray-800 to-gray-900
                    border-4 rounded-xl overflow-hidden
                    transition-all duration-300 transform
                    hover:scale-105 hover:shadow-2xl
                    ${
                      selected
                        ? label === "P1"
                          ? "border-blue-500 shadow-blue-500/50 shadow-lg"
                          : "border-red-500 shadow-red-500/50 shadow-lg"
                        : "border-gray-700 hover:border-yellow-500"
                    }
                  `}
                  style={{
                    borderColor: selected
                      ? label === "P1"
                        ? "#3b82f6"
                        : "#ef4444"
                      : undefined,
                  }}
                >
                  {/* Selection Badge */}
                  {selected && (
                    <div
                      className={`
                        absolute top-2 right-2 z-10
                        px-3 py-1 rounded-full
                        font-bold text-sm
                        ${
                          label === "P1"
                            ? "bg-blue-500 text-white"
                            : "bg-red-500 text-white"
                        }
                      `}
                    >
                      {label}
                    </div>
                  )}

                  {/* Deselect Indicator - appears on hover of selected character */}
                  {selected && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 group-hover:backdrop-blur-md transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 z-20">
                      <div className="text-center">
                        <div className="text-white font-bold text-3xl mb-2">
                          ✕
                        </div>
                        <div className="text-white font-semibold text-base">
                          Click to Deselect
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Character Avatar */}
                  <div
                    className="h-40 flex items-center justify-center text-6xl font-bold bg-gray-800 relative"
                    style={{
                      background: `linear-gradient(135deg, ${persona.accentColor}22 0%, transparent 100%)`,
                    }}
                  >
                    <div
                      className="w-24 h-24 rounded-full border-4 flex items-center justify-center text-4xl text-white bg-gray-900"
                      style={{ borderColor: persona.accentColor }}
                    >
                      {persona.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                  </div>

                  {/* Character Info */}
                  <div className="p-4 bg-gray-900/80 backdrop-blur flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-1 truncate">
                      {persona.name}
                    </h3>
                    <p className="text-sm text-gray-400 mb-2">
                      {persona.style}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-3">
                      {persona.bio}
                    </p>
                  </div>

                  {/* Hover Overlay */}
                  {!selected && (
                    <div className="absolute inset-0 bg-yellow-500/0 group-hover:bg-yellow-500/10 transition-colors duration-300 pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Battle Options - Only show if at least one feature is globally enabled */}
        {(isVotingGloballyEnabled || isCommentsGloballyEnabled) && (
          <div className="w-full max-w-7xl mx-auto mb-6">
            <div className="bg-gray-800/50 border-2 border-gray-700 rounded-lg p-6 shadow-lg">
              <h3 className="text-white font-bold text-xl mb-4">Battle Options</h3>
              <div className="space-y-4">
                {/* Voting Toggle - Only show if globally enabled */}
                {isVotingGloballyEnabled && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-900/50 border border-blue-500/50">
                        <ThumbsUp size={20} className="text-blue-400" />
                      </div>
                      <div>
                        <div className="text-white font-semibold">Enable Voting</div>
                        <div className="text-gray-400 text-sm">
                          Allow viewers to vote for their favorite verses
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={votingEnabled}
                      onCheckedChange={setVotingEnabled}
                    />
                  </div>
                )}

                {/* Comments Toggle - Only show if globally enabled */}
                {isCommentsGloballyEnabled && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-900/50 border border-green-500/50">
                        <MessageSquare size={20} className="text-green-400" />
                      </div>
                      <div>
                        <div className="text-white font-semibold">Enable Comments</div>
                        <div className="text-gray-400 text-sm">
                          Allow viewers to leave comments on the battle
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={commentsEnabled}
                      onCheckedChange={setCommentsEnabled}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Admin Toggle for Live Battle */}
        {isAdmin && (
          <div className="w-full max-w-7xl mx-auto mb-6 flex justify-center">
            <div className="flex items-center gap-4 bg-purple-900/30 border-2 border-purple-500/50 rounded-lg px-6 py-4 shadow-lg">
              <div className="flex items-center gap-2 text-purple-400">
                <Radio size={20} />
              </div>
              <div className="flex-1">
                <div className="text-white font-bold text-lg">Go Live</div>
                <div className="text-purple-300 text-sm">
                  Create as featured battle on homepage
                </div>
              </div>
              <Switch
                checked={createAsLive}
                onCheckedChange={setCreateAsLive}
              />
            </div>
          </div>
        )}

        {/* Start Battle Button */}
        <div className="w-full max-w-7xl mx-auto text-center">
          <button
            onClick={handleStartBattle}
            disabled={!player1 || !player2 || isCreating}
            className={`
              px-12 py-4 rounded-lg font-bold text-xl
              transition-all duration-300 transform
              ${
                player1 && player2 && !isCreating
                  ? "bg-linear-to-r from-yellow-400 via-red-500 to-purple-600 hover:scale-105 hover:shadow-2xl text-white"
                  : "bg-gray-800 text-gray-600 cursor-not-allowed"
              }
            `}
          >
            {isCreating
              ? "CREATING BATTLE..."
              : player1 && player2
              ? createAsLive
                ? "START LIVE BATTLE"
                : "START BATTLE"
              : "SELECT YOUR FIGHTERS"}
          </button>
        </div>

        {/* Back Link */}
        <div className="mt-8">
          <a
            href="/"
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </>
  );
}
