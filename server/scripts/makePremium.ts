
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function main() {
  await db.update(users)
    .set({ subscriptionStatus: 'paid' })
    .where(eq(users.email, 'user@gmail.com'));
  console.log('User upgraded to paid');
  process.exit(0);
}

main().catch(console.error);
