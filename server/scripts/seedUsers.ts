#!/usr/bin/env ts-node
import { db } from '../db';
import { users } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { storage } from '../storage';

interface SeedUser {
  email: string;
  password: string;
  role?: 'master_admin' | 'secondary_admin';
}

const seedUsers: SeedUser[] = [
  { email: 'admin@gmail.com', password: 'admin123', role: 'master_admin' },
  { email: 'user@gmail.com', password: 'user123' }
];

async function upsertUser(u: SeedUser) {
  const existing = await db.select().from(users).where(eq(users.email, u.email)).limit(1);
  if (existing.length === 0) {
    const passwordHash = await bcrypt.hash(u.password, 12);
    const [created] = await db.insert(users).values({
      email: u.email,
      passwordHash,
      emailVerifiedAt: new Date(),
      subscriptionStatus: 'free'
    }).returning();
    if (u.role) {
      await storage.makeUserAdmin(created.id, u.role);
    }
    console.log(`Created user ${u.email}${u.role ? ' with role '+u.role : ''}`);
  } else {
    // Optionally update password if needed
    console.log(`User ${u.email} already exists`);
    if (u.role && !existing[0].isAdmin) {
      await storage.makeUserAdmin(existing[0].id, u.role);
      console.log(`Promoted existing user ${u.email} to ${u.role}`);
    }
  }
}

async function main() {
  for (const u of seedUsers) {
    await upsertUser(u);
  }
  console.log('Seeding complete');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
