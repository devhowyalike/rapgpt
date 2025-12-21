/**
 * @/lib/shared
 * Shared utilities, types, and constants for RapGPT
 *
 * NOTE: Server components needing full persona data (with systemPrompts)
 * should import directly from "@/lib/shared/personas"
 */

export * from "./battle-helpers";
export * from "./battle-types";
export * from "./stages";

// Re-export only client-safe persona utilities (no systemPrompts)
export {
  type ClientPersona,
  getAllClientPersonas,
  getClientPersona,
  getPrimaryClientPersonas,
  getPersonaGroups,
  getGroupForPersona,
} from "./personas/client";
