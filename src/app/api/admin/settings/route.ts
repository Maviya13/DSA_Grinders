import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { Settings } from '@/models/Settings';
import { OPTIMAL_SCHEDULES } from '@/lib/schedule-helper';

// Get current settings
export const GET = requireAdmin(async (req, user) => {
  try {
    await dbConnect();

    // Get or create settings
    let settings = await Settings.findOne({});

    if (!settings) {
      // Create default settings if none exist
      settings = new Settings({});
      await settings.save();
      console.log('Created default settings');
    }

    return NextResponse.json({
      success: true,
      settings: {
        id: settings._id,
        automationEnabled: settings.automationEnabled,
        emailAutomationEnabled: settings.emailAutomationEnabled,
        whatsappAutomationEnabled: settings.whatsappAutomationEnabled,
        dailyEmailTime: settings.dailyEmailTime,
        dailyWhatsappTime: settings.dailyWhatsappTime,
        timezone: settings.timezone,
        maxDailyEmails: settings.maxDailyEmails,
        maxDailyWhatsapp: settings.maxDailyWhatsapp,
        emailsSentToday: settings.emailsSentToday,
        whatsappSentToday: settings.whatsappSentToday,
        lastEmailSent: settings.lastEmailSent,
        lastWhatsappSent: settings.lastWhatsappSent,
        skipWeekends: settings.skipWeekends,
        skipHolidays: settings.skipHolidays,
        customSkipDates: settings.customSkipDates,
        updatedAt: settings.updatedAt
      }
    });

  } catch (error: any) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

// Update settings
export const PUT = requireAdmin(async (req, user) => {
  try {
    const updateData = await req.json();

    await dbConnect();

    // Get or create settings
    let settings = await Settings.findOne({});

    if (!settings) {
      settings = new Settings({});
    }

    // Update fields if provided
    if (updateData.automationEnabled !== undefined) {
      settings.automationEnabled = updateData.automationEnabled;
    }
    if (updateData.emailAutomationEnabled !== undefined) {
      settings.emailAutomationEnabled = updateData.emailAutomationEnabled;
    }
    if (updateData.whatsappAutomationEnabled !== undefined) {
      settings.whatsappAutomationEnabled = updateData.whatsappAutomationEnabled;
    }
    if (updateData.dailyEmailTime) {
      // Validate time format (HH:MM)
      if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(updateData.dailyEmailTime)) {
        return NextResponse.json(
          { error: 'Invalid email time format. Use HH:MM (24-hour format)' },
          { status: 400 }
        );
      }
      settings.dailyEmailTime = updateData.dailyEmailTime;
    }
    if (updateData.dailyWhatsappTime) {
      // Validate time format (HH:MM)
      if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(updateData.dailyWhatsappTime)) {
        return NextResponse.json(
          { error: 'Invalid WhatsApp time format. Use HH:MM (24-hour format)' },
          { status: 400 }
        );
      }
      settings.dailyWhatsappTime = updateData.dailyWhatsappTime;
    }
    if (updateData.timezone) {
      settings.timezone = updateData.timezone;
    }
    if (updateData.maxDailyEmails !== undefined) {
      if (updateData.maxDailyEmails < 0 || updateData.maxDailyEmails > 10) {
        return NextResponse.json(
          { error: 'Max daily emails must be between 0 and 10' },
          { status: 400 }
        );
      }
      settings.maxDailyEmails = updateData.maxDailyEmails;

      // Auto-generate optimal email schedule based on count
      if (updateData.maxDailyEmails > 0 && updateData.maxDailyEmails <= 5) {
        const optimalSchedule = OPTIMAL_SCHEDULES[updateData.maxDailyEmails as keyof typeof OPTIMAL_SCHEDULES];
        if (optimalSchedule) {
          settings.emailSchedule = optimalSchedule.email;
        }
      }
    }
    if (updateData.maxDailyWhatsapp !== undefined) {
      if (updateData.maxDailyWhatsapp < 0 || updateData.maxDailyWhatsapp > 10) {
        return NextResponse.json(
          { error: 'Max daily WhatsApp messages must be between 0 and 10' },
          { status: 400 }
        );
      }
      settings.maxDailyWhatsapp = updateData.maxDailyWhatsapp;

      // Auto-generate optimal WhatsApp schedule based on count
      if (updateData.maxDailyWhatsapp > 0 && updateData.maxDailyWhatsapp <= 5) {
        const optimalSchedule = OPTIMAL_SCHEDULES[updateData.maxDailyWhatsapp as keyof typeof OPTIMAL_SCHEDULES];
        if (optimalSchedule) {
          settings.whatsappSchedule = optimalSchedule.whatsapp;
        }
      }
    }
    if (updateData.skipWeekends !== undefined) {
      settings.skipWeekends = updateData.skipWeekends;
    }
    if (updateData.skipHolidays !== undefined) {
      settings.skipHolidays = updateData.skipHolidays;
    }
    if (updateData.customSkipDates) {
      settings.customSkipDates = updateData.customSkipDates.map((date: string) => new Date(date));
    }

    await settings.save();

    console.log('Admin updated automation settings');

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings: {
        id: settings._id,
        automationEnabled: settings.automationEnabled,
        emailAutomationEnabled: settings.emailAutomationEnabled,
        whatsappAutomationEnabled: settings.whatsappAutomationEnabled,
        dailyEmailTime: settings.dailyEmailTime,
        dailyWhatsappTime: settings.dailyWhatsappTime,
        timezone: settings.timezone,
        maxDailyEmails: settings.maxDailyEmails,
        maxDailyWhatsapp: settings.maxDailyWhatsapp,
        emailsSentToday: settings.emailsSentToday,
        whatsappSentToday: settings.whatsappSentToday,
        lastEmailSent: settings.lastEmailSent,
        lastWhatsappSent: settings.lastWhatsappSent,
        skipWeekends: settings.skipWeekends,
        skipHolidays: settings.skipHolidays,
        customSkipDates: settings.customSkipDates,
        updatedAt: settings.updatedAt
      }
    });

  } catch (error: any) {
    console.error('Settings PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

// Reset daily counters (for testing or manual reset)
export const POST = requireAdmin(async (req, user) => {
  try {
    await dbConnect();

    const settings = await Settings.findOne({});

    if (!settings) {
      return NextResponse.json(
        { error: 'Settings not found' },
        { status: 404 }
      );
    }

    // Reset daily counters
    settings.emailsSentToday = 0;
    settings.whatsappSentToday = 0;
    settings.lastResetDate = new Date();

    await settings.save();

    console.log('Admin reset daily counters');

    return NextResponse.json({
      success: true,
      message: 'Daily counters reset successfully'
    });

  } catch (error: any) {
    console.error('Settings POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});