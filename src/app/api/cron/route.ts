import path from 'path';
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { users, settings, User, Setting } from '@/db/schema';
import { eq, ne, and, notLike } from 'drizzle-orm';
import { updateDailyStatsForUser } from '@/lib/leetcode';
import { sendConfigEmail, sendConfigWhatsApp } from '@/lib/messaging';
import { getTodayDate } from '@/lib/utils';
import { generateDynamicRoast, DynamicContent } from '@/lib/ai';

// Helper function to check if today should be skipped
function shouldSkipToday(s: Setting): boolean {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday

  // Skip weekends if enabled
  if (s.skipWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
    return true;
  }

  // Check custom skip dates
  const today = now.toDateString();
  const customSkipDates = (s.customSkipDates as string[]) || [];
  if (customSkipDates.some((date: string) =>
    new Date(date).toDateString() === today
  )) {
    return true;
  }

  return false;
}

// Helper function to reset daily counters if needed
async function resetDailyCountersIfNeeded(s: Setting): Promise<Setting> {
  const now = new Date();
  const lastReset = s.lastResetDate ? new Date(s.lastResetDate) : new Date(0);

  // Check if it's a new day
  if (now.toDateString() !== lastReset.toDateString()) {
    const [updated] = await db.update(settings)
      .set({
        emailsSentToday: 0,
        whatsappSentToday: 0,
        lastResetDate: now,
      })
      .where(eq(settings.id, s.id))
      .returning();
    return updated;
  }

  return s;
}

// Helper function to process users in batches (simple concurrency control)
async function processInBatches<T, R>(items: T[], batchSize: number, processor: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }
  return results;
}


