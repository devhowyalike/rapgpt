/**
 * Battle storage using JSON files
 * For production, migrate to a database
 */

import type { Battle } from '@/lib/shared';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'battles');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
}

/**
 * Get battle by ID
 */
export async function getBattleById(id: string): Promise<Battle | null> {
  try {
    await ensureDataDir();
    const filePath = path.join(DATA_DIR, `${id}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Save battle
 */
export async function saveBattle(battle: Battle): Promise<void> {
  try {
    await ensureDataDir();
    const filePath = path.join(DATA_DIR, `${battle.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(battle, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving battle:', error);
    throw error;
  }
}

/**
 * Get all battles
 */
export async function getAllBattles(): Promise<Battle[]> {
  try {
    await ensureDataDir();
    const files = await fs.readdir(DATA_DIR);
    const battles: Battle[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(DATA_DIR, file);
        const data = await fs.readFile(filePath, 'utf-8');
        battles.push(JSON.parse(data));
      }
    }

    // Sort by creation date, newest first
    return battles.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error getting all battles:', error);
    return [];
  }
}

/**
 * Get current month's battle
 */
export async function getCurrentBattle(): Promise<Battle | null> {
  const battles = await getAllBattles();
  // Only return ongoing battles, not completed ones
  return battles.find(b => b.status === 'ongoing') || null;
}

