#!/usr/bin/env tsx

/**
 * PostgreSQL Database Restore Script
 * Restores a database backup from a .dump file
 * Usage: tsx scripts/restore-db.ts <backup-filename> [--single-transaction]
 *
 * Environment: Uses .env.local by default (via pnpm db:restore:dev)
 * This ensures you're restoring to your local dev database, not production
 */

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

// Parse command line arguments
const args = process.argv.slice(2);
const backupFilename = args.find((arg) => !arg.startsWith("--"));
const useSingleTransaction =
  args.includes("--single-transaction") || args.includes("-s");

if (!backupFilename) {
  console.error("❌ Error: Please provide a backup filename");
  console.log(
    "Usage: tsx scripts/restore-db.ts <backup-filename> [--single-transaction]",
  );
  console.log("");
  console.log("Examples:");
  console.log(
    "  tsx scripts/restore-db.ts rapgpt_prod_2025-10-23T15-41-12.dump",
  );
  console.log(
    "  tsx scripts/restore-db.ts rapgpt_prod_2025-10-23T15-41-12.dump --single-transaction",
  );
  console.log("");
  console.log("Options:");
  console.log(
    "  --single-transaction, -s    Restore in a single transaction (all-or-nothing)",
  );
  process.exit(1);
}

// Ensure POSTGRES_URL is set (check both standard and QA_ prefix)
const postgresUrl = process.env.POSTGRES_URL || process.env.QA_POSTGRES_URL;
if (!postgresUrl) {
  console.error(
    "❌ Error: POSTGRES_URL or QA_POSTGRES_URL environment variable is not set",
  );
  console.error(
    "💡 Make sure you have .env.local file with POSTGRES_URL or QA_POSTGRES_URL",
  );
  process.exit(1);
}

// Resolve backup path
const backupPath = backupFilename.includes("/")
  ? backupFilename
  : join(process.cwd(), "backups", backupFilename);

// Check if backup file exists
if (!existsSync(backupPath)) {
  console.error(`❌ Error: Backup file not found: ${backupPath}`);
  process.exit(1);
}

console.log("⚠️  WARNING: This will replace all data in your target database!");
console.log(`📦 Backup file: ${backupPath}`);
console.log(`🎯 Target database: ${postgresUrl.replace(/:[^:]*@/, ":****@")}`);
if (useSingleTransaction) {
  console.log("🔒 Mode: Single transaction (all-or-nothing restore)");
} else {
  console.log(
    "📝 Mode: Individual transactions (allows partial restore on error)",
  );
}
console.log("");
console.log("Press Ctrl+C to cancel, or wait 3 seconds to continue...");

// Give user time to cancel
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function restore() {
  await sleep(3000);

  console.log("");
  console.log("🔄 Starting database restore...");

  try {
    // Build pg_restore command with:
    // -d: database connection string
    // --clean: drop existing objects before recreating
    // --if-exists: don't error if objects don't exist
    // --no-owner: don't set ownership
    // --no-acl: don't restore access privileges
    // --single-transaction: (optional) restore in one transaction for atomicity
    // -v: verbose output
    const flags = [
      "-d",
      `"${postgresUrl}"`,
      "--clean",
      "--if-exists",
      "--no-owner",
      "--no-acl",
      useSingleTransaction ? "--single-transaction" : null,
      "-v",
      `"${backupPath}"`,
    ].filter(Boolean);

    const command = `pg_restore ${flags.join(" ")}`;

    execSync(command, {
      stdio: "inherit",
      env: process.env,
    });

    console.log("");
    console.log("✅ Database restore completed successfully!");
    console.log("💡 You can verify the data using: pnpm db:studio");
  } catch (error) {
    console.error("");
    console.error("❌ Restore failed:", error);
    console.error("");
    console.error("Troubleshooting tips:");
    console.error(
      "1. Make sure pg_restore is installed (comes with PostgreSQL)",
    );
    console.error("2. Verify your POSTGRES_URL is correct in .env.local");
    console.error("3. Check that the backup file is not corrupted");
    process.exit(1);
  }
}

// Run the restore
restore();
