"use client";

import { useState, useEffect } from "react";
import {
  getPrimaryClientPersonas,
  getClientPersona,
  type ClientPersona,
} from "@/lib/shared/personas/client";
import { useAuth } from "@clerk/nextjs";
import { StageSelect } from "./stage-select";
import { PlayerDisplay } from "./selection/player-display";
import { SelectionGrid } from "./selection/selection-grid";
import { SessionRestoreLoading } from "./session-restore-loading";
import { PersonaGridItem } from "./selection/persona-grid-item";
import { VsGlow } from "./selection/vs-glow";
import { motion, AnimatePresence } from "framer-motion";
import { usePersonaSelection } from "@/hooks/use-persona-selection";
import {
  getHoverPreviewPersona,
  isInGroup,
  getVariantIndex,
} from "@/lib/persona-selection-utils";
import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";

const SESSION_STORAGE_KEY = "rapgpt_battle_selections";

interface BattleSelections {
  player1Id?: string;
  player2Id?: string;
  createAsLive: boolean;
  votingEnabled: boolean;
  commentsEnabled: boolean;
  showStageSelect: boolean;
  autoStartOnAdvance: boolean;
  selectionStep?: "player1" | "player2" | "complete";
  editPlayer?: boolean;
  fromStage?: boolean;
}

interface CharacterSelectProps {
  /**
   * Minimum time (in ms) to show the "Restoring Session" loading screen.
   * This ensures users can see the loading feedback when restoring from sessionStorage.
   * Set to 0 to disable the delay. Defaults to 500ms.
   */
  minLoadingDelay?: number;
}

