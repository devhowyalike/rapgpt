/**
 * Utility functions for working with battle positions and persona mappings
 * These helpers bridge the gap between position-based scoring and persona-based UI/APIs
 */

import type {
  Battle,
  Persona,
  PersonaPosition,
  RoundScore,
} from "@/lib/shared";

/**
 * Get the position (player1 or player2) for a given persona ID in a battle
 * Returns null if the persona ID is not found in the battle
 */
export function getPersonaPosition(
  battle: Battle,
  personaId: string,
): PersonaPosition | null {
  if (battle.personas.player1.id === personaId) return "player1";
  if (battle.personas.player2.id === personaId) return "player2";
  return null;
}

/**
 * Get the persona object for a given position in a battle
 */
export function getPersonaByPosition(
  battle: Battle,
  position: PersonaPosition,
): Persona {
  return battle.personas[position];
}

/**
 * Convert a round winner position to the corresponding persona ID
 * Returns null if there's no winner or if the position is invalid
 */
export function getWinnerPersonaId(
  battle: Battle,
  roundScore: RoundScore,
): string | null {
  if (!roundScore.winner) return null;
  return battle.personas[roundScore.winner].id;
}

/**
 * Get the score for a specific persona in a round by looking up their position
 * Returns null if the persona is not in this battle
 */
export function getRoundScoreForPersona(
  battle: Battle,
  roundScore: RoundScore,
  personaId: string,
) {
  const position = getPersonaPosition(battle, personaId);
  if (!position) return null;
  return roundScore.positionScores[position];
}

/**
 * Check if a persona is the winner of a specific round
 */
export function isPersonaRoundWinner(
  battle: Battle,
  roundScore: RoundScore,
  personaId: string,
): boolean {
  const position = getPersonaPosition(battle, personaId);
  return position !== null && roundScore.winner === position;
}

/**
 * Get both position and persona info together
 */
export function getPositionInfo(battle: Battle, position: PersonaPosition) {
  return {
    position,
    persona: battle.personas[position],
    personaId: battle.personas[position].id,
  };
}

/**
 * Get all position info for both players
 */
export function getAllPositionInfo(battle: Battle) {
  return {
    player1: getPositionInfo(battle, "player1"),
    player2: getPositionInfo(battle, "player2"),
  };
}

/**
 * Safely get a position's total score from a round score
 * Returns 0 if the position scores don't exist or are invalid
 */
export function getPositionScore(
  roundScore: RoundScore,
  position: PersonaPosition,
): number {
  return roundScore.positionScores?.[position]?.totalScore ?? 0;
}

/**
 * Calculate total scores for both positions across all rounds
 */
export function calculateTotalScores(scoresOrBattle: RoundScore[] | Battle) {
  const scores = Array.isArray(scoresOrBattle)
    ? scoresOrBattle
    : scoresOrBattle.scores;

  let player1Total = 0;
  let player2Total = 0;

  for (const roundScore of scores) {
    player1Total += getPositionScore(roundScore, "player1");
    player2Total += getPositionScore(roundScore, "player2");
  }

  return {
    player1: Math.round(player1Total),
    player2: Math.round(player2Total),
  };
}
