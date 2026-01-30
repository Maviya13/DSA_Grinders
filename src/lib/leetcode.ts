import { db } from '@/db/drizzle';
import { dailyStats } from '@/db/schema';
import { eq, and, lt, desc } from 'drizzle-orm';
import { getTodayDate } from './utils';
import type { LeetCodeStats, LeetCodeAPIError } from '@/types';

const LEETCODE_GRAPHQL = 'https://leetcode.com/graphql';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

// Custom error class for LeetCode API errors
export class LeetCodeError extends Error {
  code: LeetCodeAPIError['code'];
  retryable: boolean;

  constructor(code: LeetCodeAPIError['code'], message: string, retryable: boolean = false) {
    super(message);
    this.name = 'LeetCodeError';
    this.code = code;
    this.retryable = retryable;
  }
}

// Sleep utility for retry delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Calculate current streak from submission calendar
function calculateStreak(calendarData: string): number {
  if (!calendarData) return 0;

  try {
    const calendar: Record<string, number> = JSON.parse(calendarData);
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

// LeetCode GraphQL response types
interface LeetCodeUserProfile {
  ranking: number;
  userAvatar: string | null;
  realName: string | null;
  countryName: string | null;
}

interface LeetCodeSubmissionCount {
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'All';
  count: number;
}

interface LeetCodeMatchedUser {
  username: string;
  profile: LeetCodeUserProfile;
  submitStatsGlobal: {
    acSubmissionNum: LeetCodeSubmissionCount[];
  };
  submissionCalendar: string;
}

interface LeetCodeGraphQLResponse {
  data: {
    matchedUser: LeetCodeMatchedUser | null;
    recentAcSubmissionList: LeetCodeSubmission[] | null;
  };
  errors?: Array<{ message: string }>;
}

export interface LeetCodeSubmission {
  id: string;
  title: string;
  titleSlug: string;
  timestamp: string;
}

async function fetchLeetCodeUserWithRetry(
  username: string,
  retryCount: number = 0
): Promise<{ matchedUser: LeetCodeMatchedUser | null; recentSubmissions: LeetCodeSubmission[] }> {
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
      recentAcSubmissionList(username: $username, limit: 15) {
        id
        title
        titleSlug
        timestamp
      }
    }
  `;

  try {
    const response = await fetch(LEETCODE_GRAPHQL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://leetcode.com',
      },
      body: JSON.stringify({ query, variables: { username } }),
      cache: 'no-store',
    });

    // Handle rate limiting
    if (response.status === 429) {
      if (retryCount < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount);
        console.log(`Rate limited by LeetCode, retrying in ${delay}ms...`);
        await sleep(delay);
        return fetchLeetCodeUserWithRetry(username, retryCount + 1);
      }
      throw new LeetCodeError(
        'RATE_LIMITED',
        'LeetCode is temporarily limiting requests. Please try again in a few minutes.',
        true
      );
    }

    // Handle server errors (5xx) with retry
    if (response.status >= 500) {
      if (retryCount < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount);
        console.log(`LeetCode server error ${response.status}, retrying in ${delay}ms...`);
        await sleep(delay);
        return fetchLeetCodeUserWithRetry(username, retryCount + 1);
      }
      throw new LeetCodeError(
        'API_ERROR',
        'LeetCode is experiencing issues. Please try again later.',
        true
      );
    }

    if (!response.ok) {
      throw new LeetCodeError(
        'API_ERROR',
        `Failed to connect to LeetCode (Status: ${response.status})`,
        false
      );
    }

    const data: LeetCodeGraphQLResponse = await response.json();

    // Check for GraphQL errors
    if (data.errors && data.errors.length > 0) {
      throw new LeetCodeError(
        'API_ERROR',
        data.errors[0].message,
        false
      );
    }

    return {
      matchedUser: data.data.matchedUser,
      recentSubmissions: data.data.recentAcSubmissionList || []
    };

  } catch (error) {
    // Handle network errors with retry
    if (error instanceof TypeError && error.message.includes('fetch')) {
      if (retryCount < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount);
        console.log(`Network error, retrying in ${delay}ms...`);
        await sleep(delay);
        return fetchLeetCodeUserWithRetry(username, retryCount + 1);
      }
      throw new LeetCodeError(
        'NETWORK_ERROR',
        'Unable to connect to LeetCode. Please check your internet connection.',
        true
      );
    }

    // Re-throw LeetCodeError as-is
    if (error instanceof LeetCodeError) {
      throw error;
    }

    // Wrap unknown errors
    throw new LeetCodeError(
      'API_ERROR',
      error instanceof Error ? error.message : 'An unexpected error occurred',
      false
    );
  }
}

export async function fetchLeetCodeStats(username: string): Promise<LeetCodeStats> {
  // Use the retry-enabled fetch function
  const { matchedUser, recentSubmissions } = await fetchLeetCodeUserWithRetry(username);

  if (!matchedUser) {
    throw new LeetCodeError(
      'USER_NOT_FOUND',
      `User "${username}" not found on LeetCode. Please check the username is correct.`,
      false
    );
  }

  const submitStats = matchedUser.submitStatsGlobal;
  if (!submitStats || !submitStats.acSubmissionNum || submitStats.acSubmissionNum.length === 0) {
    throw new LeetCodeError(
      'PROFILE_PRIVATE',
      `Could not fetch submission stats for "${username}". The profile may be private.`,
      false
    );
  }

  const acNum = submitStats.acSubmissionNum;
  const easy = acNum.find((s) => s.difficulty === 'Easy')?.count || 0;
  const medium = acNum.find((s) => s.difficulty === 'Medium')?.count || 0;
  const hard = acNum.find((s) => s.difficulty === 'Hard')?.count || 0;
  const total = acNum.find((s) => s.difficulty === 'All')?.count || 0;
  const ranking = matchedUser.profile?.ranking || 0;

  // LeetCode's public API doesn't return avatars, so we construct the URL
  const avatarFromAPI = matchedUser.profile?.userAvatar;
  const avatar = avatarFromAPI || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=1a73e8&color=fff&size=128`;

  const country = matchedUser.profile?.countryName || '';


  // Calculate streak from submission calendar
  const calendar = matchedUser.submissionCalendar;
  const streak = calculateStreak(calendar);

  // Get last submission timestamp from calendar
  let lastSubmission: string | null = null;
  if (calendar) {
    try {
      const calendarObj: Record<string, number> = JSON.parse(calendar);
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
    recentSubmissions,
    streak,
    lastSubmission,
  };
}

export async function updateDailyStatsForUser(userId: number, leetcodeUsername: string) {
  const stats = await fetchLeetCodeStats(leetcodeUsername);
  const today = getTodayDate();

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
    recentProblems: stats.recentSubmissions,
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
