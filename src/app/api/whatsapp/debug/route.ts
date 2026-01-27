import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export const POST = requireAuth(async (req, user) => {
  try {
    const { phoneNumber } = await req.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.RPAY_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'RPAY_API_KEY environment variable is not set' },
        { status: 500 }
      );
    }

    // Test with minimal message first
    const testMessage = "Test message from DSA Grinders";
    
    // Try different parameter combinations to see which one works
    const payloads = [
      {
        name: "Payload 1 (number)",
        data: {
          api_key: apiKey,
          number: phoneNumber,
          msg: testMessage,
        }
      },
      {
        name: "Payload 2 (mobile)",
        data: {
          api_key: apiKey,
          mobile: phoneNumber,
          msg: testMessage,
        }
      },
      {
        name: "Payload 3 (phone)",
        data: {
          api_key: apiKey,
          phone: phoneNumber,
          msg: testMessage,
        }
      }
    ];

    const results = [];

    for (const payload of payloads) {
      try {
        console.log(`Testing ${payload.name}:`, payload.data);
        
        const response = await fetch('https://rpayconnect.com/api/send-text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload.data),
        });

        const data = await response.json();
        
        results.push({
          payload: payload.name,
          status: response.status,
          success: response.ok,
          data: data
        });

        console.log(`${payload.name} result:`, {
          status: response.status,
          data: data
        });

        // If this one works, break
        if (response.ok && data.status !== false) {
          break;
        }

      } catch (error: any) {
        results.push({
          payload: payload.name,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      phoneNumber,
      apiKeyConfigured: !!apiKey,
      results
    });

  } catch (error: any) {
    console.error('WhatsApp debug error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
