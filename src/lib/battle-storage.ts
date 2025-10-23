/**
 * Battle storage using Vercel Postgres with Drizzle ORM
 */

import type { Battle } from '@/lib/shared';
import { db } from '@/lib/db/client';
import { battles } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * Get battle by ID
 */
export async function getBattleById(id: string): Promise<Battle | null> {
  try {
    const result = await db.select().from(battles).where(eq(battles.id, id)).limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    const battle = result[0];
    
    // Transform database format back to Battle type
    return {
      id: battle.id,
      title: battle.title,
      month: battle.month,
      year: battle.year,
      status: battle.status as Battle['status'],
      personas: {
        left: battle.leftPersona,
        right: battle.rightPersona,
      },
      currentRound: battle.currentRound,
      currentTurn: battle.currentTurn as Battle['currentTurn'],
      verses: battle.verses,
      scores: battle.scores,
      comments: battle.comments,
      winner: battle.winner,
      createdAt: battle.createdAt.getTime(),
      updatedAt: battle.updatedAt.getTime(),
    };
  } catch (error) {
    console.error('Error getting battle by ID:', error);
    return null;
  }
}

/**
 * Save battle (create or update)
 */
export async function saveBattle(battle: Battle): Promise<void> {
  try {
    // Check if battle exists
    const existing = await db.select().from(battles).where(eq(battles.id, battle.id)).limit(1);
    
    const battleData = {
      id: battle.id,
      title: battle.title,
      month: battle.month,
      year: battle.year,
      status: battle.status,
      leftPersona: battle.personas.left,
      rightPersona: battle.personas.right,
      currentRound: battle.currentRound,
      currentTurn: battle.currentTurn,
      verses: battle.verses,
      scores: battle.scores,
      comments: battle.comments,
      winner: battle.winner,
      createdAt: new Date(battle.createdAt),
      updatedAt: new Date(Date.now()),
    };
    
    if (existing.length === 0) {
      // Insert new battle
      await db.insert(battles).values(battleData);
    } else {
      // Update existing battle
      await db.update(battles).set(battleData).where(eq(battles.id, battle.id));
    }
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
    const result = await db.select().from(battles).orderBy(desc(battles.createdAt));
    
    // Transform database format back to Battle type
    return result.map(battle => ({
      id: battle.id,
      title: battle.title,
      month: battle.month,
      year: battle.year,
      status: battle.status as Battle['status'],
      personas: {
        left: battle.leftPersona,
        right: battle.rightPersona,
      },
      currentRound: battle.currentRound,
      currentTurn: battle.currentTurn as Battle['currentTurn'],
      verses: battle.verses,
      scores: battle.scores,
      comments: battle.comments,
      winner: battle.winner,
      createdAt: battle.createdAt.getTime(),
      updatedAt: battle.updatedAt.getTime(),
    }));
  } catch (error) {
    console.error('Error getting all battles:', error);
    return [];
  }
}

/**
 * Get current month's battle
 */
export async function getCurrentBattle(): Promise<Battle | null> {
  const allBattles = await getAllBattles();
  // Only return ongoing battles, not completed ones
  return allBattles.find(b => b.status === 'ongoing') || null;
}

/**
 * Delete battle by ID (for admin use)
 */
export async function deleteBattle(id: string): Promise<boolean> {
  try {
    await db.delete(battles).where(eq(battles.id, id));
    return true;
  } catch (error) {
    console.error('Error deleting battle:', error);
    return false;
  }
}
