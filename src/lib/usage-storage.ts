/**
 * Token usage storage and aggregation helpers
 */

import { db } from '@/lib/db/client';
import { battleTokenUsage } from '@/lib/db/schema';
import { eq, inArray, sql } from 'drizzle-orm';

export interface BattleTokenUsageEvent {
  id: string;
  battleId: string;
  round?: number | null;
  personaId?: string | null;
  provider: string;
  model: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  reasoningTokens?: number | null;
  cachedInputTokens?: number | null;
  status?: 'completed' | 'error';
  createdAt?: Date;
}

/**
 * Record a single token usage event for a battle generation call.
 */
export async function recordBattleTokenUsage(event: BattleTokenUsageEvent): Promise<void> {
  const row = {
    id: event.id,
    battleId: event.battleId,
    round: event.round ?? null,
    personaId: event.personaId ?? null,
    provider: event.provider,
    model: event.model,
    inputTokens: event.inputTokens ?? null,
    outputTokens: event.outputTokens ?? null,
    totalTokens: event.totalTokens ?? null,
    reasoningTokens: event.reasoningTokens ?? null,
    cachedInputTokens: event.cachedInputTokens ?? null,
    status: event.status ?? 'completed',
    createdAt: event.createdAt ?? new Date(),
  };

  await db.insert(battleTokenUsage).values(row);
}

export interface BattleTokenTotals {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cachedInputTokens: number;
}

/**
 * Get aggregate token totals for a single battle.
 */
export async function getBattleTokenTotals(battleId: string): Promise<BattleTokenTotals> {
  const [result] = await db
    .select({
      // Cast SUM (bigint) to float8 to avoid string return type from pg
      inputTokens: sql<number>`coalesce(sum(${battleTokenUsage.inputTokens})::float8, 0)`,
      outputTokens: sql<number>`coalesce(sum(${battleTokenUsage.outputTokens})::float8, 0)`,
      totalTokens: sql<number>`coalesce(sum(${battleTokenUsage.totalTokens})::float8, 0)`,
      cachedInputTokens: sql<number>`coalesce(sum(${battleTokenUsage.cachedInputTokens})::float8, 0)`,
    })
    .from(battleTokenUsage)
    .where(eq(battleTokenUsage.battleId, battleId));

  return {
    inputTokens: Number(result?.inputTokens ?? 0),
    outputTokens: Number(result?.outputTokens ?? 0),
    totalTokens: Number(result?.totalTokens ?? 0),
    cachedInputTokens: Number(result?.cachedInputTokens ?? 0),
  };
}

/**
 * Get aggregate token totals for many battles in one query.
 * Returns a map keyed by battleId for efficient lookups in the admin list.
 */
export async function getAllBattlesTokenTotals(): Promise<Record<string, BattleTokenTotals>> {
  const rows = await db
    .select({
      battleId: battleTokenUsage.battleId,
      inputTokens: sql<number>`coalesce(sum(${battleTokenUsage.inputTokens})::float8, 0)`,
      outputTokens: sql<number>`coalesce(sum(${battleTokenUsage.outputTokens})::float8, 0)`,
      totalTokens: sql<number>`coalesce(sum(${battleTokenUsage.totalTokens})::float8, 0)`,
      cachedInputTokens: sql<number>`coalesce(sum(${battleTokenUsage.cachedInputTokens})::float8, 0)`,
    })
    .from(battleTokenUsage)
    .groupBy(battleTokenUsage.battleId);

  const map: Record<string, BattleTokenTotals> = {};
  for (const r of rows) {
    map[r.battleId] = {
      inputTokens: Number(r.inputTokens ?? 0),
      outputTokens: Number(r.outputTokens ?? 0),
      totalTokens: Number(r.totalTokens ?? 0),
      cachedInputTokens: Number(r.cachedInputTokens ?? 0),
    };
  }
  return map;
}

export interface BattleTokenEventRow {
  id: string;
  battleId: string;
  round: number | null;
  personaId: string | null;
  provider: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  reasoningTokens: number | null;
  cachedInputTokens: number | null;
  status: 'completed' | 'error';
  createdAt: Date;
}

/**
 * List raw token usage events for a battle (newest first).
 */
export async function getBattleTokenEvents(battleId: string): Promise<BattleTokenEventRow[]> {
  const rows = await db
    .select()
    .from(battleTokenUsage)
    .where(eq(battleTokenUsage.battleId, battleId))
    .orderBy(sql`"created_at" desc`);
  return rows as unknown as BattleTokenEventRow[];
}

export interface BattleTokenTotalsByModel {
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

/**
 * Aggregate token totals by model for a battle.
 */
export async function getBattleTokenTotalsByModel(battleId: string): Promise<BattleTokenTotalsByModel[]> {
  const rows = await db
    .select({
      model: battleTokenUsage.model,
      provider: battleTokenUsage.provider,
      inputTokens: sql<number>`coalesce(sum(${battleTokenUsage.inputTokens})::float8, 0)`,
      outputTokens: sql<number>`coalesce(sum(${battleTokenUsage.outputTokens})::float8, 0)`,
      totalTokens: sql<number>`coalesce(sum(${battleTokenUsage.totalTokens})::float8, 0)`,
    })
    .from(battleTokenUsage)
    .where(eq(battleTokenUsage.battleId, battleId))
    .groupBy(battleTokenUsage.model, battleTokenUsage.provider)
    .orderBy(sql`coalesce(sum(${battleTokenUsage.totalTokens})::float8, 0) desc`);

  // Ensure numeric coercion
  return rows.map((r) => ({
    ...r,
    inputTokens: Number(r.inputTokens ?? 0),
    outputTokens: Number(r.outputTokens ?? 0),
    totalTokens: Number(r.totalTokens ?? 0),
  }));
}

export interface MonthlyTokenTotals {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  reasoningTokens: number;
  cachedInputTokens: number;
  month: string;
  year: number;
}

/**
 * Get aggregate token totals for the current month.
 * Returns totals for all usage events in the current calendar month.
 */
export async function getCurrentMonthTokenTotals(): Promise<MonthlyTokenTotals> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // JS months are 0-indexed
  
  // Get first day of current month
  const startOfMonth = new Date(year, month - 1, 1);
  
  // Get first day of next month
  const startOfNextMonth = new Date(year, month, 1);

  const [result] = await db
    .select({
      inputTokens: sql<number>`coalesce(sum(${battleTokenUsage.inputTokens})::float8, 0)`,
      outputTokens: sql<number>`coalesce(sum(${battleTokenUsage.outputTokens})::float8, 0)`,
      totalTokens: sql<number>`coalesce(sum(${battleTokenUsage.totalTokens})::float8, 0)`,
      reasoningTokens: sql<number>`coalesce(sum(${battleTokenUsage.reasoningTokens})::float8, 0)`,
      cachedInputTokens: sql<number>`coalesce(sum(${battleTokenUsage.cachedInputTokens})::float8, 0)`,
    })
    .from(battleTokenUsage)
    .where(
      sql`${battleTokenUsage.createdAt} >= ${startOfMonth} AND ${battleTokenUsage.createdAt} < ${startOfNextMonth}`
    );

  return {
    inputTokens: Number(result?.inputTokens ?? 0),
    outputTokens: Number(result?.outputTokens ?? 0),
    totalTokens: Number(result?.totalTokens ?? 0),
    reasoningTokens: Number(result?.reasoningTokens ?? 0),
    cachedInputTokens: Number(result?.cachedInputTokens ?? 0),
    month: now.toLocaleString('en-US', { month: 'long' }),
    year,
  };
}


