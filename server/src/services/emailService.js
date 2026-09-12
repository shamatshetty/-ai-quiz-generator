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

/**
 * Build responsive HTML template for Live Quiz Hosted invitation
 */
const buildLiveQuizInviteTemplate = ({
  studentName,
  studentEmail,
  teacherName = 'Teacher',
  quizTitle = 'Classroom Quiz',
  subject = 'General Knowledge',
  roomCode,
  timeLimit = 20,
  totalQuestions = 10,
  joinUrl
}) => {
  const displayName = studentName || studentEmail.split('@')[0];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Quiz Started: ${quizTitle} - QuizPop</title>
</head>
<body style="margin: 0; padding: 0; background-color: #070B1E; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F1F5F9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #070B1E; min-height: 100vh; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 580px; background: #0F172A; border: 1px solid #334155; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 36px 40px 24px; text-align: center; background: linear-gradient(180deg, rgba(147, 51, 234, 0.25) 0%, rgba(15, 23, 42, 0) 100%);">
              <div style="display: inline-block; width: 60px; height: 60px; line-height: 60px; background: linear-gradient(135deg, #F59E0B, #EF4444); border-radius: 18px; font-size: 30px; text-align: center; box-shadow: 0 10px 20px -3px rgba(245, 158, 11, 0.5);">
                ⚡
              </div>
              <h1 style="margin: 16px 0 4px; font-size: 26px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.5px;">
                Quiz<span style="color: #F59E0B;">Pop!</span> Live
              </h1>
              <div style="display: inline-block; margin-top: 6px; padding: 4px 14px; background: rgba(245, 158, 11, 0.2); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 9999px;">
                <span style="font-size: 11px; font-weight: 800; color: #FCD34D; text-transform: uppercase; letter-spacing: 1.5px;">
                  🔴 Live Quiz Now Active
                </span>
              </div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 10px 40px 32px;">
              <h2 style="margin: 0 0 12px; font-size: 22px; font-weight: 800; color: #F8FAFC;">
                Your teacher just launched a live quiz!
              </h2>
              <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #94A3B8;">
                Hello <strong style="color: #F1F5F9;">${displayName}</strong>, your instructor <strong style="color: #A855F7;">${teacherName}</strong> has hosted an interactive classroom quiz game. Join your classmates on the buzzer!
              </p>

              <!-- Quiz Info Box -->
              <div style="background: rgba(30, 41, 59, 0.8); border: 1px solid #475569; border-radius: 16px; padding: 20px 24px; margin: 20px 0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding-bottom: 8px;">
                      <span style="font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px;">Quiz Title:</span>
                      <div style="font-size: 18px; font-weight: 800; color: #FFFFFF; margin-top: 2px;">${quizTitle}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top: 8px; border-top: 1px solid #334155;">
                      <span style="font-size: 12px; color: #CBD5E1;">
                        📚 <strong>Subject:</strong> ${subject} &nbsp;•&nbsp; 
                        ❓ <strong>Questions:</strong> ${totalQuestions} &nbsp;•&nbsp; 
                        ⏱️ <strong>Timer:</strong> ${timeLimit}s
                      </span>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- 6-Digit Room PIN Box -->
              <div style="background: linear-gradient(135deg, rgba(147, 51, 234, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%); border: 2px dashed #A855F7; border-radius: 18px; padding: 24px; text-align: center; margin: 26px 0;">
                <p style="margin: 0 0 6px; font-size: 12px; font-weight: 800; color: #C084FC; text-transform: uppercase; letter-spacing: 2px;">
                  Room PIN Code
                </p>
                <div style="font-size: 44px; font-weight: 900; font-family: 'Courier New', Courier, monospace; letter-spacing: 10px; color: #FCD34D; margin: 6px 0; text-shadow: 0 0 25px rgba(245, 158, 11, 0.4);">
                  ${roomCode}
                </div>
                <p style="margin: 8px 0 0; font-size: 12px; color: #94A3B8;">
                  Enter this 6-digit PIN on your Student Dashboard to join the game room.
                </p>
              </div>

              <!-- Action Button -->
              <div style="text-align: center; margin: 30px 0 24px;">
                <a href="${joinUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: #0F172A; font-weight: 900; font-size: 16px; text-decoration: none; padding: 16px 42px; border-radius: 14px; box-shadow: 0 10px 25px -3px rgba(245, 158, 11, 0.5); letter-spacing: 0.5px;">
                  ⚡ Join Live Quiz Now &rarr;
                </a>
              </div>

              <!-- Direct Link -->
              <div style="border-top: 1px solid #1E293B; padding-top: 18px; margin-top: 24px; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #64748B;">
                  Direct link: <a href="${joinUrl}" style="color: #A855F7; text-decoration: underline;">${joinUrl}</a>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #070B1E; border-top: 1px solid #1E293B; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 12px; color: #64748B;">
                You received this email because you are registered as a Student on QuizPop Classroom.
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569;">
                &copy; ${new Date().getFullYear()} QuizPop Classroom Assessment System. All rights reserved.
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
 * Dispatch live quiz announcement email to a registered student
 */
export async function sendLiveQuizNotificationEmail({
  studentEmail,
  studentName,
  teacherName = 'Teacher',
  quizTitle = 'Classroom Quiz',
  subject = 'General Knowledge',
  roomCode,
  timeLimit = 20,
  totalQuestions = 10,
  clientUrl = 'http://localhost:5173'
}) {
  try {
    const transporter = await getTransporter();
    const fromAddress = process.env.SMTP_FROM || '"QuizPop Classroom" <noreply@quizpop.classroom>';
    const joinUrl = `${clientUrl}/?room=${roomCode}`;

    const htmlContent = buildLiveQuizInviteTemplate({
      studentName,
      studentEmail,
      teacherName,
      quizTitle,
      subject,
      roomCode,
      timeLimit,
      totalQuestions,
      joinUrl
    });

    const textContent = `⚡ QuizPop Live Quiz Invitation!\n\nHello ${studentName || studentEmail},\n\nYour teacher ${teacherName} has hosted a live quiz: "${quizTitle}" (${subject})!\n\nRoom PIN: ${roomCode}\nQuestions: ${totalQuestions} • Time per Question: ${timeLimit}s\n\nJoin the live classroom now at: ${joinUrl}\n\nEnter the PIN ${roomCode} to join your classmates!`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: studentEmail,
      subject: `⚡ [QuizPop] Live Quiz: ${quizTitle} hosted by ${teacherName} (PIN: ${roomCode})`,
      text: textContent,
      html: htmlContent
    });

    console.log(`✅ Live quiz email dispatched to student ${studentEmail} (Room ${roomCode}). MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ Failed to send live quiz email to ${studentEmail}:`, err.message);
    throw err;
  }
}
