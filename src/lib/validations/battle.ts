/**
 * Zod schemas for battle data validation
 * Used for API request/response validation
 */

import { z } from "zod";
import { sanitizeText } from "@/lib/sanitization";

// Persona validation
export const personaSchema = z.object({
  id: z.string(),
  name: z.string(),
  bio: z.string(),
  style: z.string(),
  avatar: z.string(),
  accentColor: z.string(),
  systemPrompt: z.string(),
  encryptedCustomContext: z.string().optional(),
});

// Custom context validation (for user input before encryption)
export const customContextSchema = z
  .string()
  .max(120, "Custom context must be 120 characters or less")
  .optional()
  .transform((val) => (val ? sanitizeText(val) : val));

// Bar validation
export const barSchema = z.object({
  text: z.string(),
  index: z.number().int().min(0),
});

// Verse validation
export const verseSchema = z.object({
  id: z.string(),
  personaId: z.string(),
  round: z.number().int().min(1).max(3),
  bars: z.array(barSchema),
  timestamp: z.number(),
  fullText: z.string(),
});

// Automated score validation
export const automatedScoreSchema = z.object({
  rhymeScheme: z.number().min(0).max(30),
  wordplay: z.number().min(0).max(25),
  flow: z.number().min(0).max(20),
  relevance: z.number().min(0).max(15),
  originality: z.number().min(0).max(10),
  total: z.number().min(0).max(100),
  breakdown: z.object({
    rhymeScheme: z.string(),
    wordplay: z.string(),
    flow: z.string(),
    relevance: z.string(),
    originality: z.string(),
  }),
});

// Round score validation
export const roundScoreSchema = z.object({
  round: z.number().int().min(1).max(3),
  positionScores: z.object({
    player1: z.object({
      personaId: z.string(),
      automated: automatedScoreSchema,
      userVotes: z.number().int().min(0),
      totalScore: z.number(),
    }),
    player2: z.object({
      personaId: z.string(),
      automated: automatedScoreSchema,
      userVotes: z.number().int().min(0),
      totalScore: z.number(),
    }),
  }),
  winner: z.enum(["player1", "player2"]).nullable(),
});

// Comment validation
export const commentSchema = z.object({
  id: z.string(),
  username: z.string().min(1).max(50),
  content: z.string().min(1).max(500),
  timestamp: z.number(),
  round: z.number().int().min(1).max(3).optional(),
});

// Battle validation
export const battleSchema = z.object({
  id: z.string(),
  title: z.string(),
  month: z.string(),
  year: z.number().int(),
  status: z.enum(["upcoming", "paused", "completed"]),
  stageId: z.string(),
  personas: z.object({
    player1: personaSchema,
    player2: personaSchema,
  }),
  currentRound: z.number().int().min(1).max(3),
  currentTurn: z.enum(["player1", "player2"]).nullable(),
  verses: z.array(verseSchema),
  scores: z.array(roundScoreSchema),
  comments: z.array(commentSchema),
  winner: z.string().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
  // Optional creator field
  creator: z
    .object({
      userId: z.string(),
      displayName: z.string(),
      imageUrl: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  // Live battle fields
  isLive: z.boolean().optional(),
  liveStartedAt: z.number().optional(),
  adminControlMode: z.enum(["manual", "auto"]).optional(),
  autoPlayConfig: z
    .object({
      verseDelay: z.number().optional(),
      autoAdvance: z.boolean().optional(),
      readingDuration: z.number().optional(),
      votingDuration: z.number().optional(),
    })
    .optional(),
  // Battle options
  autoStartOnAdvance: z.boolean().optional(),
});

// API Request/Response schemas
export const createBattleRequestSchema = z.object({
  player1PersonaId: z.string().min(1),
  player2PersonaId: z.string().min(1),
  stageId: z.string().min(1),
});
// Note: Same persona battles are now allowed - each position is scored independently

export const createBattleResponseSchema = z.object({
  battleId: z.string(),
});

export const voteRequestSchema = z.object({
  personaId: z.string(),
  round: z.number().int().min(1).max(3),
  // userId removed - comes from authenticated session
});

export const commentRequestSchema = z.object({
  content: z.string().min(1).max(500).trim().transform(sanitizeText),
  round: z.number().int().min(1).max(3).optional(),
  // username removed - comes from authenticated user
});

export const generateVerseRequestSchema = z.object({
  battleId: z.string(),
  personaId: z.string(),
  round: z.number().int().min(1).max(3),
  opponentVerse: z.string().optional(),
});

// Type exports for TypeScript
export type PersonaValidation = z.infer<typeof personaSchema>;
export type BattleValidation = z.infer<typeof battleSchema>;
export type CreateBattleRequest = z.infer<typeof createBattleRequestSchema>;
export type CreateBattleResponse = z.infer<typeof createBattleResponseSchema>;
export type VoteRequest = z.infer<typeof voteRequestSchema>;
export type CommentRequest = z.infer<typeof commentRequestSchema>;
export type GenerateVerseRequest = z.infer<typeof generateVerseRequestSchema>;
