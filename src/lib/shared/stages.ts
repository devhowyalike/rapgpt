/**
 * Stage configuration for battle locations
 */

export interface Stage {
  id: string;
  name: string;
  country: string;
  flag: string;
  backgroundImage: string;
}

export const canada: Stage = {
  id: 'canada',
  name: "Futur's Den",
  country: 'Canada',
  flag: '🇨🇦',
  backgroundImage: '/stages/canada.jpg',
};

export const AVAILABLE_STAGES: Record<string, Stage> = {
  canada,
};

export function getStage(id: string): Stage | null {
  return AVAILABLE_STAGES[id] || null;
}

export function getAllStages(): Stage[] {
  return Object.values(AVAILABLE_STAGES);
}

// Default stage
export const DEFAULT_STAGE = canada;

