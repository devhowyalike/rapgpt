"use client";

import { useState, useEffect } from "react";
import { getAllStages, type Stage } from "@/lib/shared/stages";
import { useRouter } from "next/navigation";
import type { ClientPersona } from "@/lib/shared/personas/client";
import Image from "next/image";
import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";

interface StageSelectProps {
  player1: ClientPersona;
  player2: ClientPersona;
  isAdmin: boolean;
  votingEnabled: boolean;
  commentsEnabled: boolean;
  createAsLive: boolean;
  isVotingGloballyEnabled: boolean;
  isCommentsGloballyEnabled: boolean;
  onBack: () => void;
  onVotingEnabledChange: (enabled: boolean) => void;
  onCommentsEnabledChange: (enabled: boolean) => void;
  onCreateAsLiveChange: (enabled: boolean) => void;
  autoStartOnAdvance: boolean;
  onAutoStartOnAdvanceChange: (enabled: boolean) => void;
  sessionStorageKey: string;
}

interface StageSelections {
  stageId?: string;
}

export function StageSelect({
  player1,
  player2,
  isAdmin,
  votingEnabled,
  commentsEnabled,
  createAsLive,
  isVotingGloballyEnabled,
  isCommentsGloballyEnabled,
  onBack,
  onVotingEnabledChange,
  onCommentsEnabledChange,
  onCreateAsLiveChange,
  autoStartOnAdvance,
  onAutoStartOnAdvanceChange,
  sessionStorageKey,
}: StageSelectProps) {
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const [hoveredStage, setHoveredStage] = useState<Stage | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const router = useRouter();

  const stages = getAllStages();

  // Load stage from sessionStorage on mount
  useEffect(() => {
    if (isHydrated) return;

    try {
      const stored = sessionStorage.getItem(sessionStorageKey);
      if (stored) {
        const selections = JSON.parse(stored);
        const stageSelections = selections as StageSelections & {
          stageId?: string;
        };

        if (stageSelections.stageId) {
          const stage = stages.find((s) => s.id === stageSelections.stageId);
          if (stage) setSelectedStage(stage);
        }
      }
    } catch (error) {
      console.error("Failed to load stage from sessionStorage:", error);
    }

    setIsHydrated(true);
  }, [isHydrated, sessionStorageKey, stages]);

  // Save stage to sessionStorage whenever it changes
  useEffect(() => {
    if (!isHydrated) return;

    try {
      const stored = sessionStorage.getItem(sessionStorageKey);
      const selections = stored ? JSON.parse(stored) : {};
      selections.stageId = selectedStage?.id;
      sessionStorage.setItem(sessionStorageKey, JSON.stringify(selections));
    } catch (error) {
      console.error("Failed to save stage to sessionStorage:", error);
    }
  }, [selectedStage, sessionStorageKey, isHydrated]);

  const handleRandomStage = () => {
    const randomIndex = Math.floor(Math.random() * stages.length);
    setSelectedStage(stages[randomIndex]);
  };

  const handleStartBattle = async () => {
    if (!selectedStage) return;

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
          player1PersonaId: player1.id,
          player2PersonaId: player2.id,
          stageId: selectedStage.id,
          isFeatured: false, // Only admins can create featured battles
          votingEnabled,
          commentsEnabled,
          autoStartOnAdvance,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create battle");
      }

      const { battleId } = await response.json();

      // Clear sessionStorage after successful battle creation
      try {
        sessionStorage.removeItem(sessionStorageKey);
      } catch (error) {
        console.error("Failed to clear sessionStorage:", error);
      }

      if (createAsLive) {
        router.push(`/admin/battles/${battleId}/control`);
      } else {
        router.push(`/battle/${battleId}`);
      }
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

  const displayStage = hoveredStage || selectedStage;

  return (
    <>
      <SiteHeader />
      <div className="min-h-screen bg-black text-white selection:bg-yellow-500/30 pt-20 pb-32 relative overflow-hidden flex flex-col">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-purple-900/20 via-black to-black z-0" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl z-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10 flex flex-col flex-1">
          {/* Header Section */}
          <div className="text-center mb-8 md:mb-12 animate-slide-up">
            <div className="inline-block mb-4 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
              <span className="text-sm font-medium text-yellow-400 tracking-wide uppercase">
                Choose Your Arena
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter font-(family-name:--font-bebas-neue)">
              <span className="bg-linear-to-r from-white via-gray-200 to-gray-400 text-transparent bg-clip-text pr-2">
                SELECT STAGE
              </span>
            </h1>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start justify-center max-w-6xl mx-auto w-full flex-1">
            {/* Left Column: Stage Grid */}
            <div className="w-full lg:w-1/2 order-2 lg:order-1">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 md:gap-4">
                {stages.map((stage) => {
                  const isSelected = selectedStage?.id === stage.id;
                  return (
                    <button
                      key={stage.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedStage(null);
                          setHoveredStage(null);
                        } else {
                          setSelectedStage(stage);
                        }
                      }}
                      onMouseEnter={() => setHoveredStage(stage)}
                      onMouseLeave={() => setHoveredStage(null)}
                      className={cn(
                        "relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 group",
                        isSelected
                          ? "border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.4)] scale-105 z-10"
                          : "border-white/10 hover:border-white/30 hover:scale-105 hover:z-10"
                      )}
                    >
                      <Image
                        src={stage.backgroundImage}
                        alt={stage.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {/* Overlay Gradient */}
                      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                      {/* Name Label */}
                      <div className="absolute bottom-0 left-0 right-0 p-2 text-xs font-bold text-center truncate text-white/90">
                        {stage.name}
                      </div>

                      {/* Selection Indicator */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-yellow-500/20 flex items-center justify-center backdrop-blur-[1px]">
                          <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold shadow-lg">
                            ✓
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}

                {/* Random Button */}
                <button
                  onClick={handleRandomStage}
                  className="relative aspect-square rounded-xl overflow-hidden border-2 border-purple-500/50 hover:border-purple-500 bg-purple-900/20 hover:bg-purple-900/40 transition-all duration-300 group flex flex-col items-center justify-center gap-2"
                >
                  <span className="text-2xl md:text-3xl group-hover:animate-bounce">
                    🎲
                  </span>
                  <span className="text-xs font-bold text-purple-200">
                    RANDOM
                  </span>
                </button>
              </div>
            </div>

            {/* Right Column: Large Preview */}
            <div className="w-full lg:w-1/2 order-1 lg:order-2 sticky top-24">
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-black/50 shadow-2xl group">
                {displayStage ? (
                  <>
                    <Image
                      src={displayStage.backgroundImage}
                      alt={displayStage.name}
                      fill
                      className="object-cover transition-transform duration-700 hover:scale-105"
                      priority
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent" />

                    <div className="absolute bottom-0 left-0 right-0 px-6 pt-6 pb-2 md:px-8 md:pt-8 md:pb-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-4">
                        <span className="text-lg">{displayStage.flag}</span>
                        <span className="text-sm font-medium text-gray-200">
                          {displayStage.country}
                        </span>
                      </div>
                      <h2 className="text-4xl md:text-6xl font-bold font-(family-name:--font-bebas-neue) tracking-wide text-white">
                        {displayStage.name}
                      </h2>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20">
                    <span className="text-6xl mb-4">🏟️</span>
                    <span className="text-xl font-medium uppercase tracking-widest">
                      Select a Stage
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar - Floating */}
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-linear-to-t from-black via-black/90 to-transparent pt-12">
          <div className="container mx-auto max-w-4xl">
            <div className="flex flex-col gap-4 items-center">
              {/* Edit Characters & Start Battle */}
              <div className="flex flex-col gap-6 items-center w-full">
                <button
                  onClick={onBack}
                  className="flex items-center gap-3 px-6 py-2 rounded-full bg-black/40 border border-white/10 hover:bg-white/10 transition-all group backdrop-blur-md"
                >
                  <span className="text-sm font-medium text-gray-300 group-hover:text-white uppercase tracking-wider">
                    ← Edit Characters
                  </span>
                  <div className="flex -space-x-2 pl-2 border-l border-white/10">
                    <div className="w-8 h-8 rounded-full border-2 border-black overflow-hidden relative z-20">
                      <Image
                        src={player1.avatar}
                        alt={player1.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="w-8 h-8 rounded-full border-2 border-black overflow-hidden relative z-10">
                      <Image
                        src={player2.avatar}
                        alt={player2.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleStartBattle}
                  disabled={!selectedStage || isCreating}
                  className={cn(
                    "w-full sm:w-auto px-16 py-4 rounded-xl font-black text-xl tracking-widest transition-all duration-300 transform shadow-2xl",
                    !selectedStage || isCreating
                      ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                      : "bg-linear-to-r from-yellow-400 via-orange-500 to-red-600 hover:scale-105 hover:shadow-[0_0_40px_rgba(251,191,36,0.6)] text-white shadow-orange-500/20"
                  )}
                >
                  {isCreating
                    ? "CREATING BATTLE..."
                    : selectedStage
                    ? "START BATTLE"
                    : "SELECT STAGE"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Spacer for bottom bar */}
        <div className="h-32" />
      </div>
    </>
  );
}
