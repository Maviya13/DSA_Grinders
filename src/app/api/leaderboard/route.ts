import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/db/drizzle';
import { users, dailyStats } from '@/db/schema';
import { eq, or, and, desc, ne, notLike, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Exclude admin accounts from leaderboard
    // We can filter by role or by email pattern
    const allUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      leetcodeUsername: users.leetcodeUsername,
      github: users.github,
      linkedin: users.linkedin,
    })
      .from(users)
      .where(
        and(
          ne(users.role, 'admin'),
          notLike(users.leetcodeUsername, 'pending_%')
        )
      );

    const today = new Date().toISOString().split('T')[0];

    const leaderboard = [];
    for (const user of allUsers) {
      // Get today's stat specifically
      const [todayStat] = await db.select()
        .from(dailyStats)
        .where(and(eq(dailyStats.userId, user.id), eq(dailyStats.date, today)))
        .limit(1);

      // Get latest stat for other data points
      const [latestStat] = await db.select()
        .from(dailyStats)
        .where(eq(dailyStats.userId, user.id))
        .orderBy(desc(dailyStats.date))
        .limit(1);

      // Calculate total score: easy=1, medium=3, hard=6
      const easy = latestStat?.easy ?? 0;
      const medium = latestStat?.medium ?? 0;
      const hard = latestStat?.hard ?? 0;
      const totalScore = easy * 1 + medium * 3 + hard * 6;

      leaderboard.push({
        id: user.id,
        name: user.name,
        email: user.email,
        leetcodeUsername: user.leetcodeUsername,
        todayPoints: todayStat?.todayPoints || 0,
        totalScore: totalScore,
        totalProblems: latestStat?.total ?? 0,
        easy: easy,
        medium: medium,
        hard: hard,
        ranking: latestStat?.ranking ?? 0,
        avatar: latestStat?.avatar ?? '',
        country: latestStat?.country ?? '',
        streak: latestStat?.streak ?? 0,
        lastSubmission: latestStat?.lastSubmission || null,
        recentProblems: latestStat?.recentProblems || [],
        lastUpdated: latestStat?.date || null,
        github: user.github || null,
        linkedin: user.linkedin || null,
        rank: 0,
      });
    }

    // Sort based on type
    const searchParams = new URL(request.url).searchParams;
    const type = searchParams.get('type') || 'daily'; // Default to daily

    if (type === 'daily') {
      leaderboard.sort((a, b) => b.todayPoints - a.todayPoints || b.totalScore - a.totalScore);
    } else {
      leaderboard.sort((a, b) => b.totalScore - a.totalScore || b.todayPoints - a.todayPoints);
    }

    // Add rank
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return NextResponse.json(leaderboard);
  } catch (error: any) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
