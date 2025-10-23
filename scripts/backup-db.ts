#!/usr/bin/env tsx

/**
 * PostgreSQL Database Backup Script
 * Creates a full backup of the production database using pg_dump
 * Backup format: Custom compressed format (.dump)
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Ensure POSTGRES_URL is set
const postgresUrl = process.env.POSTGRES_URL;
if (!postgresUrl) {
  console.error('❌ Error: POSTGRES_URL environment variable is not set');
  process.exit(1);
}

// Create backups directory if it doesn't exist
const backupsDir = join(process.cwd(), 'backups');
if (!existsSync(backupsDir)) {
  mkdirSync(backupsDir, { recursive: true });
  console.log(`📁 Created backups directory: ${backupsDir}`);
}

// Generate timestamp for filename
const timestamp = new Date()
  .toISOString()
  .replace(/:/g, '-')
  .replace(/\..+/, '');

// Backup filename with _prod_ identifier
const backupFilename = `rapgpt_prod_${timestamp}.dump`;
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

