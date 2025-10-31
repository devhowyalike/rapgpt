/**
 * Client-side persona data (UI-only, no systemPrompts)
 * This keeps the client bundle small and fast
 */

import type { Persona } from '../battle-types';

/**
 * Client persona type - excludes systemPrompt to reduce bundle size
 */
export type ClientPersona = Omit<Persona, 'systemPrompt'>;

/**
 * Client-safe persona data for UI rendering
 */
export const kennyK: ClientPersona = {
  id: 'kennyK',
  name: 'Kenny K',
  bio: 'Master of the Dojo Technique. Z-Man\'s former bodyguard.',
  style: 'Boom Bap',
  avatar: '/avatars/lyricist.png',
  accentColor: '#00d4ff',
};

export const ladyMuse: ClientPersona = {
  id: 'ladyMuse',
  name: 'Lady Muse',
  bio: 'eBay influencer. Thief. Voted Australia\'s Most Likely to Player Hate, 1995.',
  style: 'Alt-Hop',
  avatar: '/avatars/lyricist.png',
  accentColor: '#00d4ff',
};

export const timDawg: ClientPersona = {
  id: 'timDawg',
  name: 'Tim Dawg',
  bio: 'Bronx all day, every day.',
  style: 'Boom Bap',
  avatar: '/avatars/lyricist.png',
  accentColor: '#00d4ff',
};

export const dawn: ClientPersona = {
  id: 'dawn',
  name: 'Dawn from En Vogue',
  bio: 'Lucy Pearl from Oakland, CA.',
  style: 'R&B',
  avatar: '/avatars/lyricist.png',
  accentColor: '#00d4ff',
};

export const CLIENT_PERSONAS: Record<string, ClientPersona> = {
  kennyK,
  ladyMuse,
  timDawg,
  dawn,
};

export function getClientPersona(id: string): ClientPersona | null {
  return CLIENT_PERSONAS[id] || null;
}

export function getAllClientPersonas(): ClientPersona[] {
  return Object.values(CLIENT_PERSONAS);
}

