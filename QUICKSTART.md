# Quick Start Guide

## 🎯 Your App is Ready for Vercel!

Your filesystem-based storage has been migrated to **Vercel Postgres + Drizzle ORM**. Just 3 steps to get it running:

## Step 1: Create Database (2 minutes)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **Storage** → **Create Database** → **Postgres**
3. Name it `rapgpt-db` and click **Create**

## Step 2: Get Credentials (1 minute)

```bash
# Install Vercel CLI (if needed)
pnpm install -g vercel

# Link your project
vercel link

# Pull database credentials to .env.local
vercel env pull .env.local
```

## Step 3: Create Tables (30 seconds)

```bash
# Push your database schema
pnpm db:push
```

## 🎉 Done! Deploy It

```bash
git add .
git commit -m "Add Postgres database"
git push
```

Your app will deploy without the `ENOENT` error!

## 📝 What Changed?

### Before (File System)

```typescript
// ❌ Doesn't work on Vercel
await fs.writeFile("/var/task/data/battles/...json");
```

### After (Database)

```typescript
// ✅ Works everywhere!
await db.insert(battles).values(battleData);
```

## 🔍 Verify Locally

```bash
# Start dev server
pnpm dev

# In another terminal, open database browser
pnpm db:studio
```

Visit `http://localhost:3001` and create a battle. Then check Drizzle Studio to see it in the database!

## 📚 More Info

- **Full Setup Guide**: [DATABASE_SETUP.md](./DATABASE_SETUP.md)
- **Migration Details**: [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md)
- **Updated README**: [README.md](./README.md)

## 💡 Pro Tips

**Inspect Database Anytime:**

```bash
pnpm db:studio
```

**Update Schema:**

```bash
# Edit src/lib/db/schema.ts, then:
pnpm db:push
```

**Check Types:**

```bash
npx tsc --noEmit
```

---

**Need help?** Check the troubleshooting section in [DATABASE_SETUP.md](./DATABASE_SETUP.md)
