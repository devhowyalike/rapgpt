#!/usr/bin/env tsx

/**
 * PostgreSQL Database Backup Script
 * Creates a full backup of the database using pg_dump
 * Backup format: Custom compressed format (.dump)
 * 
 * Environment: 
 *  - pnpm db:backup:prod - backs up production (.env.production) → rapgpt_prod_*.dump
 *  - pnpm db:backup:dev  - backs up dev (.env.local) → rapgpt_dev_*.dump
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Ensure POSTGRES_URL is set (check both standard and QA_ prefix)
const postgresUrl = process.env.POSTGRES_URL || process.env.QA_POSTGRES_URL;
if (!postgresUrl) {
  console.error('❌ Error: POSTGRES_URL or QA_POSTGRES_URL environment variable is not set');
  console.error('💡 Make sure you have .env.production file with POSTGRES_URL or QA_POSTGRES_URL');
  process.exit(1);
}

// Create backups directory if it doesn't exist
const backupsDir = join(process.cwd(), 'backups');
if (!existsSync(backupsDir)) {
  mkdirSync(backupsDir, { recursive: true });
  console.log(`📁 Created backups directory: ${backupsDir}`);
}

// Determine environment from BACKUP_ENV variable (defaults to 'prod')
const environment = process.env.BACKUP_ENV || 'prod';

// Generate timestamp for filename
const timestamp = new Date()
  .toISOString()
  .replace(/:/g, '-')
  .replace(/\..+/, '');

// Backup filename with environment identifier
const backupFilename = `rapgpt_${environment}_${timestamp}.dump`;
const backupPath = join(backupsDir, backupFilename);

console.log('🔄 Starting database backup...');
console.log(`📦 Backup file: ${backupFilename}`);

try {
  // Use pg_dump with custom format (-Fc) for compressed, efficient backups
  // -v for verbose output
  // --no-owner and --no-acl for portability
  const command = `pg_dump "${postgresUrl}" -Fc -v --no-owner --no-acl -f "${backupPath}"`;
  
  execSync(command, {
    stdio: 'inherit',
    env: process.env,
  });

  console.log('✅ Backup completed successfully!');
  console.log(`📍 Location: ${backupPath}`);
  
  // Get file size
  const stats = statSync(backupPath);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`📊 Size: ${fileSizeMB} MB`);
  
} catch (error) {
  console.error('❌ Backup failed:', error);
  process.exit(1);
}

