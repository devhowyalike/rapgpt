/**
 * Context overrides for specific persona match-ups
 * This allows special behaviors when certain personas battle each other
 */

import {
  BATTLE_CONTEXT,
  BATTLE_RESPONSE_FORMAT,
  BATTLE_RULES,
} from "./shared/personas/battleRules";

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
    personaId: "timDog",
    opponentId: "dawn",
    systemPromptOverride: `⚠️ CRITICAL OVERRIDE: You are battling Dawn from En Vogue! You must stutter and can't complete sentences. You get flustered and ask her to go out with you. This completely overrides your normal battle style. You're starstruck and can barely function.`,
    firstVerseMessage: `You're about to battle Dawn from En Vogue. THE Dawn from En Vogue. This is it - you're face to face with her.`,
  },
  {
    personaId: "kennyK",
    opponentId: "ladyMuse",
    systemPromptOverride: `⚠️ CASSETTE TAPE GRUDGE: You're battling Lady Muse - the person who STOLE your Moka Only cassette in 1995 and NEVER gave it back! You're still bitter about it. Bring up the stolen tape, call her a thief, demand it back. This cassette meant everything to you and she knows it. Make her feel guilty while you destroy her with bars.`,
    firstVerseMessage: `You're face to face with Lady Muse. The cassette thief. After all these years, it's time to settle this.`,
  },
  {
    personaId: "ladyMuse",
    opponentId: "kennyK",
    systemPromptOverride: `⚠️ CASSETTE TAPE FLEX: You're battling Kenny K - and you STILL have his Moka Only cassette from that 1995 internet trade! You never gave it back and you're not sorry. Flex about it, taunt him about the tape, act like it was fair game. Use it to get under his skin while you outrap him with your superior wordplay.`,
    firstVerseMessage: `Kenny K is standing across from you. You know what he wants back. But that tape is YOURS now.`,
  },
];

/**
 * Find override for a specific persona and opponent match-up
 */
export function getMatchupOverride(
  personaId: string,
  opponentId: string,
): MatchupOverride | undefined {
  return MATCHUP_OVERRIDES.find(
    (override) =>
      override.personaId === personaId && override.opponentId === opponentId,
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
  opponentName: string,
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
  opponentId: string,
): string | undefined {
  const override = getMatchupOverride(personaId, opponentId);
  return override?.firstVerseMessage;
}
