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
  altCostumes: ['mrAkron'],
  musicStyleDescription: 'underground hip-hop, jazzy samples, intricate wordplay, abstract lyrics, boom bap drums, laid-back flow with complex rhyme schemes, rare funk samples',
  vocalGender: 'm',
};

export const ladyMuse: ClientPersona = {
  id: 'ladyMuse',
  name: 'Lady Muse',
  bio: 'eBay influencer. Thief. Voted Australia\'s Most Likely to Player Hate, 1995.',
  style: 'Alt-Hop',
  avatar: '/avatars/lady-muse.jpg',
  accentColor: '#00d4ff',
  musicStyleDescription: 'alternative hip-hop, experimental beats, eclectic samples, playful delivery, genre-blending production, unconventional flow patterns, edgy electronic elements',
  vocalGender: 'f',
};

export const timDawg: ClientPersona = {
  id: 'timDawg',
  name: 'Tim Dawg',
  bio: 'Bronx all day, every day.',
  style: 'Boom Bap',
  avatar: '/avatars/tim-dawg.jpg',
  accentColor: '#00d4ff',
  musicStyleDescription: 'classic East Coast boom bap, hard-hitting drums, street poetry, aggressive delivery, raw authentic sound, gritty urban aesthetics',
  vocalGender: 'm',
};

export const dawn: ClientPersona = {
  id: 'dawn',
  name: 'Dawn from En Vogue',
  bio: 'Lucy Pearl from Oakland, CA.',
  style: 'R&B',
  avatar: '/avatars/dawn-en-vogue.jpg',
  accentColor: '#00d4ff',
  musicStyleDescription: 'smooth R&B vocals, soulful melodies, melodic rap-singing hybrid, neo-soul influences, rich harmonies, emotional delivery',
  vocalGender: 'f',
};

export const mrAkron: ClientPersona = {
  id: 'mrAkron',
  name: 'Mr. Akron',
  bio: 'Enigmatic alter of Kenny K. Master of multi-syllables.',
  style: 'Boom Bap',
  // Using existing asset as placeholder; replace with /avatars/mr-kron.jpg when available
  avatar: '/avatars/kenny-k.jpg',
  accentColor: '#00d4ff',
  musicStyleDescription: 'cinematic west coast boom bap, dense internal rhymes, layered metaphors, comic book imagery, crate-digger flex',
  vocalGender: 'm',
};

export const CLIENT_PERSONAS: Record<string, ClientPersona> = {
  kennyK,
  ladyMuse,
  timDawg,
  dawn,
  mrAkron,
};

export function getClientPersona(id: string): ClientPersona | null {
  return CLIENT_PERSONAS[id] || null;
}

export function getAllClientPersonas(): ClientPersona[] {
  return Object.values(CLIENT_PERSONAS);
}

/**
 * Returns only primary personas (those not listed as an alt in any primary's altCostumes).
 */
export function getPrimaryClientPersonas(): ClientPersona[] {
  const all = Object.values(CLIENT_PERSONAS);
  const altIds = new Set<string>();
  for (const p of all) {
    if (p.altCostumes?.length) {
      for (const altId of p.altCostumes) altIds.add(altId);
    }
  }
  return all.filter(p => !altIds.has(p.id));
}

/**
 * Returns a map of primary persona id → ordered group [primaryId, ...altIds]
 */
export function getPersonaGroups(): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  const primaries = getPrimaryClientPersonas();
  for (const primary of primaries) {
    groups[primary.id] = [primary.id, ...(primary.altCostumes ?? [])];
  }
  return groups;
}

/**
 * Given any persona id, finds its primary and the full ordered group.
 */
export function getGroupForPersona(personaId: string): { primaryId: string; members: string[] } | null {
  const groups = getPersonaGroups();
  for (const [primaryId, members] of Object.entries(groups)) {
    if (members.includes(personaId)) {
      return { primaryId, members };
    }
  }
  return null;
}

