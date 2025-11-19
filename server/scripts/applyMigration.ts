#!/usr/bin/env ts-node
import { db } from '../db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

async function main() {
  const migrationFiles = fs.readdirSync('migrations')
    .filter(f => f.endsWith('.sql'))
    .sort(); // Apply in alphabetical order

  for (const file of migrationFiles) {
    console.log(`Applying migration: ${file}`);
    const sqlText = fs.readFileSync(path.join('migrations', file), 'utf8');
    // Split by semicolon but keep it simple
    const statements = sqlText.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      try {
        await db.execute(sql.raw(stmt));
      } catch (e) {
        console.warn(`Warning executing ${file}: ${(e as Error).message}`);
      }
    }
  }
  console.log('All migrations applied');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
