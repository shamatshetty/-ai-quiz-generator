import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../prisma.js';
import { forgotPasswordLimiter, resetPasswordLimiter } from '../middleware/rateLimiter.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'classroom-quiz-secret-key-2026';

/**
 * Log an authentication audit event to the database
 */
const logAuthAudit = async ({ event, email, req, details = '' }) => {
  try {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    await prisma.authAuditLog.create({
      data: {
        event,
        email: email ? String(email).trim().toLowerCase() : null,
        ipAddress: String(ipAddress),
        userAgent: String(userAgent).substring(0, 255),
        details: typeof details === 'object' ? JSON.stringify(details) : String(details)
      }
    });
  } catch (err) {
    console.error('[AuditLog] Failed to record auth audit log:', err.message);
  }
};

/**
 * Generate a JWT token for a user
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Helper to strip password from user object
 */
const sanitizeUser = (user) => {
  const { password, ...safeUser } = user;
  return safeUser;
};

/**
 * GET /api/auth/check-email
 * Quick check if an email already exists in the database
 */
router.get('/check-email', async (req, res) => {
  try {
    const email = (req.query.email || '').trim().toLowerCase();
    if (!email) {
      return res.json({ exists: false });
    }
    const user = await prisma.user.findUnique({
      where: { email }
    });
    res.json({
      exists: !!user,
      role: user ? user.role : null
    });
  } catch (err) {
    res.status(500).json({ exists: false, error: err.message });
  }
});

/**
 * POST /api/auth/register
 * Register a new Teacher or Student account
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, avatar, subject } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Full name is required' });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Email address is required' });
    }

    if (!password || password.length < 4) {
      return res.status(400).json({ success: false, error: 'Password must be at least 4 characters' });
    }

    const normalizedRole = (role || 'STUDENT').toUpperCase();
    if (!['TEACHER', 'STUDENT'].includes(normalizedRole)) {
      return res.status(400).json({ success: false, error: 'Role must be either TEACHER or STUDENT' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        code: 'EMAIL_ALREADY_EXISTS',
        error: 'This email ID is registered. Please login.'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Default avatar
    const defaultAvatar = normalizedRole === 'TEACHER' ? '👨‍🏫' : (avatar || '🚀');

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: normalizedRole,
        avatar: avatar || defaultAvatar,
        subject: subject?.trim() || (normalizedRole === 'TEACHER' ? 'General' : null),
        lastLoginAt: new Date()
      }
    });

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      token,
      user: sanitizeUser(newUser)
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, error: 'Failed to create account: ' + err.message });
  }
});

/**
 * POST /api/auth/login
 * Log in an existing Teacher or Student
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Please enter your email' });
    }

    if (!password) {
      return res.status(400).json({ success: false, error: 'Please enter your password' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log('[Auth] Login attempt for:', normalizedEmail, 'role requested:', role);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      await logAuthAudit({ event: 'LOGIN_FAILED', email: normalizedEmail, req, details: 'Email not registered' });
      return res.status(404).json({
        success: false,
        code: 'EMAIL_NOT_FOUND',
        error: 'This email is not registered yet. Please sign up first.'
      });
    }

    let isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch && typeof password === 'string') {
      isMatch = await bcrypt.compare(password.trim(), user.password);
    }

    if (!isMatch) {
      await logAuthAudit({ event: 'LOGIN_FAILED', email: normalizedEmail, req, details: 'Invalid password' });
      return res.status(401).json({
        success: false,
        code: 'INVALID_PASSWORD',
        error: 'Incorrect password. Please try again or use "Forgot password?" below to reset it.'
      });
    }

    // Update lastLoginAt timestamp
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate token with user's verified registered role
    const token = generateToken(updatedUser);

    await logAuthAudit({ event: 'LOGIN_SUCCESS', email: normalizedEmail, req, details: { role: updatedUser.role } });
    console.log('[Auth] Login successful for:', normalizedEmail, 'role:', updatedUser.role);

    res.json({
      success: true,
      token,
      user: sanitizeUser(updatedUser)
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Login failed: ' + err.message });
  }
});

/**
 * POST /api/auth/forgot-password
 * Request a 15-minute expiring password reset token & 6-digit OTP code sent via email
 */
