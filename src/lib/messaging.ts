import { User } from '@/db/schema';
import { getEmailTransporter } from '@/lib/emailTransporter';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { getWhatsAppMessage, getEmailHTML, getEmailSubject } from '@/config/messages';

export async function sendConfigEmail(user: User, roast?: string, insult?: string, fullMessage?: string) {
    const transporter = getEmailTransporter();

    const mailOptions = {
        from: `"DSA Grinders 🔥" <${process.env.SMTP_EMAIL}>`,
        to: user.email,
        subject: getEmailSubject(user.name),
        html: getEmailHTML(user.name, roast, insult, fullMessage),
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to send email';
        console.error('Email send error:', message);
        return { success: false, error: message };
    }
}

export async function sendConfigWhatsApp(user: User, roast?: string, insult?: string, fullMessage?: string) {
    if (!user.phoneNumber) {
        return { success: false, error: 'No phone number' };
    }

    const message = getWhatsAppMessage(user.name, roast, insult, fullMessage);

    try {
        return await sendWhatsAppMessage(user.phoneNumber, message);
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Failed to send WhatsApp';
        console.error('WhatsApp send error:', msg);
        return { success: false, error: msg };
    }
}
