/**
 * Persona configuration and management (SERVER-ONLY)
 *
 * IMPORTANT:
 * - Client components should import from './client' for lightweight UI data
 * - Server components/API routes should import from this file for full persona data
 * - Persona objects are assembled at runtime by combining client data + systemPrompts
 *
 * When adding a new persona:
 * 1. Add the client persona to client.ts (with its ID as the export name)
 * 2. Create the system prompt file (e.g., newPersona.ts)
 * 3. Import and add the system prompt to systemPrompts.ts
 * That's it! The persona will be automatically assembled below.
 */

import { HOOPLA_MODE } from "../../constants";
import type { Persona } from "../battle-types";
import { CLIENT_PERSONAS } from "./client";
import { SYSTEM_PROMPTS } from "./systemPrompts";

/**
 * Automatically assemble full Persona objects by combining client data + system prompts
 */
function buildPersonas(): Record<string, Persona> {
  const personas: Record<string, Persona> = {};

  for (const [id, clientPersona] of Object.entries(CLIENT_PERSONAS)) {
    const systemPrompt = SYSTEM_PROMPTS[id];
    if (!systemPrompt) {
      console.warn(`Missing system prompt for persona: ${id}`);
      continue;
    }
    personas[id] = {
      ...clientPersona,
      systemPrompt,
    };
  }

  return personas;
}

// Server-side: Full persona data with systemPrompts
export const AVAILABLE_PERSONAS: Record<string, Persona> = buildPersonas();

export function getPersona(id: string): Persona | null {
  return AVAILABLE_PERSONAS[id] || null;
}

export function getAllPersonas(): Persona[] {
  const personas = Object.values(AVAILABLE_PERSONAS);
  if (HOOPLA_MODE) return personas;
  return personas.filter((p) => !p.isHoopla);
}

// Re-export battle rules for use in other files
export {
  BATTLE_CONTEXT,
  BATTLE_RESPONSE_FORMAT,
  BATTLE_RULES,
} from "./battleRules";
// Re-export client-side utilities for convenience
export {
  type ClientPersona,
  getAllClientPersonas,
  getClientPersona,
} from "./client";
