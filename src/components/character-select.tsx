"use client";

import { useState, useEffect } from "react";
import {
  getAllClientPersonas,
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
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export function CharacterSelect() {
  const [player1, setPlayer1] = useState<ClientPersona | null>(null);
  const [player2, setPlayer2] = useState<ClientPersona | null>(null);
  const [hoveredPersona, setHoveredPersona] = useState<ClientPersona | null>(
    null
  );
  const [showStageSelect, setShowStageSelect] = useState(false);
  const [createAsLive, setCreateAsLive] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [votingEnabled, setVotingEnabled] = useState(true);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

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

  const personas = getAllClientPersonas();

  const handlePersonaClick = (persona: ClientPersona) => {
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

  const isSelected = (persona: ClientPersona) => {
    return player1?.id === persona.id || player2?.id === persona.id;
  };

  const getSelectionLabel = (persona: ClientPersona) => {
    if (player1?.id === persona.id) return "P1";
    if (player2?.id === persona.id) return "P2";
    return null;
  };

  const handleProceedToStageSelect = () => {
    if (!player1 || !player2) return;
    setShowStageSelect(true);
  };

  const handleBackToCharacterSelect = () => {
    setShowStageSelect(false);
  };

  // Show player1 if selected, otherwise show hoveredPersona as preview if no player1 selected
  const displayPlayer1 = player1 || (!player1 && hoveredPersona);
  // Show player2 if selected, otherwise show hoveredPersona as preview if player1 is selected but not player2
  const displayPlayer2 = player2 || (player1 && !player2 && hoveredPersona);

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
                  player={displayPlayer1}
                  side="left"
                  showBio={true}
                  placeholder="PLAYER 1"
                />

                {/* Center - VS Text */}
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

                {/* Player 2 */}
                <PlayerDisplay
                  player={displayPlayer2}
                  side="right"
                  showBio={true}
                  placeholder="PLAYER 2"
                />
              </SelectionContainer>

              {/* Bottom Section - Character Grid */}
              <SelectionBottom>
                {/* Character Selection Grid */}
                <SelectionGrid gap="normal">
                  {personas.map((persona) => {
                    const selected = isSelected(persona);
                    const label = getSelectionLabel(persona);

                    return (
                      <button
                        key={persona.id}
                        onClick={() => handlePersonaClick(persona)}
                        onMouseEnter={() =>
                          !isTouchDevice && setHoveredPersona(persona)
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
                        ${selected ? "scale-105 md:scale-110 z-10" : ""}
                      `}
                      >
                        {/* Selection Indicator */}
                        {selected && (
                          <div
                            className={`
                            absolute top-0 right-0 z-20
                            w-7 h-7 md:w-8 md:h-8 rounded-full
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
                          overflow-hidden
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
                  <ActionButton
                    onClick={handleProceedToStageSelect}
                    disabled={!player1 || !player2}
                  >
                    {player1 && player2 ? "SELECT FIGHTERS" : "SELECT FIGHTERS"}
                  </ActionButton>
                </SelectionActions>
              </SelectionBottom>
            </SelectionLayout>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
