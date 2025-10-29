/**
 * Vercel Postgres client with Drizzle ORM
 */

import { drizzle, type VercelPgDatabase } from 'drizzle-orm/vercel-postgres';
import { createPool, type VercelPool } from '@vercel/postgres';
import * as schema from './schema';

/**
 * Lazy initialization of database connection
 * Only creates the connection when first accessed at runtime
 */
let dbInstance: VercelPgDatabase<typeof schema> | null = null;
let poolInstance: VercelPool | null = null;

function getPool() {
  if (!poolInstance) {
    const connectionString = process.env.POSTGRES_URL;
    
    if (!connectionString) {
      throw new Error('POSTGRES_URL environment variable is not set');
    }
    
    poolInstance = createPool({ connectionString });
  }
  return poolInstance;
}

function getDb() {
  if (!dbInstance) {
    const pool = getPool();
    dbInstance = drizzle({ client: pool, schema });
  }
  return dbInstance;
}

/**
 * Drizzle database client
 * Uses lazy initialization to avoid connection at build time
 */
export const db = new Proxy({} as VercelPgDatabase<typeof schema>, {
  get(_target, prop) {
    return getDb()[prop as keyof VercelPgDatabase<typeof schema>];
  }
}) as VercelPgDatabase<typeof schema>;

/**
 * Raw SQL client for direct queries if needed
 */
export const sql = new Proxy({} as VercelPool, {
  get(_target, prop) {
    return getPool()[prop as keyof VercelPool];
  }
}) as VercelPool;

