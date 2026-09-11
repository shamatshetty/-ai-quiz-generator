import nodemailer from 'nodemailer';

/**
 * Service to dispatch transactional authentication emails (Password Reset, OTP)
 */

let cachedTransporter = null;

const getTransporter = async () => {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
    console.log('📧 Configured production SMTP email transporter:', host);
    return cachedTransporter;
  }

  // Fallback: Create test account or console logger
  try {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log('📧 Initialized Ethereal test email transporter (Dev preview mode)');
    return cachedTransporter;
  } catch (err) {
    console.warn('⚠️ Could not connect to Ethereal email, using direct console logger:', err.message);
    cachedTransporter = {
      sendMail: async (mailOptions) => {
        console.log('\n================== 📧 OUTGOING EMAIL SIMULATION ==================');
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        console.log('Preview Text:', mailOptions.text);
        console.log('==================================================================\n');
        return { messageId: 'simulated-' + Date.now() };
      }
    };
    return cachedTransporter;
  }
};

/**
 * Build responsive HTML template for password reset
 */
const buildPasswordResetTemplate = ({ name, email, resetUrl, otpCode, expiresMinutes = 15 }) => {
  const displayName = name || email.split('@')[0];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - QuizPop</title>
</head>
<body style="margin: 0; padding: 0; background-color: #090D1F; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F1F5F9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #090D1F; min-height: 100vh; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 560px; background: #0F172A; border: 1px solid #334155; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 36px 40px 24px; text-align: center; background: linear-gradient(180deg, rgba(147, 51, 234, 0.15) 0%, rgba(15, 23, 42, 0) 100%);">
              <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; background: linear-gradient(135deg, #9333EA, #4F46E5); border-radius: 16px; font-size: 28px; text-align: center; box-shadow: 0 10px 15px -3px rgba(147, 51, 234, 0.4);">
                ⚡
              </div>
              <h1 style="margin: 16px 0 4px; font-size: 24px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">
                Quiz<span style="color: #EC4899;">Pop!</span>
              </h1>
              <p style="margin: 0; font-size: 12px; font-weight: 700; color: #A855F7; text-transform: uppercase; letter-spacing: 1.5px;">
                Security & Authentication
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 10px 40px 32px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #F8FAFC;">
                Password Reset Request
              </h2>
              <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #94A3B8;">
                Hello <strong style="color: #F1F5F9;">${displayName}</strong>, we received a request to reset your password for your registered QuizPop account (<span style="color: #38BDF8;">${email}</span>).
              </p>
              
              <!-- OTP Box -->
              <div style="background: #1E293B; border: 1px solid #475569; border-radius: 16px; padding: 24px; text-align: center; margin: 24px 0;">
                <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px;">
                  Your 6-Digit Verification Code
                </p>
                <div style="font-size: 36px; font-weight: 900; font-family: monospace; letter-spacing: 8px; color: #38BDF8; margin: 8px 0; text-shadow: 0 0 20px rgba(56, 189, 248, 0.3);">
                  ${otpCode}
                </div>
                <p style="margin: 8px 0 0; font-size: 12px; color: #64748B;">
                  Valid for <strong>${expiresMinutes} minutes</strong> • Single use only
                </p>
              </div>

              <div style="text-align: center; margin: 28px 0 24px;">
                <p style="margin: 0 0 16px; font-size: 14px; color: #94A3B8;">
                  Or click the button below to reset your password directly:
                </p>
                <a href="${resetUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%); color: #FFFFFF; font-weight: 700; font-size: 15px; text-decoration: none; padding: 14px 36px; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(124, 58, 237, 0.4);">
                  Reset Password Now &rarr;
                </a>
              </div>

              <!-- Security Notice -->
              <div style="border-top: 1px solid #1E293B; padding-top: 20px; margin-top: 28px;">
                <p style="margin: 0 0 8px; font-size: 13px; color: #64748B; line-height: 1.5;">
                  <strong>Didn't request this?</strong> If you didn't ask for a password reset, you can safely ignore this email. Your password will remain unchanged.
                </p>
                <p style="margin: 0; font-size: 12px; color: #475569; word-break: break-all;">
                  Button not working? Paste this link in your browser:<br>
                  <a href="${resetUrl}" style="color: #818CF8; text-decoration: none;">${resetUrl}</a>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #090D1F; border-top: 1px solid #1E293B; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #475569;">
                &copy; ${new Date().getFullYear()} QuizPop Classroom Assessment. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

/**
 * Dispatch password reset email with token and OTP code
 */
export async function sendPasswordResetEmail({ email, name, resetUrl, otpCode, expiresMinutes = 15 }) {
  try {
    const transporter = await getTransporter();
    const fromAddress = process.env.SMTP_FROM || '"QuizPop Security" <noreply@quizpop.classroom>';

    const htmlContent = buildPasswordResetTemplate({
      name,
      email,
      resetUrl,
      otpCode,
      expiresMinutes
    });

    const textContent = `QuizPop Password Reset Request\n\nHello ${name || email},\n\nYour 6-digit verification code is: ${otpCode}\n\nThis code expires in ${expiresMinutes} minutes and is single-use only.\n\nAlternatively, reset your password directly at: ${resetUrl}\n\nIf you did not request this, please ignore this email.`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: `[QuizPop] ${otpCode} is your password reset code`,
      text: textContent,
      html: htmlContent
    });

    console.log(`✅ Password reset email sent to ${email}. MessageId: ${info.messageId}`);
    if (nodemailer.getTestMessageUrl && info.messageId) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`🔗 Ethereal Email Preview URL: ${previewUrl}`);
      }
    }

    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ Failed to send password reset email to ${email}:`, err);
    throw err;
  }
}