router.post('/forgot-password', forgotPasswordLimiter.middleware(), async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Please enter your email address' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log('[Auth] Forgot password request for:', normalizedEmail);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      await logAuthAudit({ event: 'FORGOT_PASSWORD_FAILED', email: normalizedEmail, req, details: 'Email not found' });
      return res.status(404).json({
        success: false,
        code: 'EMAIL_NOT_FOUND',
        error: 'This email is not registered. Please sign up first.'
      });
    }

    // Generate cryptographically secure reset token (hex) and 6-digit OTP
    const rawToken = crypto.randomBytes(32).toString('hex');
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash token and OTP using SHA-256 for secure database storage
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const otpHash = crypto.createHash('sha256').update(rawOtp).digest('hex');

    // Invalidate any older unused reset tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: normalizedEmail }
    });

    // Save token with 15-minute expiry
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await prisma.passwordResetToken.create({
      data: {
        email: normalizedEmail,
        tokenHash,
        otpHash,
        expiresAt,
        used: false
      }
    });

    // Build reset URL
    const clientBaseUrl = req.headers.origin || req.headers.referer?.split('?')[0] || 'http://localhost:5173';
    const resetUrl = `${clientBaseUrl}?resetToken=${rawToken}&email=${encodeURIComponent(normalizedEmail)}`;

    // Dispatch email
    await sendPasswordResetEmail({
      email: normalizedEmail,
      name: user.name,
      resetUrl,
      otpCode: rawOtp,
      expiresMinutes: 15
    });

    await logAuthAudit({ event: 'FORGOT_PASSWORD_REQUEST', email: normalizedEmail, req });

    res.json({
      success: true,
      message: 'A password reset link and verification code have been sent to your email.'
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, error: 'Failed to process password reset: ' + err.message });
  }
});

/**
 * POST /api/auth/verify-reset-token
 * Check if a reset token or OTP code is valid, unused, and within its 15-minute window
 */
