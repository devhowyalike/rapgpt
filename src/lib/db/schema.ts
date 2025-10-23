/**
 * Database schema for RapGPT Battle System
 * Using Drizzle ORM with Vercel Postgres
 */

import { pgTable, text, integer, jsonb, timestamp, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import type { Persona, Verse, RoundScore, Comment } from '@/lib/shared/battle-types';

/**
 * Battles table - stores the main battle data
 */
export const battles = pgTable('battles', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  month: text('month').notNull(),
  year: integer('year').notNull(),
  status: text('status').notNull(), // 'upcoming' | 'ongoing' | 'completed' | 'incomplete'
  
  // Store personas as JSONB (they're static data, no need to normalize)
  leftPersona: jsonb('left_persona').$type<Persona>().notNull(),
  rightPersona: jsonb('right_persona').$type<Persona>().notNull(),
  
  currentRound: integer('current_round').notNull().default(1),
  currentTurn: text('current_turn'), // 'left' | 'right' | null
  
  // Store verses, scores, and comments as JSONB arrays
  verses: jsonb('verses').$type<Verse[]>().notNull().default(sql`'[]'::jsonb`),
  scores: jsonb('scores').$type<RoundScore[]>().notNull().default(sql`'[]'::jsonb`),
  comments: jsonb('comments').$type<Comment[]>().notNull().default(sql`'[]'::jsonb`),
  
  winner: text('winner'),
  
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
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
  userId: text('user_id').notNull(), // Can be IP address or user ID when you add auth
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

// Type inference for TypeScript
export type BattleDB = typeof battles.$inferSelect;
export type BattleInsert = typeof battles.$inferInsert;
export type VoteDB = typeof votes.$inferSelect;
export type VoteInsert = typeof votes.$inferInsert;

