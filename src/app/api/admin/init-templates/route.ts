import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { messageTemplates } from '@/db/schema';
import { inArray } from 'drizzle-orm';

// Default templates - Minimalist for initialization
const defaultTemplates = [
  {
    type: 'whatsapp_roast',
    name: 'Daily Roast',
    content: `🔥 *Oye {userName}!* 🔥\n\n{roast}\n\n*Reality Check:* {insult}\n\n💻 LeetCode: https://leetcode.com/problemset/\n🌐 Website: https://dsa-grinders.vercel.app\n\nPadh le bhai, mauka hai! 🚀\n---\nDSA Dhurandhars 💀`,
    variables: ['userName', 'roast', 'insult'],
    isActive: true
  },
  {
    type: 'email_roast',
    name: 'Daily Roast Email',
    subject: 'Reality Check for {userName} 🤡',
    content: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 20px auto; padding: 30px; border: 1px solid #eee; border-radius: 10px; color: #333;">
  <h2 style="color: #d32f2f; margin-top: 0;">Daily Reality Check, {userName} 🤡</h2>
  <p style="font-size: 18px; line-height: 1.5; background: #fff5f5; padding: 15px; border-left: 5px solid #ff5252; border-radius: 4px;">"{roast}"</p>
  <p style="color: #666; font-style: italic; margin-bottom: 25px;"><strong>Harsh Truth:</strong> {insult}</p>
  <p style="margin-bottom: 25px;">Your rivals are currently solving Hard problems on LeetCode while you're reading this. It's time to stop being a slacker and get to work.</p>
  <div style="text-align: center; margin: 35px 0;"><a href="https://leetcode.com/problemset/" style="background-color: #212121; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Solve Problems Now</a></div>
  <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0;">
  <p style="font-size: 12px; color: #999; text-align: center;">Check your progress: <a href="https://dsa-grinders.vercel.app" style="color: #d32f2f; text-decoration: none;">dsa-grinders.vercel.app</a><br>Keep grinding. Or don't. See if we care.</p>
</div>`,
    variables: ['userName', 'roast', 'insult'],
    isActive: true
  }
];

export const POST = requireAdmin(async (req) => {
  try {
    // Check if templates already exist
    const existingTemplates = await db.select()
      .from(messageTemplates)
      .where(inArray(messageTemplates.type, ['whatsapp_roast', 'email_roast']));

    if (existingTemplates.length > 0) {
      return NextResponse.json({
        message: 'Templates already exist',
        existing: existingTemplates.length,
        templates: existingTemplates.map(t => ({ type: t.type, name: t.name }))
      });
    }

    // Create default templates
    const createdTemplates = await db.insert(messageTemplates).values(defaultTemplates).returning();

    return NextResponse.json({
      success: true,
      message: 'Default templates created successfully',
      created: createdTemplates.length
    });

  } catch (error: any) {
    console.error('Template initialization error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
