"use client";

import { useState } from "react";
import { getAllStages, type Stage } from "@/lib/shared/stages";
import { useRouter } from "next/navigation";
import { BattleOptions } from "./battle-options";
import type { ClientPersona } from "@/lib/shared/personas/client";
import { SelectionLayout } from "./selection/selection-layout";
import { CenterDisplay } from "./selection/center-display";
import { SelectionBottom } from "./selection/selection-bottom";
import { SelectionActions } from "./selection/selection-actions";
import { ActionButton } from "./selection/action-button";
import { BackLink } from "./selection/back-link";
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
}: StageSelectProps) {
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const [hoveredStage, setHoveredStage] = useState<Stage | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const stages = getAllStages();

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
          leftPersonaId: player1.id,
          rightPersonaId: player2.id,
          stageId: selectedStage.id,
          isFeatured: createAsLive,
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

  // Split stages into left and right columns
  const midPoint = Math.ceil((stages.length + 1) / 2); // +1 for random button
  const leftStages = stages.slice(0, midPoint - 1);
  const rightStages = stages.slice(midPoint - 1);

  const renderStageButton = (stage: Stage) => {
    const selected = selectedStage?.id === stage.id;

    return (
      <button
        key={stage.id}
        onClick={() =>
          selected ? setSelectedStage(null) : setSelectedStage(stage)
        }
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
            w-32 h-24 md:w-40 md:h-28 lg:w-48 lg:h-32
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
            width={192}
            height={128}
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

        {/* Stage Name on Hover */}
        {!selected && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
            <div className="bg-black/90 px-3 py-1 rounded text-white text-xs font-bold border border-gray-700">
              {stage.name}
            </div>
          </div>
        )}
      </button>
    );
  };

  return (
    <SelectionLayout title="Stage Select">
      {/* Main Section - Stage Selection */}
      <div className="flex items-center justify-between gap-4 pb-4">
        {/* Left Column - Stage Options */}
        <div className="flex flex-col gap-4 items-center">
          {leftStages.map((stage) => renderStageButton(stage))}

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
            <div className="w-32 h-24 md:w-40 md:h-28 lg:w-48 lg:h-32 rounded-lg border-4 border-purple-500 overflow-hidden bg-linear-to-br from-purple-900 via-pink-900 to-purple-900 transition-all duration-300 hover:border-purple-400 hover:shadow-[0_0_30px_rgba(168,85,247,0.8)] flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl md:text-5xl mb-1 animate-pulse">
                  🎲
                </div>
                <div className="text-white font-black text-sm md:text-base tracking-wider">
                  RANDOM
                </div>
              </div>
            </div>

            {/* Tooltip */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
              <div className="bg-black/90 px-3 py-1 rounded text-white text-xs font-bold border border-purple-500">
                Random Stage
              </div>
            </div>
          </button>
        </div>

        {/* Center - Stage Preview */}
        <CenterDisplay title="" subtitle="">
          <div className="mt-4 shrink-0 w-[240px] md:w-[384px] lg:w-[512px]">
            {/* Fixed height container to prevent layout shifts */}
            <div className="relative mb-4 group">
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
        </CenterDisplay>

        {/* Right Column - Stage Options */}
        <div className="flex flex-col gap-4 items-center">
          {rightStages.map((stage) => renderStageButton(stage))}
        </div>
      </div>

      {/* Bottom Section - Battle Options & Start Button */}
      <SelectionBottom>
        <SelectionActions>
          <BattleOptions
            votingEnabled={votingEnabled}
            onVotingEnabledChange={onVotingEnabledChange}
            commentsEnabled={commentsEnabled}
            onCommentsEnabledChange={onCommentsEnabledChange}
            createAsLive={createAsLive}
            onCreateAsLiveChange={onCreateAsLiveChange}
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

          <div className="flex justify-center">
            <BackLink onClick={onBack} disabled={isCreating}>
              ← Back to Character Select
            </BackLink>
          </div>
        </SelectionActions>
      </SelectionBottom>
    </SelectionLayout>
  );
}
