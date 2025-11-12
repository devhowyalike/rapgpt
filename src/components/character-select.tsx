"use client";

import { useState, useEffect } from "react";
import {
  getPrimaryClientPersonas,
  getClientPersona,
  type ClientPersona,
} from "@/lib/shared/personas/client";
import { useAuth } from "@clerk/nextjs";
import { StageSelect } from "./stage-select";
import { SelectionLayout } from "./selection/selection-layout";
import { SelectionContainer } from "./selection/selection-container";
import { PlayerDisplay } from "./selection/player-display";
import { CenterDisplay } from "./selection/center-display";
import { SelectionBottom } from "./selection/selection-bottom";
import { SelectionGrid } from "./selection/selection-grid";
import { SelectionActions } from "./selection/selection-actions";
import { ActionButton } from "./selection/action-button";
import { SessionRestoreLoading } from "./session-restore-loading";
import { PersonaGridItem } from "./selection/persona-grid-item";
import { motion, AnimatePresence } from "framer-motion";
import { usePersonaSelection } from "@/hooks/use-persona-selection";
import {
  getHoverPreviewPersona,
  isInGroup,
  getVariantIndex,
} from "@/lib/persona-selection-utils";

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
            key="character-select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <SelectionLayout title="Create Battle">
              {/* Top Section - Character Display */}
              <SelectionContainer>
                {/* Player 1 */}
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

                {/* Center - VS Text */}
                <div className="flex flex-col items-center gap-2">
                  {/* Player Step Indicator */}
                  <div className="h-8 flex items-center justify-center">
                    <div
                      className={`text-2xl md:text-3xl font-black transition-all duration-300 ${
                        selectionStep === "player1"
                          ? "text-[rgb(var(--player1-color))] drop-shadow-[0_0_20px_rgba(var(--player1-color),0.8)] opacity-100"
                          : selectionStep === "player2"
                          ? "text-[rgb(var(--player2-color))] drop-shadow-[0_0_20px_rgba(var(--player2-color),0.8)] opacity-100"
                          : "opacity-0"
                      }`}
                    >
                      {selectionStep === "player1"
                        ? "Player 1"
                        : selectionStep === "player2"
                        ? "Player 2"
                        : ""}
                    </div>
                  </div>

                  <CenterDisplay title="CHARACTER" subtitle="SELECT">
                    {/* VS text with fixed height to prevent layout shift */}
                    <div className="h-6 md:h-8 lg:h-10 flex items-center justify-center">
                      <div
                        className={`text-lg md:text-xl lg:text-2xl font-black text-[rgb(var(--player2-color))] animate-pulse drop-shadow-[0_0_20px_rgba(var(--player2-color),0.8)] transition-opacity duration-300 ${
                          player1 && player2 ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        VS
                      </div>
                    </div>
                  </CenterDisplay>
                </div>

                {/* Player 2 */}
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
              </SelectionContainer>

              {/* Bottom Section - Character Grid */}
              <SelectionBottom>
                <AnimatePresence initial={false} mode="wait">
                  <motion.div
                    key={selectionStep}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    {/* Character Selection Grid */}
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

                    {/* Start Button */}
                    <SelectionActions>
                      {selectionStep === "player1" ? (
                        <ActionButton
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
                                    // Clear the edit flags and return to stage select
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
                                console.error(
                                  "Failed to check edit flags:",
                                  error
                                );
                              }
                              // Normal flow: proceed to player 2
                              setSelectionStep("player2");
                            }
                          }}
                          disabled={!player1}
                        >
                          SELECT PLAYER 1
                        </ActionButton>
                      ) : (
                        <ActionButton
                          onClick={() => {
                            if (player2) {
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
                                    // Clear the edit flags and return to stage select
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
                                console.error(
                                  "Failed to check edit flags:",
                                  error
                                );
                              }
                              setSelectionStep("complete");
                              handleProceedToStageSelect();
                            }
                          }}
                          disabled={!player2}
                        >
                          SELECT PLAYER 2
                        </ActionButton>
                      )}
                    </SelectionActions>
                  </motion.div>
                </AnimatePresence>
              </SelectionBottom>
            </SelectionLayout>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
