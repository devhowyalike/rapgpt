# Community Feature Migration Guide

This guide will help you apply the database migration for the Community feature.

## Database Changes

The migration adds two new fields:

- `is_public` (boolean, default: false) to the `battles` table
- `is_profile_public` (boolean, default: true) to the `users` table

## Migration File

The migration SQL is located at: `drizzle/0001_slimy_harry_osborn.sql`

## How to Apply the Migration

### Option 1: Using Drizzle Push (Recommended for Development)

```bash
# Make sure your POSTGRES_URL environment variable is set
pnpm drizzle-kit push
```

### Option 2: Using Drizzle Migrate (Recommended for Production)

```bash
# Make sure your POSTGRES_URL environment variable is set
pnpm drizzle-kit migrate
```

### Option 3: Manual SQL Execution

If you prefer to run the SQL manually, connect to your database and execute:

```sql
ALTER TABLE "battles" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;
ALTER TABLE "users" ADD COLUMN "is_profile_public" boolean DEFAULT true NOT NULL;
```

## Verification

After applying the migration, verify the changes:

```sql
-- Check battles table
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'battles' AND column_name = 'is_public';

-- Check users table
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'is_profile_public';
```

## What's New

### For Users:

1. **Community Page** (`/community`) - View all registered users
2. **User Profiles** (`/profile/[userId]`) - View individual user profiles and their public battles
3. **Battle Publishing** - Users can publish/unpublish battles from their My e-Beefs page
4. **Profile Privacy** - Users can make their profile private (still appear in Community but no battles visible)

### Default Behavior:

- New battles are **private by default**
- User profiles are **public by default**
- Users must explicitly publish a battle for it to appear on their profile

## Testing

After applying the migration, test the following:

1. Visit `/community` to see all users
2. Click on a user to view their profile
3. Go to "My e-Beefs" and use the three-dot menu to publish a battle
4. On your own profile, toggle your profile privacy
5. Verify that private profiles show "Private Profile" message when viewed by others
