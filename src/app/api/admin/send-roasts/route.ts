import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { users as usersTable, messageTemplates } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
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

// Replace template variables
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
    from: `"DSA Grinders 🔥" <${process.env.SMTP_EMAIL}>`,
    to: user.email,
    subject: subject,
    html: content,
  };
  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function sendTemplatedWhatsApp(user: any, template: any, roast: string, insult: string) {
  const content = replaceTemplateVariables(template.content, user, roast, insult);
  try {
    return await sendWhatsAppMessage(user.phoneNumber, content);
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export const POST = requireAdmin(async (req, user) => {
  try {
    // Get active templates
    const [whatsappTemplate] = await db.select().from(messageTemplates).where(and(eq(messageTemplates.type, 'whatsapp_roast'), eq(messageTemplates.isActive, true))).limit(1);
    const [emailTemplate] = await db.select().from(messageTemplates).where(and(eq(messageTemplates.type, 'email_roast'), eq(messageTemplates.isActive, true))).limit(1);

    // Get all users
    const allUsers = await db.select().from(usersTable);

    const results = {
      emailsSent: 0,
      emailsFailed: 0,
      whatsappSent: 0,
      whatsappFailed: 0,
      whatsappSkipped: 0,
      errors: [] as string[],
    };

    const batchRoast = '';
    const batchInsult = '';

    for (const targetUser of allUsers) {
      try {
        if (emailTemplate) {
          const emailResult = await sendTemplatedEmail(targetUser, emailTemplate, batchRoast, batchInsult);
          if (emailResult.success) results.emailsSent++;
          else results.emailsFailed++;
        }
      } catch (error: any) {
        results.emailsFailed++;
      }

      if (targetUser.phoneNumber && targetUser.phoneNumber.trim()) {
        try {
          if (whatsappTemplate) {
            const whatsappResult = await sendTemplatedWhatsApp(targetUser, whatsappTemplate, batchRoast, batchInsult);
            if (whatsappResult.success) results.whatsappSent++;
            else results.whatsappFailed++;
          }
        } catch (error: any) {
          results.whatsappFailed++;
        }
      } else {
        results.whatsappSkipped++;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return NextResponse.json({
      success: true,
      results,
      totalUsers: allUsers.length,
    });
  } catch (error: any) {
    console.error('Admin send roasts error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
