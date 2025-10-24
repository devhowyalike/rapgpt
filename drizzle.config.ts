import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // Check QA_POSTGRES_URL first (for QA database), fallback to POSTGRES_URL (for local/prod)
    url: process.env.QA_POSTGRES_URL || process.env.POSTGRES_URL!,
  },
  verbose: true,
  strict: true,
});

