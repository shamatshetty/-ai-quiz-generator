import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'classroom-quiz-secret-key-2026';

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
        error: 'An account with this email address already exists. Please sign in instead.'
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
        subject: subject?.trim() || (normalizedRole === 'TEACHER' ? 'General' : null)
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
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    let isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch && typeof password === 'string') {
      isMatch = await bcrypt.compare(password.trim(), user.password);
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password. If you forgot your password or created this account with Google, use "Forgot password?" below to reset it.'
      });
    }

    // Generate token with user's verified registered role
    const token = generateToken(user);

    console.log('[Auth] Login successful for:', normalizedEmail, 'role:', user.role);

    res.json({
      success: true,
      token,
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Login failed: ' + err.message });
  }
});

/**
 * POST /api/auth/reset-password
 * Direct password reset for accounts using verified email
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Email address is required' });
    }

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ success: false, error: 'New password must be at least 4 characters' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log('[Auth] Reset password request for:', normalizedEmail);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'No account found with this email address' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    const token = generateToken(updatedUser);

    console.log('[Auth] Password successfully reset for:', normalizedEmail);

    res.json({
      success: true,
      message: 'Password reset successfully! You are now logged in.',
      token,
      user: sanitizeUser(updatedUser)
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
          password: defaultHashedPassword
        }
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
 * POST /api/auth/google
 * Authenticate or register a user via Google Account
 */
router.post('/google', async (req, res) => {
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
      // If user exists, update their name/avatar if empty
      if ((!user.name || user.name === user.email.split('@')[0]) && displayName) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { name: displayName, avatar: user.avatar || userAvatar }
        });
      }
    } else {
      // Create new user authenticated via Google
      const randomPassword = await bcrypt.hash('google-oauth-' + Math.random().toString(36), 10);
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: displayName,
          password: randomPassword,
          role: normalizedRole,
          avatar: userAvatar,
          subject: normalizedRole === 'TEACHER' ? 'General Education' : null
        }
      });
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
});

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

