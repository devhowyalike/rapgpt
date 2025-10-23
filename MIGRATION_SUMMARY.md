# Database Migration Summary

## ✅ What's Been Done

Your RapGPT application has been successfully migrated from file-based storage to **Vercel Postgres with Drizzle ORM**.

### Changes Made

#### 1. **Dependencies Installed**

- `drizzle-orm` - Type-safe ORM
- `@vercel/postgres` - Vercel Postgres client
- `drizzle-kit` - Database migrations and tooling
- `zod` - Runtime validation (already installed, now integrated)

#### 2. **Database Schema Created** (`src/lib/db/schema.ts`)

- `battles` table - stores all battle data
- `votes` table - tracks user votes (normalized for future features)
- JSONB fields for flexible nested data (personas, verses, scores, comments)
- Proper indexes and constraints

#### 3. **Database Client** (`src/lib/db/client.ts`)

- Drizzle client configured for Vercel Postgres
- Type-safe database access

#### 4. **Storage Layer Updated** (`src/lib/battle-storage.ts`)

- Migrated from filesystem (fs.readFile/writeFile) to database queries
- Same API, different implementation
- Added `deleteBattle()` function for admin features

#### 5. **Zod Validation Added** (`src/lib/validations/`)

- Complete validation schemas for all battle types
- API request/response validation
- Runtime type safety on all endpoints

#### 6. **All API Routes Updated**

- `/api/battle/create` - Create battles
- `/api/battle/[id]` - Get battle by ID
- `/api/battle/[id]/vote` - Submit votes
- `/api/battle/[id]/comment` - Add comments
- `/api/battle/generate-verse` - Generate AI verses

All now use:

- Zod validation for request bodies
- Database storage instead of files
- Proper error handling with detailed validation errors

#### 7. **Scripts Added** (`package.json`)

```bash
pnpm db:push      # Push schema to database
pnpm db:generate  # Generate migrations
pnpm db:migrate   # Run migrations
pnpm db:studio    # Visual database browser
```

#### 8. **Documentation**

- `DATABASE_SETUP.md` - Complete setup guide
- `README.md` - Updated with database info
- `.env.example` - Environment variable template (blocked by gitignore, you'll need to create manually)
- `.gitignore` - Updated to exclude database artifacts

## 🚀 Next Steps (Required!)

### 1. Set Up Vercel Postgres

You need to create a database before deploying:

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (or create one)
3. Go to **Storage** → **Create Database** → **Postgres**
4. Follow the setup wizard

### 2. Pull Environment Variables (Local Development)

```bash
# Install Vercel CLI if you haven't
pnpm install -g vercel

# Link to your Vercel project
vercel link

# Pull database credentials
vercel env pull .env.local
```

### 3. Push Database Schema

```bash
pnpm db:push
```

This creates the `battles` and `votes` tables in your database.

### 4. Test Locally

```bash
pnpm dev
```

Try creating a battle to ensure everything works!

### 5. Deploy to Vercel

```bash
git add .
git commit -m "Migrate to Vercel Postgres with Drizzle ORM"
git push
```

Vercel will automatically deploy with your database connected.

## 🔄 Migrating Existing Data (Optional)

If you have existing battle data in JSON files (`data/battles/`), you'll want to import it:

### Option 1: Manual Import via Drizzle Studio

```bash
pnpm db:studio
```

This opens a visual interface where you can manually insert your battles.

### Option 2: Migration Script

Create `scripts/import-battles.ts`:

```typescript
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { saveBattle } from "../src/lib/battle-storage";
import type { Battle } from "../src/lib/shared";

async function importBattles() {
  const dataDir = join(process.cwd(), "data", "battles");

  try {
    const files = await readdir(dataDir);
    let count = 0;

    for (const file of files) {
      if (file.endsWith(".json")) {
        const content = await readFile(join(dataDir, file), "utf-8");
        const battle: Battle = JSON.parse(content);
        await saveBattle(battle);
        console.log(`✅ Imported: ${battle.id}`);
        count++;
      }
    }

    console.log(`\n🎉 Successfully imported ${count} battles!`);
  } catch (error) {
    console.error("❌ Import failed:", error);
  }
}

importBattles();
```

Run it:

```bash
tsx scripts/import-battles.ts
```

## 🎯 Benefits You Now Have

### For Development

- ✅ Works on Vercel (no more ENOENT errors!)
- ✅ Type-safe database queries
- ✅ Visual database browser (Drizzle Studio)
- ✅ Request validation with helpful error messages

### For Future Features

- ✅ Ready for user authentication
- ✅ Ready for admin dashboard
- ✅ Normalized votes table for analytics
- ✅ Easy to add new tables (users, sessions, etc.)
- ✅ Proper relational data structure

### For Production

- ✅ Automatic backups (via Vercel)
- ✅ Connection pooling built-in
- ✅ Scalable storage (not limited by filesystem)
- ✅ Real database queries and indexes

## 📚 Useful Commands

```bash
# Development
pnpm dev                    # Start dev server
pnpm db:studio              # Browse database

# Database Management
pnpm db:push                # Update database schema
pnpm db:generate            # Generate migration files
pnpm db:migrate             # Apply migrations

# Deployment
git push                    # Deploy to Vercel
vercel env pull .env.local  # Update local env vars
```

## 🆘 Troubleshooting

### "Cannot connect to database"

- Run `vercel env pull .env.local`
- Check that `.env.local` exists and has `POSTGRES_URL`

### "Table doesn't exist"

- Run `pnpm db:push` to create tables

### "Invalid request" errors in API

- This is Zod validation working! Check the error details
- Ensure your request matches the schema in `src/lib/validations/battle.ts`

## 🎉 You're All Set!

Once you complete the "Next Steps" above, your app will be production-ready with a proper database backend!

Any questions? Check out:

- [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed setup
- [Drizzle Docs](https://orm.drizzle.team)
- [Vercel Postgres Docs](https://vercel.com/docs/storage/vercel-postgres)
