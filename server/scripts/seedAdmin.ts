#!/usr/bin/env ts-node
import { storage } from '../storage';
import { env } from '../env';
import { users } from '@shared/schema';
import { sql } from 'drizzle-orm';
import { db } from '../db';

/*
  Seed / promote a user to Master Admin.
  Usage examples:
    ts-node server/scripts/seedAdmin.ts --email someone@example.com
    EMAIL=someone@example.com ts-node server/scripts/seedAdmin.ts

  If user with provided email does not exist, a minimal user record will be created.
  (Adjust creation if additional required fields emerge.)
*/

async function main() {
  const argEmailIndex = process.argv.findIndex(a => a === '--email');
  const cliEmail = argEmailIndex !== -1 ? process.argv[argEmailIndex + 1] : undefined;
  const email = cliEmail || process.env.EMAIL;

  if (!email) {
    console.error('Provide an email via --email or EMAIL env var');
    process.exit(1);
  }

  // Find user by email
  const existing = await db.select().from(users).where(sql`lower(email) = lower(${email})`).limit(1);
  let userId: string;
  if (existing.length === 0) {
    // Create bare user
    const insert = await db.insert(users).values({ 
      email, 
      subscriptionStatus: 'free',
      userType: 'applicant',
      approvalStatus: 'approved'
    }).returning();
    userId = insert[0].id;
    console.log(`Created new user ${email} with id ${userId}`);
  } else {
    userId = existing[0].id;
    console.log(`Found existing user ${email} with id ${userId}`);
  }

  // Promote to master_admin if not already
  if (!existing[0] || existing[0].adminRole !== 'master_admin') {
    const updated = await storage.makeUserAdmin(userId, 'master_admin');
    console.log(`User ${email} promoted to master_admin (id: ${updated.id})`);
  } else {
    console.log(`User ${email} is already a master_admin`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Seed admin error:', err);
  process.exit(1);
});
