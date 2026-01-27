import { NextResponse } from 'next/server';
import { sendDSAWhatsAppReminder, sendWhatsAppMessage } from '@/lib/whatsapp';
import { requireAuth } from '@/lib/auth';

export const POST = requireAuth(async (req, user) => {
  try {
    const { phoneNumber, message, userName, type = 'custom' } = await req.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    let result;
    
    if (type === 'roast') {
      // Send DSA roast message
      const name = userName || user.name;
      result = await sendDSAWhatsAppReminder(phoneNumber, name);
    } else {
      // Send custom message
      if (!message) {
        return NextResponse.json(
          { error: 'Message is required for custom type' },
          { status: 400 }
        );
      }
      result = await sendWhatsAppMessage(phoneNumber, message);
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'WhatsApp message sent successfully',
        data: result.data,
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('WhatsApp send error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
