import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import nodemailer from 'nodemailer';

// Simple admin check
function isAdmin(user: any): boolean {
  return user.role === 'admin';
}

export const POST = requireAuth(async (req, user) => {
  try {
    // Check if user is admin
    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check environment variables
    const envCheck = {
      SMTP_EMAIL: process.env.SMTP_EMAIL,
      SMTP_PASSWORD: !!process.env.SMTP_PASSWORD,
      SMTP_PASSWORD_LENGTH: process.env.SMTP_PASSWORD?.length || 0
    };

    console.log('Email environment check:', envCheck);

    // Create transporter with detailed logging
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
      debug: true, // Enable debug logging
      logger: true // Enable logger
    });

    // Verify transporter configuration
    try {
      await transporter.verify();
      console.log('✅ SMTP connection verified successfully');
    } catch (verifyError: any) {
      console.error('❌ SMTP verification failed:', verifyError);
      return NextResponse.json({
        error: 'SMTP configuration error',
        details: verifyError.message,
        envCheck
      }, { status: 500 });
    }

    const testMessage = {
      from: `"DSA Grinders Test" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: `Test Email - ${new Date().toLocaleString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; border-radius: 8px;">
          <h1 style="color: #333; text-align: center;">DSA Grinders - Email Test</h1>
          <p style="color: #666; text-align: center;">This is a test email to verify SMTP configuration.</p>
          <div style="background: #e8f5e8; border: 1px solid #4caf50; border-radius: 4px; padding: 16px; margin: 20px 0;">
            <p style="color: #2e7d32; margin: 0; text-align: center;">
              ✅ If you received this email, the SMTP configuration is working correctly!
            </p>
          </div>
          <p style="color: #999; font-size: 12px; text-align: center;">
            Sent at: ${new Date().toISOString()}<br>
            From: ${process.env.SMTP_EMAIL}
          </p>
        </div>
      `,
    };

    console.log('Sending test email to:', email);
    console.log('From:', process.env.SMTP_EMAIL);

    const info = await transporter.sendMail(testMessage);

    console.log('✅ Test email sent successfully:', info.messageId);
    console.log('Email info:', {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected
    });

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      details: {
        messageId: info.messageId,
        response: info.response,
        accepted: info.accepted,
        rejected: info.rejected,
        to: email,
        from: process.env.SMTP_EMAIL
      },
      envCheck
    });

  } catch (error: any) {
    console.error('❌ Test email error:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
      envCheck: {
        SMTP_EMAIL: process.env.SMTP_EMAIL,
        SMTP_PASSWORD: !!process.env.SMTP_PASSWORD,
        SMTP_PASSWORD_LENGTH: process.env.SMTP_PASSWORD?.length || 0
      }
    }, { status: 500 });
  }
});
