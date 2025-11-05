/**
 * Database schema for RapGPT Battle System
 * Using Drizzle ORM with Vercel Postgres
 */

import { pgTable, text, integer, jsonb, timestamp, boolean, unique } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import type { Persona, Verse, RoundScore, Comment } from '@/lib/shared/battle-types';

/**
 * Users table - stores authenticated user data
 * Sensitive fields are encrypted using AES-256-GCM
 */
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  clerkId: text('clerk_id').notNull().unique(),
  encryptedEmail: text('encrypted_email').notNull(), // Encrypted email
  encryptedName: text('encrypted_name'), // Encrypted real name from Clerk
  encryptedDisplayName: text('encrypted_display_name'), // Encrypted user-set display name
  imageUrl: text('image_url'), // Not encrypted (public profile picture URL)
  role: text('role').notNull().default('user'), // 'admin' | 'user'
  isProfilePublic: boolean('is_profile_public').notNull().default(true), // Profile visibility
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

/**
 * Battles table - stores the main battle data
 */
export const battles = pgTable('battles', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  month: text('month').notNull(),
  year: integer('year').notNull(),
  status: text('status').notNull(), // 'upcoming' | 'ongoing' | 'completed' | 'incomplete'
  stageId: text('stage_id').notNull().default('canada'), // Stage where battle takes place
  
  // Store personas as JSONB (they're static data, no need to normalize)
  leftPersona: jsonb('left_persona').$type<Persona>().notNull(),
  rightPersona: jsonb('right_persona').$type<Persona>().notNull(),
  
  currentRound: integer('current_round').notNull().default(1),
  currentTurn: text('current_turn'), // 'left' | 'right' | null
  
  // Store verses, scores, and comments as JSONB arrays
  verses: jsonb('verses').$type<Verse[]>().notNull().default(sql`'[]'::jsonb`),
  scores: jsonb('scores').$type<RoundScore[]>().notNull().default(sql`'[]'::jsonb`),
  comments: jsonb('comments').$type<Comment[]>().notNull().default(sql`'[]'::jsonb`), // Legacy comments
  
  winner: text('winner'),
  
  // Auth and feature flags
  createdBy: text('created_by').references(() => users.id), // null for legacy battles
  isFeatured: boolean('is_featured').notNull().default(false), // true = admin featured, false = user battle
  isPublic: boolean('is_public').notNull().default(false), // Battle visibility on user profiles
  votingEnabled: boolean('voting_enabled').notNull().default(true), // Enable/disable voting
  commentsEnabled: boolean('comments_enabled').notNull().default(true), // Enable/disable comments
  
  // Live battle fields
  isLive: boolean('is_live').notNull().default(false), // Battle currently in live mode
  liveStartedAt: timestamp('live_started_at', { mode: 'date' }), // When live mode started
  adminControlMode: text('admin_control_mode').default('manual'), // 'manual' | 'auto'
  autoPlayConfig: jsonb('auto_play_config').$type<{
    verseDelay?: number;
    autoAdvance?: boolean;
    readingDuration?: number;
    votingDuration?: number;
  }>(), // Auto-play timing settings
  
  // AI-generated song from battle verses
  generatedSong: jsonb('generated_song').$type<{
    audioUrl: string;
    videoUrl?: string;
    imageUrl?: string;
    title: string;
    beatStyle: 'g-funk' | 'boom-bap' | 'trap';
    generatedAt: number;
    sunoTaskId: string;
  }>(),
  
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

/**
 * Comments table - for new authenticated comments
 * Legacy comments remain in battles.comments JSONB field
 */
export const comments = pgTable('comments', {
  id: text('id').primaryKey(),
  battleId: text('battle_id').notNull().references(() => battles.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  round: integer('round'), // null for general battle comments
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

/**
 * Votes table - for tracking user votes per round
 * This is normalized for easier querying and analytics
 */
export const votes = pgTable('votes', {
  id: text('id').primaryKey(),
  battleId: text('battle_id').notNull().references(() => battles.id, { onDelete: 'cascade' }),
  round: integer('round').notNull(),
  personaId: text('persona_id').notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  // Unique constraint: one vote per user per round per battle
  uniqueVote: unique().on(table.battleId, table.round, table.userId),
}));

// Type inference for TypeScript
export type UserDB = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
export type BattleDB = typeof battles.$inferSelect;
export type BattleInsert = typeof battles.$inferInsert;
export type CommentDB = typeof comments.$inferSelect;
export type CommentInsert = typeof comments.$inferInsert;
export type VoteDB = typeof votes.$inferSelect;
export type VoteInsert = typeof votes.$inferInsert;

