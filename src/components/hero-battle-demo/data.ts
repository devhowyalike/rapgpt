import type { MCData, DemoState, StateConfig } from "./types";
import { calculateVerseDuration } from "./utils";

// =============================================================================
// MC Data
// =============================================================================

export const MC1: MCData = {
  name: "Tyler, The Creator",
  shortName: "Tyler",
  avatar: "/avatars/tyler.webp",
  style: "GOLF le FLEUR*",
  bio: "@#$%! #$@&! %$#@!!!",
};

export const MC2: MCData = {
  name: "Tim Dog",
  shortName: "Tim",
  avatar: "/avatars/tim-dog.webp",
  style: "Boom Bap",
  bio: "Bronx all day, every day",
};

// =============================================================================
// Verses
// =============================================================================

export const VERSES = {
  mc1: [
    "I bend shock into art, make discomfort design",
    "Turn chaos into albums that redefine their time",
    "You swung first for reaction, I evolved the response",
    "I am the era shift, not a footnote in its fonts",
  ],
  mc2: [
    "I was dissing whole coasts before your blog era buzzed",
    "Back when controversy meant something, not a marketing plug",
    "You sell shock with pastel fits, I brought real disruption",
    "Name rang bells off bars, not curated by consumption",
  ],
} as const;

// =============================================================================
// State Configurations
// =============================================================================

export const STATE_CONFIGS: Record<DemoState, StateConfig> = {
  intro: {
    duration: 800,
    activeMC: "mc1",
    round: 3,
    streamingMC: "mc1",
    showStreamingIndicator: true,
    mc1Lines: 0,
    mc2Lines: 0,
  },
  "mc1-verse": {
    duration: calculateVerseDuration(VERSES.mc1),
    activeMC: "mc1",
    round: 3,
    streamingMC: "mc1",
    mc1Lines: 4,
    mc2Lines: 0,
  },
  "mc2-intro": {
    duration: 800,
    activeMC: "mc2",
    round: 3,
    streamingMC: "mc2",
    showStreamingIndicator: true,
    mc1Lines: 4,
    mc2Lines: 0,
  },
  "mc2-verse": {
    duration: calculateVerseDuration(VERSES.mc2),
    activeMC: "mc2",
    round: 3,
    streamingMC: "mc2",
    mc1Lines: 4,
    mc2Lines: 4,
  },
  scoring: {
    duration: 1500,
    activeMC: "none",
    round: 3,
    showScoring: true,
    mc1Lines: 4,
    mc2Lines: 4,
  },
  winner: {
    duration: 3000,
    activeMC: "mc2",
    round: 3,
    showWinner: true,
    mc1Lines: 4,
    mc2Lines: 4,
  },
  "song-style-select": {
    duration: 3500,
    activeMC: "none",
    round: 3,
    showSongStyleSelect: true,
    mc1Lines: 4,
    mc2Lines: 4,
  },
  "song-generating": {
    duration: 4000,
    activeMC: "none",
    round: 3,
    showSongGenerating: true,
    mc1Lines: 4,
    mc2Lines: 4,
  },
  "song-complete": {
    duration: 4000,
    activeMC: "none",
    round: 3,
    showSongComplete: true,
    mc1Lines: 4,
    mc2Lines: 4,
  },
};

export const STATE_ORDER: DemoState[] = [
  "intro",
  "mc1-verse",
  "mc2-intro",
  "mc2-verse",
  "scoring",
  "winner",
  "song-style-select",
  "song-generating",
  "song-complete",
];

