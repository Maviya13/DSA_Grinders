import { NextResponse } from 'next/server';
import { sendDSAWhatsAppReminder, sendWhatsAppMessage } from '@/lib/whatsapp';
import { requireAuth } from '@/lib/auth';

export const POST = requireAuth(async (req, user) => {
  try {
    const { phoneNumber, type = 'roast', message } = await req.json();

    console.log('WhatsApp test request:', {
      phoneNumber,
      type,
      userName: user.name,
      hasApiKey: !!process.env.RPAY_API_KEY
    });

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    if (!process.env.RPAY_API_KEY) {
      return NextResponse.json(
        { error: 'WhatsApp API key is not configured. Please set RPAY_API_KEY in environment variables.' },
        { status: 500 }
      );
    }

    let result;
    
    if (type === 'roast') {
      // Send DSA roast message
      result = await sendDSAWhatsAppReminder(phoneNumber, user.name);
    } else if (type === 'custom' && message) {
      // Send custom message
      result = await sendWhatsAppMessage(phoneNumber, message);
    } else {
      return NextResponse.json(
        { error: 'Invalid type or missing message for custom type' },
        { status: 400 }
      );
    }

    console.log('WhatsApp test result:', result);

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'WhatsApp message sent successfully' : 'Failed to send WhatsApp message',
      data: result.data,
      error: result.error,
    });
  } catch (error: any) {
    console.error('WhatsApp test error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
