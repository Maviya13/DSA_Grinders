import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/db/drizzle';
import { users, dailyStats, settings } from '@/db/schema';
import { eq, and, desc, ne, notLike, sql } from 'drizzle-orm';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, getRateLimitHeaders } from '@/lib/rateLimit';
import { getTodayDate } from '@/lib/utils';

// In-memory cache for leaderboard data
interface CachedLeaderboard {
  data: LeaderboardEntry[];
  timestamp: number;
  type: string;
}

interface LeaderboardEntry {
  id: number;
  name: string;
  email: string;
  leetcodeUsername: string;
  todayPoints: number;
  totalScore: number;
  totalProblems: number;
  easy: number;
  medium: number;
  hard: number;
  ranking: number;
  avatar: string;
  country: string;
  streak: number;
  lastSubmission: string | null;
  recentProblems: string[];
  lastUpdated: string | null;
  github: string | null;
  linkedin: string | null;
  rank: number;
}

// Cache duration: 5 minutes (300000 ms)
const CACHE_DURATION_MS = 5 * 60 * 1000;

// Export cache map for manual invalidation
export const leaderboardCache = new Map<string, CachedLeaderboard>();

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(clientId, RATE_LIMITS.LEADERBOARD);

  if (!rateLimitResult.allowed) {
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...getRateLimitHeaders(rateLimitResult),
        },
      }
    );
  }

  try {
    const searchParams = new URL(request.url).searchParams;
    const type = searchParams.get('type') || 'daily';
    const cacheKey = `leaderboard_${type}`;

    // Check cache first
    const cached = leaderboardCache.get(cacheKey);
    const now = Date.now();
    if (cached && (now - cached.timestamp) < CACHE_DURATION_MS) {
      return new NextResponse(JSON.stringify(cached.data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300, must-revalidate',
          'X-Cache': 'HIT',
          'X-Cache-Age': Math.floor((now - cached.timestamp) / 1000).toString(),
          ...getRateLimitHeaders(rateLimitResult),
        },
      });
    }

    const today = getTodayDate();

    // Single optimized query using subqueries to avoid N+1
    // This joins users with their latest stats and today's stats in one go
    const result = await db.execute(sql`
      WITH latest_stats AS (
        SELECT DISTINCT ON (user_id) 
          user_id,
          date,
          easy,
          medium,
          hard,
          total,
          ranking,
          avatar,
          country,
          streak,
          last_submission,
          recent_problems
        FROM daily_stats
        ORDER BY user_id, date DESC
      ),
      today_stats AS (
        SELECT user_id, today_points
        FROM daily_stats
        WHERE date = ${today}
      )
      SELECT 
        u.id,
        u.name,
        u.email,
        u.leetcode_username as "leetcodeUsername",
        u.github,
        u.linkedin,
        COALESCE(t.today_points, 0) as "todayPoints",
        COALESCE(l.easy, 0) as easy,
        COALESCE(l.medium, 0) as medium,
        COALESCE(l.hard, 0) as hard,
        COALESCE(l.total, 0) as "totalProblems",
        COALESCE(l.ranking, 0) as ranking,
        COALESCE(l.avatar, '') as avatar,
        COALESCE(l.country, '') as country,
        COALESCE(l.streak, 0) as streak,
        l.last_submission as "lastSubmission",
        l.recent_problems as "recentProblems",
        l.date as "lastUpdated"
      FROM users u
      LEFT JOIN latest_stats l ON u.id = l.user_id
      LEFT JOIN today_stats t ON u.id = t.user_id
      WHERE u.role != 'admin' 
        AND u.leetcode_username NOT LIKE 'pending_%'
    `);

    // Transform the result
    const leaderboard: LeaderboardEntry[] = (result.rows as any[]).map((row) => {
      const easy = Number(row.easy) || 0;
      const medium = Number(row.medium) || 0;
      const hard = Number(row.hard) || 0;
      const totalScore = easy * 1 + medium * 3 + hard * 6;

      return {
        id: row.id,
        name: row.name,
        email: row.email,
        leetcodeUsername: row.leetcodeUsername,
        todayPoints: Number(row.todayPoints) || 0,
        totalScore,
        totalProblems: Number(row.totalProblems) || 0,
        easy,
        medium,
        hard,
        ranking: Number(row.ranking) || 0,
        avatar: row.avatar || '',
        country: row.country || '',
        streak: Number(row.streak) || 0,
        lastSubmission: row.lastSubmission || null,
        recentProblems: row.recentProblems || [],
        lastUpdated: row.lastUpdated || null,
        github: row.github || null,
        linkedin: row.linkedin || null,
        rank: 0,
      };
    });

    // Sort based on type
    if (type === 'daily') {
      leaderboard.sort((a, b) => b.todayPoints - a.todayPoints || b.totalScore - a.totalScore);
    } else {
      leaderboard.sort((a, b) => b.totalScore - a.totalScore || b.todayPoints - a.todayPoints);
    }

    // Add rank
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // Update cache
    leaderboardCache.set(cacheKey, {
      data: leaderboard,
      timestamp: now,
      type,
    });

    // 1. Fetch AI roast for the day
    let dailyRoast = null;
    try {
      const [s] = await db.select({ aiRoast: settings.aiRoast }).from(settings).limit(1);
      if (s?.aiRoast && (s.aiRoast as any).date === today) {
        dailyRoast = s.aiRoast;
      }
    } catch (e) {
      console.error('Failed to fetch daily roast for leaderboard:', e);
    }

    // 2. Fetch recent activities from all users for the last 3 days
    let activities: any[] = [];
    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];

      const recentStats = await db.execute(sql`
        SELECT 
          u.name as "userName",
          u.leetcode_username as "leetcodeUsername",
          ds.avatar,
          ds.recent_problems as "recentProblems"
        FROM daily_stats ds
        JOIN users u ON ds.user_id = u.id
        WHERE ds.date >= ${threeDaysAgoStr}
          AND u.role != 'admin'
          AND u.leetcode_username NOT LIKE 'pending_%'
        ORDER BY ds.date DESC
      `);

      // Flatten and de-duplicate activities
      const seenIds = new Set<string>();
      const nowTs = Math.floor(Date.now() / 1000);
      const seventyTwoHoursAgo = nowTs - (3 * 24 * 60 * 60);

      (recentStats.rows as any[]).forEach(row => {
        const problems = Array.isArray(row.recentProblems) ? row.recentProblems : [];
        problems.forEach((p: any) => {
          const problemTs = Number(p.timestamp);
          // Strict 72-hour filter
          if (!seenIds.has(p.id) && problemTs >= seventyTwoHoursAgo) {
            seenIds.add(p.id);
            activities.push({
              ...p,
              userName: row.userName,
              leetcodeUsername: row.leetcodeUsername,
              avatar: row.avatar
            });
          }
        });
      });

      // Sort by timestamp descending
      activities.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
      // Limit to 30 for performance
      activities = activities.slice(0, 30);
    } catch (e) {
      console.error('Failed to fetch recent activities:', e);
    }

    return new NextResponse(JSON.stringify({
      entries: leaderboard,
      dailyRoast,
      activities
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, must-revalidate',
        'X-Cache': 'MISS',
        ...getRateLimitHeaders(rateLimitResult),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('Leaderboard error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
