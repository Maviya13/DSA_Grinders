

export const ROASTS = [
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
  "Did you solve anything today or just scrolling?",
  "Your competitors are grinding right now. What are you doing?",
  "That 0 points is making recruiters cry!",
  "Bro solve at least one problem, need to impress that recruiter!",
  "Sitting idle? Try that graph question!",
  "Your struggle story will go viral on LinkedIn... for the wrong reasons!",
  "Can't even do Two Sum? Maybe engineering isn't for you!",
];

export const INSULTS = [
  "You're not just behind, you're in a completely different race.",
  "Your LinkedIn says 'Open to Work' but your LeetCode says 'Never Worked'.",
  "Even ChatGPT can't help someone who doesn't try.",
  "Your future self will be very disappointed.",
  "The only thing consistent about you is your inconsistency.",
  "Your competition thanks you for not showing up.",
  "Dreams don't work unless you do.",
  "You're not lazy, you're just on energy-saving mode... permanently.",
];

export function getRandomRoast(): string {
  return ROASTS[Math.floor(Math.random() * ROASTS.length)];
}

export function getRandomInsult(): string {
  return INSULTS[Math.floor(Math.random() * INSULTS.length)];
}

export function getWhatsAppMessage(userName: string, roast?: string, insult?: string, fullMessage?: string): string {
  if (fullMessage) {
    return `${fullMessage}\n\n— DSA Grinders Team`;
  }

  const r = roast || getRandomRoast();
  const i = insult || getRandomInsult();

  return `🔥 *Wake up, ${userName}!*

${r}

${i}

Stop scrolling. Start coding. Your competitors aren't waiting.

*Goal:* 2+ Medium problems today 💪

— DSA Grinders Team`;
}

