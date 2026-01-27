const WHATSAPP_API_URL = 'https://rpayconnect.com/api/send-text';

export async function sendDSAWhatsAppReminder(phoneNumber: string, userName: string) {
  // Simple message with LeetCode and Website links
  const message = `🔥 *Oye ${userName}!* 🔥\n\nIt's time to grind some DSA problems!\n\n💻 LeetCode: https://leetcode.com/problemset/\n🌐 Website: https://dsa-grinders.vercel.app\n\nPadh le bhai, mauka hai! 🚀`;

  const apiKey = process.env.RPAY_API_KEY;

  if (!apiKey) {
    console.error('RPAY_API_KEY environment variable is not set');
    return { success: false, error: 'WhatsApp API key is not configured' };
  }

  try {
    const cleanPhoneNumber = phoneNumber.replace(/[\+\s-]/g, '');
    const url = new URL(WHATSAPP_API_URL);
    url.searchParams.append('api_key', apiKey);
    url.searchParams.append('number', cleanPhoneNumber);
    url.searchParams.append('msg', message);

    const response = await fetch(url.toString(), { method: 'GET' });
    const data = await response.json();

    if (!response.ok || data.status === false) {
      throw new Error(data.message || 'WhatsApp API error');
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('WhatsApp send error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendWhatsAppMessage(phoneNumber: string, message: string) {
  const apiKey = process.env.RPAY_API_KEY;

  if (!apiKey) {
    console.error('RPAY_API_KEY environment variable is not set');
    return { success: false, error: 'WhatsApp API key is not configured' };
  }

  try {
    const cleanPhoneNumber = phoneNumber.replace(/[\+\s-]/g, '');
    const url = new URL(WHATSAPP_API_URL);
    url.searchParams.append('api_key', apiKey);
    url.searchParams.append('number', cleanPhoneNumber);
    url.searchParams.append('msg', message);

    const response = await fetch(url.toString(), { method: 'GET' });
    const data = await response.json();

    if (!response.ok || data.status === false) {
      throw new Error(data.message || 'WhatsApp API error');
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('WhatsApp send error:', error);
    return { success: false, error: error.message };
  }
}
