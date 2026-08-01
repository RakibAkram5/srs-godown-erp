import { Resend } from 'resend';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';

const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;

export async function sendOtpEmail(to: string, otp: string, companyName: string) {
  const subject = `${companyName} — Password reset code`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="margin-bottom: 4px;">${companyName}</h2>
      <p style="color: #555;">Use this code to reset your password. It expires in 10 minutes.</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 16px; background: #f4f4f5; border-radius: 8px;">${otp}</p>
      <p style="color: #888; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;

  if (!resend) {
    // No Resend API key configured (e.g. local dev) — log instead of emailing.
    logger.warn(`RESEND_API_KEY not set — OTP for ${to} is: ${otp}`);
    return;
  }

  const { error } = await resend.emails.send({
    from: env.resendFromEmail,
    to,
    subject,
    html,
  });
  if (error) {
    logger.error(`Failed to send OTP email to ${to}`, error);
    throw new Error('Could not send the reset email. Please try again shortly.');
  }
}
