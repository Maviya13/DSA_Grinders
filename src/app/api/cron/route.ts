import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { users, messageTemplates, settings } from '@/db/schema';
import { eq, ne, and, lt, lte, or, desc, notLike } from 'drizzle-orm';
import { updateDailyStatsForUser } from '@/lib/leetcode';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import nodemailer from 'nodemailer';

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});


// Helper function to check if today should be skipped
function shouldSkipToday(s: any): boolean {
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
async function resetDailyCountersIfNeeded(s: any): Promise<any> {
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
    console.log('Daily counters reset for new day');
    return updated;
  }

  return s;
}

// Helper function to check if current time matches any scheduled time
function isTimeToSend(scheduledTimes: string[] | undefined, timezone: string = 'Asia/Kolkata', devMode: boolean = false): boolean {
  // In development mode, always return true for testing
  if (devMode) {
    console.log('🧪 Development mode: Skipping time check');
    return true;
  }

  // Handle undefined or empty schedules
  if (!scheduledTimes || scheduledTimes.length === 0) {
    console.log('⚠️ No scheduled times found');
    return false;
  }

  const now = new Date();
  const currentTime = now.toLocaleTimeString('en-IN', {
    timeZone: timezone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });

  const [currentHour, currentMinute] = currentTime.split(':').map(Number);
  const currentMinutes = currentHour * 60 + currentMinute;

  // Check if current time is within 15 minutes of any scheduled time
  const isTime = scheduledTimes.some(scheduledTime => {
    const [scheduledHour, scheduledMinute] = scheduledTime.split(':').map(Number);
    const scheduledMinutes = scheduledHour * 60 + scheduledMinute;

    const timeDiff = Math.abs(currentMinutes - scheduledMinutes);
    console.log(`⏰ Checking ${scheduledTime}: current=${currentTime}, diff=${timeDiff}min`);

    return timeDiff <= 15;
  });

  console.log(`🕐 Time check result: ${isTime} (current: ${currentTime})`);
  return isTime;
}

// Replace template variables with actual values
function replaceTemplateVariables(content: string, user: any, roast: string = '', insult: string = ''): string {
  return content
    .replace(/\{userName\}/g, user.name)
    .replace(/\{email\}/g, user.email)
    .replace(/\{leetcodeUsername\}/g, user.leetcodeUsername)
    .replace(/\{roast\}/g, roast)
    .replace(/\{insult\}/g, insult);
}

