const WHATSAPP_API_URL = 'https://rpayconnect.com/api/send-text';

const ROASTS = [
  "Abe gadhe, DSA kar varna Swiggy pe delivery karega zindagi bhar! 🛵",
  "Oye nikamme! Netflix band kar, LeetCode khol! Nahi toh jobless marega! 💀",
  "Tere dost Google join kar rahe, tu abhi bhi Two Sum mein atka hai ullu! 😭",
  "DSA nahi aati? Koi baat nahi, Chai Ka Thela khol le nalayak! ☕",
  "Ek problem bhi solve nahi karta? Teri toh kismat hi kharab hai bhai! 🏫",
  "Array reverse karna nahi aata? Teri life reverse ho jayegi bekaar! 🔄",
  "Bro itna useless kaun hota hai? Thoda toh padhle kamina! 🙈",
  "Teri struggle story LinkedIn pe viral hogi... rejection ke saath! 😅",
  "Placement season mein tujhe dekhke HR log bhi hasenge! 🤣",
  "Recursion samajh nahi aata? Tu khud ek infinite loop hai bc! 🔁",
  "Aaj bhi kuch nahi kiya? Teri productivity toh COVID se bhi zyada khatarnak hai! 🦠",
  "Tere resume mein sirf WhatsApp forward karne ka experience hai kya? 📱",
  "DSA Dhurandhar banne aaya tha, DSA Bekaar ban gaya! 🤡",
];

function getRandomRoast() {
  return ROASTS[Math.floor(Math.random() * ROASTS.length)];
}

export async function sendDSAWhatsAppReminder(phoneNumber: string, userName: string) {
  const roast = getRandomRoast();

  // Short, funny message with LeetCode and Website links
  const message = `🔥 *Oye ${userName}!* 🔥

${roast}

💻 *LeetCode:* https://leetcode.com/problemset/
🌐 *Website:* https://dsa-dhurandhars.vercel.app

Padh le bhai, mauka hai! 🚀`;

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

    console.log('Sending WhatsApp msg to:', cleanPhoneNumber);

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