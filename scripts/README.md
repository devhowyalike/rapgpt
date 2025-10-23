# Scripts

This directory contains utility scripts for managing the RapGPT application.

## Database Backup

### `backup-db.ts`

Creates a full backup of the production PostgreSQL database.

**Usage:**

```bash
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
- `POSTGRES_URL` environment variable must be set in `.env.local`

**Restoring from backup:**

```bash
# Using pg_restore
pg_restore -d your_database_name backups/rapgpt_prod_YYYY-MM-DDTHH-MM-SS.dump

# Or with connection URL
pg_restore --dbname="your_postgres_url" backups/rapgpt_prod_YYYY-MM-DDTHH-MM-SS.dump
```

**Notes:**

- Backups are stored in the `backups/` directory (ignored by git)
- Custom format (.dump) allows for flexible restoration options
- Includes `--no-owner` and `--no-acl` flags for better portability

## Battle Creation

### `create-battle.ts`

Creates new battles in the database.

**Usage:**

```bash
pnpm create-battle
```
