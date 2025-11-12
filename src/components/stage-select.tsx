"use client";

import { useState, useEffect } from "react";
import { getAllStages, type Stage } from "@/lib/shared/stages";
import { useRouter } from "next/navigation";
import { BattleOptions } from "./battle-options";
import type { ClientPersona } from "@/lib/shared/personas/client";
import { SelectionLayout } from "./selection/selection-layout";
import { SelectionBottom } from "./selection/selection-bottom";
import { SelectionGrid } from "./selection/selection-grid";
import { ActionButton } from "./selection/action-button";
import { PlayerChangeButton } from "./selection/player-change-button";
import Image from "next/image";

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

  const renderStageButton = (stage: Stage) => {
    const selected = selectedStage?.id === stage.id;

    return (
      <button
        key={stage.id}
        onClick={() => {
          if (selected) {
            setSelectedStage(null);
            setHoveredStage(null); // Clear hover state when deselecting
          } else {
            setSelectedStage(stage);
          }
        }}
        onMouseEnter={() => setHoveredStage(stage)}
        onMouseLeave={() => setHoveredStage(null)}
        className={`
          relative group
          transition-all duration-300 transform
          hover:scale-105 md:hover:scale-110 hover:z-20
          ${selected ? "scale-105 md:scale-110 z-10" : ""}
        `}
      >
        {/* Selection Indicator */}
        {selected && (
          <div className="absolute top-0 right-0 z-20 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-xs bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.8)]">
            ✓
          </div>
        )}

        {/* Stage Thumbnail */}
        <div
          className={`
            w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28
            rounded-lg
            border-4
            overflow-hidden
            bg-gray-900
            transition-all duration-300
            ${
              selected
                ? "border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.8)]"
                : "border-gray-700 hover:border-yellow-400 hover:shadow-[0_0_20px_rgba(250,204,21,0.5)]"
            }
          `}
        >
          <Image
            src={stage.backgroundImage}
            alt={stage.name}
            width={112}
            height={112}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Deselect Overlay - shows on hover of selected stage */}
        {selected && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/70 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 z-10 rounded-lg">
            <div className="text-center">
              <div className="text-white font-bold text-2xl md:text-3xl mb-1">
                ✕
              </div>
              <div className="text-white font-semibold text-xs">DESELECT</div>
            </div>
          </div>
        )}
      </button>
    );
  };

  return (
    <SelectionLayout title="Stage Select">
      {/* Mobile: Stacked Layout, Desktop: Side-by-side Layout */}
      <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-center gap-2 md:gap-12 lg:gap-16 px-4 md:px-8 pb-2 md:pb-8">
        {/* Left Side - Stage Grid (Bottom on mobile, Left on desktop) */}
        <div className="flex flex-col items-center gap-2 md:gap-6 order-2 md:order-1 mt-4 md:mt-0">
          {/* Stage Selection Grid */}
          <SelectionGrid gap="normal">
            {stages.map((stage) => renderStageButton(stage))}

            {/* Random Stage Option */}
            <button
              onClick={handleRandomStage}
              className={`
                relative group
                transition-all duration-300 transform
                hover:scale-105 md:hover:scale-110 hover:z-20
              `}
            >
              {/* Random Stage Card */}
              <div className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-lg border-4 border-purple-500 overflow-hidden bg-linear-to-br from-purple-900 via-pink-900 to-purple-900 transition-all duration-300 hover:border-purple-400 hover:shadow-[0_0_30px_rgba(168,85,247,0.8)] flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl mb-0.5 animate-pulse">
                    🎲
                  </div>
                  <div className="text-white font-black text-[10px] md:text-xs tracking-wider">
                    RANDOM
                  </div>
                </div>
              </div>
            </button>
          </SelectionGrid>
        </div>

        {/* Right Side - Stage Preview (Top on mobile, Right on desktop) */}
        <div className="flex flex-col items-center gap-2 md:gap-6 order-1 md:order-2">
          <div className="shrink-0 w-[240px] md:w-[384px] lg:w-[512px]">
            {/* Fixed height container to prevent layout shifts */}
            <div className="relative mb-2 md:mb-4 group">
              {displayStage && (
                <div className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-lg" />
              )}
              <div
                className={`relative aspect-video rounded-lg border-4 overflow-hidden bg-gray-900 shadow-2xl transition-all duration-300 ${
                  displayStage
                    ? "border-yellow-400"
                    : "border-dashed border-gray-700"
                }`}
              >
                {displayStage ? (
                  <Image
                    src={displayStage.backgroundImage}
                    alt={displayStage.name}
                    fill
                    sizes="(max-width: 768px) 240px, (max-width: 1024px) 384px, 512px"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-700 text-4xl opacity-40">
                    ?
                  </div>
                )}
              </div>
            </div>
            {/* Fixed height for text content */}
            <div className="text-center">
              <div className="text-xl md:text-3xl font-black mb-1 min-h-8 md:min-h-10 flex items-center justify-center">
                {displayStage ? (
                  <span className="text-yellow-400">{displayStage.name}</span>
                ) : (
                  <span className="text-gray-700 opacity-40">
                    SELECT A STAGE
                  </span>
                )}
              </div>
              <div className="text-sm md:text-lg text-gray-300 min-h-6 md:min-h-7">
                {displayStage && (
                  <>
                    {displayStage.flag} {displayStage.country}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Battle Options & Actions */}
      <SelectionBottom>
        <div className="max-w-7xl w-full mx-auto px-2 md:px-4 lg:px-8 space-y-2 md:space-y-4">
          <BattleOptions
            votingEnabled={votingEnabled}
            onVotingEnabledChange={onVotingEnabledChange}
            commentsEnabled={commentsEnabled}
            onCommentsEnabledChange={onCommentsEnabledChange}
            createAsLive={createAsLive}
            onCreateAsLiveChange={onCreateAsLiveChange}
            autoStartOnAdvance={autoStartOnAdvance}
            onAutoStartOnAdvanceChange={onAutoStartOnAdvanceChange}
            isAdmin={isAdmin}
            isVotingGloballyEnabled={isVotingGloballyEnabled}
            isCommentsGloballyEnabled={isCommentsGloballyEnabled}
          />

          <ActionButton
            onClick={handleStartBattle}
            disabled={!selectedStage || isCreating}
          >
            {isCreating
              ? "CREATING BATTLE..."
              : selectedStage
              ? "FIGHT!"
              : "SELECT STAGE"}
          </ActionButton>

          {/* Change Player Buttons - moved here under primary action */}
          <div className="flex justify-center gap-3 md:gap-6 pt-1 md:pt-2">
            <PlayerChangeButton
              player={player1}
              playerNumber={1}
              sessionStorageKey={sessionStorageKey}
              onBack={onBack}
            />
            <PlayerChangeButton
              player={player2}
              playerNumber={2}
              sessionStorageKey={sessionStorageKey}
              onBack={onBack}
            />
          </div>
        </div>
      </SelectionBottom>
    </SelectionLayout>
  );
}
