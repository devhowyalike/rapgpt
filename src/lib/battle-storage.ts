/**
 * Battle storage using Vercel Postgres with Drizzle ORM
 */

import type { Battle } from '@/lib/shared';
import { db } from '@/lib/db/client';
import { battles, users } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { decrypt } from '@/lib/auth/encryption';

/**
 * Get battle by ID
 */
export async function getBattleById(id: string): Promise<Battle | null> {
  try {
    const result = await db
      .select({
        battle: battles,
        creator: users,
      })
      .from(battles)
      .leftJoin(users, eq(battles.createdBy, users.id))
      .where(eq(battles.id, id))
      .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    const { battle, creator } = result[0];
    
    // Decrypt creator display name if available
    let creatorInfo = null;
    if (creator && creator.isProfilePublic) {
      try {
        const displayName = creator.encryptedDisplayName 
          ? decrypt(creator.encryptedDisplayName)
          : (creator.encryptedName ? decrypt(creator.encryptedName) : 'Anonymous');
        
        creatorInfo = {
          userId: creator.id,
          displayName,
          imageUrl: creator.imageUrl,
        };
      } catch (error) {
        console.error('Error decrypting creator info:', error);
      }
    }
    
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
      creator: creatorInfo,
      // Live battle fields
      isLive: battle.isLive,
      liveStartedAt: battle.liveStartedAt?.getTime(),
      adminControlMode: battle.adminControlMode as 'manual' | 'auto' | undefined,
      autoPlayConfig: battle.autoPlayConfig as Battle['autoPlayConfig'],
    };
  } catch (error) {
    console.error('Error getting battle by ID:', error);
    return null;
  }
}

/**
 * Save battle (create or update)
 */
export async function saveBattle(
  battle: Battle,
  options?: {
    createdBy?: string | null;
    isFeatured?: boolean;
  }
): Promise<void> {
  try {
    // Check if battle exists
    const existing = await db.select().from(battles).where(eq(battles.id, battle.id)).limit(1);
    
    const battleData: any = {
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
      // Live battle fields
      isLive: battle.isLive || false,
      liveStartedAt: battle.liveStartedAt ? new Date(battle.liveStartedAt) : null,
      adminControlMode: battle.adminControlMode || 'manual',
      autoPlayConfig: battle.autoPlayConfig || null,
    };
    
    // Add optional fields if provided (only on insert)
    if (existing.length === 0) {
      if (options?.createdBy !== undefined) {
        battleData.createdBy = options.createdBy;
      }
      if (options?.isFeatured !== undefined) {
        battleData.isFeatured = options.isFeatured;
      }
      
      // Insert new battle
      await db.insert(battles).values(battleData);
    } else {
      // Update existing battle (don't update createdBy or isFeatured)
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
    const result = await db
      .select({
        battle: battles,
        creator: users,
      })
      .from(battles)
      .leftJoin(users, eq(battles.createdBy, users.id))
      .orderBy(desc(battles.createdAt));
    
    // Transform database format back to Battle type
    return result.map(({ battle, creator }) => {
      // Decrypt creator display name if available
      let creatorInfo = null;
      if (creator && creator.isProfilePublic) {
        try {
          const displayName = creator.encryptedDisplayName 
            ? decrypt(creator.encryptedDisplayName)
            : (creator.encryptedName ? decrypt(creator.encryptedName) : 'Anonymous');
          
          creatorInfo = {
            userId: creator.id,
            displayName,
            imageUrl: creator.imageUrl,
          };
        } catch (error) {
          console.error('Error decrypting creator info:', error);
        }
      }
      
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
        creator: creatorInfo,
        // Live battle fields
        isLive: battle.isLive,
        liveStartedAt: battle.liveStartedAt?.getTime(),
        adminControlMode: battle.adminControlMode as 'manual' | 'auto' | undefined,
        autoPlayConfig: battle.autoPlayConfig as Battle['autoPlayConfig'],
      };
    });
  } catch (error) {
    console.error('Error getting all battles:', error);
    return [];
  }
}

/**
 * Get all featured battles (for homepage and archive)
 */
export async function getFeaturedBattles(): Promise<Battle[]> {
  try {
    const result = await db
      .select({
        battle: battles,
        creator: users,
      })
      .from(battles)
      .leftJoin(users, eq(battles.createdBy, users.id))
      .where(eq(battles.isFeatured, true))
      .orderBy(desc(battles.createdAt));
    
    // Transform database format back to Battle type
    return result.map(({ battle, creator }) => {
      // Decrypt creator display name if available
      let creatorInfo = null;
      if (creator && creator.isProfilePublic) {
        try {
          const displayName = creator.encryptedDisplayName 
            ? decrypt(creator.encryptedDisplayName)
            : (creator.encryptedName ? decrypt(creator.encryptedName) : 'Anonymous');
          
          creatorInfo = {
            userId: creator.id,
            displayName,
            imageUrl: creator.imageUrl,
          };
        } catch (error) {
          console.error('Error decrypting creator info:', error);
        }
      }
      
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
        creator: creatorInfo,
        // Live battle fields
        isLive: battle.isLive,
        liveStartedAt: battle.liveStartedAt?.getTime(),
        adminControlMode: battle.adminControlMode as 'manual' | 'auto' | undefined,
        autoPlayConfig: battle.autoPlayConfig as Battle['autoPlayConfig'],
      };
    });
  } catch (error) {
    console.error('Error getting featured battles:', error);
    return [];
  }
}

/**
 * Get current month's battle (featured ongoing battle)
 */
export async function getCurrentBattle(): Promise<Battle | null> {
  const featuredBattles = await getFeaturedBattles();
  // Only return ongoing featured battles, not completed ones
  return featuredBattles.find(b => b.status === 'ongoing') || null;
}

/**
 * Get all currently live battles
 */
export async function getLiveBattles(): Promise<Battle[]> {
  try {
    const result = await db
      .select({
        battle: battles,
        creator: users,
      })
      .from(battles)
      .leftJoin(users, eq(battles.createdBy, users.id))
      .where(eq(battles.isLive, true))
      .orderBy(desc(battles.liveStartedAt));
    
    // Transform database format back to Battle type
    return result.map(({ battle, creator }) => {
      // Decrypt creator display name if available
      let creatorInfo = null;
      if (creator && creator.isProfilePublic) {
        try {
          const displayName = creator.encryptedDisplayName 
            ? decrypt(creator.encryptedDisplayName)
            : (creator.encryptedName ? decrypt(creator.encryptedName) : 'Anonymous');
          
          creatorInfo = {
            userId: creator.id,
            displayName,
            imageUrl: creator.imageUrl,
          };
        } catch (error) {
          console.error('Error decrypting creator info:', error);
        }
      }
      
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
        creator: creatorInfo,
        // Live battle fields
        isLive: battle.isLive,
        liveStartedAt: battle.liveStartedAt?.getTime(),
        adminControlMode: battle.adminControlMode as 'manual' | 'auto' | undefined,
        autoPlayConfig: battle.autoPlayConfig as Battle['autoPlayConfig'],
      };
    });
  } catch (error) {
    console.error('Error getting live battles:', error);
    return [];
  }
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
