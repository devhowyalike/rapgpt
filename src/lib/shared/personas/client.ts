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
  avatar: '/avatars/kenny-k.jpg',
  accentColor: '#00d4ff',
  musicStyleDescription: 'underground hip-hop, jazzy samples, intricate wordplay, abstract lyrics, boom bap drums, laid-back flow with complex rhyme schemes, rare funk samples',
};

export const ladyMuse: ClientPersona = {
  id: 'ladyMuse',
  name: 'Lady Muse',
  bio: 'eBay influencer. Thief. Voted Australia\'s Most Likely to Player Hate, 1995.',
  style: 'Alt-Hop',
  avatar: '/avatars/lady-muse.jpg',
  accentColor: '#00d4ff',
  musicStyleDescription: 'alternative hip-hop, experimental beats, eclectic samples, playful delivery, genre-blending production, unconventional flow patterns, edgy electronic elements',
};

export const timDawg: ClientPersona = {
  id: 'timDawg',
  name: 'Tim Dawg',
  bio: 'Bronx all day, every day.',
  style: 'Boom Bap',
  avatar: '/avatars/tim-dawg.jpg',
  accentColor: '#00d4ff',
  musicStyleDescription: 'classic East Coast boom bap, hard-hitting drums, street poetry, aggressive delivery, raw authentic sound, gritty urban aesthetics',
};

export const dawn: ClientPersona = {
  id: 'dawn',
  name: 'Dawn from En Vogue',
  bio: 'Lucy Pearl from Oakland, CA.',
  style: 'R&B',
  avatar: '/avatars/dawn-en-vogue.jpg',
  accentColor: '#00d4ff',
  musicStyleDescription: 'smooth R&B vocals, soulful melodies, melodic rap-singing hybrid, neo-soul influences, rich harmonies, emotional delivery',
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

