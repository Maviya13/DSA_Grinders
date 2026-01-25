import nodemailer from 'nodemailer';
import path from 'path';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

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

export async function sendDSAReminder(toEmail: string, userName: string) {
  const roast = getRandomRoast();

  const mailOptions = {
    from: `"DSA Dhurandhar 🔥" <${process.env.SMTP_EMAIL}>`,
    to: toEmail,
    subject: '🚨 OYE NALAYAK! DSA KARLE! - Daily Reality Check',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; background-color: #f9f9f9; border-radius: 10px;">
        <img src="cid:logo" alt="DSA Dhurandhar Logo" style="width: 150px; margin-bottom: 20px;" />
        
        <h2 style="color: #333;">Oye ${userName}! 👋</h2>
        
        <p style="font-size: 18px; color: #555; line-height: 1.6;">
          ${roast}
        </p>
        
        <div style="margin: 30px 0;">
          <a href="https://leetcode.com/problemset/" style="background-color: #ffa116; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
            LEETCODE KHOL ABHI! 🚀
          </a>
        </div>
        
        <p style="font-size: 14px; color: #888;">
          Website: <a href="https://dsa-dhurandhars.vercel.app" style="color: #0070f3;">dsa-dhurandhars.vercel.app</a>
        </p>
        
        <p style="font-size: 12px; color: #aaa; margin-top: 30px;">
          Tu ye mail isiliye padh raha hai kyunki tune sign up kiya tha. Ab bhugat! 😈
        </p>
      </div>
    `,
    attachments: [
      {
        filename: 'logo.png',
        path: path.join(process.cwd(), 'public', 'logo.png'),
        cid: 'logo' // same cid value as in the html img src
      }
    ]
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error: any) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}
