import { HOOPLA_MODE } from "../constants";

/**
 * Stage configuration for battle locations
 */

export interface Stage {
  id: string;
  name: string;
  country: string;
  flag: string;
  backgroundImage: string;
  isHoopla?: boolean;
}

export const canada: Stage = {
  id: "canada",
  name: "Futur's Den",
  country: "Canada",
  flag: "🇨🇦",
  backgroundImage: "/stages/futur.webp",
  isHoopla: true,
};

export const bronx: Stage = {
  id: "bronx",
  name: "1520 Sedgwick Avenue",
  country: "Bronx, NY",
  flag: "🇺🇸",
  backgroundImage: "/stages/sedgwick.webp",
};

export const bkBathroom: Stage = {
  id: "bkBathroom",
  name: "Burger King Bathroom",
  country: "USA",
  flag: "🍔",
  backgroundImage: "/stages/bk-bathroom.webp",
};

export const oakland: Stage = {
  id: "oaklandCol",
  name: "Oakland Coliseum",
  country: "Oakland, CA",
  flag: "🇺🇸",
  backgroundImage: "/stages/coliseum.webp",
};

export const outback: Stage = {
  id: "outback",
  name: "The Outback",
  country: "Australia",
  flag: "🇦🇺",
  backgroundImage: "/stages/outback.webp",
};

export const AVAILABLE_STAGES: Record<string, Stage> = {
  [canada.id]: canada,
  [bronx.id]: bronx,
  [bkBathroom.id]: bkBathroom,
  [oakland.id]: oakland,
  [outback.id]: outback,
};

export function getStage(id: string): Stage | null {
  return AVAILABLE_STAGES[id] || null;
}

export function getAllStages(): Stage[] {
  const stages = Object.values(AVAILABLE_STAGES);
  if (HOOPLA_MODE) return stages;
  return stages.filter((s) => !s.isHoopla);
}

// Default stage
export const DEFAULT_STAGE = canada;
