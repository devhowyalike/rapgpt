/**
 * Persona configuration and management
 * 
 * IMPORTANT:
 * - Client components should import from './client' for lightweight UI data
 * - Server components/API routes should import from this file for full persona data
 * - Persona objects are assembled at runtime by combining client data + systemPrompts
 */

import type { Persona } from '../battle-types';
import * as clientPersonas from './client';
import { kennyKSystemPrompt } from './kennyK';
import { ladyMuseSystemPrompt } from './ladyMuse';
import { timDawgSystemPrompt } from './timDawg';
import { dawnSystemPrompt } from './dawn';

// Map of persona IDs to their system prompts
const SYSTEM_PROMPTS: Record<string, string> = {
  kennyK: kennyKSystemPrompt,
  ladyMuse: ladyMuseSystemPrompt,
  timDawg: timDawgSystemPrompt,
  dawn: dawnSystemPrompt,
};

// Assemble full Persona objects at runtime by combining client data + systemPrompts
const kennyK: Persona = { ...clientPersonas.kennyK, systemPrompt: kennyKSystemPrompt };
const ladyMuse: Persona = { ...clientPersonas.ladyMuse, systemPrompt: ladyMuseSystemPrompt };
const timDawg: Persona = { ...clientPersonas.timDawg, systemPrompt: timDawgSystemPrompt };
const dawn: Persona = { ...clientPersonas.dawn, systemPrompt: dawnSystemPrompt };

// Server-side: Full persona data with systemPrompts
export const AVAILABLE_PERSONAS: Record<string, Persona> = {
  kennyK,
  ladyMuse,
  timDawg,
  dawn,
};

export function getPersona(id: string): Persona | null {
  return AVAILABLE_PERSONAS[id] || null;
}

export function getAllPersonas(): Persona[] {
  return Object.values(AVAILABLE_PERSONAS);
}

export { kennyK, ladyMuse, timDawg, dawn };

// Re-export client-side utilities for convenience
export { 
  getClientPersona, 
  getAllClientPersonas,
  type ClientPersona 
} from './client';

// Re-export battle rules for use in other files
export { BATTLE_CONTEXT, BATTLE_RULES, BATTLE_RESPONSE_FORMAT } from './battleRules';

