import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

const ROASTS = [
  "Learn DSA or you'll be delivering food your entire life!",
  "Hey slacker! Close Netflix, open LeetCode! Or stay jobless!",
  "Your friends are joining Google, you're still stuck on Two Sum!",
  "Don't know DSA? No worries, start a food truck business!",
  "Can't solve even one problem? Your luck is terrible dude!",
  "Can't reverse an array? Your life will reverse too!",
  "Bro who is this useless? Study a little bit!",
  "Your struggle story will go viral on LinkedIn... with rejections!",
  "During placement season, even HR will laugh at you!",
  "Don't understand recursion? You're an infinite loop yourself!",
  "Did nothing again today? Your productivity is worse than a pandemic!",
  "Does your resume only have WhatsApp forwarding experience?",
  "Came to be a DSA grinder, became a DSA disgrace!",
];

const INSULTS = [
  "Even low-tier companies will reject you!",
  "Your LeetCode streak makes coding itself cry!",
  "You're so slow, even a turtle would win the race!",
  "Bro you're so weak, can't even run a loop properly!",
  "Your code has so many bugs, you should open a pesticide company!",
];

function getRandomRoast() {
  return ROASTS[Math.floor(Math.random() * ROASTS.length)];
}

function getRandomInsult() {
  return INSULTS[Math.floor(Math.random() * INSULTS.length)];
}

export async function sendDSAReminder(toEmail: string, userName: string) {
  const roast = getRandomRoast();
  const insult = getRandomInsult();

  const mailOptions = {
    from: `"DSA Grinders" <${process.env.SMTP_EMAIL}>`,
    to: toEmail,
    subject: 'Daily Reality Check - Time to Grind DSA',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px;">
        <h1 style="color: #ff4444; text-align: center; font-size: 32px; margin-bottom: 10px;">
          DSA GRINDERS
        </h1>
        <p style="color: #888; text-align: center; font-size: 14px; margin-bottom: 20px;">
          Daily Reality Check for Aspiring Developers
        </p>
        
        <div style="background: rgba(255,80,80,0.15); border: 2px solid rgba(255,80,80,0.4); border-radius: 12px; padding: 24px; margin-bottom: 20px;">
          <h2 style="color: #ff6b6b; text-align: center; font-size: 24px; margin: 0 0 10px 0;">
            ROAST OF THE DAY
          </h2>
          <p style="color: #ff9999; text-align: center; font-size: 18px; margin: 0; font-weight: bold;">
            ${roast}
          </p>
        </div>
        
        <div style="background: rgba(255,165,0,0.1); border: 1px solid rgba(255,165,0,0.3); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <p style="color: #ffa500; text-align: center; font-size: 16px; margin: 0;">
            Bonus Insult: ${insult}
          </p>
        </div>
        
        <p style="color: #e0e0e0; font-size: 16px; text-align: center; line-height: 1.6;">
          Hey <strong style="color: #00d4ff;">${userName}</strong>!<br><br>
          Your competitors are grinding LeetCode right now<br>
          and you're here reading emails?<br><br>
          <strong style="color: #ff6b6b;">Solve one problem first, then do other stuff!</strong>
        </p>
        
        <div style="text-align: center; margin-top: 24px;">
          <a href="https://leetcode.com/problemset/" style="display: inline-block; background: linear-gradient(135deg, #ff4444 0%, #ff6b6b 100%); color: #fff; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 18px; text-transform: uppercase;">
            OPEN LEETCODE NOW
          </a>
        </div>
        
        <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 16px; margin-top: 24px; text-align: center;">
          <p style="color: #ff4444; font-size: 20px; margin: 0; font-weight: bold;">
            LEARN DSA OR YOU WON'T GET A JOB!
          </p>
        </div>
        
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
          <p style="color: #666; font-size: 11px; text-align: center;">
            You're getting this roast because you joined DSA Grinders.<br>
            Now deal with it! No unsubscribe option for the weak!
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error: any) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}
