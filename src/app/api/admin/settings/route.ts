import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { settings as settingsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { OPTIMAL_SCHEDULES } from '@/lib/schedule-helper';

// Get current settings
export const GET = requireAdmin(async (req, user) => {
  try {
    let [settings] = await db.select().from(settingsTable).limit(1);

    if (!settings) {
      [settings] = await db.insert(settingsTable).values({}).returning();
      console.log('Created default settings');
    }

    // Bridging old fields for frontend compatibility if needed
    const emailSchedule = settings.emailSchedule as string[] || ['09:00'];
    const whatsappSchedule = settings.whatsappSchedule as string[] || ['09:30'];

    return NextResponse.json({
      success: true,
      settings: {
        ...settings,
        dailyEmailTime: emailSchedule[0],
        dailyWhatsappTime: whatsappSchedule[0],
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

    let [settings] = await db.select().from(settingsTable).limit(1);
    if (!settings) {
      [settings] = await db.insert(settingsTable).values({}).returning();
    }

    const updatePayload: any = {};

    if (updateData.automationEnabled !== undefined) updatePayload.automationEnabled = updateData.automationEnabled;
    if (updateData.emailAutomationEnabled !== undefined) updatePayload.emailAutomationEnabled = updateData.emailAutomationEnabled;
    if (updateData.whatsappAutomationEnabled !== undefined) updatePayload.whatsappAutomationEnabled = updateData.whatsappAutomationEnabled;

    if (updateData.dailyEmailTime) {
      if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(updateData.dailyEmailTime)) {
        return NextResponse.json({ error: 'Invalid email time format' }, { status: 400 });
      }
      updatePayload.emailSchedule = [updateData.dailyEmailTime];
    }

    if (updateData.dailyWhatsappTime) {
      if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(updateData.dailyWhatsappTime)) {
        return NextResponse.json({ error: 'Invalid WhatsApp time format' }, { status: 400 });
      }
      updatePayload.whatsappSchedule = [updateData.dailyWhatsappTime];
    }

    if (updateData.timezone) updatePayload.timezone = updateData.timezone;

    if (updateData.maxDailyEmails !== undefined) {
      updatePayload.maxDailyEmails = updateData.maxDailyEmails;
      if (updateData.maxDailyEmails > 0 && updateData.maxDailyEmails <= 5) {
        const optimal = OPTIMAL_SCHEDULES[updateData.maxDailyEmails as keyof typeof OPTIMAL_SCHEDULES];
        if (optimal) updatePayload.emailSchedule = optimal.email;
      }
    }

    if (updateData.maxDailyWhatsapp !== undefined) {
      updatePayload.maxDailyWhatsapp = updateData.maxDailyWhatsapp;
      if (updateData.maxDailyWhatsapp > 0 && updateData.maxDailyWhatsapp <= 5) {
        const optimal = OPTIMAL_SCHEDULES[updateData.maxDailyWhatsapp as keyof typeof OPTIMAL_SCHEDULES];
        if (optimal) updatePayload.whatsappSchedule = optimal.whatsapp;
      }
    }

    if (updateData.skipWeekends !== undefined) updatePayload.skipWeekends = updateData.skipWeekends;
    if (updateData.skipHolidays !== undefined) updatePayload.skipHolidays = updateData.skipHolidays;
    if (updateData.customSkipDates) updatePayload.customSkipDates = updateData.customSkipDates.map((d: string) => new Date(d));

    const [updatedSettings] = await db.update(settingsTable)
      .set({ ...updatePayload, updatedAt: new Date() })
      .where(eq(settingsTable.id, settings.id))
      .returning();

    const emailSchedule = updatedSettings.emailSchedule as string[] || [];
    const whatsappSchedule = updatedSettings.whatsappSchedule as string[] || [];

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings: {
        ...updatedSettings,
        dailyEmailTime: emailSchedule[0] || '09:00',
        dailyWhatsappTime: whatsappSchedule[0] || '09:30',
      }
    });

  } catch (error: any) {
    console.error('Settings PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

// Reset daily counters
export const POST = requireAdmin(async (req, user) => {
  try {
    const [settings] = await db.select().from(settingsTable).limit(1);
    if (!settings) return NextResponse.json({ error: 'Settings not found' }, { status: 404 });

    await db.update(settingsTable)
      .set({
        emailsSentToday: 0,
        whatsappSentToday: 0,
        lastResetDate: new Date(),
      })
      .where(eq(settingsTable.id, settings.id));

    return NextResponse.json({
      success: true,
      message: 'Daily counters reset successfully'
    });
  } catch (error: any) {
    console.error('Settings POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
