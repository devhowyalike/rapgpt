# Scripts

This directory contains utility scripts for managing the RapGPT application.

## Environment Files

The scripts use different environment files for safety:

- **`.env.local`** - Local development database (used by `db:restore:dev`)
- **`.env.production`** - Production database (used by `db:backup:prod`)

This separation prevents accidentally backing up from dev or restoring to production.

## Database Backup

### `backup-db.ts`

Creates a full backup of the PostgreSQL database.

**Usage:**

```bash
# Backup production database (uses .env.production)
pnpm db:backup:prod
```

**Features:**

- Uses PostgreSQL's `pg_dump` utility with custom compressed format
- Automatically creates a `backups/` directory in the project root
- Generates timestamped backup files with `_prod_` identifier
- Format: `rapgpt_prod_YYYY-MM-DDTHH-MM-SS.dump`
- Displays backup size after completion

**Requirements:**

- PostgreSQL client tools (`pg_dump`) must be installed on your system
- `POSTGRES_URL` environment variable must be set in `.env.production`
- **Important**: This backs up your PRODUCTION database

**See also:** `restore-db.ts` for easy restoration

**Notes:**

- Backups are stored in the `backups/` directory (ignored by git)
- Custom format (.dump) allows for flexible restoration options
- Includes `--no-owner` and `--no-acl` flags for better portability

## Database Restore

### `restore-db.ts`

Restores a PostgreSQL database backup from a .dump file.

**Usage:**

```bash
# Restore to local dev database (uses .env.local)
pnpm db:restore:dev rapgpt_prod_2025-10-23T15-41-12.dump

# With single transaction (all-or-nothing mode)
pnpm db:restore:dev rapgpt_prod_2025-10-23T15-41-12.dump --single-transaction

# Or directly with tsx
tsx scripts/restore-db.ts backups/rapgpt_prod_2025-10-23T15-41-12.dump

# Short form flag
pnpm db:restore:dev rapgpt_prod_2025-10-23T15-41-12.dump -s
```

**Options:**

- `--single-transaction` or `-s`: Restore in a single transaction (all-or-nothing)
  - ✅ Use for: Production restores where consistency is critical
  - ❌ Avoid for: Very large databases or when partial recovery is acceptable

**Features:**

- Safely restores database from backup files created by `backup-db.ts`
- Uses `pg_restore` with proper flags for clean restoration
- Includes 3-second countdown to allow cancellation
- Displays masked database URL for security
- Validates backup file exists before attempting restore
- Cleans existing objects before restoring (`--clean --if-exists`)

**Requirements:**

- PostgreSQL client tools (`pg_restore`) must be installed on your system
- `POSTGRES_URL` environment variable must be set in `.env.local` (for dev restore)
- Valid backup file in custom format (.dump)
- **Important**: This restores to your LOCAL dev database by default

**⚠️ Warning:**

This will **replace all data** in your target database! Make sure you:

1. Are restoring to the correct database (check your `.env.local`)
2. Have a backup of your current data if needed
3. Understand this is a destructive operation

**Common Use Cases:**

```bash
# Restore prod backup to local dev (quick, partial restore OK)
pnpm db:restore:dev rapgpt_prod_2025-10-23T15-41-12.dump

# Restore with safety (all-or-nothing)
pnpm db:restore:dev rapgpt_prod_2025-10-23T15-41-12.dump --single-transaction

# Restore to a different environment (manual override)
dotenv -e .env.production -- tsx scripts/restore-db.ts backup.dump
```

**Single Transaction Mode Explained:**

Without `--single-transaction` (default):

- Each SQL command commits individually
- If restore fails midway, you get a partially restored database
- ✅ Good for dev: Faster, can inspect partial results
- ✅ Good for large databases: Smaller memory footprint

With `--single-transaction`:

- Entire restore happens in one transaction
- If any command fails, everything rolls back (database unchanged)
- ✅ Good for production: Guarantees consistency
- ❌ Avoid for huge databases: High memory/disk usage for transaction log

**Notes:**

- The script will wait 3 seconds before starting to allow cancellation (Ctrl+C)
- Uses `--no-owner` and `--no-acl` for portability across databases
- Verbose output (`-v`) shows restoration progress
- After restore, verify data with `pnpm db:studio`

## Battle Creation

### `create-battle.ts`

Creates new battles in the database.

**Usage:**

```bash
pnpm create-battle
```
