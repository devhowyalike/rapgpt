#!/usr/bin/env tsx

/**
 * Interactive script to create a new battle
 * Usage: pnpm tsx scripts/create-battle.ts
 * 
 * This script will prompt you for:
 * - Event name (e.g., "Summer Showdown 2025")
 * - Two persona IDs to battle
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';
import { AVAILABLE_PERSONAS } from '../src/lib/shared';
import type { Persona, Battle } from '../src/lib/shared';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Available personas - imported from shared package
const PERSONAS: Record<string, Persona> = AVAILABLE_PERSONAS;

// Create readline interface
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
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
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-');      // Replace multiple hyphens with single hyphen
}

async function main() {
  console.log('🎤 Create a New Battle\n');
  console.log('Available personas:');
  Object.values(PERSONAS).forEach(p => {
    console.log(`  - ${p.id}: ${p.name} (${p.style})`);
  });
  console.log('');

  // Get event name
  const eventName = await ask('What should this battle be called? (e.g., "Summer Showdown 2025"): ');
  if (!eventName || eventName.trim() === '') {
    console.error('❌ Error: Event name is required');
    rl.close();
    process.exit(1);
  }

  // Get first persona
  const persona1Id = await ask('Enter the first persona ID: ');
  if (!PERSONAS[persona1Id]) {
    console.error(`❌ Error: Persona "${persona1Id}" not found. Available: ${Object.keys(PERSONAS).join(', ')}`);
    rl.close();
    process.exit(1);
  }

  // Get second persona
  const persona2Id = await ask('Enter the second persona ID: ');
  if (!PERSONAS[persona2Id]) {
    console.error(`❌ Error: Persona "${persona2Id}" not found. Available: ${Object.keys(PERSONAS).join(', ')}`);
    rl.close();
    process.exit(1);
  }

  if (persona1Id === persona2Id) {
    console.error('❌ Error: Both personas cannot be the same');
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
    month: now.toLocaleDateString('en-US', { month: 'long' }),
    year: now.getFullYear(),
    status: 'ongoing',
    personas: {
      left: PERSONAS[persona1Id],
      right: PERSONAS[persona2Id]
    },
    currentRound: 1,
    currentTurn: 'left',
    verses: [],
    scores: [],
    comments: [],
    winner: null,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  // Ensure data directory exists
  const dataDir = join(__dirname, '..', 'data', 'battles');
  mkdirSync(dataDir, { recursive: true });

  // Write battle file
  const filePath = join(dataDir, `${battleId}.json`);
  writeFileSync(filePath, JSON.stringify(battle, null, 2));

  console.log('\n✅ Created battle successfully!');
  console.log(`📁 File: ${filePath}`);
  console.log(`🆔 Battle ID: ${battleId}`);
  console.log(`\n🎤 Battle: ${battle.title}`);
  console.log(`   Left: ${battle.personas.left.name} (${battle.personas.left.style})`);
  console.log(`   Right: ${battle.personas.right.name} (${battle.personas.right.style})`);
  console.log(`\n🚀 Start your dev server to see the battle!`);
  console.log(`   pnpm dev`);
  console.log(`\n🔗 URL: http://localhost:3000/battle/${battleId}\n`);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});

