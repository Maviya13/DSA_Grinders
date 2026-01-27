import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { messageTemplates } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

// Default templates
const defaultTemplates = [
  {
    type: 'whatsapp_roast',
    name: 'Daily Roast',
    content: `🔥 *WAKE UP CALL FOR {userName}* 🔥
\n*REALITY CHECK:*
{roast}
\n*HARSH TRUTH:* {insult}
\nListen up *{userName}*! 👂
\nWhile you're scrolling through WhatsApp, your competition is grinding LeetCode problems and getting closer to their dream jobs! 💼
\n⏰ *STOP MAKING EXCUSES!*
⏰ *STOP PROCRASTINATING!*
⏰ *START CODING NOW!*
\n🎯 *TODAY'S MISSION:*
• Solve at least 2 problems
• Focus on Medium difficulty
• Stop checking social media every 5 minutes!
\n🚀 *GET TO WORK:* https://leetcode.com/problemset/
\n*REMEMBER:* Every minute you waste is a minute your competition gets ahead! 
\n*NO EXCUSES. NO SHORTCUTS. JUST GRIND!* 💪
\n---
DSA Grinders - Where weak coders become strong! 💀`,
    variables: ['userName', 'roast', 'insult'],
    isActive: true
  },
  {
    type: 'email_roast',
    name: 'Daily Roast Email',
    subject: 'Daily Reality Check - Time to Grind DSA',
    content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px;">
  <h1 style="color: #ff4444; text-align: center; font-size: 32px; margin-bottom: 10px;">
    DSA GRINDERS
  </h1>
  <p style="color: #888; text-align: center; font-size: 14px; margin-bottom: 20px;">
    Daily Reality Check for Aspiring Developers
  </p>
  
  <div style="background: rgba(255,80,80,0.15); border: 2px solid rgba(255,80,80,0.4); border-radius: 12px; padding: 24px; margin-bottom: 20px;">
    <h2 style="color: #ff6b6b; text-align: center; font-size: 24px; margin: 0 0 10px 0;">
      WAKE UP CALL
    </h2>
    <p style="color: #ff9999; text-align: center; font-size: 18px; margin: 0; font-weight: bold;">
      {roast}
    </p>
  </div>
  
  <div style="background: rgba(255,165,0,0.1); border: 1px solid rgba(255,165,0,0.3); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
    <p style="color: #ffa500; text-align: center; font-size: 16px; margin: 0;">
      Harsh Truth: {insult}
    </p>
  </div>
  
  <p style="color: #e0e0e0; font-size: 16px; text-align: center; line-height: 1.6;">
    Hey <strong style="color: #00d4ff;">{userName}</strong>!<br><br>
    Your competitors are grinding LeetCode right now<br>
    and you're here reading emails?<br><br>
    <strong style="color: #ff6b6b;">Solve one problem first, then do other stuff!</strong>
  </p>
  
  <div style="text-align: center; margin-top: 24px;">
    <a href="https://leetcode.com/problemset/" style="display: inline-block; background: linear-gradient(135deg, #ff4444 0%, #ff6b6b 100%); color: #fff; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 18px; text-transform: uppercase;">
      OPEN LEETCODE NOW
    </a>
  </div>
  
  <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 16px; margin-top: 24px; text-align: center;">
    <p style="color: #ff4444; font-size: 20px; margin: 0; font-weight: bold;">
      LEARN DSA OR YOU WON'T GET A JOB!
    </p>
  </div>
</div>`,
    variables: ['userName', 'roast', 'insult'],
    isActive: true
  }
];

export const GET = requireAdmin(async (req, user) => {
  try {
    // Get all templates
    let templates = await db.select().from(messageTemplates).orderBy(asc(messageTemplates.type), asc(messageTemplates.name));

    // If no templates exist, create default ones
    if (templates.length === 0) {
      templates = await db.insert(messageTemplates).values(defaultTemplates).returning();
    }

    return NextResponse.json({
      templates: templates.map(template => ({
        ...template,
        id: template.id,
      })),
    });
  } catch (error: any) {
    console.error('Admin templates fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

export const POST = requireAdmin(async (req, user) => {
  try {
    const { type, name, subject, content, variables } = await req.json();

    if (!type || !name || !content) {
      return NextResponse.json({ error: 'Type, name, and content are required' }, { status: 400 });
    }

    const [template] = await db.insert(messageTemplates).values({
      type,
      name,
      subject,
      content,
      variables: variables || [],
      isActive: true,
    }).returning();

    return NextResponse.json({
      success: true,
      template: {
        ...template,
        id: template.id,
      },
    });
  } catch (error: any) {
    console.error('Admin template creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

export const PUT = requireAdmin(async (req, user) => {
  try {
    const { id, type, name, subject, content, variables, isActive } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const [template] = await db.update(messageTemplates)
      .set({
        type,
        name,
        subject,
        content,
        variables: variables || [],
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date(),
      })
      .where(eq(messageTemplates.id, id))
      .returning();

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      template: {
        ...template,
        id: template.id,
      },
    });
  } catch (error: any) {
    console.error('Admin template update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
