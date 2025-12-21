#!/usr/bin/env tsx

/**
 * Interactive script to create a new battle
 * Usage: pnpm tsx scripts/create-battle.ts
 *
 * This script will prompt you for:
 * - Event name (e.g., "Summer Showdown 2025")
 * - Two persona IDs to battle
 */

import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { createInterface } from "readline";
import { fileURLToPath } from "url";
import type { Battle, Persona, Stage } from "../src/lib/shared";
import { getAllPersonas } from "../src/lib/shared/personas";
import { getAllStages } from "../src/lib/shared/stages";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Available personas - imported from shared package
const PERSONAS: Record<string, Persona> = getAllPersonas().reduce(
  (acc, p) => ({ ...acc, [p.id]: p }),
  {},
);

// Available stages
const STAGES = getAllStages();

// Create readline interface
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Helper function to ask a question
function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// Convert event name to kebab-case for file naming
function toKebabCase(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-"); // Replace multiple hyphens with single hyphen
}

async function main() {
  console.log("🎤 Create a New Battle\n");
  console.log("Available personas:");
  Object.values(PERSONAS).forEach((p) => {
    console.log(`  - ${p.id}: ${p.name} (${p.style})`);
  });
  console.log("");

  // Get event name
  const eventName = await ask(
    'What should this battle be called? (e.g., "Summer Showdown 2025"): ',
  );
  if (!eventName || eventName.trim() === "") {
    console.error("❌ Error: Event name is required");
    rl.close();
    process.exit(1);
  }

  // Get first persona
  const persona1Id = await ask("Enter the first persona ID: ");
  if (!PERSONAS[persona1Id]) {
    console.error(
      `❌ Error: Persona "${persona1Id}" not found. Available: ${Object.keys(PERSONAS).join(", ")}`,
    );
    rl.close();
    process.exit(1);
  }

  // Get second persona
  const persona2Id = await ask("Enter the second persona ID: ");
  if (!PERSONAS[persona2Id]) {
    console.error(
      `❌ Error: Persona "${persona2Id}" not found. Available: ${Object.keys(PERSONAS).join(", ")}`,
    );
    rl.close();
    process.exit(1);
  }

  if (persona1Id === persona2Id) {
    console.error("❌ Error: Both personas cannot be the same");
    rl.close();
    process.exit(1);
  }

  // Get stage
  console.log("\nAvailable stages:");
  STAGES.forEach((s) => {
    console.log(`  - ${s.id}: ${s.name} ${s.flag} (${s.country})`);
  });
  console.log("");

  const stageId = await ask(
    'Enter the stage ID (or press Enter for default "canada"): ',
  );
  const selectedStageId = stageId.trim() || "canada";

  if (!STAGES.find((s) => s.id === selectedStageId)) {
    console.error(
      `❌ Error: Stage "${selectedStageId}" not found. Available: ${STAGES.map((s) => s.id).join(", ")}`,
    );
    rl.close();
    process.exit(1);
  }

  rl.close();

  // Create battle ID from event name
  const battleId = toKebabCase(eventName);
  const timestamp = Date.now();
  const now = new Date();

  const battle: Battle = {
    id: battleId,
    title: eventName.trim(),
    month: now.toLocaleDateString("en-US", { month: "long" }),
    year: now.getFullYear(),
    status: "paused",
    stageId: selectedStageId,
    personas: {
      player1: PERSONAS[persona1Id],
      player2: PERSONAS[persona2Id],
    },
    currentRound: 1,
    currentTurn: "player1",
    verses: [],
    scores: [],
    comments: [],
    winner: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  // Ensure data directory exists
  const dataDir = join(__dirname, "..", "data", "battles");
  mkdirSync(dataDir, { recursive: true });

  // Write battle file
  const filePath = join(dataDir, `${battleId}.json`);
  writeFileSync(filePath, JSON.stringify(battle, null, 2));

  console.log("\n✅ Created battle successfully!");
  console.log(`📁 File: ${filePath}`);
  console.log(`🆔 Battle ID: ${battleId}`);
  console.log(`\n🎤 Battle: ${battle.title}`);
  console.log(
    `   Player 1: ${battle.personas.player1.name} (${battle.personas.player1.style})`,
  );
  console.log(
    `   Player 2: ${battle.personas.player2.name} (${battle.personas.player2.style})`,
  );
  console.log(`\n🚀 Start your dev server to see the battle!`);
  console.log(`   pnpm dev`);
  console.log(`\n🔗 URL: http://localhost:3000/battle/${battleId}\n`);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