const EMAIL_STYLE = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { 
    margin: 0; 
    padding: 0; 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif; 
    background-color: #f9fafb;
    color: #111827; 
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  .email-wrapper { 
    padding: 40px 20px; 
  }
  .email-container { 
    max-width: 600px; 
    margin: 0 auto; 
    background-color: #ffffff; 
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }
  
  /* Header */
  .email-header {
    padding: 32px 40px;
    border-bottom: 1px solid #e5e7eb;
  }
  .logo-text { 
    font-size: 13px; 
    font-weight: 700; 
    color: #6b7280;
    text-transform: uppercase; 
    letter-spacing: 0.05em;
  }
  
  /* Content */
  .email-content { 
    padding: 40px; 
  }
  .greeting { 
    font-size: 24px; 
    font-weight: 700; 
    color: #111827;
    margin-bottom: 24px;
    line-height: 1.3;
  }
  .greeting-name {
    color: #3b82f6;
  }
  
  /* Roast Box */
  .roast-box { 
    background-color: #fef2f2;
    border-left: 3px solid #ef4444;
    padding: 20px 24px;
    margin-bottom: 32px;
    border-radius: 4px;
  }
  .roast-text { 
    margin: 0; 
    font-size: 16px; 
    color: #991b1b; 
    font-weight: 600;
    line-height: 1.6;
  }
  
  /* Message Box */
  .message-box {
    background-color: #f9fafb;
    padding: 20px 24px;
    border-radius: 4px;
    margin-bottom: 24px;
  }
  .message-text { 
    font-size: 15px; 
    color: #4b5563;
    margin: 0;
    line-height: 1.6;
  }
  
  /* Truth Section */
  .truth-section {
    margin-bottom: 32px;
    padding: 16px 0;
  }
  .truth-label { 
    font-size: 12px; 
    font-weight: 600; 
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 8px;
  }
  .truth-text { 
    font-size: 15px; 
    color: #374151;
    font-style: italic;
    margin: 0;
  }
  
  /* Stats */
  .stats-grid {
    display: table;
    width: 100%;
    margin-bottom: 32px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    overflow: hidden;
  }
  .stats-row {
    display: table-row;
  }
  .stat-cell {
    display: table-cell;
    padding: 16px;
    text-align: center;
    border-right: 1px solid #e5e7eb;
    background-color: #fafafa;
  }
  .stat-cell:last-child {
    border-right: none;
  }
  .stat-label {
    font-size: 11px;
    font-weight: 600;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: block;
    margin-bottom: 6px;
  }
  .stat-value {
    font-size: 20px;
    font-weight: 700;
    color: #111827;
  }
  
  /* Buttons */
  .button-group {
    margin-bottom: 24px;
  }
  .btn { 
    display: inline-block;
    padding: 12px 24px;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    border-radius: 6px;
    text-align: center;
    margin-right: 12px;
    margin-bottom: 12px;
  }
  .btn-primary {
    background-color: #3b82f6;
    color: #ffffff;
  }
  .btn-secondary {
    background-color: #ffffff;
    color: #3b82f6;
    border: 1px solid #3b82f6;
  }
  
  /* Footer */
  .email-footer { 
    padding: 32px 40px;
    text-align: center;
    background-color: #f9fafb;
    border-top: 1px solid #e5e7eb;
  }
  .footer-text {
    font-size: 13px;
    color: #6b7280;
    margin-bottom: 12px;
  }
  .footer-links {
    font-size: 12px;
    color: #9ca3af;
  }
  .footer-link {
    color: #3b82f6;
    text-decoration: none;
  }
  
  /* Mobile */
  @media only screen and (max-width: 600px) {
    .email-wrapper { padding: 20px 10px; }
    .email-content { padding: 32px 24px; }
    .email-header { padding: 24px; }
    .email-footer { padding: 24px; }
    .greeting { font-size: 20px; }
    .stats-grid { display: block; }
    .stats-row { display: block; }
    .stat-cell { 
      display: block; 
      border-right: none;
      border-bottom: 1px solid #e5e7eb;
    }
    .stat-cell:last-child {
      border-bottom: none;
    }
    .btn {
      display: block;
      margin-right: 0;
      width: 100%;
    }
  }
`;

export function getEmailHTML(userName: string, roast?: string, insult?: string, fullMessage?: string): string {
  const r = roast || getRandomRoast();
  const i = insult || getRandomInsult();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>DSA Grinders - Daily Reminder</title>
  <style>${EMAIL_STYLE}</style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <!-- Header -->
      <div class="email-header">
        <div class="logo-text">DSA Grinders</div>
      </div>
      
      <!-- Content -->
      <div class="email-content">
        ${!fullMessage ? `
        <h1 class="greeting">
          Hey <span class="greeting-name">${userName}</span> 👋
        </h1>
        ` : ''}
        
        <!-- Roast -->
        <div class="roast-box">
          <p class="roast-text">${fullMessage || r}</p>
        </div>
        
        ${!fullMessage ? `
        <!-- Message -->
        <div class="message-box">
          <p class="message-text">
            Your competitors are grinding right now. Every minute counts when you're preparing for your dream job.
          </p>
        </div>
        
        <!-- Truth -->
        <div class="truth-section">
          <div class="truth-label">Reality Check</div>
          <p class="truth-text">${i}</p>
        </div>
        
        <!-- Stats -->
        <div class="stats-grid">
          <div class="stats-row">
            <div class="stat-cell">
              <span class="stat-label">Daily Goal</span>
              <span class="stat-value">2+</span>
            </div>
            <div class="stat-cell">
              <span class="stat-label">Difficulty</span>
              <span class="stat-value">Medium</span>
            </div>
            <div class="stat-cell">
              <span class="stat-label">Time Left</span>
              <span class="stat-value">Today</span>
            </div>
          </div>
        </div>
        ` : ''}
        
        <!-- Buttons -->
        <div class="button-group">
          <a href="https://leetcode.com/problemset/" class="btn btn-primary">Start Solving</a>
          <a href="https://dsa-grinders.vercel.app/" class="btn btn-secondary">View Dashboard</a>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="email-footer">
        <p class="footer-text">
          Keep grinding. Your future self will thank you.
        </p>
        <p class="footer-links">
          <a href="https://dsa-grinders.vercel.app/" class="footer-link">Leaderboard</a>
          •
          <a href="https://leetcode.com" class="footer-link">LeetCode</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function getCustomEmailHTML(userName: string, subject: string, message: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <style>${EMAIL_STYLE}</style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-text">DSA Grinder Team</div>
      </div>
      
      <div class="content">
        <h1 class="greeting">${subject}</h1>
        <p class="instruction" style="white-space: pre-wrap; font-size: 16px; color: #1e293b;">${message}</p>
        <a href="https://dsa-grinders.vercel.app/" class="btn">Check leaderboard</a>
      </div>
      
      <div class="footer">
        <p>System message from DSA Grinder Team</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function getEmailSubject(userName: string): string {
  return `🚨 Wake Up ${userName}! Time to Grind DSA`;
}
