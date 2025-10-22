/**
 * Persona configuration and management
 */

import type { Persona } from '../battle-types';
import { kennyK } from './kennyK';
import { ladyMuse } from './ladyMuse';
import { timDawg } from './timDawg';
import { dawn } from './dawn';

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

