"use client";

import { useState, useEffect } from "react";
import {
  getPrimaryClientPersonas,
  getPersonaGroups,
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
import { BattleOptions } from "./battle-options";
import { SessionRestoreLoading } from "./session-restore-loading";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

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
  const [player1, setPlayer1] = useState<ClientPersona | null>(null);
  const [player2, setPlayer2] = useState<ClientPersona | null>(null);
  const [lastInteractedSlot, setLastInteractedSlot] = useState<
    "player1" | "player2" | null
  >(null);
  const [selectionStep, setSelectionStep] = useState<
    "player1" | "player2" | "complete"
  >("player1");
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
  const personaGroups = getPersonaGroups();

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
      const selections: BattleSelections = {
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

  const nextVariantId = (
    primaryId: string,
    currentId?: string | null
  ): string | null => {
    const group = personaGroups[primaryId] || [primaryId];
    if (!currentId) return group[0] ?? null;
    const i = group.indexOf(currentId);
    if (i === -1) return group[0] ?? null;
    // Wrap around to the beginning instead of deselecting
    return group[(i + 1) % group.length] ?? null;
  };

  const getHoverPreviewPersona = (primary: ClientPersona): ClientPersona => {
    const group = personaGroups[primary.id] || [primary.id];
    const p1InGroup = !!(player1 && group.includes(player1.id));
    const p2InGroup = !!(player2 && group.includes(player2.id));

    // Show the currently selected variant based on active selection step
    if (selectionStep === "player1" && p1InGroup && player1) {
      // Show current P1 selection
      return player1;
    } else if (selectionStep === "player2" && p2InGroup && player2) {
      // Show current P2 selection
      return player2;
    } else if (selectionStep === "complete") {
      // In complete step, show currently selected variant for whichever player has this character
      if (p1InGroup && player1) {
        return player1;
      } else if (p2InGroup && player2) {
        return player2;
      }
    }

    // Default: show the primary persona (first costume in the group)
    return primary;
  };

  const handlePersonaClick = (primary: ClientPersona) => {
    // Clear hover preview on touch devices after click
    if (isTouchDevice) {
      setHoveredPersona(null);
    }

    const group = personaGroups[primary.id] || [primary.id];
    const p1InGroup = !!(player1 && group.includes(player1.id));
    const p2InGroup = !!(player2 && group.includes(player2.id));

    // Lock selection based on current step
    if (selectionStep === "player1") {
      // Only allow P1 selection/cycling
      if (p1InGroup) {
        // Cycle P1's costume
        const currentId = player1?.id ?? null;
        const nextId = nextVariantId(primary.id, currentId);
        if (nextId) {
          const nextPersona = getClientPersona(nextId);
          if (nextPersona) {
            setPlayer1(nextPersona);
            // Update hover preview to show the new selection
            if (!isTouchDevice) {
              setHoveredPersona(nextPersona);
            }
          }
        } else {
          setPlayer1(null);
          // Update hover preview to show deselection
          if (!isTouchDevice) {
            setHoveredPersona(primary);
          }
        }
      } else {
        // Select P1
        const nextId = nextVariantId(primary.id, null);
        const nextPersona = nextId ? getClientPersona(nextId) : null;
        if (nextPersona) {
          setPlayer1(nextPersona);
          // Update hover preview to show the new selection
          if (!isTouchDevice) {
            setHoveredPersona(nextPersona);
          }
        }
      }
      return;
    }

    if (selectionStep === "player2") {
      // Only allow P2 selection/cycling
      if (p2InGroup) {
        // Cycle P2's costume
        const currentId = player2?.id ?? null;
        const nextId = nextVariantId(primary.id, currentId);
        if (nextId) {
          const nextPersona = getClientPersona(nextId);
          if (nextPersona) {
            setPlayer2(nextPersona);
            // Update hover preview to show the new selection
            if (!isTouchDevice) {
              setHoveredPersona(nextPersona);
            }
          }
        } else {
          setPlayer2(null);
          // Update hover preview to show deselection
          if (!isTouchDevice) {
            setHoveredPersona(primary);
          }
        }
      } else {
        // Select P2
        const nextId = nextVariantId(primary.id, null);
        const nextPersona = nextId ? getClientPersona(nextId) : null;
        if (nextPersona) {
          setPlayer2(nextPersona);
          // Update hover preview to show the new selection
          if (!isTouchDevice) {
            setHoveredPersona(nextPersona);
          }
        }
      }
      return;
    }

    // If selection is complete, allow cycling both
    if (selectionStep === "complete") {
      // If neither slot has this group selected, do nothing (selections are locked)
      if (!p1InGroup && !p2InGroup) {
        return;
      }

      // If one or both slots have this group's variant, cycle that slot
      let target: "player1" | "player2" | null = null;
      if (p1InGroup && p2InGroup) {
        target = lastInteractedSlot ?? "player1";
      } else if (p1InGroup) {
        target = "player1";
      } else if (p2InGroup) {
        target = "player2";
      }

      if (target === "player1") {
        const currentId = player1?.id ?? null;
        const nextId = nextVariantId(primary.id, currentId);
        if (nextId) {
          const nextPersona = getClientPersona(nextId);
          if (nextPersona) {
            setPlayer1(nextPersona);
            setLastInteractedSlot("player1");
            // Update hover preview to show the new selection
            if (!isTouchDevice) {
              setHoveredPersona(nextPersona);
            }
          }
        } else {
          setPlayer1(null);
          setLastInteractedSlot("player1");
          // Update hover preview to show deselection
          if (!isTouchDevice) {
            setHoveredPersona(primary);
          }
        }
        return;
      }

      if (target === "player2") {
        const currentId = player2?.id ?? null;
        const nextId = nextVariantId(primary.id, currentId);
        if (nextId) {
          const nextPersona = getClientPersona(nextId);
          if (nextPersona) {
            setPlayer2(nextPersona);
            setLastInteractedSlot("player2");
            // Update hover preview to show the new selection
            if (!isTouchDevice) {
              setHoveredPersona(nextPersona);
            }
          }
        } else {
          setPlayer2(null);
          setLastInteractedSlot("player2");
          // Update hover preview to show deselection
          if (!isTouchDevice) {
            setHoveredPersona(primary);
          }
        }
        return;
      }
    }
  };

  const isCardSelected = (primaryId: string) => {
    const group = personaGroups[primaryId] || [primaryId];
    return (
      (player1 && group.includes(player1.id)) ||
      (player2 && group.includes(player2.id))
    );
  };

  const handleProceedToStageSelect = () => {
    if (!player1 || !player2) return;
    setShowStageSelect(true);
  };

  const handleBackToCharacterSelect = () => {
    setShowStageSelect(false);
    setSelectionStep("player2");
  };

  // Base players without hover previews
  const basePlayer1 = player1;
  const basePlayer2 = player2;

  // Compute hover previews based on active selection step
  const previewedPlayer1 =
    selectionStep === "player1" ? hoveredPersona || basePlayer1 : basePlayer1;
  const previewedPlayer2 =
    selectionStep === "player2" ? hoveredPersona || basePlayer2 : basePlayer2;

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
                          ? "text-blue-500 drop-shadow-[0_0_20px_rgba(59,130,246,0.8)] opacity-100"
                          : selectionStep === "player2"
                          ? "text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)] opacity-100"
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
                        className={`text-lg md:text-xl lg:text-2xl font-black text-red-500 animate-pulse drop-shadow-[0_0_20px_rgba(239,68,68,0.8)] transition-opacity duration-300 ${
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
                        const group = personaGroups[persona.id] || [persona.id];
                        const p1InGroup = !!(
                          player1 && group.includes(player1.id)
                        );
                        const p2InGroup = !!(
                          player2 && group.includes(player2.id)
                        );
                        const p1VariantIndex =
                          p1InGroup && player1
                            ? Math.max(0, group.indexOf(player1.id))
                            : -1;
                        const p2VariantIndex =
                          p2InGroup && player2
                            ? Math.max(0, group.indexOf(player2.id))
                            : -1;
                        const selected = p1InGroup || p2InGroup;

                        return (
                          <button
                            key={persona.id}
                            onClick={() => handlePersonaClick(persona)}
                            onMouseEnter={() =>
                              !isTouchDevice &&
                              setHoveredPersona(getHoverPreviewPersona(persona))
                            }
                            onMouseLeave={() =>
                              !isTouchDevice && setHoveredPersona(null)
                            }
                            onTouchStart={() =>
                              isTouchDevice && setHoveredPersona(null)
                            }
                            className={`
                        relative group
                        transition-all duration-300 transform
                        hover:scale-105 md:hover:scale-110 hover:z-20
                        ${
                          selected &&
                          ((p1InGroup && selectionStep === "player1") ||
                            (p2InGroup && selectionStep === "player2"))
                            ? "scale-105 md:scale-110 z-10"
                            : ""
                        }
                      `}
                          >
                            {/* Selection Indicators - only show for active selection step */}
                            {selected && (
                              <>
                                {p1InGroup && selectionStep === "player1" && (
                                  <div
                                    className={`
                                  absolute top-0 right-0 z-20
                                  w-7 h-7 md:w-8 md:h-8 rounded-full
                                  flex items-center justify-center
                                  font-bold text-xs
                                  bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.8)]
                                `}
                                  >
                                    P1
                                    {p1VariantIndex > 0 && (
                                      <span className="absolute -bottom-1 -right-1 w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-white/90" />
                                    )}
                                  </div>
                                )}
                                {p2InGroup && selectionStep === "player2" && (
                                  <div
                                    className={`
                                  absolute top-0 right-0 z-20
                                  w-7 h-7 md:w-8 md:h-8 rounded-full
                                  flex items-center justify-center
                                  font-bold text-xs
                                  bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.8)]
                                `}
                                  >
                                    P2
                                    {p2VariantIndex > 0 && (
                                      <span className="absolute -bottom-1 -right-1 w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-white/90" />
                                    )}
                                  </div>
                                )}
                              </>
                            )}

                            {/* Deselect Overlay - shows on hover of selected character for active step */}
                            {selected &&
                              ((p1InGroup && selectionStep === "player1") ||
                                (p2InGroup && selectionStep === "player2")) && (
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/70 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 z-10 rounded-lg">
                                  <div className="text-center">
                                    <div className="text-white font-bold text-2xl md:text-3xl mb-1">
                                      ✕
                                    </div>
                                    <div className="text-white font-semibold text-xs uppercase">
                                      Deselect
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
                          overflow-hidden
                          bg-linear-to-br from-gray-800 to-gray-900
                          transition-all duration-300
                          ${
                            selected &&
                            ((p1InGroup && selectionStep === "player1") ||
                              (p2InGroup && selectionStep === "player2"))
                              ? p1InGroup && selectionStep === "player1"
                                ? "border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.8)]"
                                : "border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.8)]"
                              : "border-gray-700 hover:border-yellow-400 hover:shadow-[0_0_20px_rgba(250,204,21,0.5)]"
                          }
                        `}
                            >
                              <Image
                                src={persona.avatar}
                                alt={persona.name}
                                width={112}
                                height={112}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </button>
                        );
                      })}
                    </SelectionGrid>

                    {/* Start Button */}
                    <SelectionActions>
                      {selectionStep === "player1" ? (
                        <ActionButton
                          onClick={() => {
                            if (player1) {
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
