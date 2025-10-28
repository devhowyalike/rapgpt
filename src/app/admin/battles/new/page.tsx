"use client";

import { useState } from "react";
import { getAllPersonas } from "@/lib/shared/personas";
import type { Persona } from "@/lib/shared/battle-types";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { PersonaCard } from "@/components/persona-card";
import { Swords, Star } from "lucide-react";

export default function NewAdminBattlePage() {
  const [player1, setPlayer1] = useState<Persona | null>(null);
  const [player2, setPlayer2] = useState<Persona | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch("/api/battle/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leftPersonaId: player1.id,
          rightPersonaId: player2.id,
          isFeatured: true, // Admin battles are featured
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create battle");
      }

      const { battleId } = await response.json();

      // Navigate to battle page
      router.push(`/battle/${battleId}`);
    } catch (error) {
      console.error("Error creating battle:", error);

      if (error instanceof Error && error.name === "AbortError") {
        alert("Request timed out. Please check your connection and try again.");
      } else if (error instanceof Error) {
        alert(error.message || "Failed to create battle. Please try again.");
      } else {
        alert("Failed to create battle. Please try again.");
      }

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
          <h1 className="font-bebas text-6xl text-center mb-4 text-white flex items-center justify-center gap-3">
            <Star className="text-purple-400" size={48} />
            Create Featured Battle
          </h1>
          <p className="text-center text-gray-400 text-lg">
            Select two AI personas for a featured homepage battle
          </p>
        </div>

        {/* Selection Display */}
        {(player1 || player2) && (
          <div className="w-full max-w-7xl mx-auto mb-8 flex items-center justify-center gap-8">
            <div className="flex-1 max-w-xs">
              {player1 ? (
                <PersonaCard persona={player1} selected />
              ) : (
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center text-gray-500">
                  Select Player 1
                </div>
              )}
            </div>

            <Swords className="text-purple-400" size={48} />

            <div className="flex-1 max-w-xs">
              {player2 ? (
                <PersonaCard persona={player2} selected />
              ) : (
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center text-gray-500">
                  Select Player 2
                </div>
              )}
            </div>
          </div>
        )}

        {/* Personas Grid */}
        <div className="w-full max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {personas.map((persona) => (
            <div
              key={persona.id}
              onClick={() => handlePersonaClick(persona)}
              className="cursor-pointer"
            >
              <PersonaCard
                persona={persona}
                selected={isSelected(persona)}
                label={getSelectionLabel(persona) || undefined}
              />
            </div>
          ))}
        </div>

        {/* Start Battle Button */}
        <button
          onClick={handleStartBattle}
          disabled={!player1 || !player2 || isCreating}
          className={`px-8 py-4 rounded-lg font-bebas text-2xl transition-all flex items-center gap-2 ${
            player1 && player2 && !isCreating
              ? "bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
              : "bg-gray-700 text-gray-500 cursor-not-allowed"
          }`}
        >
          <Star size={24} />
          {isCreating
            ? "Creating Featured Battle..."
            : "Create Featured Battle"}
        </button>
      </div>
    </>
  );
}
