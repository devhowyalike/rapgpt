/**
 * Persona configuration and management
 * 
 * IMPORTANT:
 * - Client components should import from './client' for lightweight UI data
 * - Server components/API routes should import from this file for full persona data
 * - Persona objects are assembled at runtime by combining client data + systemPrompts
 */

import { HOOPLA_MODE } from '../../constants';
import type { Persona } from '../battle-types';
import * as clientPersonas from './client';
import { kennyKSystemPrompt } from './kennyK';
import { ladyMuseSystemPrompt } from './ladyMuse';
import { raygunSystemPrompt } from './raygun';
import { timDogSystemPrompt } from './timDog';
import { dawnSystemPrompt } from './dawn';
import { mrAkronSystemPrompt } from './mrAkron';
import { humptyHumpSystemPrompt } from './humptyHump';
import { shockGSystemPrompt } from './shockG';
import { parappaSystemPrompt } from './parappa';

// Map of persona IDs to their system prompts
const SYSTEM_PROMPTS: Record<string, string> = {
  kennyK: kennyKSystemPrompt,
  ladyMuse: ladyMuseSystemPrompt,
  raygun: raygunSystemPrompt,
  timDog: timDogSystemPrompt,
  dawn: dawnSystemPrompt,
  mrAkron: mrAkronSystemPrompt,
  humptyHump: humptyHumpSystemPrompt,
  shockG: shockGSystemPrompt,
  parappa: parappaSystemPrompt,
};

// Assemble full Persona objects at runtime by combining client data + systemPrompts
const kennyK: Persona = { ...clientPersonas.kennyK, systemPrompt: kennyKSystemPrompt };
const ladyMuse: Persona = { ...clientPersonas.ladyMuse, systemPrompt: ladyMuseSystemPrompt };
const raygun: Persona = { ...clientPersonas.raygun, systemPrompt: raygunSystemPrompt };
const timDog: Persona = { ...clientPersonas.timDog, systemPrompt: timDogSystemPrompt };
const dawn: Persona = { ...clientPersonas.dawn, systemPrompt: dawnSystemPrompt };
const mrAkron: Persona = { ...clientPersonas.mrAkron, systemPrompt: mrAkronSystemPrompt };
const humptyHump: Persona = { ...clientPersonas.humptyHump, systemPrompt: humptyHumpSystemPrompt };
const shockG: Persona = { ...clientPersonas.shockG, systemPrompt: shockGSystemPrompt };
const parappa: Persona = { ...clientPersonas.parappa, systemPrompt: parappaSystemPrompt };

// Server-side: Full persona data with systemPrompts
export const AVAILABLE_PERSONAS: Record<string, Persona> = {
  kennyK,
  ladyMuse,
  raygun,
  timDog,
  dawn,
  mrAkron,
  humptyHump,
  shockG,
  parappa,
};

export function getPersona(id: string): Persona | null {
  return AVAILABLE_PERSONAS[id] || null;
}

export function getAllPersonas(): Persona[] {
  const personas = Object.values(AVAILABLE_PERSONAS);
  if (HOOPLA_MODE) return personas;
  return personas.filter(p => !p.isHoopla);
}

export { kennyK, ladyMuse, raygun, timDog, dawn, humptyHump, shockG, parappa };

// Re-export client-side utilities for convenience
export { 
  getClientPersona, 
  getAllClientPersonas,
  type ClientPersona 
} from './client';

// Re-export battle rules for use in other files
export { BATTLE_CONTEXT, BATTLE_RULES, BATTLE_RESPONSE_FORMAT } from './battleRules';

