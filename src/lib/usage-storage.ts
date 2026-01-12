/**
 * Token usage storage and aggregation helpers
 */

import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { battles, battleTokenUsage, songCreationUsage } from "@/lib/db/schema";

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
  // Get first day of target month (use UTC to avoid timezone issues)
  const startOfMonth = new Date(Date.UTC(year, month - 1, 1));

  // Get first day of next month
  const startOfNextMonth = new Date(Date.UTC(year, month, 1));

  const [result] = await db
    .select({
      inputTokens: sql<number>`coalesce(sum(${battleTokenUsage.inputTokens})::float8, 0)`,
      outputTokens: sql<number>`coalesce(sum(${battleTokenUsage.outputTokens})::float8, 0)`,
      totalTokens: sql<number>`coalesce(sum(${battleTokenUsage.totalTokens})::float8, 0)`,
      cachedInputTokens: sql<number>`coalesce(sum(${battleTokenUsage.cachedInputTokens})::float8, 0)`,
    })
    .from(battleTokenUsage)
    .where(
      sql`${battleTokenUsage.createdAt} >= ${startOfMonth.toISOString()} AND ${battleTokenUsage.createdAt} < ${startOfNextMonth.toISOString()}`,
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
  totalSongs: number;
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
  // Get first day of target month (use UTC to avoid timezone issues)
  const startOfMonth = new Date(Date.UTC(year, month - 1, 1));

  // Get first day of next month
  const startOfNextMonth = new Date(Date.UTC(year, month, 1));

  // Get battle counts for the month
  const [result] = await db
    .select({
      totalBattles: sql<number>`count(*)::int`,
      liveBattles: sql<number>`count(*) filter (where ${battles.liveStartedAt} is not null)::int`,
      completedBattles: sql<number>`count(*) filter (where ${battles.status} = 'completed')::int`,
      featuredBattles: sql<number>`count(*) filter (where ${battles.isFeatured} = true)::int`,
      totalSongs: sql<number>`count(*) filter (where ${battles.generatedSong}->>'audioUrl' is not null)::int`,
    })
    .from(battles)
    .where(
      sql`${battles.createdAt} >= ${startOfMonth.toISOString()} AND ${battles.createdAt} < ${startOfNextMonth.toISOString()}`
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
    totalSongs: Number(result?.totalSongs ?? 0),
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
  totalSongs: number;
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
      totalSongs: sql<number>`count(*) filter (where ${battles.generatedSong}->>'audioUrl' is not null)::int`,
      firstBattleDate: sql<Date>`min(${battles.createdAt})`,
      lastBattleDate: sql<Date>`max(${battles.createdAt})`,
    })
    .from(battles);

  return {
    totalBattles: Number(result?.totalBattles ?? 0),
    liveBattles: Number(result?.liveBattles ?? 0),
    completedBattles: Number(result?.completedBattles ?? 0),
    featuredBattles: Number(result?.featuredBattles ?? 0),
    totalSongs: Number(result?.totalSongs ?? 0),
    firstBattleDate: result?.firstBattleDate
      ? new Date(result.firstBattleDate)
      : null,
    lastBattleDate: result?.lastBattleDate
      ? new Date(result.lastBattleDate)
      : null,
  };
}

// ============================================================================
// Song Creation Usage
// ============================================================================

export interface SongCreationUsageEvent {
  id: string;
  battleId: string;
  provider: string;
  credits: number;
  status?: "completed" | "error";
  createdAt?: Date;
}

/**
 * Record a song creation usage event.
 */
export async function recordSongCreationUsage(
  event: SongCreationUsageEvent,
): Promise<void> {
  const row = {
    id: event.id,
    battleId: event.battleId,
    provider: event.provider,
    credits: event.credits,
    status: event.status ?? "completed",
    createdAt: event.createdAt ?? new Date(),
  };

  await db.insert(songCreationUsage).values(row);
}

export interface SongCreationTotals {
  totalCredits: number;
  totalSongs: number;
  month?: string;
  year?: number;
}

/**
 * Get aggregate song creation totals for all time.
 */
export async function getAllTimeSongCreationTotals(): Promise<SongCreationTotals> {
  // 1. Get usage from the tracking table
  const [usageResult] = await db
    .select({
      totalCredits: sql<number>`coalesce(sum(${songCreationUsage.credits})::float8, 0)`,
      totalSongs: sql<number>`count(*)::int`,
    })
    .from(songCreationUsage);

  // 2. Get total songs from battles table (which includes historical data)
  const [battleResult] = await db
    .select({
      totalSongs: sql<number>`count(*) filter (where ${battles.generatedSong}->>'audioUrl' is not null)::int`,
    })
    .from(battles);

  const usageSongs = Number(usageResult?.totalSongs ?? 0);
  const totalSongsFromBattles = Number(battleResult?.totalSongs ?? 0);

  // Use the higher number for total songs to ensure historical ones are counted
  const displayTotalSongs = Math.max(usageSongs, totalSongsFromBattles);
  
  // For credits, add 10 for each "historical" song not in the usage table
  const historicalSongsCount = Math.max(0, totalSongsFromBattles - usageSongs);
  const historicalCredits = historicalSongsCount * 10;

  return {
    totalCredits: Number(usageResult?.totalCredits ?? 0) + historicalCredits,
    totalSongs: displayTotalSongs,
  };
}

/**
 * Get aggregate song creation totals for a specific month.
 */
export async function getMonthlySongCreationTotals(
  month: number,
  year: number,
): Promise<SongCreationTotals> {
  // Use UTC to avoid timezone issues
  const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const startOfNextMonth = new Date(Date.UTC(year, month, 1));

  // 1. Get usage from the tracking table for this month
  const [usageResult] = await db
    .select({
      totalCredits: sql<number>`coalesce(sum(${songCreationUsage.credits})::float8, 0)`,
      totalSongs: sql<number>`count(*)::int`,
    })
    .from(songCreationUsage)
    .where(
      sql`${songCreationUsage.createdAt} >= ${startOfMonth.toISOString()} AND ${songCreationUsage.createdAt} < ${startOfNextMonth.toISOString()}`,
    );

  // 2. Get songs from battles table for this month (historical fallback)
  const [battleResult] = await db
    .select({
      totalSongs: sql<number>`count(*) filter (where ${battles.generatedSong}->>'audioUrl' is not null 
          AND to_timestamp((${battles.generatedSong}->>'generatedAt')::bigint / 1000) >= ${startOfMonth.toISOString()}::timestamp
          AND to_timestamp((${battles.generatedSong}->>'generatedAt')::bigint / 1000) < ${startOfNextMonth.toISOString()}::timestamp)::int`,
    })
    .from(battles);

  const usageSongs = Number(usageResult?.totalSongs ?? 0);
  const battleSongs = Number(battleResult?.totalSongs ?? 0);

  const displayTotalSongs = Math.max(usageSongs, battleSongs);
  const historicalSongsCount = Math.max(0, battleSongs - usageSongs);
  const historicalCredits = historicalSongsCount * 10;

  // Format month name
  const monthName = new Date(year, month - 1, 1).toLocaleString("en-US", {
    month: "long",
  });

  return {
    totalCredits: Number(usageResult?.totalCredits ?? 0) + historicalCredits,
    totalSongs: displayTotalSongs,
    month: monthName,
    year,
  };
}

/**
 * Get aggregate song creation totals for the current month.
 */
export async function getCurrentMonthSongCreationTotals(): Promise<SongCreationTotals> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return getMonthlySongCreationTotals(month, year);
}
