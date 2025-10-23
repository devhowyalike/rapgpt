/**
 * Zod schemas for battle data validation
 * Used for API request/response validation
 */

import { z } from 'zod';

// Persona validation
export const personaSchema = z.object({
  id: z.string(),
  name: z.string(),
  bio: z.string(),
  style: z.string(),
  avatar: z.string(),
  accentColor: z.string(),
  systemPrompt: z.string(),
});

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
  personaScores: z.record(z.string(), z.object({
    automated: automatedScoreSchema,
    userVotes: z.number().int().min(0),
    totalScore: z.number(),
  })),
  winner: z.string().nullable(),
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
  status: z.enum(['upcoming', 'ongoing', 'completed', 'incomplete']),
  personas: z.object({
    left: personaSchema,
    right: personaSchema,
  }),
  currentRound: z.number().int().min(1).max(3),
  currentTurn: z.enum(['left', 'right']).nullable(),
  verses: z.array(verseSchema),
  scores: z.array(roundScoreSchema),
  comments: z.array(commentSchema),
  winner: z.string().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// API Request/Response schemas
export const createBattleRequestSchema = z.object({
  leftPersonaId: z.string().min(1),
  rightPersonaId: z.string().min(1),
}).refine(data => data.leftPersonaId !== data.rightPersonaId, {
  message: 'Cannot battle the same persona',
});

export const createBattleResponseSchema = z.object({
  battleId: z.string(),
});

export const voteRequestSchema = z.object({
  personaId: z.string(),
  round: z.number().int().min(1).max(3),
  userId: z.string(), // IP address or user ID
});

export const commentRequestSchema = z.object({
  username: z.string().min(1).max(50).trim(),
  content: z.string().min(1).max(500).trim(),
  round: z.number().int().min(1).max(3).optional(),
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

