import { useState } from "react";
import type { ClientPersona } from "@/lib/shared/personas/client";
import { getPersonaGroups } from "@/lib/shared/personas/client";
import {
  cyclePlayerVariant,
  selectNewPersona,
  isInGroup,
} from "@/lib/persona-selection-utils";

const personaGroups = getPersonaGroups();

type SelectionStep = "player1" | "player2" | "complete";

interface UsePersonaSelectionReturn {
  player1: ClientPersona | null;
  player2: ClientPersona | null;
  selectionStep: SelectionStep;
  lastInteractedSlot: "player1" | "player2" | null;
  setPlayer1: (persona: ClientPersona | null) => void;
  setPlayer2: (persona: ClientPersona | null) => void;
  setSelectionStep: (step: SelectionStep) => void;
  handlePersonaClick: (
    primary: ClientPersona,
    isTouchDevice: boolean,
    setHoveredPersona: (persona: ClientPersona | null) => void
  ) => void;
}

export function usePersonaSelection(): UsePersonaSelectionReturn {
  const [player1, setPlayer1] = useState<ClientPersona | null>(null);
  const [player2, setPlayer2] = useState<ClientPersona | null>(null);
  const [lastInteractedSlot, setLastInteractedSlot] = useState<
    "player1" | "player2" | null
  >(null);
  const [selectionStep, setSelectionStep] = useState<SelectionStep>("player1");

  const handlePersonaClick = (
    primary: ClientPersona,
    isTouchDevice: boolean,
    setHoveredPersona: (persona: ClientPersona | null) => void
  ) => {
    // Clear hover preview on touch devices after click
    if (isTouchDevice) {
      setHoveredPersona(null);
    }

    const group = personaGroups[primary.id] || [primary.id];
    const p1InGroup = isInGroup(player1?.id ?? null, primary.id);
    const p2InGroup = isInGroup(player2?.id ?? null, primary.id);

    // Handle player 1 selection step
    if (selectionStep === "player1") {
      if (p1InGroup) {
        cyclePlayerVariant(
          primary.id,
          player1,
          isTouchDevice,
          setPlayer1,
          setHoveredPersona
        );
      } else {
        selectNewPersona(
          primary.id,
          isTouchDevice,
          setPlayer1,
          setHoveredPersona
        );
      }
      return;
    }

    // Handle player 2 selection step
    if (selectionStep === "player2") {
      if (p2InGroup) {
        cyclePlayerVariant(
          primary.id,
          player2,
          isTouchDevice,
          setPlayer2,
          setHoveredPersona
        );
      } else {
        selectNewPersona(
          primary.id,
          isTouchDevice,
          setPlayer2,
          setHoveredPersona
        );
      }
      return;
    }

    // Handle complete step - allow cycling both players
    if (selectionStep === "complete") {
      // If neither slot has this group selected, do nothing
      if (!p1InGroup && !p2InGroup) {
        return;
      }

      // Determine which player to cycle
      let target: "player1" | "player2" | null = null;
      if (p1InGroup && p2InGroup) {
        target = lastInteractedSlot ?? "player1";
      } else if (p1InGroup) {
        target = "player1";
      } else if (p2InGroup) {
        target = "player2";
      }

      if (target === "player1") {
        cyclePlayerVariant(
          primary.id,
          player1,
          isTouchDevice,
          setPlayer1,
          setHoveredPersona
        );
        setLastInteractedSlot("player1");
      } else if (target === "player2") {
        cyclePlayerVariant(
          primary.id,
          player2,
          isTouchDevice,
          setPlayer2,
          setHoveredPersona
        );
        setLastInteractedSlot("player2");
      }
    }
  };

  return {
    player1,
    player2,
    selectionStep,
    lastInteractedSlot,
    setPlayer1,
    setPlayer2,
    setSelectionStep,
    handlePersonaClick,
  };
}

