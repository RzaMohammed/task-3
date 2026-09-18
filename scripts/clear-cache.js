#!/usr/bin/env node

/**
 * Cache and temporary directory cleanup utility.
 * Supports --dry-run and --force CLI arguments.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force') || args.includes('-f');

const TARGET_DIRECTORIES = [
  path.join(__dirname, '..', '.pytest_cache'),
  path.join(__dirname, '..', 'backend', 'dist'),
  path.join(__dirname, '..', 'coverage'),
  path.join(__dirname, '..', 'temp_uploads')
];

console.log(`[CACHE CLEANUP] Mode: ${isDryRun ? 'DRY-RUN' : 'LIVE'}`);

let totalDeleted = 0;

for (const dir of TARGET_DIRECTORIES) {
  if (fs.existsSync(dir)) {
    console.log(`Found target: ${dir}`);
    if (!isDryRun) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`  ✓ Removed ${dir}`);
        totalDeleted++;
      } catch (err) {
        console.error(`  ✗ Failed to delete ${dir}:`, err.message);
      }
    } else {
      console.log(`  [DRY-RUN] Would remove ${dir}`);
      totalDeleted++;
    }
  } else {
    console.log(`Skipping (not found): ${dir}`);
  }
}

console.log(`[CACHE CLEANUP] Completed. Processed ${totalDeleted} targets.`);
