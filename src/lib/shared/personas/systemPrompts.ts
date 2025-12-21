/**
 * Aggregated system prompts for all personas
 *
 * When adding a new persona:
 * 1. Create the system prompt file (e.g., newPersona.ts)
 * 2. Import and add it to the SYSTEM_PROMPTS record below
 * 3. Add the client persona to client.ts
 *
 * The index.ts file will automatically combine them.
 */

import { dawnSystemPrompt } from "./dawn";
import { humptyHumpSystemPrompt } from "./humptyHump";
import { igorSystemPrompt } from "./igor";
import { kennyKSystemPrompt } from "./kennyK";
import { ladyMuseSystemPrompt } from "./ladyMuse";
import { mrAkronSystemPrompt } from "./mrAkron";
import { parappaSystemPrompt } from "./parappa";
import { raygunSystemPrompt } from "./raygun";
import { shockGSystemPrompt } from "./shockG";
import { timDogSystemPrompt } from "./timDog";
import { tylerSystemPrompt } from "./tyler";

/**
 * Map of persona ID to system prompt
 * Keys must match the persona IDs in client.ts
 */
export const SYSTEM_PROMPTS: Record<string, string> = {
  kennyK: kennyKSystemPrompt,
  ladyMuse: ladyMuseSystemPrompt,
  raygun: raygunSystemPrompt,
  timDog: timDogSystemPrompt,
  dawn: dawnSystemPrompt,
  mrAkron: mrAkronSystemPrompt,
  humptyHump: humptyHumpSystemPrompt,
  shockG: shockGSystemPrompt,
  parappa: parappaSystemPrompt,
  tyler: tylerSystemPrompt,
  igor: igorSystemPrompt,
};

