"use client";

import { useState, useEffect } from "react";
import { getAllPersonas } from "@/lib/shared/personas";
import type { Persona } from "@/lib/shared/battle-types";
import { useRouter } from "next/navigation";
import { SiteHeader } from "./site-header";
import { useAuth } from "@clerk/nextjs";
import { BattleOptions } from "./battle-options";

export function CharacterSelect() {
  const [player1, setPlayer1] = useState<Persona | null>(null);
  const [player2, setPlayer2] = useState<Persona | null>(null);
  const [hoveredPersona, setHoveredPersona] = useState<Persona | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createAsLive, setCreateAsLive] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [votingEnabled, setVotingEnabled] = useState(true);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const router = useRouter();

  // Check if features are globally enabled via env flags
  const isVotingGloballyEnabled =
    process.env.NEXT_PUBLIC_USER_BATTLE_VOTING !== "false";
  const isCommentsGloballyEnabled =
    process.env.NEXT_PUBLIC_USER_BATTLE_COMMENTING !== "false";

  // Check if user is admin
  const { userId, isLoaded } = useAuth();

  // Detect touch device
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

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
    // Clear hover preview on touch devices after click
    if (isTouchDevice) {
      setHoveredPersona(null);
    }

    // Check if clicking a selected character (deselect)
    if (player1?.id === persona.id) {
      setPlayer1(null);
      return;
    }

    if (player2?.id === persona.id) {
      setPlayer2(null);
      return;
    }

    // Select logic - assign to first empty slot
    if (!player1) {
      setPlayer1(persona);
    } else if (!player2) {
      setPlayer2(persona);
    }
    // If both slots full and clicking an unselected character, do nothing
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
      <div className="min-h-screen bg-linear-to-b from-gray-950 via-gray-900 to-black relative overflow-hidden">
        {/* Dramatic Background Effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.8)_100%)]" />

        {/* Main Container */}
        <div className="relative z-10 flex flex-col h-[calc(100vh-52px)] justify-start pt-16 md:pt-20 lg:pt-24">
          {/* Top Section - Character Display */}
          <div className="flex items-center justify-between px-2 md:px-8 lg:px-16 pb-0">
            {/* Player 1 - Left Side */}
            <div className="flex-1 flex flex-col items-center justify-start min-h-[240px] md:min-h-[280px] lg:min-h-[320px]">
              {(() => {
                // Show player1 if selected, otherwise show hoveredPersona as preview if no player1 selected
                const displayPersona = player1 || (!player1 && hoveredPersona);

                return displayPersona ? (
                  <>
                    {/* Large Character Portrait */}
                    <div className="relative mb-2 group">
                      <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse" />
                      <div
                        className="relative w-20 h-20 md:w-28 md:h-28 lg:w-36 lg:h-36 rounded-full border-4 md:border-6 border-blue-500 flex items-center justify-center text-2xl md:text-4xl lg:text-5xl text-white bg-linear-to-br from-gray-800 to-gray-900 shadow-2xl transform transition-transform hover:scale-105"
                        style={{
                          boxShadow: `0 0 40px rgba(59, 130, 246, 0.6)`,
                        }}
                      >
                        {displayPersona.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                    </div>
                    {/* Character Name */}
                    <div className="text-center text-lg md:text-2xl lg:text-3xl font-black text-white mb-1 tracking-wider drop-shadow-[0_0_20px_rgba(59,130,246,0.8)] text-balance">
                      {displayPersona.name.toUpperCase()}
                    </div>
                    {/* Character Info */}
                    <div className="text-center max-w-xs mb-1 flex flex-col min-h-[60px] md:min-h-[80px]">
                      <p className="text-gray-300 text-xs md:text-sm lg:text-base hidden md:block mb-1">
                        {displayPersona.bio}
                      </p>
                      <p className="text-blue-400 text-xs md:text-sm lg:text-base font-semibold mt-auto">
                        Style: {displayPersona.style}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center opacity-40">
                    <div className="w-20 h-20 md:w-28 md:h-28 lg:w-36 lg:h-36 rounded-full border-4 md:border-6 border-gray-700 border-dashed flex items-center justify-center text-3xl md:text-4xl lg:text-5xl text-gray-700 mb-2">
                      ?
                    </div>
                    <div className="text-base md:text-xl lg:text-2xl font-black text-gray-700 tracking-wider">
                      PLAYER 1
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Center - VS Text */}
            <div className="flex flex-col items-center justify-center px-1 md:px-4 lg:px-8">
              <div className="text-center mb-1">
                <div className="text-base md:text-3xl lg:text-5xl font-black text-transparent bg-clip-text bg-linear-to-b from-yellow-400 via-orange-500 to-red-600 tracking-wider drop-shadow-[0_0_30px_rgba(251,191,36,0.8)] mb-0.5">
                  CHARACTER
                </div>
                <div className="text-xs md:text-xl lg:text-3xl font-black text-white tracking-[0.3em] md:tracking-[0.5em] drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]">
                  SELECT
                </div>
              </div>
              {/* VS text with fixed height to prevent layout shift */}
              <div className="h-6 md:h-8 lg:h-10 flex items-center justify-center">
                <div
                  className={`text-lg md:text-xl lg:text-2xl font-black text-red-500 animate-pulse drop-shadow-[0_0_20px_rgba(239,68,68,0.8)] transition-opacity duration-300 ${
                    player1 && player2 ? "opacity-100" : "opacity-0"
                  }`}
                >
                  VS
                </div>
              </div>
            </div>

            {/* Player 2 - Right Side */}
            <div className="flex-1 flex flex-col items-center justify-start min-h-[240px] md:min-h-[280px] lg:min-h-[320px]">
              {(() => {
                // Show player2 if selected, otherwise show hoveredPersona as preview if player1 is selected but not player2
                const displayPersona =
                  player2 || (player1 && !player2 && hoveredPersona);

                return displayPersona ? (
                  <>
                    {/* Large Character Portrait */}
                    <div className="relative mb-2 group">
                      <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full animate-pulse" />
                      <div
                        className="relative w-20 h-20 md:w-28 md:h-28 lg:w-36 lg:h-36 rounded-full border-4 md:border-6 border-red-500 flex items-center justify-center text-2xl md:text-4xl lg:text-5xl text-white bg-linear-to-br from-gray-800 to-gray-900 shadow-2xl transform transition-transform hover:scale-105"
                        style={{
                          boxShadow: `0 0 40px rgba(239, 68, 68, 0.6)`,
                        }}
                      >
                        {displayPersona.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                    </div>
                    {/* Character Name */}
                    <div className="text-center text-lg md:text-2xl lg:text-3xl font-black text-white mb-1 tracking-wider drop-shadow-[0_0_20px_rgba(239,68,68,0.8)] text-balance">
                      {displayPersona.name.toUpperCase()}
                    </div>
                    {/* Character Info */}
                    <div className="text-center max-w-xs mb-1 flex flex-col min-h-[60px] md:min-h-[80px]">
                      <p className="text-gray-300 text-xs md:text-sm lg:text-base hidden md:block mb-1">
                        {displayPersona.bio}
                      </p>
                      <p className="text-red-400 text-xs md:text-sm lg:text-base font-semibold mt-auto">
                        Style: {displayPersona.style}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center opacity-40">
                    <div className="w-20 h-20 md:w-28 md:h-28 lg:w-36 lg:h-36 rounded-full border-4 md:border-6 border-gray-700 border-dashed flex items-center justify-center text-3xl md:text-4xl lg:text-5xl text-gray-700 mb-2">
                      ?
                    </div>
                    <div className="text-base md:text-xl lg:text-2xl font-black text-gray-700 tracking-wider">
                      PLAYER 2
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Bottom Section - Character Grid */}
          <div className="bg-linear-to-t from-black/90 via-black/70 to-transparent pt-2 pb-4">
            {/* Character Selection Grid */}
            <div className="max-w-5xl mx-auto px-2 md:px-4 lg:px-8 mb-3 md:mb-4">
              <div className="flex justify-center items-center gap-3 md:gap-4">
                {personas.map((persona) => {
                  const selected = isSelected(persona);
                  const label = getSelectionLabel(persona);

                  return (
                    <button
                      key={persona.id}
                      onClick={() => handlePersonaClick(persona)}
                      onMouseEnter={() => !isTouchDevice && setHoveredPersona(persona)}
                      onMouseLeave={() => !isTouchDevice && setHoveredPersona(null)}
                      onTouchStart={() => isTouchDevice && setHoveredPersona(null)}
                      className={`
                        relative group
                        transition-all duration-300 transform
                        hover:scale-110 hover:z-20
                        ${selected ? "scale-110 z-10" : ""}
                      `}
                    >
                      {/* Selection Indicator */}
                      {selected && (
                        <div
                          className={`
                            absolute -top-2 -right-2 z-20
                            w-8 h-8 rounded-full
                            flex items-center justify-center
                            font-bold text-xs
                            ${
                              label === "P1"
                                ? "bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.8)]"
                                : "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.8)]"
                            }
                          `}
                        >
                          {label}
                        </div>
                      )}

                      {/* Deselect Overlay - shows on hover of selected character */}
                      {selected && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/70 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 z-10 rounded-lg">
                          <div className="text-center">
                            <div className="text-white font-bold text-2xl md:text-3xl mb-1">
                              ✕
                            </div>
                            <div className="text-white font-semibold text-xs">
                              DESELECT
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Character Portrait */}
                      <div
                        className={`
                          w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28
                          rounded-lg
                          border-4
                          flex items-center justify-center
                          text-2xl md:text-3xl font-bold text-white
                          bg-linear-to-br from-gray-800 to-gray-900
                          transition-all duration-300
                          ${
                            selected
                              ? label === "P1"
                                ? "border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.8)]"
                                : "border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.8)]"
                              : "border-gray-700 hover:border-yellow-400 hover:shadow-[0_0_20px_rgba(250,204,21,0.5)]"
                          }
                        `}
                        style={{
                          background: selected
                            ? `linear-gradient(135deg, ${persona.accentColor}44 0%, #1f2937 100%)`
                            : `linear-gradient(135deg, ${persona.accentColor}22 0%, #1f2937 100%)`,
                        }}
                      >
                        {persona.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>

                      {/* Character Name on Hover - only show for unselected characters */}
                      {!selected && (
                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
                          <div className="bg-black/90 px-3 py-1 rounded text-white text-xs font-bold border border-gray-700">
                            {persona.name}
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Battle Options & Start Button */}
            <div className="max-w-4xl mx-auto px-2 md:px-4 lg:px-8 space-y-3 md:space-y-4">
              <BattleOptions
                votingEnabled={votingEnabled}
                onVotingEnabledChange={setVotingEnabled}
                commentsEnabled={commentsEnabled}
                onCommentsEnabledChange={setCommentsEnabled}
                createAsLive={createAsLive}
                onCreateAsLiveChange={setCreateAsLive}
                isAdmin={isAdmin}
                isVotingGloballyEnabled={isVotingGloballyEnabled}
                isCommentsGloballyEnabled={isCommentsGloballyEnabled}
              />

              {/* Start Battle Button */}
              <div className="text-center pb-2 md:pb-4">
                <button
                  onClick={handleStartBattle}
                  disabled={!player1 || !player2 || isCreating}
                  className={`
                    px-8 md:px-12 lg:px-16 py-3 md:py-4 rounded-lg font-black text-lg md:text-xl lg:text-2xl tracking-wider
                    transition-all duration-300 transform
                    ${
                      player1 && player2 && !isCreating
                        ? "bg-linear-to-r from-yellow-400 via-orange-500 to-red-600 hover:scale-105 hover:shadow-[0_0_40px_rgba(251,191,36,0.8)] text-white"
                        : "bg-gray-800 text-gray-600 cursor-not-allowed"
                    }
                  `}
                >
                  {isCreating
                    ? "CREATING BATTLE..."
                    : player1 && player2
                    ? "FIGHT!"
                    : "SELECT FIGHTERS"}
                </button>

                {/* Back Link */}
                <div className="mt-4">
                  <a
                    href="/"
                    className="text-gray-500 hover:text-gray-300 transition-colors text-sm font-semibold tracking-wide"
                  >
                    ← BACK TO HOME
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
