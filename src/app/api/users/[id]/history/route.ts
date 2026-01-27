import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { dailyStats } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const stats = await db.select().from(dailyStats).where(eq(dailyStats.userId, userId)).orderBy(asc(dailyStats.date));
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
