import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { MessageTemplate } from '@/models/MessageTemplate';
import { Settings } from '@/models/Settings';
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

// Roasts and insults arrays (fallback if templates don't exist)
const ROASTS = [
  "Learn DSA or you'll be delivering food your entire life!",
  "Hey slacker! Close Netflix, open LeetCode! Or stay jobless!",
  "Your friends are joining Google, you're still stuck on Two Sum!",
  "Don't know DSA? No worries, start a food truck business!",
  "Can't solve even one problem? Your luck is terrible dude!",
  "Can't reverse an array? Your life will reverse too!",
  "Bro who is this useless? Study a little bit!",
  "Your struggle story will go viral on LinkedIn... with rejections!",
  "During placement season, even HR will laugh at you!",
  "Don't understand recursion? You're an infinite loop yourself!",
  "Did nothing again today? Your productivity is worse than a pandemic!",
  "Does your resume only have WhatsApp forwarding experience?",
  "Came to be a DSA grinder, became a DSA disgrace!",
];

const INSULTS = [
  "Even low-tier companies will reject you!",
  "Your LeetCode streak makes coding itself cry!",
  "You're so slow, even a turtle would win the race!",
  "Bro you're so weak, can't even run a loop properly!",
  "Your code has so many bugs, you should open a pesticide company!",
];

