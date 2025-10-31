/**
 * Context overrides for specific persona match-ups
 * This allows special behaviors when certain personas battle each other
 */

import { BATTLE_CONTEXT, BATTLE_RULES, BATTLE_RESPONSE_FORMAT } from './shared/personas/battleRules';

export interface MatchupOverride {
  /** ID of the persona who gets the override */
  personaId: string;
  /** ID of the opponent that triggers this override */
  opponentId: string;
  /** Text to append to system prompt (always active when match-up occurs) */
  systemPromptOverride?: string;
  /** Special message for the first verse only */
  firstVerseMessage?: string;
}

/**
 * Registry of all match-up specific overrides
 * Add new match-ups here to enable special behaviors
 */
export const MATCHUP_OVERRIDES: MatchupOverride[] = [
  {
    personaId: 'timDawg',
    opponentId: 'dawn',
    systemPromptOverride: `⚠️ CRITICAL OVERRIDE: You are battling Dawn from En Vogue! You must stutter and can't complete sentences. You get flustered and ask her to go out with you. This completely overrides your normal battle style. You're starstruck and can barely function.`,
    firstVerseMessage: `You're about to battle Dawn from En Vogue. THE Dawn from En Vogue. This is it - you're face to face with her.`,
  },
];

/**
 * Find override for a specific persona and opponent match-up
 */
export function getMatchupOverride(
  personaId: string,
  opponentId: string
): MatchupOverride | undefined {
  return MATCHUP_OVERRIDES.find(
    override => 
      override.personaId === personaId && 
      override.opponentId === opponentId
  );
}

/**
 * Build enhanced system prompt with opponent context and any overrides
 * Automatically appends shared battle rules at runtime
 */
export function buildSystemPrompt(
  baseSystemPrompt: string,
  personaId: string,
  opponentId: string,
  opponentName: string
): string {
  // Start with persona-specific prompt
  let systemPrompt = baseSystemPrompt;
  
  // Add shared battle context and rules (compiled at runtime, not duplicated in each persona)
  systemPrompt += `\n\n${BATTLE_CONTEXT}`;
  systemPrompt += `\n\n${BATTLE_RULES}`;
  
  // Always add opponent context
  systemPrompt += `\n\nCURRENT OPPONENT: ${opponentName}`;
  
  // Check for match-up specific override
  const override = getMatchupOverride(personaId, opponentId);
  if (override?.systemPromptOverride) {
    systemPrompt += `\n\n${override.systemPromptOverride}`;
  }
  
  // Add response format instructions at the end
  systemPrompt += `\n\n${BATTLE_RESPONSE_FORMAT}`;
  
  return systemPrompt;
}

/**
 * Get special first verse message if one exists for this match-up
 */
export function getFirstVerseMessage(
  personaId: string,
  opponentId: string
): string | undefined {
  const override = getMatchupOverride(personaId, opponentId);
  return override?.firstVerseMessage;
}