export function CharacterSelect({
  minLoadingDelay = 500,
}: CharacterSelectProps = {}) {
  // Use custom hook for persona selection logic
  const {
    player1,
    player2,
    selectionStep,
    setPlayer1,
    setPlayer2,
    setSelectionStep,
    handlePersonaClick: handlePersonaClickFromHook,
  } = usePersonaSelection();

  const [hoveredPersona, setHoveredPersona] = useState<ClientPersona | null>(
    null
  );
  const [showStageSelect, setShowStageSelect] = useState(false);
  const [createAsLive, setCreateAsLive] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [votingEnabled, setVotingEnabled] = useState(false);
  const [commentsEnabled, setCommentsEnabled] = useState(false);
  const [autoStartOnAdvance, setAutoStartOnAdvance] = useState(true);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Check if features are globally enabled via env flags
  const isVotingGloballyEnabled =
    process.env.NEXT_PUBLIC_USER_BATTLE_VOTING !== "false";
  const isCommentsGloballyEnabled =
    process.env.NEXT_PUBLIC_USER_BATTLE_COMMENTING !== "false";

  // Check if user is admin
  const { userId, isLoaded } = useAuth();

  // Detect touch device
  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
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

  // Only show primary personas in the grid
  const primaryPersonas = getPrimaryClientPersonas();

  // Load from sessionStorage on mount
  useEffect(() => {
    if (isHydrated) return;

    const loadSelections = async () => {
      try {
        const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (stored) {
          const selections: BattleSelections = JSON.parse(stored);

          // Restore player selections
          if (selections.player1Id) {
            const persona = getClientPersona(selections.player1Id);
            if (persona) setPlayer1(persona);
          }
          if (selections.player2Id) {
            const persona = getClientPersona(selections.player2Id);
            if (persona) setPlayer2(persona);
          }

          // Restore battle options
          setCreateAsLive(selections.createAsLive);
          setVotingEnabled(selections.votingEnabled);
          setCommentsEnabled(selections.commentsEnabled);
          setShowStageSelect(selections.showStageSelect);
          setAutoStartOnAdvance(selections.autoStartOnAdvance ?? true);
          setSelectionStep(selections.selectionStep ?? "player1");

          // Add a minimum delay so the loading screen is visible to users
          // This provides visual feedback that the session is being restored
          if (minLoadingDelay > 0) {
            await new Promise((resolve) =>
              setTimeout(resolve, minLoadingDelay)
            );
          }
        }
      } catch (error) {
        console.error("Failed to load selections from sessionStorage:", error);
      }

      setIsHydrated(true);
    };

    loadSelections();
  }, [isHydrated, minLoadingDelay]);

  // Save to sessionStorage whenever selections change
  useEffect(() => {
    if (!isHydrated) return;

    try {
      // Preserve transient flags (e.g., editPlayer/fromStage) by merging with existing
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      const previous: Partial<BattleSelections> = stored
        ? JSON.parse(stored)
        : {};
      const selections: BattleSelections = {
        ...previous,
        player1Id: player1?.id,
        player2Id: player2?.id,
        createAsLive,
        votingEnabled,
        commentsEnabled,
        showStageSelect,
        autoStartOnAdvance,
        selectionStep,
      };
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(selections));
    } catch (error) {
      console.error("Failed to save selections to sessionStorage:", error);
    }
  }, [
    player1,
    player2,
    createAsLive,
    votingEnabled,
    commentsEnabled,
    showStageSelect,
    autoStartOnAdvance,
    selectionStep,
    isHydrated,
  ]);

  // Wrapper to pass additional touch device state to the hook's handler
  const handlePersonaClick = (primary: ClientPersona) => {
    handlePersonaClickFromHook(primary, isTouchDevice, setHoveredPersona);
  };

  const handleProceedToStageSelect = () => {
    if (!player1 || !player2) return;
    setShowStageSelect(true);
  };

  const handleBackToCharacterSelect = () => {
    setShowStageSelect(false);
    // Check sessionStorage to see if a specific selection step was requested
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const selections: BattleSelections = JSON.parse(stored);
        // If selectionStep is "complete", set to "player2" to allow editing
        // Otherwise use the stored step (e.g. "player1" or "player2")
        if (
          selections.selectionStep &&
          selections.selectionStep !== "complete"
        ) {
          setSelectionStep(selections.selectionStep);
          return;
        }
      }
    } catch (error) {
      console.error("Failed to read selectionStep from sessionStorage:", error);
    }
    // Default to player2 if no specific step was requested or if it was "complete"
    setSelectionStep("player2");
  };

  // Compute hover previews based on active selection step
  const previewedPlayer1 =
    selectionStep === "player1" ? hoveredPersona || player1 : player1;
  const previewedPlayer2 =
    selectionStep === "player2" ? hoveredPersona || player2 : player2;

  // Show loading screen while hydrating from sessionStorage
  if (!isHydrated) {
    return <SessionRestoreLoading />;
  }

  return (
    <div className="relative min-h-dvh flex flex-col">
      <AnimatePresence initial={false} mode="wait">
        {showStageSelect && player1 && player2 ? (
          <motion.div
            key="stage-select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <StageSelect
              player1={player1}
              player2={player2}
              isAdmin={isAdmin}
              votingEnabled={votingEnabled}
              commentsEnabled={commentsEnabled}
              createAsLive={createAsLive}
              isVotingGloballyEnabled={isVotingGloballyEnabled}
              isCommentsGloballyEnabled={isCommentsGloballyEnabled}
              onBack={handleBackToCharacterSelect}
              onVotingEnabledChange={setVotingEnabled}
              onCommentsEnabledChange={setCommentsEnabled}
              onCreateAsLiveChange={setCreateAsLive}
              autoStartOnAdvance={autoStartOnAdvance}
              onAutoStartOnAdvanceChange={setAutoStartOnAdvance}
              sessionStorageKey={SESSION_STORAGE_KEY}
            />
          </motion.div>
        ) : (
          <motion.div
            key={selectionStep}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex-1 flex flex-col"
          >
            <SiteHeader />
            <div className="min-h-screen bg-black text-white selection:bg-yellow-500/30 pt-20 relative overflow-hidden flex flex-col">
              {/* Background Effects */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-purple-900/20 via-black to-black z-0" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl z-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
              </div>

              <div className="container mx-auto px-4 relative z-10 flex flex-col flex-1">
                {/* Header Section */}
                <div className="text-center mb-8 animate-slide-up">
                  <h1 className="text-5xl md:text-7xl font-bold tracking-tighter font-(family-name:--font-bebas-neue)">
                    <span className="bg-linear-to-r from-white via-gray-200 to-gray-400 text-transparent bg-clip-text pr-2 text-uppercase">
                      Select Characters
                    </span>
                  </h1>
                </div>

                {/* Main Selection Area */}
                <div className="flex flex-col lg:flex-row items-center justify-center max-w-6xl mx-auto w-full gap-2 lg:gap-12 flex-1">
                  {/* Players Preview Area */}
                  <div className="w-full lg:w-auto shrink-0 flex flex-row justify-center gap-4 md:gap-12 lg:gap-16 items-center lg:sticky lg:top-24 order-1 lg:order-2 mb-2 lg:mb-0">
                    {/* Player 1 Preview */}
                    <div className="w-[140px] md:w-[200px]">
                      <PlayerDisplay
                        player={previewedPlayer1}
                        side="left"
                        showBio={true}
                        placeholder="PLAYER 1"
                        onActivate={() => setSelectionStep("player1")}
                        onClear={
                          player1 && selectionStep !== "player1"
                            ? () => setSelectionStep("player1")
                            : undefined
                        }
                        isActive={selectionStep === "player1"}
                      />
                    </div>

                    {/* VS Badge */}
                    <div className="flex flex-col items-center">
                      <div className="relative w-12 h-12 md:w-16 md:h-16 flex items-center justify-center">
                        <VsGlow
                          visible={Boolean(player1 && player2)}
                          color="player2"
                          size="md"
                        />
                      </div>
                    </div>

                    {/* Player 2 Preview */}
                    <div className="w-[140px] md:w-[200px]">
                      <PlayerDisplay
                        player={previewedPlayer2}
                        side="right"
                        showBio={true}
                        placeholder="PLAYER 2"
                        onActivate={() => setSelectionStep("player2")}
                        onClear={
                          player2 && selectionStep !== "player2"
                            ? () => setSelectionStep("player2")
                            : undefined
                        }
                        isActive={selectionStep === "player2"}
                      />
                    </div>
                  </div>

                  {/* Character Grid */}
                  <div className="w-full order-2 lg:order-1 flex-1">
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4 md:p-6">
                      <SelectionGrid gap="normal">
                        {primaryPersonas.map((persona) => {
                          const p1InGroup = isInGroup(
                            player1?.id ?? null,
                            persona.id
                          );
                          const p2InGroup = isInGroup(
                            player2?.id ?? null,
                            persona.id
                          );
                          const p1VariantIndex =
                            p1InGroup && player1
                              ? getVariantIndex(player1.id, persona.id)
                              : -1;
                          const p2VariantIndex =
                            p2InGroup && player2
                              ? getVariantIndex(player2.id, persona.id)
                              : -1;
                          const selected = p1InGroup || p2InGroup;
                          const showPlayer1Indicator =
                            p1InGroup && selectionStep === "player1";
                          const showPlayer2Indicator =
                            p2InGroup && selectionStep === "player2";

                          return (
                            <PersonaGridItem
                              key={persona.id}
                              persona={persona}
                              isSelected={selected}
                              isPlayer1={p1InGroup}
                              isPlayer2={p2InGroup}
                              showPlayer1Indicator={showPlayer1Indicator}
                              showPlayer2Indicator={showPlayer2Indicator}
                              player1VariantIndex={p1VariantIndex}
                              player2VariantIndex={p2VariantIndex}
                              isTouchDevice={isTouchDevice}
                              onClick={() => handlePersonaClick(persona)}
                              onMouseEnter={() =>
                                setHoveredPersona(
                                  getHoverPreviewPersona(
                                    persona,
                                    selectionStep,
                                    player1,
                                    player2
                                  )
                                )
                              }
                              onMouseLeave={() => setHoveredPersona(null)}
                              onTouchStart={() => setHoveredPersona(null)}
                            />
                          );
                        })}
                      </SelectionGrid>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Bottom Bar */}
              <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-linear-to-t from-black via-black/90 to-transparent pt-12">
                <div className="container mx-auto max-w-xl">
                  {selectionStep === "player1" ? (
                    <button
                      onClick={() => {
                        if (player1) {
                          // Check if we're editing from stage select
                          try {
                            const stored =
                              sessionStorage.getItem(SESSION_STORAGE_KEY);
                            if (stored) {
                              const selections: BattleSelections =
                                JSON.parse(stored);
                              if (
                                selections.editPlayer &&
                                selections.fromStage
                              ) {
                                selections.editPlayer = false;
                                selections.fromStage = false;
                                selections.selectionStep = "complete";
                                selections.showStageSelect = true;
                                sessionStorage.setItem(
                                  SESSION_STORAGE_KEY,
                                  JSON.stringify(selections)
                                );
                                setSelectionStep("complete");
                                setShowStageSelect(true);
                                handleProceedToStageSelect();
                                return;
                              }
                            }
                          } catch (error) {
                            console.error("Failed to check edit flags:", error);
                          }
                          // Normal flow: proceed to player 2
                          setSelectionStep("player2");
                        }
                      }}
                      disabled={!player1}
                      className={cn(
                        "w-full px-8 md:px-12 py-4 rounded-lg font-black text-xl tracking-wider transition-all duration-300 transform",
                        !player1
                          ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                          : "bg-linear-to-r from-yellow-400 via-orange-500 to-red-600 hover:scale-105 hover:shadow-[0_0_40px_rgba(251,191,36,0.8)] text-white shadow-lg shadow-yellow-500/20"
                      )}
                    >
                      CONFIRM PLAYER 1
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (player2) {
                          // Check if player1 is still selected
                          if (!player1) {
                            setSelectionStep("player1");
                            return;
                          }

                          // Check if we're editing from stage select
                          try {
                            const stored =
                              sessionStorage.getItem(SESSION_STORAGE_KEY);
                            if (stored) {
                              const selections: BattleSelections =
                                JSON.parse(stored);
                              if (
                                selections.editPlayer &&
                                selections.fromStage
                              ) {
                                selections.editPlayer = false;
                                selections.fromStage = false;
                                selections.selectionStep = "complete";
                                selections.showStageSelect = true;
                                sessionStorage.setItem(
                                  SESSION_STORAGE_KEY,
                                  JSON.stringify(selections)
                                );
                                setSelectionStep("complete");
                                setShowStageSelect(true);
                                handleProceedToStageSelect();
                                return;
                              }
                            }
                          } catch (error) {
                            console.error("Failed to check edit flags:", error);
                          }
                          setSelectionStep("complete");
                          handleProceedToStageSelect();
                        }
                      }}
                      disabled={!player2}
                      className={cn(
                        "w-full px-8 md:px-12 py-4 rounded-lg font-black text-xl tracking-wider transition-all duration-300 transform",
                        !player2
                          ? "bg-gray-800 text-gray-600 cursor-not-allowed"
                          : "bg-linear-to-r from-yellow-400 via-orange-500 to-red-600 hover:scale-105 hover:shadow-[0_0_40px_rgba(251,191,36,0.8)] text-white shadow-lg shadow-yellow-500/20"
                      )}
                    >
                      CONFIRM PLAYER 2
                    </button>
                  )}
                </div>
              </div>

              {/* Spacer for bottom bar */}
              <div className="h-48" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