function getRandomRoast() {
  return ROASTS[Math.floor(Math.random() * ROASTS.length)];
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

// Helper function to check if today should be skipped
function shouldSkipToday(settings: any): boolean {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday

  // Skip weekends if enabled
  if (settings.skipWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
    return true;
  }

  // Check custom skip dates
  const today = now.toDateString();
  if (settings.customSkipDates && settings.customSkipDates.some((date: Date) =>
    new Date(date).toDateString() === today
  )) {
    return true;
  }

  return false;
}

// Helper function to reset daily counters if needed
async function resetDailyCountersIfNeeded(settings: any): Promise<any> {
  const now = new Date();
  const lastReset = new Date(settings.lastResetDate);

  // Check if it's a new day
  if (now.toDateString() !== lastReset.toDateString()) {
    settings.emailsSentToday = 0;
    settings.whatsappSentToday = 0;
    settings.lastResetDate = now;
    await settings.save();
    console.log('Daily counters reset for new day');
  }

  return settings;
}

function getRandomInsult() {
  return INSULTS[Math.floor(Math.random() * INSULTS.length)];
}

// Replace template variables with actual values
function replaceTemplateVariables(content: string, user: any, roast?: string, insult?: string): string {
  return content
    .replace(/\{userName\}/g, user.name)
    .replace(/\{email\}/g, user.email)
    .replace(/\{leetcodeUsername\}/g, user.leetcodeUsername)
    .replace(/\{roast\}/g, roast || getRandomRoast())
    .replace(/\{insult\}/g, insult || getRandomInsult());
}

async function sendTemplatedEmail(user: any, template: any, roast: string, insult: string) {
  const subject = replaceTemplateVariables(template.subject || 'DSA Grinders - Daily Reminder', user, roast, insult);
  const content = replaceTemplateVariables(template.content, user, roast, insult);

  const mailOptions = {
    from: `"DSA Grinders" <admin@dsagrinders.com>`,
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
  // Auth check using CRON_SECRET - works with any external cron service (cron-job.org, easycron, etc.)
  const authHeader = req.headers.get('authorization');

  // Check for CRON_SECRET in Authorization header (Bearer token)
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
    await dbConnect();

    // Get automation settings
    let settings = await Settings.findOne({});
    if (!settings) {
      // Create default settings if none exist
      settings = new Settings({});
      await settings.save();
      console.log('Created default automation settings');
    }

    // Handle migration from old format to new format
    if (!settings.emailSchedule || settings.emailSchedule.length === 0) {
      settings.emailSchedule = ["09:00"];
      console.log('🔄 Migrated emailSchedule to new format');
    }
    if (!settings.whatsappSchedule || settings.whatsappSchedule.length === 0) {
      settings.whatsappSchedule = ["09:30"];
      console.log('🔄 Migrated whatsappSchedule to new format');
    }

    // Save migration changes
    await settings.save();

    // Reset daily counters if needed
    settings = await resetDailyCountersIfNeeded(settings);

    // Development mode check (for testing)
    const isDevelopment = process.env.NODE_ENV === 'development' ||
      req.headers.get('x-development-mode') === 'true';

    console.log('Cron job started - Settings check:', {
      automationEnabled: settings.automationEnabled,
      emailAutomationEnabled: settings.emailAutomationEnabled,
      whatsappAutomationEnabled: settings.whatsappAutomationEnabled,
      emailSchedule: settings.emailSchedule,
      whatsappSchedule: settings.whatsappSchedule,
      emailsSentToday: settings.emailsSentToday,
      whatsappSentToday: settings.whatsappSentToday,
      maxDailyEmails: settings.maxDailyEmails,
      maxDailyWhatsapp: settings.maxDailyWhatsapp,
      isDevelopment
    });

    // Check if automation is enabled
    if (!settings.automationEnabled) {
      console.log('Automation is disabled - skipping cron job');
      return NextResponse.json({
        message: 'Automation disabled',
        automationEnabled: false
      });
    }

    // Check if today should be skipped
    if (shouldSkipToday(settings)) {
      console.log('Skipping today due to settings (weekend/holiday)');
      return NextResponse.json({
        message: 'Day skipped due to settings',
        skipped: true
      });
    }

    // Check if it's time to send emails
    const shouldSendEmails = settings.emailAutomationEnabled &&
      isTimeToSend(settings.emailSchedule, settings.timezone, isDevelopment) &&
      settings.emailsSentToday < settings.maxDailyEmails;

    // Check if it's time to send WhatsApp messages
    const shouldSendWhatsApp = settings.whatsappAutomationEnabled &&
      isTimeToSend(settings.whatsappSchedule, settings.timezone, isDevelopment) &&
      settings.whatsappSentToday < settings.maxDailyWhatsapp;

    console.log('Timing check:', {
      shouldSendEmails,
      shouldSendWhatsApp,
      currentTime: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
      emailSchedule: settings.emailSchedule,
      whatsappSchedule: settings.whatsappSchedule,
      emailsSentToday: settings.emailsSentToday,
      whatsappSentToday: settings.whatsappSentToday,
      maxDailyEmails: settings.maxDailyEmails,
      maxDailyWhatsapp: settings.maxDailyWhatsapp
    });

    // If neither should be sent, exit early
    if (!shouldSendEmails && !shouldSendWhatsApp) {
      return NextResponse.json({
        message: 'Not time to send messages or daily limits reached',
        shouldSendEmails,
        shouldSendWhatsApp,
        currentTime: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
        emailSchedule: settings.emailSchedule,
        whatsappSchedule: settings.whatsappSchedule
      });
    }

    // Get active templates
    const whatsappTemplate = await MessageTemplate.findOne({
      type: 'whatsapp_roast',
      isActive: true
    });
    const emailTemplate = await MessageTemplate.findOne({
      type: 'email_roast',
      isActive: true
    });

    console.log('Templates loaded:', {
      whatsappTemplate: !!whatsappTemplate,
      emailTemplate: !!emailTemplate
    });

    // Exclude admin accounts from cron job
    const adminEmails = ['admin@dsagrinders.com'];
    const users = await User.find({
      email: { $nin: adminEmails }
    });

    const results = [];
    let emailsSentCount = 0;
    let whatsappSentCount = 0;

    // Generate random roast and insult for this batch (same for all users)
    const batchRoast = getRandomRoast();
    const batchInsult = getRandomInsult();

    console.log(`Processing ${users.length} users - Batch roast: ${batchRoast.substring(0, 50)}...`);

    for (const user of users) {
      const userResult: any = {
        username: user.leetcodeUsername,
        email: user.email,
        phoneNumber: user.phoneNumber || null,
        statsUpdate: { success: false },
        emailSent: { success: false, skipped: false },
        whatsappSent: { success: false, skipped: false }
      };

      // Update LeetCode stats (always do this)
      try {
        await updateDailyStatsForUser(user._id, user.leetcodeUsername);
        userResult.statsUpdate = { success: true };
      } catch (error: any) {
        userResult.statsUpdate = { success: false, error: error.message };
      }

      // Send email reminder if it's time and under limit
      if (shouldSendEmails && emailsSentCount < settings.maxDailyEmails) {
        try {
          if (emailTemplate) {
            const emailResult = await sendTemplatedEmail(user, emailTemplate, batchRoast, batchInsult);
            userResult.emailSent = emailResult;
            if (emailResult.success) {
              emailsSentCount++;
            }
          } else {
            // Fallback to original email function if no template
            const { sendDSAReminder } = await import('@/lib/email');
            const emailResult = await sendDSAReminder(user.email, user.name);
            userResult.emailSent = emailResult;
            if (emailResult.success) {
              emailsSentCount++;
            }
          }
        } catch (error: any) {
          userResult.emailSent = { success: false, error: error.message };
        }
      } else {
        userResult.emailSent = { success: false, skipped: true, reason: 'Not time or limit reached' };
      }

      // Send WhatsApp reminder if it's time, under limit, and user has phone number
      if (shouldSendWhatsApp && whatsappSentCount < settings.maxDailyWhatsapp && user.phoneNumber) {
        try {
          if (whatsappTemplate) {
            const whatsappResult = await sendTemplatedWhatsApp(user, whatsappTemplate, batchRoast, batchInsult);
            userResult.whatsappSent = whatsappResult;
            if (whatsappResult.success) {
              whatsappSentCount++;
            }
          } else {
            // Fallback to original WhatsApp function if no template
            const { sendDSAWhatsAppReminder } = await import('@/lib/whatsapp');
            const whatsappResult = await sendDSAWhatsAppReminder(user.phoneNumber, user.name);
            userResult.whatsappSent = whatsappResult;
            if (whatsappResult.success) {
              whatsappSentCount++;
            }
          }
        } catch (error: any) {
          userResult.whatsappSent = { success: false, error: error.message };
        }
      } else {
        const reason = !shouldSendWhatsApp ? 'Not time or limit reached' :
          !user.phoneNumber ? 'No phone number' : 'Unknown';
        userResult.whatsappSent = { success: false, skipped: true, reason };
      }

      results.push(userResult);

      // Small delay to avoid overwhelming the APIs
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Update settings with new counts
    settings.emailsSentToday += emailsSentCount;
    settings.whatsappSentToday += whatsappSentCount;
    if (emailsSentCount > 0) settings.lastEmailSent = new Date();
    if (whatsappSentCount > 0) settings.lastWhatsappSent = new Date();
    await settings.save();

    // Calculate summary
    const summary = {
      totalUsers: users.length,
      statsUpdated: results.filter(r => r.statsUpdate.success).length,
      emailsSent: emailsSentCount,
      whatsappSent: whatsappSentCount,
      emailsSkipped: results.filter(r => r.emailSent.skipped).length,
      whatsappSkipped: results.filter(r => r.whatsappSent.skipped).length,
      dailyTotals: {
        emailsSentToday: settings.emailsSentToday,
        whatsappSentToday: settings.whatsappSentToday,
        maxDailyEmails: settings.maxDailyEmails,
        maxDailyWhatsapp: settings.maxDailyWhatsapp
      },
      usedTemplates: {
        whatsapp: !!whatsappTemplate,
        email: !!emailTemplate
      }
    };

    console.log('Cron job completed:', summary);

    return NextResponse.json({
      message: 'Cron job completed successfully',
      summary,
      settings: {
        automationEnabled: settings.automationEnabled,
        emailAutomationEnabled: settings.emailAutomationEnabled,
        whatsappAutomationEnabled: settings.whatsappAutomationEnabled,
        emailSchedule: settings.emailSchedule,
        whatsappSchedule: settings.whatsappSchedule
      },
      templatesUsed: {
        whatsapp: whatsappTemplate?.name || 'fallback',
        email: emailTemplate?.name || 'fallback'
      },
      results: results.slice(0, 5) // Only return first 5 results to avoid large response
    });
  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
