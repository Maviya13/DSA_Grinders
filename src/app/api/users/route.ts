import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { updateDailyStatsForUser } from '@/lib/leetcode';

export async function POST(req: Request) {
  try {
    const { name, leetcodeUsername, email, github } = await req.json();
    if (!name || !leetcodeUsername || !email || !github) {
      return NextResponse.json({ error: 'Name, LeetCode username, email, and github are required' }, { status: 400 });
    }

    const [existing] = await db.select().from(users).where(eq(users.leetcodeUsername, leetcodeUsername)).limit(1);
    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const [user] = await db.insert(users).values({
      name,
      leetcodeUsername,
      email: email.toLowerCase(),
      github,
    }).returning();

    // Fetch initial stats
    try {
      await updateDailyStatsForUser(user.id, user.leetcodeUsername);
    } catch (error) {
      // If LeetCode fetch fails, delete the user and return error
      await db.delete(users).where(eq(users.id, user.id));
      throw error;
    }

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
