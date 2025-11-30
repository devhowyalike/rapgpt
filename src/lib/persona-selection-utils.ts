import {
  type ClientPersona,
  getClientPersona,
  getPersonaGroups,
} from "@/lib/shared/personas/client";

const personaGroups = getPersonaGroups();

/**
 * Get the next variant ID in a persona group, returning null after the last variant (for deselection)
 */
export function getNextVariantId(
  primaryId: string,
  currentId?: string | null,
): string | null {
  const group = personaGroups[primaryId] || [primaryId];
  if (!currentId) return group[0] ?? null;
  const i = group.indexOf(currentId);
  if (i === -1) return group[0] ?? null;
  // Return null after cycling through all variants to allow deselection
  const nextIndex = i + 1;
  return nextIndex < group.length ? (group[nextIndex] ?? null) : null;
}

/**
 * Check if a persona ID belongs to a persona group
 */
export function isInGroup(
  personaId: string | null,
  primaryId: string,
): boolean {
  if (!personaId) return false;
  const group = personaGroups[primaryId] || [primaryId];
  return group.includes(personaId);
}

/**
 * Get the index of a persona variant within its group
 */
export function getVariantIndex(personaId: string, primaryId: string): number {
  const group = personaGroups[primaryId] || [primaryId];
  return Math.max(0, group.indexOf(personaId));
}

/**
 * Get the hover preview persona based on selection state
 */
export function getHoverPreviewPersona(
  primary: ClientPersona,
  selectionStep: "player1" | "player2" | "complete",
  player1: ClientPersona | null,
  player2: ClientPersona | null,
): ClientPersona {
  const group = personaGroups[primary.id] || [primary.id];
  const p1InGroup = !!(player1 && group.includes(player1.id));
  const p2InGroup = !!(player2 && group.includes(player2.id));

  // Show the currently selected variant based on active selection step
  if (selectionStep === "player1" && p1InGroup && player1) {
    return player1;
  } else if (selectionStep === "player2" && p2InGroup && player2) {
    return player2;
  } else if (selectionStep === "complete") {
    if (p1InGroup && player1) {
      return player1;
    } else if (p2InGroup && player2) {
      return player2;
    }
  }

  // Default: show the primary persona (first costume in the group)
  return primary;
}

/**
 * Cycle to the next variant for a player
 */
export function cyclePlayerVariant(
  primaryId: string,
  currentPersona: ClientPersona | null,
  isTouchDevice: boolean,
  setPersona: (persona: ClientPersona | null) => void,
  setHoveredPersona: (persona: ClientPersona | null) => void,
): void {
  const currentId = currentPersona?.id ?? null;
  const nextId = getNextVariantId(primaryId, currentId);

  if (nextId) {
    const nextPersona = getClientPersona(nextId);
    if (nextPersona) {
      setPersona(nextPersona);
      if (!isTouchDevice) {
        setHoveredPersona(nextPersona);
      }
    }
  } else {
    setPersona(null);
    if (!isTouchDevice) {
      const primaryPersona = getClientPersona(primaryId);
      if (primaryPersona) {
        setHoveredPersona(primaryPersona);
      }
    }
  }
}

/**
 * Select a new persona for a player
 */
export function selectNewPersona(
  primaryId: string,
  isTouchDevice: boolean,
  setPersona: (persona: ClientPersona | null) => void,
  setHoveredPersona: (persona: ClientPersona | null) => void,
): void {
  const nextId = getNextVariantId(primaryId, null);
  const nextPersona = nextId ? getClientPersona(nextId) : null;

  if (nextPersona) {
    setPersona(nextPersona);
    if (!isTouchDevice) {
      setHoveredPersona(nextPersona);
    }
  }
}
