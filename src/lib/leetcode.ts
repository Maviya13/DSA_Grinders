import { db } from '@/db/drizzle';
import { dailyStats } from '@/db/schema';
import { eq, and, lt, desc } from 'drizzle-orm';

const LEETCODE_GRAPHQL = 'https://leetcode.com/graphql';

// Calculate current streak from submission calendar
function calculateStreak(calendarData: string): number {
  if (!calendarData) return 0;

  try {
    const calendar = JSON.parse(calendarData);
    const timestamps = Object.keys(calendar).map(Number).sort((a, b) => b - a);

    if (timestamps.length === 0) return 0;

    let streak = 0;
    const oneDayInSeconds = 86400;
    const now = Math.floor(Date.now() / 1000);
    const todayStart = now - (now % oneDayInSeconds);

    // Check if solved today or yesterday (to account for timezone)
    const mostRecent = timestamps[0];
    if (mostRecent < todayStart - oneDayInSeconds) return 0;

    let currentDay = todayStart;

    for (const timestamp of timestamps) {
      const dayStart = timestamp - (timestamp % oneDayInSeconds);

      if (dayStart === currentDay || dayStart === currentDay - oneDayInSeconds) {
        if (dayStart < currentDay) {
          streak++;
          currentDay = dayStart;
        }
      } else {
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error('Error calculating streak:', error);
    return 0;
  }
}

async function fetchLeetCodeUser(username: string) {
  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          ranking
          userAvatar
          realName
          countryName
        }
        submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
        submissionCalendar
      }
    }
  `;

  const response = await fetch(LEETCODE_GRAPHQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0',
      'Referer': 'https://leetcode.com',
    },
    body: JSON.stringify({ query, variables: { username } }),
    cache: 'no-store', // Disable caching to ensure fresh data
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`LeetCode API error for ${username}:`, response.status, errorText);
    throw new Error(`LeetCode API error: ${response.status}`);
  }

  const data = await response.json();

  // Log the response to debug
  console.log(`[LeetCode API] Response for ${username}:`, JSON.stringify(data, null, 2));

  return data.data;
}

export async function fetchLeetCodeStats(username: string) {
  try {
    const userStats = await fetchLeetCodeUser(username);

    if (!userStats || !userStats.matchedUser) {
      throw new Error(`User "${username}" not found on LeetCode. Please check the username is correct.`);
    }

    const submitStats = userStats.matchedUser.submitStatsGlobal;
    if (!submitStats || !submitStats.acSubmissionNum || submitStats.acSubmissionNum.length === 0) {
      throw new Error(`Could not fetch submission stats for "${username}". The profile may be private.`);
    }

    const acNum = submitStats.acSubmissionNum;
    const easy = acNum.find((s: any) => s.difficulty === 'Easy')?.count || 0;
    const medium = acNum.find((s: any) => s.difficulty === 'Medium')?.count || 0;
    const hard = acNum.find((s: any) => s.difficulty === 'Hard')?.count || 0;
    const total = acNum.find((s: any) => s.difficulty === 'All')?.count || 0;
    const ranking = userStats.matchedUser.profile?.ranking || 0;

    // LeetCode's public API doesn't return avatars, so we construct the URL
    // Format: https://assets.leetcode.com/users/avatars/avatar_{timestamp}_{username}.png
    // Since we can't get the exact URL, we'll use LeetCode's default or a placeholder service
    const avatarFromAPI = userStats.matchedUser.profile?.userAvatar;
    const avatar = avatarFromAPI || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=1a73e8&color=fff&size=128`;

    const country = userStats.matchedUser.profile?.countryName || '';

    // Debug: Log avatar data
    console.log(`[LeetCode] Fetched data for ${username}:`, {
      avatarFromAPI,
      avatarFinal: avatar,
      country,
      hasProfile: !!userStats.matchedUser.profile,
    });

    // Calculate streak from submission calendar
    const calendar = userStats.matchedUser.submissionCalendar;
    const streak = calculateStreak(calendar);

    // Get last submission timestamp from calendar
    let lastSubmission = null;
    if (calendar) {
      try {
        const calendarObj = JSON.parse(calendar);
        const timestamps = Object.keys(calendarObj).map(Number);
        if (timestamps.length > 0) {
          lastSubmission = Math.max(...timestamps).toString();
        }
      } catch (e) {
        console.error('Error parsing submission calendar:', e);
      }
    }

    return {
      easy,
      medium,
      hard,
      total,
      ranking,
      avatar,
      country,
      recentSubmissions: [], // Not available from public API
      streak,
      lastSubmission,
    };
  } catch (error) {
    console.error(`Error fetching LeetCode stats for ${username}:`, error);
    throw error;
  }
}

export async function updateDailyStatsForUser(userId: number, leetcodeUsername: string) {
  const stats = await fetchLeetCodeStats(leetcodeUsername);
  const today = new Date().toISOString().split('T')[0];

  // Find today's stat or the most recent one
  const [todayStat] = await db.select()
    .from(dailyStats)
    .where(and(eq(dailyStats.userId, userId), eq(dailyStats.date, today)))
    .limit(1);

  // Get yesterday's or most recent stat to calculate points
  const [lastStat] = await db.select()
    .from(dailyStats)
    .where(and(eq(dailyStats.userId, userId), lt(dailyStats.date, today)))
    .orderBy(desc(dailyStats.date))
    .limit(1);

  // Calculate today's points with weighted scoring
  // Easy = 1 point, Medium = 3 points, Hard = 6 points
  let todayPoints = 0;
  let previousTotal = 0;

  if (lastStat) {
    // Calculate points based on new problems solved since last stat
    const newEasy = Math.max(0, stats.easy - (lastStat.easy ?? 0));
    const newMedium = Math.max(0, stats.medium - (lastStat.medium ?? 0));
    const newHard = Math.max(0, stats.hard - (lastStat.hard ?? 0));
    todayPoints = newEasy * 1 + newMedium * 3 + newHard * 6;
    previousTotal = lastStat.total ?? 0;
  } else {
    // First ever entry for this user, no points yet
    previousTotal = stats.total;
    todayPoints = 0;
  }

  // Ensure points are non-negative
  todayPoints = Math.max(0, todayPoints);

  const update = {
    easy: stats.easy,
    medium: stats.medium,
    hard: stats.hard,
    total: stats.total,
    ranking: stats.ranking,
    avatar: stats.avatar,
    country: stats.country,
    streak: stats.streak,
    lastSubmission: stats.lastSubmission,
    recentProblems: stats.recentSubmissions.map((s: any) => s.title),
    previousTotal: todayStat ? previousTotal : stats.total, // Keep original baseline
    todayPoints,
  };

  if (todayStat) {
    await db.update(dailyStats)
      .set(update)
      .where(and(eq(dailyStats.userId, userId), eq(dailyStats.date, today)));
    return todayStat; // Or re-fetch if needed
  } else {
    const [newStat] = await db.insert(dailyStats)
      .values({
        userId,
        date: today,
        ...update,
      })
      .returning();
    return newStat;
  }
}
