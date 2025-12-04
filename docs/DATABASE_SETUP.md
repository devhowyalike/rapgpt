# Database Setup Guide

This guide will help you set up Vercel Postgres for your RapGPT application.

## Prerequisites

- Vercel account (free tier works fine)
- Project deployed to Vercel (or ready to deploy)

## Step 1: Create Vercel Postgres Database

1. Go to your project on [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to the **Storage** tab
3. Click **Create Database**
4. Select **Postgres**
5. Choose your database name (e.g., `rapgpt-db`)
6. Select a region (choose closest to your users)
7. Click **Create**

## Step 2: Connect Database to Your Project

1. After creation, Vercel will show you a connection string
2. The connection will automatically add environment variables to your project:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NO_SSL`
   - `POSTGRES_URL_NON_POOLING`
   - `POSTGRES_USER`
   - `POSTGRES_HOST`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_DATABASE`

3. For local development, pull these environment variables:

```bash
pnpm vercel env pull .env.local
```

This will create a `.env.local` file with all your database credentials.

## Step 3: Push Database Schema

Now that you have your database credentials, push the schema:

```bash
# This will create the tables in your database
pnpm db:push
```

This command:
- Reads your schema from `src/lib/db/schema.ts`
- Creates the `battles` and `votes` tables
- Sets up all indexes and constraints

## Step 4: Verify Setup

You can use Drizzle Studio to visually inspect your database:

```bash
pnpm db:studio
```

This opens a web interface at `https://local.drizzle.studio` where you can:
- View all tables
- Browse data
- Run queries

## Step 5: Deploy

Once everything is working locally:

```bash
git add .
git commit -m "Add Postgres database with Drizzle ORM"
git push
```

Vercel will automatically deploy with the database connected.

## Database Scripts Reference

- `pnpm db:generate` - Generate migration files from schema changes
- `pnpm db:migrate` - Apply migration files to database
- `pnpm db:push` - Push schema directly to database (best for development)
- `pnpm db:studio` - Open Drizzle Studio UI

## Migration from File-Based Storage (Optional)

If you have existing battle data in JSON files, you'll need to migrate it:

1. Create a migration script (example below)
2. Run it once to import your data
3. Keep the JSON files as backup

Example migration script (`scripts/migrate-to-db.ts`):

```typescript
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { saveBattle } from '../src/lib/battle-storage';
import type { Battle } from '../src/lib/shared';

async function migrate() {
  const dataDir = join(process.cwd(), 'data', 'battles');
  const files = await readdir(dataDir);
  
  for (const file of files) {
    if (file.endsWith('.json')) {
      const content = await readFile(join(dataDir, file), 'utf-8');
      const battle: Battle = JSON.parse(content);
      await saveBattle(battle);
      console.log(`Migrated: ${battle.id}`);
    }
  }
  
  console.log('Migration complete!');
}

migrate();
```

Run with: `tsx scripts/migrate-to-db.ts`

## Troubleshooting

### "Cannot connect to database"
- Make sure you've run `pnpm vercel env pull .env.local`
- Check that `.env.local` contains `POSTGRES_URL`
- Verify you're in the correct project directory

### "Table already exists"
- This is safe to ignore on subsequent `db:push` commands
- Drizzle will only update changed columns

### "Push failed with type errors"
- Check your schema in `src/lib/db/schema.ts`
- Ensure all imports are correct
- Run `pnpm build` to check for TypeScript errors

## Production Considerations

For production, you may want to:

1. **Enable Connection Pooling**: Already handled by Vercel Postgres
2. **Set up Backups**: Vercel Postgres includes automatic backups
3. **Monitor Usage**: Check the Vercel dashboard for usage metrics
4. **Scale Plan**: Free tier includes 256 MB storage, 1 GB bandwidth

## Next Steps: Adding Authentication

When you're ready to add authentication:

1. Add a `users` table to your schema
2. Use Vercel Auth, NextAuth.js, or Clerk
3. Link battles and votes to user IDs
4. Implement admin roles for battle management

## Need Help?

- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [Vercel Postgres Docs](https://vercel.com/docs/storage/vercel-postgres)
- [Next.js Database Guide](https://nextjs.org/docs/app/building-your-application/data-fetching)

