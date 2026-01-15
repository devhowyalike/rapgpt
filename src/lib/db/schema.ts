/**
 * Database schema for RapGPT Battle System
 * Using Drizzle ORM with Vercel Postgres
 */

import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import type {
  Comment,
  Persona,
  RoundScore,
  Verse,
} from "@/lib/shared/battle-types";

/**
 * Users table - stores authenticated user data
 * Sensitive fields are encrypted using AES-256-GCM
 */
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  username: text("username"), // Public username from Clerk (not encrypted)
  encryptedEmail: text("encrypted_email").notNull(), // Encrypted email
  encryptedName: text("encrypted_name"), // Encrypted real name from Clerk
  encryptedDisplayName: text("encrypted_display_name"), // Encrypted user-set display name
  imageUrl: text("image_url"), // Not encrypted (public profile picture URL)
  role: text("role").notNull().default("user"), // 'admin' | 'user'
  isProfilePublic: boolean("is_profile_public").notNull().default(false), // Profile visibility
  isDeleted: boolean("is_deleted").notNull().default(false), // User deleted their Clerk account
  deletedAt: timestamp("deleted_at", { mode: "date" }), // When the user was marked as deleted
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

/**
 * Battles table - stores the main battle data
 */
export const battles = pgTable("battles", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  month: text("month").notNull(),
  year: integer("year").notNull(),
  status: text("status").notNull(), // 'upcoming' | 'paused' | 'completed'
  stageId: text("stage_id").notNull().default("canada"), // Stage where battle takes place

  // Store personas as JSONB (they're static data, no need to normalize)
  player1Persona: jsonb("player1_persona").$type<Persona>().notNull(),
  player2Persona: jsonb("player2_persona").$type<Persona>().notNull(),

  currentRound: integer("current_round").notNull().default(1),
  currentTurn: text("current_turn"), // 'player1' | 'player2' | null

  // Store verses, scores, and comments as JSONB arrays
  verses: jsonb("verses").$type<Verse[]>().notNull().default(sql`'[]'::jsonb`),
  scores: jsonb("scores")
    .$type<RoundScore[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  comments: jsonb("comments")
    .$type<Comment[]>()
    .notNull()
    .default(sql`'[]'::jsonb`), // Legacy comments

  winner: text("winner"),

  // Auth and feature flags
  createdBy: text("created_by").references(() => users.id), // null for legacy battles
  isFeatured: boolean("is_featured").notNull().default(false), // true = admin featured, false = user battle
  isPublic: boolean("is_public").notNull().default(false), // Battle visibility on user profiles
  votingEnabled: boolean("voting_enabled").notNull().default(false), // Enable/disable voting
  commentsEnabled: boolean("comments_enabled").notNull().default(true), // Enable/disable comments

  // Live battle fields
  isLive: boolean("is_live").notNull().default(false), // Battle currently in live mode
  liveStartedAt: timestamp("live_started_at", { mode: "date" }), // When live mode started
  adminControlMode: text("admin_control_mode").default("manual"), // 'manual' | 'auto'
  autoPlayConfig: jsonb("auto_play_config").$type<{
    verseDelay?: number;
    autoAdvance?: boolean;
    readingDuration?: number;
    votingDuration?: number;
  }>(), // Auto-play timing settings
  // Battle option: auto-start first verse after advancing round (default true)
  autoStartOnAdvance: boolean("auto_start_on_advance").notNull().default(true),

  // AI-generated song from battle verses
  generatedSong: jsonb("generated_song").$type<{
    audioUrl: string;
    videoUrl?: string;
    imageUrl?: string;
    title: string;
    beatStyle: "g-funk" | "boom-bap" | "trap";
    generatedAt: number;
    sunoTaskId: string;
  }>(),

  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

/**
 * Comments table - for new authenticated comments
 * Legacy comments remain in battles.comments JSONB field
 */
export const comments = pgTable("comments", {
  id: text("id").primaryKey(),
  battleId: text("battle_id")
    .notNull()
    .references(() => battles.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  round: integer("round"), // null for general battle comments
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

/**
 * Votes table - for tracking user votes per round
 * This is normalized for easier querying and analytics
 */
export const votes = pgTable(
  "votes",
  {
    id: text("id").primaryKey(),
    battleId: text("battle_id")
      .notNull()
      .references(() => battles.id, { onDelete: "cascade" }),
    round: integer("round").notNull(),
    personaId: text("persona_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    // Unique constraint: one vote per user per round per battle
    uniqueVote: unique().on(table.battleId, table.round, table.userId),
  }),
);

/**
 * Battle token usage - per generation call token accounting
 * Provider-agnostic usage captured via AI SDK LanguageModelUsage
 */
export const battleTokenUsage = pgTable("battle_token_usage", {
  id: text("id").primaryKey(),
  battleId: text("battle_id").references(() => battles.id, {
    onDelete: "set null",
  }),
  round: integer("round"),
  personaId: text("persona_id"),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  totalTokens: integer("total_tokens"),
  reasoningTokens: integer("reasoning_tokens"),
  cachedInputTokens: integer("cached_input_tokens"),
  status: text("status").notNull().default("completed"), // 'completed' | 'error'
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

/**
 * Song creation usage - tracks credits consumed for AI song generation
 */
export const songCreationUsage = pgTable("song_creation_usage", {
  id: text("id").primaryKey(),
  battleId: text("battle_id").references(() => battles.id, {
    onDelete: "set null",
  }),
  provider: text("provider").notNull(), // e.g., 'suno'
  credits: integer("credits").notNull(), // Credits consumed
  status: text("status").notNull().default("completed"), // 'completed' | 'error'
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// Type inference for TypeScript
export type UserDB = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
export type BattleDB = typeof battles.$inferSelect;
export type BattleInsert = typeof battles.$inferInsert;
export type CommentDB = typeof comments.$inferSelect;
export type CommentInsert = typeof comments.$inferInsert;
export type VoteDB = typeof votes.$inferSelect;
export type VoteInsert = typeof votes.$inferInsert;
export type BattleTokenUsageDB = typeof battleTokenUsage.$inferSelect;
export type BattleTokenUsageInsert = typeof battleTokenUsage.$inferInsert;
export type SongCreationUsageDB = typeof songCreationUsage.$inferSelect;
export type SongCreationUsageInsert = typeof songCreationUsage.$inferInsert;
