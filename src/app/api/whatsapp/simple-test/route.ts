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

    // Simple test message
    const testMessage = "Hello from DSA Grinders! This is a test message.";
    
    console.log('Testing with simple approach...');
    console.log('API Key:', apiKey);
    console.log('Phone:', phoneNumber);
    console.log('Message:', testMessage);

    // Try the exact format from documentation
    const formData = new URLSearchParams();
    formData.append('api_key', apiKey);
    formData.append('mobile', phoneNumber);
    formData.append('msg', testMessage);

    console.log('Form data string:', formData.toString());

    const response = await fetch('https://rpayconnect.com/api/send-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Raw response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { rawResponse: responseText };
    }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      data: data,
      rawResponse: responseText,
      requestDetails: {
        url: 'https://rpayconnect.com/api/send-text',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      }
    });

  } catch (error: any) {
    console.error('Simple test error:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});
