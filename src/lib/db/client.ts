/**
 * Vercel Postgres client with Drizzle ORM
 */

import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql as vercelSql } from '@vercel/postgres';
import * as schema from './schema';

/**
 * Drizzle database client
 * Uses Vercel Postgres connection
 */
export const db = drizzle({ client: vercelSql, schema });

/**
 * Raw SQL client for direct queries if needed
 */
export const sql = vercelSql;

