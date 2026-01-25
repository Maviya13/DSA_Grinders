import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
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

async function sendCustomEmail(toEmail: string, userName: string, subject: string, message: string) {
  const mailOptions = {
    from: `"DSA Grinders" <${process.env.SMTP_EMAIL}>`,
    to: toEmail,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px;">
        <h1 style="color: #00d4ff; text-align: center; font-size: 32px; margin-bottom: 10px;">
          DSA GRINDERS
        </h1>
        <p style="color: #888; text-align: center; font-size: 14px; margin-bottom: 20px;">
          Message from Admin
        </p>
        
        <div style="background: rgba(0,212,255,0.15); border: 2px solid rgba(0,212,255,0.4); border-radius: 12px; padding: 24px; margin-bottom: 20px;">
          <h2 style="color: #00d4ff; text-align: center; font-size: 24px; margin: 0 0 10px 0;">
            ${subject}
          </h2>
        </div>
        
        <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">
            Hey <strong style="color: #00d4ff;">${userName}</strong>!

${message}
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 24px;">
          <a href="https://leetcode.com/problemset/" style="display: inline-block; background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%); color: #fff; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 18px; text-transform: uppercase;">
            OPEN LEETCODE
          </a>
        </div>
        
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
          <p style="color: #666; font-size: 11px; text-align: center;">
            This message was sent by DSA Grinders Admin.<br>
            Keep grinding and stay motivated!
          </p>
        </div>
      </div>
    `,
  };

  try {
    console.log(`Sending custom email to: ${toEmail}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${toEmail}`);
    return { success: true, info };
  } catch (error: any) {
    console.error(`❌ Email send error for ${toEmail}:`, error);
    return { success: false, error: error.message };
  }
}

export const POST = requireAdmin(async (req, user) => {
  try {
    const {
      userIds,
      messageType,
      emailSubject,
      emailMessage,
      whatsappMessage
    } = await req.json();

    if (!userIds || userIds.length === 0) {
      return NextResponse.json(
        { error: 'No users selected' },
        { status: 400 }
      );
    }

    if (!messageType || !['email', 'whatsapp', 'both'].includes(messageType)) {
      return NextResponse.json(
        { error: 'Invalid message type' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Get selected users
    const users = await User.find({ _id: { $in: userIds } }).select('-password');

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'No valid users found' },
        { status: 400 }
      );
    }

    const results = {
      emailsSent: 0,
      emailsFailed: 0,
      whatsappSent: 0,
      whatsappFailed: 0,
      errors: [] as string[],
    };

    // Send messages to each user
    for (const targetUser of users) {
      // Send email
      if (messageType === 'email' || messageType === 'both') {
        try {
          const emailResult = await sendCustomEmail(
            targetUser.email,
            targetUser.name,
            emailSubject,
            emailMessage
          );

          if (emailResult.success) {
            results.emailsSent++;
          } else {
            results.emailsFailed++;
            results.errors.push(`Email failed for ${targetUser.name}: ${emailResult.error}`);
          }
        } catch (error: any) {
          results.emailsFailed++;
          results.errors.push(`Email failed for ${targetUser.name}: ${error.message}`);
        }
      }

      // Send WhatsApp
      if ((messageType === 'whatsapp' || messageType === 'both') && targetUser.phoneNumber) {
        try {
          const whatsappResult = await sendWhatsAppMessage(targetUser.phoneNumber, whatsappMessage);

          if (whatsappResult.success) {
            results.whatsappSent++;
          } else {
            results.whatsappFailed++;
            results.errors.push(`WhatsApp failed for ${targetUser.name}: ${whatsappResult.error}`);
          }
        } catch (error: any) {
          results.whatsappFailed++;
          results.errors.push(`WhatsApp failed for ${targetUser.name}: ${error.message}`);
        }
      } else if ((messageType === 'whatsapp' || messageType === 'both') && !targetUser.phoneNumber) {
        results.whatsappFailed++;
        results.errors.push(`WhatsApp skipped for ${targetUser.name}: No phone number`);
      }
    }

    // Create summary
    const summary = [];
    if (results.emailsSent > 0) summary.push(`${results.emailsSent} emails sent`);
    if (results.emailsFailed > 0) summary.push(`${results.emailsFailed} emails failed`);
    if (results.whatsappSent > 0) summary.push(`${results.whatsappSent} WhatsApp messages sent`);
    if (results.whatsappFailed > 0) summary.push(`${results.whatsappFailed} WhatsApp messages failed`);

    return NextResponse.json({
      success: true,
      results,
      summary: summary.join(', '),
      totalUsers: users.length,
    });

  } catch (error: any) {
    console.error('Admin send messages error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});