export async function GET(req: Request) {
  // Auth check using CRON_SECRET
  const authHeader = req.headers.get('authorization');
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';

  // In production, CRON_SECRET is required
  if (isProduction && !process.env.CRON_SECRET) {
    console.error('SECURITY: CRON_SECRET environment variable is not set in production');
    return new Response('Server configuration error', { status: 500 });
  }

  // If CRON_SECRET is set (required in production), validate it
  if (process.env.CRON_SECRET) {
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.warn('Unauthorized cron access attempt');
      return new Response('Unauthorized - Include Authorization: Bearer <CRON_SECRET> header', { status: 401 });
    }
  } else if (isProduction) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const today = getTodayDate();
    // Get automation settings
    let [s] = await db.select().from(settings).limit(1);
    if (!s) {
      [s] = await db.insert(settings).values({}).returning();
    }

    // Handle migration from old format to new format
    let needsUpdate = false;
    const updatePayload: Partial<Setting> = {};

    if (!s.emailSchedule || (s.emailSchedule as string[]).length === 0) {
      updatePayload.emailSchedule = ["09:00"];
      needsUpdate = true;
    }
    if (!s.whatsappSchedule || (s.whatsappSchedule as string[]).length === 0) {
      updatePayload.whatsappSchedule = ["09:30"];
      needsUpdate = true;
    }

    if (needsUpdate) {
      [s] = await db.update(settings).set(updatePayload).where(eq(settings.id, s.id)).returning();
    }

    // Reset daily counters if needed
    s = await resetDailyCountersIfNeeded(s);

    const isDevelopment = process.env.NODE_ENV === 'development' ||
      req.headers.get('x-development-mode') === 'true';

    if (!s.automationEnabled) {
      return NextResponse.json({
        message: 'Automation disabled',
        automationEnabled: false
      });
    }

    if (shouldSkipToday(s)) {
      return NextResponse.json({
        message: 'Day skipped due to settings',
        skipped: true
      });
    }

    // When this endpoint is hit, we process regardless of internal schedule
    // The external cron service (cron-job.org) handles the trigger timing.
    const shouldSendEmails = s.emailAutomationEnabled &&
      (s.emailsSentToday ?? 0) < (s.maxDailyEmails ?? 1);

    const shouldSendWhatsApp = s.whatsappAutomationEnabled &&
      (s.whatsappSentToday ?? 0) < (s.maxDailyWhatsapp ?? 1);

    const searchParams = new URL(req.url).searchParams;
    const testEmail = searchParams.get('testEmail');

    if (!shouldSendEmails && !shouldSendWhatsApp && !testEmail) {
      return NextResponse.json({
        message: 'Daily limits reached for both Email and WhatsApp',
        shouldSendEmails,
        shouldSendWhatsApp,
        emailsSentToday: s.emailsSentToday,
        whatsappSentToday: s.whatsappSentToday,
        maxDailyEmails: s.maxDailyEmails,
        maxDailyWhatsapp: s.maxDailyWhatsapp
      });
    }

    // Exclude admin accounts and pending profiles
    let allUsers = await db.select().from(users).where(
      and(
        ne(users.role, 'admin'),
        notLike(users.leetcodeUsername, 'pending_%')
      )
    );

    if (testEmail) {
      allUsers = allUsers.filter(u => u.email === testEmail);
      if (allUsers.length === 0) {
        return NextResponse.json({ message: `No user found with email: ${testEmail}` }, { status: 404 });
      }
    }

    // 4. Fetch Dynamic AI Roast (once per cron run)
    let aiContent: DynamicContent | null = null;
    try {
      // Use the first user's name or a generic name for context
      const sampleName = allUsers[0]?.name?.split(' ')[0] || 'Dhurandhar';
      aiContent = await generateDynamicRoast(sampleName);
      if (aiContent) {
        console.log('AI: Successfully generated daily roast');
        // Save to settings for dashboard use
        await db.update(settings).set({
          aiRoast: {
            roast: aiContent.dashboardRoast,
            fullMessage: aiContent.fullMessage,
            date: today
          },
          updatedAt: new Date()
        }).where(eq(settings.id, s.id));
      }
    } catch (error) {
      console.error('AI: Failed to generate daily roast', error);
    }

    interface UserResult {
      username: string;
      email: string;
      phoneNumber: string | null;
      statsUpdate: { success: boolean; error?: string };
      emailSent: { success: boolean; skipped?: boolean; reason?: string; error?: string };
      whatsappSent: { success: boolean; skipped?: boolean; reason?: string; error?: string };
    }

    let emailsSentCount = 0;
    let whatsappSentCount = 0;

    const processUser = async (user: User): Promise<UserResult> => {
      const userResult: UserResult = {
        username: user.leetcodeUsername,
        email: user.email,
        phoneNumber: user.phoneNumber || null,
        statsUpdate: { success: false },
        emailSent: { success: false, skipped: false },
        whatsappSent: { success: false, skipped: false }
      };

      // 1. Update LeetCode stats
      try {
        await updateDailyStatsForUser(user.id, user.leetcodeUsername);
        userResult.statsUpdate = { success: true };
      } catch (error) {
        userResult.statsUpdate = { success: false, error: error instanceof Error ? error.message : 'Stats update failed' };
      }

      // Personalize the AI content for this user
      let personalizedFullMessage = aiContent?.fullMessage;
      let personalizedDashboardRoast = aiContent?.dashboardRoast;

      if (personalizedFullMessage) {
        personalizedFullMessage = personalizedFullMessage.replace(/\[NAME\]/g, user.name.split(' ')[0]);
      }
      if (personalizedDashboardRoast) {
        personalizedDashboardRoast = personalizedDashboardRoast.replace(/\[NAME\]/g, user.name.split(' ')[0]);
      }

      // 2. Send email (if within limits)
      // Note: We check limits globally after processing, but here we check locally to avoid over-sending in the same batch
      const currentEmailTotal = (s.emailsSentToday ?? 0) + emailsSentCount;
      if (testEmail || (shouldSendEmails && currentEmailTotal < (s.maxDailyEmails ?? 1))) {
        const emailResult = await sendConfigEmail(user, undefined, undefined, personalizedFullMessage);
        userResult.emailSent = emailResult;
        if (emailResult.success) emailsSentCount++;
      } else {
        userResult.emailSent = { success: false, skipped: true, reason: 'Limit reached or disabled' };
      }

      // 3. Send WhatsApp (if within limits)
      const currentWhatsappTotal = (s.whatsappSentToday ?? 0) + whatsappSentCount;
      if (testEmail || (shouldSendWhatsApp && currentWhatsappTotal < (s.maxDailyWhatsapp ?? 1) && user.phoneNumber)) {
        const whatsappResult = await sendConfigWhatsApp(user, undefined, undefined, personalizedFullMessage);
        userResult.whatsappSent = whatsappResult;
        if (whatsappResult.success) whatsappSentCount++;
      } else {
        userResult.whatsappSent = {
          success: false,
          skipped: true,
          reason: !user.phoneNumber ? 'No phone number' : 'Limit reached or disabled'
        };
      }

      return userResult;
    };

    // Process all users in batches of 5 to respect rate limits and prevent timeouts
    const results = await processInBatches(allUsers, 5, processUser);

    // Update settings with new counts
    await db.update(settings).set({
      emailsSentToday: (s.emailsSentToday ?? 0) + emailsSentCount,
      whatsappSentToday: (s.whatsappSentToday ?? 0) + whatsappSentCount,
      lastEmailSent: emailsSentCount > 0 ? new Date() : s.lastEmailSent,
      lastWhatsappSent: whatsappSentCount > 0 ? new Date() : s.lastWhatsappSent,
    }).where(eq(settings.id, s.id));

    const summary = {
      totalUsers: allUsers.length,
      statsUpdated: results.filter(r => r.statsUpdate.success).length,
      emailsSent: emailsSentCount,
      whatsappSent: whatsappSentCount,
      emailsSkipped: results.filter(r => r.emailSent.skipped).length,
      whatsappSkipped: results.filter(r => r.whatsappSent.skipped).length,
    };

    return NextResponse.json({
      message: 'Cron job completed successfully',
      summary,
      results: results.slice(0, 5)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Cron job failed';
    console.error('Cron job error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