async function sendTemplatedEmail(user: any, template: any, roast: string, insult: string) {
  const subject = replaceTemplateVariables(template.subject || 'DSA Grinders - Daily Reminder', user, roast, insult);
  const content = replaceTemplateVariables(template.content, user, roast, insult);

  const mailOptions = {
    from: `"DSA Grinders" <${process.env.SMTP_EMAIL}>`,
    to: user.email,
    subject: subject,
    html: content,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error: any) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

async function sendTemplatedWhatsApp(user: any, template: any, roast: string, insult: string) {
  const content = replaceTemplateVariables(template.content, user, roast, insult);

  try {
    const result = await sendWhatsAppMessage(user.phoneNumber, content);
    return result;
  } catch (error: any) {
    console.error('WhatsApp send error:', error);
    return { success: false, error: error.message };
  }
}

export async function GET(req: Request) {
  // Auth check using CRON_SECRET
  const authHeader = req.headers.get('authorization');

  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.log('Unauthorized cron access attempt');
    return new Response('Unauthorized - Include Authorization: Bearer <CRON_SECRET> header', { status: 401 });
  }

  console.log('Cron job triggered:', {
    hasAuth: !!authHeader,
    timestamp: new Date().toISOString(),
    source: 'External cron service'
  });

  try {
    // Get automation settings
    let [s] = await db.select().from(settings).limit(1);
    if (!s) {
      [s] = await db.insert(settings).values({}).returning();
      console.log('Created default automation settings');
    }

    // Handle migration from old format to new format
    let needsUpdate = false;
    const updatePayload: any = {};

    if (!s.emailSchedule || (s.emailSchedule as string[]).length === 0) {
      updatePayload.emailSchedule = ["09:00"];
      needsUpdate = true;
      console.log('🔄 Migrated emailSchedule to new format');
    }
    if (!s.whatsappSchedule || (s.whatsappSchedule as string[]).length === 0) {
      updatePayload.whatsappSchedule = ["09:30"];
      needsUpdate = true;
      console.log('🔄 Migrated whatsappSchedule to new format');
    }

    if (needsUpdate) {
      [s] = await db.update(settings).set(updatePayload).where(eq(settings.id, s.id)).returning();
    }

    // Reset daily counters if needed
    s = await resetDailyCountersIfNeeded(s);

    // Development mode check
    const isDevelopment = process.env.NODE_ENV === 'development' ||
      req.headers.get('x-development-mode') === 'true';

    console.log('Cron job started - Settings check:', {
      automationEnabled: s.automationEnabled,
      emailAutomationEnabled: s.emailAutomationEnabled,
      whatsappAutomationEnabled: s.whatsappAutomationEnabled,
      emailSchedule: s.emailSchedule,
      whatsappSchedule: s.whatsappSchedule,
      emailsSentToday: s.emailsSentToday,
      whatsappSentToday: s.whatsappSentToday,
      maxDailyEmails: s.maxDailyEmails,
      maxDailyWhatsapp: s.maxDailyWhatsapp,
      isDevelopment
    });

    if (!s.automationEnabled) {
      console.log('Automation is disabled - skipping cron job');
      return NextResponse.json({
        message: 'Automation disabled',
        automationEnabled: false
      });
    }

    if (shouldSkipToday(s)) {
      console.log('Skipping today due to settings (weekend/holiday)');
      return NextResponse.json({
        message: 'Day skipped due to settings',
        skipped: true
      });
    }

    const shouldSendEmails = s.emailAutomationEnabled &&
      isTimeToSend(s.emailSchedule as string[], s.timezone || undefined, isDevelopment) &&
      (s.emailsSentToday ?? 0) < (s.maxDailyEmails ?? 1);

    const shouldSendWhatsApp = s.whatsappAutomationEnabled &&
      isTimeToSend(s.whatsappSchedule as string[], s.timezone || undefined, isDevelopment) &&
      (s.whatsappSentToday ?? 0) < (s.maxDailyWhatsapp ?? 1);

    if (!shouldSendEmails && !shouldSendWhatsApp) {
      return NextResponse.json({
        message: 'Not time to send messages or daily limits reached',
        shouldSendEmails,
        shouldSendWhatsApp,
        currentTime: new Date().toLocaleTimeString('en-IN', { timeZone: s.timezone || 'Asia/Kolkata' }),
        emailSchedule: s.emailSchedule,
        whatsappSchedule: s.whatsappSchedule
      });
    }

    // Get active templates
    const [whatsappTemplate] = await db.select().from(messageTemplates).where(and(eq(messageTemplates.type, 'whatsapp_roast'), eq(messageTemplates.isActive, true))).limit(1);
    const [emailTemplate] = await db.select().from(messageTemplates).where(and(eq(messageTemplates.type, 'email_roast'), eq(messageTemplates.isActive, true))).limit(1);

    // Exclude admin accounts and pending profiles
    const allUsers = await db.select().from(users).where(
      and(
        ne(users.role, 'admin'),
        notLike(users.leetcodeUsername, 'pending_%')
      )
    );

    const results = [];
    let emailsSentCount = 0;
    let whatsappSentCount = 0;

    const batchRoast = '';
    const batchInsult = '';

    for (const user of allUsers) {
      const userResult: any = {
        username: user.leetcodeUsername,
        email: user.email,
        phoneNumber: user.phoneNumber || null,
        statsUpdate: { success: false },
        emailSent: { success: false, skipped: false },
        whatsappSent: { success: false, skipped: false }
      };

      try {
        await updateDailyStatsForUser(user.id, user.leetcodeUsername);
        userResult.statsUpdate = { success: true };
      } catch (error: any) {
        userResult.statsUpdate = { success: false, error: error.message };
      }

      if (shouldSendEmails && emailsSentCount + (s.emailsSentToday ?? 0) < (s.maxDailyEmails ?? 1)) {
        try {
          if (emailTemplate) {
            const emailResult = await sendTemplatedEmail(user, emailTemplate, batchRoast, batchInsult);
            userResult.emailSent = emailResult;
            if (emailResult.success) emailsSentCount++;
          }
        } catch (error: any) {
          userResult.emailSent = { success: false, error: error.message };
        }
      } else {
        userResult.emailSent = { success: false, skipped: true, reason: 'Not time or limit reached' };
      }

      if (shouldSendWhatsApp && whatsappSentCount + (s.whatsappSentToday ?? 0) < (s.maxDailyWhatsapp ?? 1) && user.phoneNumber) {
        try {
          if (whatsappTemplate) {
            const whatsappResult = await sendTemplatedWhatsApp(user, whatsappTemplate, batchRoast, batchInsult);
            userResult.whatsappSent = whatsappResult;
            if (whatsappResult.success) whatsappSentCount++;
          }
        } catch (error: any) {
          userResult.whatsappSent = { success: false, error: error.message };
        }
      } else {
        const reason = !shouldSendWhatsApp ? 'Not time or limit reached' : !user.phoneNumber ? 'No phone number' : 'Limit reached';
        userResult.whatsappSent = { success: false, skipped: true, reason };
      }

      results.push(userResult);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

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
  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