router.post('/verify-reset-token', resetPasswordLimiter.middleware(), async (req, res) => {
  try {
    const { email, token, otpCode } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Email address is required' });
    }

    if (!token && !otpCode) {
      return res.status(400).json({ success: false, error: 'Verification code or reset token is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Query active tokens for this email
    const resetRecords = await prisma.passwordResetToken.findMany({
      where: {
        email: normalizedEmail,
        used: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    let matched = null;

    if (token) {
      const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
      matched = resetRecords.find(r => r.tokenHash === tokenHash);
    } else if (otpCode) {
      const otpHash = crypto.createHash('sha256').update(otpCode.trim()).digest('hex');
      matched = resetRecords.find(r => r.otpHash === otpHash);
    }

    if (!matched) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_OR_EXPIRED_TOKEN',
        error: 'The verification code or reset link is invalid or has expired (valid for 15 minutes). Please request a new one.'
      });
    }

    res.json({
      success: true,
      valid: true,
      message: 'Token verified successfully'
    });
  } catch (err) {
    console.error('Verify reset token error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/auth/reset-password
 * Set new password after verifying token/OTP. Marks token as used and DOES NOT auto-login.
 */
router.post('/reset-password', resetPasswordLimiter.middleware(), async (req, res) => {
  try {
    const { email, token, otpCode, newPassword } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Email address is required' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
    }

    if (!token && !otpCode) {
      return res.status(400).json({ success: false, error: 'Verification code or reset token is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Look up active unused tokens for this email
    const resetRecords = await prisma.passwordResetToken.findMany({
      where: {
        email: normalizedEmail,
        used: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    let matched = null;

    if (token) {
      const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
      matched = resetRecords.find(r => r.tokenHash === tokenHash);
    } else if (otpCode) {
      const otpHash = crypto.createHash('sha256').update(otpCode.trim()).digest('hex');
      matched = resetRecords.find(r => r.otpHash === otpHash);
    }

    if (!matched) {
      await logAuthAudit({ event: 'RESET_PASSWORD_FAILED', email: normalizedEmail, req, details: 'Invalid or expired token' });
      return res.status(400).json({
        success: false,
        code: 'INVALID_OR_EXPIRED_TOKEN',
        error: 'The verification code or reset link is invalid or has expired. Please request a new one.'
      });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'No account found with this email' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);

    // Update user's password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    // Mark token as single-use consumed
    await prisma.passwordResetToken.update({
      where: { id: matched.id },
      data: { used: true }
    });

    await logAuthAudit({ event: 'PASSWORD_RESET_SUCCESS', email: normalizedEmail, req });

    console.log('[Auth] Password successfully reset for:', normalizedEmail);

    // Explicitly return success WITHOUT auto-login token
    res.json({
      success: true,
      message: 'Password updated successfully. Please log in with your new password.'
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, error: 'Failed to reset password: ' + err.message });
  }
});

/**
 * GET /api/auth/me
 * Retrieve current user profile using JWT token
 */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error('Auth verification error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/auth/demo-login
 * 1-Click instant demo login for either Teacher or Student
 */
router.post('/demo-login', async (req, res) => {
  try {
    const { role = 'TEACHER' } = req.body;
    const normalizedRole = role.toUpperCase();

    const demoConfig = normalizedRole === 'TEACHER'
      ? {
          email: 'teacher@classroom.edu',
          name: 'Prof. Alan Davis',
          role: 'TEACHER',
          avatar: '👨‍🏫',
          subject: 'Computer Science & STEM'
        }
      : {
          email: 'student@classroom.edu',
          name: 'Alex Rivera',
          role: 'STUDENT',
          avatar: '🚀',
          subject: null
        };

    let user = await prisma.user.findUnique({
      where: { email: demoConfig.email }
    });

    if (!user) {
      const defaultHashedPassword = await bcrypt.hash('quizpass123', 10);
      user = await prisma.user.create({
        data: {
          ...demoConfig,
          password: defaultHashedPassword,
          lastLoginAt: new Date()
        }
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error('Demo login error:', err);
    res.status(500).json({ success: false, error: 'Demo login failed: ' + err.message });
  }
});

/**
 * Unified Google OAuth Handler
 * POST /api/auth/google and /api/auth/oauth/google
 */
const handleGoogleAuth = async (req, res) => {
  try {
    const { email, name, avatar, role = 'STUDENT', googleId } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Google email is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRole = (role || 'STUDENT').toUpperCase();
    const displayName = name && name.trim() ? name.trim() : normalizedEmail.split('@')[0];
    const userAvatar = avatar || (normalizedRole === 'TEACHER' ? '👨‍🏫' : '🎓');

    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (user) {
      // Existing user: direct login without password
      const updateData = {
        lastLoginAt: new Date(),
        provider: 'google'
      };
      if (googleId) updateData.providerId = String(googleId);
      if ((!user.name || user.name === user.email.split('@')[0]) && displayName) {
        updateData.name = displayName;
      }
      if (avatar) {
        updateData.avatar = avatar;
      }
      user = await prisma.user.update({
        where: { id: user.id },
        data: updateData
      });
      await logAuthAudit({ event: 'OAUTH_LOGIN', email: normalizedEmail, req, details: { provider: 'google', isNewUser: false } });
    } else {
      // New user: auto-create account using verified email
      const randomPassword = await bcrypt.hash('google-oauth-' + crypto.randomBytes(16).toString('hex'), 10);
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: displayName,
          password: randomPassword,
          role: normalizedRole,
          avatar: userAvatar,
          subject: normalizedRole === 'TEACHER' ? 'General Education' : null,
          provider: 'google',
          providerId: googleId ? String(googleId) : null,
          lastLoginAt: new Date()
        }
      });
      await logAuthAudit({ event: 'OAUTH_LOGIN', email: normalizedEmail, req, details: { provider: 'google', isNewUser: true } });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error('Google Auth error:', err);
    res.status(500).json({ success: false, error: 'Google sign-in failed: ' + err.message });
  }
};

router.post('/google', handleGoogleAuth);
router.post('/oauth/google', handleGoogleAuth);

/**
 * Unified Microsoft OAuth Handler
 * POST /api/auth/microsoft and /api/auth/oauth/microsoft
 */
const handleMicrosoftAuth = async (req, res) => {
  try {
    const { email, name, avatar, role = 'STUDENT', microsoftId, accountId } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Microsoft email is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRole = (role || 'STUDENT').toUpperCase();
    const displayName = name && name.trim() ? name.trim() : normalizedEmail.split('@')[0];
    const userAvatar = avatar || (normalizedRole === 'TEACHER' ? '👨‍🏫' : '🚀');

    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (user) {
      // Existing user: direct login without password
      const updateData = {
        lastLoginAt: new Date(),
        provider: 'microsoft'
      };
      if (microsoftId || accountId) updateData.providerId = String(microsoftId || accountId);
      if ((!user.name || user.name === user.email.split('@')[0]) && displayName) {
        updateData.name = displayName;
      }
      user = await prisma.user.update({
        where: { id: user.id },
        data: updateData
      });
      await logAuthAudit({ event: 'OAUTH_LOGIN', email: normalizedEmail, req, details: { provider: 'microsoft', isNewUser: false } });
    } else {
      // New user: auto-create account using verified email
      const randomPassword = await bcrypt.hash('msft-oauth-' + crypto.randomBytes(16).toString('hex'), 10);
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: displayName,
          password: randomPassword,
          role: normalizedRole,
          avatar: userAvatar,
          subject: normalizedRole === 'TEACHER' ? 'General Education' : null,
          provider: 'microsoft',
          providerId: microsoftId || accountId ? String(microsoftId || accountId) : null,
          lastLoginAt: new Date()
        }
      });
      await logAuthAudit({ event: 'OAUTH_LOGIN', email: normalizedEmail, req, details: { provider: 'microsoft', isNewUser: true } });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error('Microsoft Auth error:', err);
    res.status(500).json({ success: false, error: 'Microsoft sign-in failed: ' + err.message });
  }
};

router.post('/microsoft', handleMicrosoftAuth);
router.post('/oauth/microsoft', handleMicrosoftAuth);

/**
 * PUT /api/auth/profile
 * Update user's name and/or avatar
 */
router.put('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    const { name, avatar } = req.body;
    const updateData = {};
    if (name && name.trim()) updateData.name = name.trim();
    if (avatar) updateData.avatar = avatar;

    const updatedUser = await prisma.user.update({
      where: { id: decoded.id },
      data: updateData
    });

    res.json({
      success: true,
      user: sanitizeUser(updatedUser),
      message: 'Profile updated successfully'
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/auth/change-password
 * Verify current password and update to new password
 */
router.put('/change-password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Both current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: decoded.id },
      data: { password: hashedPassword }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

