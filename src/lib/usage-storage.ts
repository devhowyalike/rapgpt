/**
 * Token usage storage and aggregation helpers
 */

import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { battles, battleTokenUsage } from "@/lib/db/schema";

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
  cachedInputTokens?: number | null;
  status?: "completed" | "error";
  createdAt?: Date;
}

/**
 * Record a single token usage event for a battle generation call.
 */
export async function recordBattleTokenUsage(
  event: BattleTokenUsageEvent,
): Promise<void> {
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
    cachedInputTokens: event.cachedInputTokens ?? null,
    status: event.status ?? "completed",
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
export async function getBattleTokenTotals(
  battleId: string,
): Promise<BattleTokenTotals> {
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
 *
 * Note: Orphaned records (where battle has been deleted) are grouped under
 * the special key "__deleted__" to preserve token usage statistics.
 */
export async function getAllBattlesTokenTotals(): Promise<
  Record<string, BattleTokenTotals>
> {
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
    // Group orphaned records (null battleId from deleted battles) under special key
    const key = r.battleId ?? "__deleted__";
    map[key] = {
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
  cachedInputTokens: number | null;
  status: "completed" | "error";
  createdAt: Date;
}

/**
 * List raw token usage events for a battle (newest first).
 */
export async function getBattleTokenEvents(
  battleId: string,
): Promise<BattleTokenEventRow[]> {
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
export async function getBattleTokenTotalsByModel(
  battleId: string,
): Promise<BattleTokenTotalsByModel[]> {
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
    .orderBy(
      sql`coalesce(sum(${battleTokenUsage.totalTokens})::float8, 0) desc`,
    );

  // Ensure numeric coercion
  return rows.map((r) => ({
    ...r,
    inputTokens: Number(r.inputTokens ?? 0),
    outputTokens: Number(r.outputTokens ?? 0),
    totalTokens: Number(r.totalTokens ?? 0),
  }));
}

/**
 * Get aggregate token totals for all time.
 */
export interface AllTimeTokenTotals extends BattleTokenTotals {
  firstUsageDate: Date | null;
  lastUsageDate: Date | null;
}

export async function getAllTimeTokenTotals(): Promise<AllTimeTokenTotals> {
  const [result] = await db
    .select({
      inputTokens: sql<number>`coalesce(sum(${battleTokenUsage.inputTokens})::float8, 0)`,
      outputTokens: sql<number>`coalesce(sum(${battleTokenUsage.outputTokens})::float8, 0)`,
      totalTokens: sql<number>`coalesce(sum(${battleTokenUsage.totalTokens})::float8, 0)`,
      cachedInputTokens: sql<number>`coalesce(sum(${battleTokenUsage.cachedInputTokens})::float8, 0)`,
      firstUsageDate: sql<Date>`min(${battleTokenUsage.createdAt})`,
      lastUsageDate: sql<Date>`max(${battleTokenUsage.createdAt})`,
    })
    .from(battleTokenUsage);

  return {
    inputTokens: Number(result?.inputTokens ?? 0),
    outputTokens: Number(result?.outputTokens ?? 0),
    totalTokens: Number(result?.totalTokens ?? 0),
    cachedInputTokens: Number(result?.cachedInputTokens ?? 0),
    firstUsageDate: result?.firstUsageDate
      ? new Date(result.firstUsageDate)
      : null,
    lastUsageDate: result?.lastUsageDate
      ? new Date(result.lastUsageDate)
      : null,
  };
}

/**
 * Get aggregate token totals by model for all time.
 */
export async function getAllTimeTokenTotalsByModel(): Promise<
  BattleTokenTotalsByModel[]
> {
  const rows = await db
    .select({
      model: battleTokenUsage.model,
      provider: battleTokenUsage.provider,
      inputTokens: sql<number>`coalesce(sum(${battleTokenUsage.inputTokens})::float8, 0)`,
      outputTokens: sql<number>`coalesce(sum(${battleTokenUsage.outputTokens})::float8, 0)`,
      totalTokens: sql<number>`coalesce(sum(${battleTokenUsage.totalTokens})::float8, 0)`,
    })
    .from(battleTokenUsage)
    .groupBy(battleTokenUsage.model, battleTokenUsage.provider)
    .orderBy(
      sql`coalesce(sum(${battleTokenUsage.totalTokens})::float8, 0) desc`,
    );

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
  cachedInputTokens: number;
  month: string;
  year: number;
}

/**
 * Get aggregate token totals for a specific month.
 * month is 1-indexed (1 = January)
 */
export async function getMonthlyTokenTotals(
  month: number,
  year: number,
): Promise<MonthlyTokenTotals> {
  // Get first day of target month
  const startOfMonth = new Date(year, month - 1, 1);

  // Get first day of next month
  const startOfNextMonth = new Date(year, month, 1);

  const [result] = await db
    .select({
      inputTokens: sql<number>`coalesce(sum(${battleTokenUsage.inputTokens})::float8, 0)`,
      outputTokens: sql<number>`coalesce(sum(${battleTokenUsage.outputTokens})::float8, 0)`,
      totalTokens: sql<number>`coalesce(sum(${battleTokenUsage.totalTokens})::float8, 0)`,
      cachedInputTokens: sql<number>`coalesce(sum(${battleTokenUsage.cachedInputTokens})::float8, 0)`,
    })
    .from(battleTokenUsage)
    .where(
      sql`${battleTokenUsage.createdAt} >= ${startOfMonth} AND ${battleTokenUsage.createdAt} < ${startOfNextMonth}`,
    );

  // Format month name
  const monthName = new Date(year, month - 1, 1).toLocaleString("en-US", {
    month: "long",
  });

  return {
    inputTokens: Number(result?.inputTokens ?? 0),
    outputTokens: Number(result?.outputTokens ?? 0),
    totalTokens: Number(result?.totalTokens ?? 0),
    cachedInputTokens: Number(result?.cachedInputTokens ?? 0),
    month: monthName,
    year,
  };
}

/**
 * Get aggregate token totals for the current month.
 * Returns totals for all usage events in the current calendar month.
 */
export async function getCurrentMonthTokenTotals(): Promise<MonthlyTokenTotals> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // JS months are 0-indexed
  return getMonthlyTokenTotals(month, year);
}

/**
 * Get list of months that have token usage data
 */
export async function getAvailableMonths(): Promise<
  { month: number; year: number; label: string }[]
> {
  // Extract distinct year and month from createdAt
  const result = await db
    .select({
      year: sql<number>`extract(year from ${battleTokenUsage.createdAt})::int`,
      month: sql<number>`extract(month from ${battleTokenUsage.createdAt})::int`,
    })
    .from(battleTokenUsage)
    .groupBy(
      sql`extract(year from ${battleTokenUsage.createdAt})`,
      sql`extract(month from ${battleTokenUsage.createdAt})`,
    )
    .orderBy(
      sql`extract(year from ${battleTokenUsage.createdAt}) desc`,
      sql`extract(month from ${battleTokenUsage.createdAt}) desc`,
    );

  return result.map((r) => {
    const date = new Date(r.year, r.month - 1, 1);
    return {
      month: r.month,
      year: r.year,
      label: date.toLocaleString("en-US", { month: "long", year: "numeric" }),
    };
  });
}

// ============================================================================
// Monthly Battle / WebSocket Stats
// ============================================================================

export interface MonthlyBattleStats {
  totalBattles: number;
  liveBattles: number;
  completedBattles: number;
  featuredBattles: number;
  month: string;
  year: number;
}

/**
 * Get aggregate battle stats for a specific month.
 * This represents WebSocket activity (live battles = WebSocket usage).
 * month is 1-indexed (1 = January)
 */
export async function getMonthlyBattleStats(
  month: number,
  year: number
): Promise<MonthlyBattleStats> {
  // Get first day of target month
  const startOfMonth = new Date(year, month - 1, 1);

  // Get first day of next month
  const startOfNextMonth = new Date(year, month, 1);

  // Get battle counts for the month
  const [result] = await db
    .select({
      totalBattles: sql<number>`count(*)::int`,
      liveBattles: sql<number>`count(*) filter (where ${battles.liveStartedAt} is not null)::int`,
      completedBattles: sql<number>`count(*) filter (where ${battles.status} = 'completed')::int`,
      featuredBattles: sql<number>`count(*) filter (where ${battles.isFeatured} = true)::int`,
    })
    .from(battles)
    .where(
      sql`${battles.createdAt} >= ${startOfMonth} AND ${battles.createdAt} < ${startOfNextMonth}`
    );

  // Format month name
  const monthName = new Date(year, month - 1, 1).toLocaleString("en-US", {
    month: "long",
  });

  return {
    totalBattles: Number(result?.totalBattles ?? 0),
    liveBattles: Number(result?.liveBattles ?? 0),
    completedBattles: Number(result?.completedBattles ?? 0),
    featuredBattles: Number(result?.featuredBattles ?? 0),
    month: monthName,
    year,
  };
}

/**
 * Get aggregate battle stats for the current month.
 */
export async function getCurrentMonthBattleStats(): Promise<MonthlyBattleStats> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // JS months are 0-indexed
  return getMonthlyBattleStats(month, year);
}

/**
 * Get list of months that have battle data
 */
export async function getAvailableBattleMonths(): Promise<
  { month: number; year: number; label: string }[]
> {
  // Extract distinct year and month from createdAt
  const result = await db
    .select({
      year: sql<number>`extract(year from ${battles.createdAt})::int`,
      month: sql<number>`extract(month from ${battles.createdAt})::int`,
    })
    .from(battles)
    .groupBy(
      sql`extract(year from ${battles.createdAt})`,
      sql`extract(month from ${battles.createdAt})`
    )
    .orderBy(
      sql`extract(year from ${battles.createdAt}) desc`,
      sql`extract(month from ${battles.createdAt}) desc`
    );

  return result.map((r) => {
    const date = new Date(r.year, r.month - 1, 1);
    return {
      month: r.month,
      year: r.year,
      label: date.toLocaleString("en-US", { month: "long", year: "numeric" }),
    };
  });
}

/**
 * Get all-time battle totals
 */
export interface AllTimeBattleStats {
  totalBattles: number;
  liveBattles: number;
  completedBattles: number;
  featuredBattles: number;
  firstBattleDate: Date | null;
  lastBattleDate: Date | null;
}

export async function getAllTimeBattleStats(): Promise<AllTimeBattleStats> {
  const [result] = await db
    .select({
      totalBattles: sql<number>`count(*)::int`,
      liveBattles: sql<number>`count(*) filter (where ${battles.liveStartedAt} is not null)::int`,
      completedBattles: sql<number>`count(*) filter (where ${battles.status} = 'completed')::int`,
      featuredBattles: sql<number>`count(*) filter (where ${battles.isFeatured} = true)::int`,
      firstBattleDate: sql<Date>`min(${battles.createdAt})`,
      lastBattleDate: sql<Date>`max(${battles.createdAt})`,
    })
    .from(battles);

  return {
    totalBattles: Number(result?.totalBattles ?? 0),
    liveBattles: Number(result?.liveBattles ?? 0),
    completedBattles: Number(result?.completedBattles ?? 0),
    featuredBattles: Number(result?.featuredBattles ?? 0),
    firstBattleDate: result?.firstBattleDate
      ? new Date(result.firstBattleDate)
      : null,
    lastBattleDate: result?.lastBattleDate
      ? new Date(result.lastBattleDate)
      : null,
  };
}
