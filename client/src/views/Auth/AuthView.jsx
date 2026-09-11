import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  BookOpen,
  Smartphone,
  Lock,
  Mail,
  User,
  BookMarked,
  ArrowRight,
  Dices,
  Eye,
  EyeOff,
  Zap,
  ArrowLeft,
  GraduationCap,
  Trophy,
  CheckCircle2,
  AlertCircle,
  BrainCircuit,
  TrendingUp,
  HelpCircle,
  X,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AVATARS, getRandomAvatar } from '../../utils/avatars';
import AIEducationBackground from '../../components/AIEducationBackground';
import soundManager from '../../utils/sound';
import GoogleSignInModal from './GoogleSignInModal';

// Helper to retrieve remembered credentials from localStorage
const getSavedCredentials = (targetRole = null) => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    if (targetRole) {
      const roleSaved = localStorage.getItem(`quiz_remember_${targetRole}`);
      if (roleSaved) return JSON.parse(roleSaved);
    }
    const saved = localStorage.getItem('quiz_remember_me');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!targetRole || parsed.role === targetRole) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading saved credentials:', e);
  }
  return null;
};

export default function AuthView({ onAuthSuccess, initialRoomCode = '', onBack = null }) {
  const { login, register, demoLogin, googleLogin, resetPassword, checkEmail } = useAuth();

  // Load remembered credentials if any
  const savedCreds = getSavedCredentials(initialRoomCode ? 'STUDENT' : null);

  // Role: 'TEACHER' or 'STUDENT'
  const [role, setRole] = useState(initialRoomCode ? 'STUDENT' : (savedCreds?.role || 'STUDENT'));
  // Mode: 'login' or 'register'
  const [mode, setMode] = useState('login');

  // Form fields
  const [email, setEmail] = useState(savedCreds?.email || '');
  const [password, setPassword] = useState(savedCreds?.password || '');
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('General');
  const [avatar, setAvatar] = useState(getRandomAvatar());
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(savedCreds ? true : true);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setError('');
    if (mode === 'login') {
      const roleCreds = getSavedCredentials(newRole);
      if (roleCreds) {
        setEmail(roleCreds.email || '');
        setPassword(roleCreds.password || '');
        setRememberMe(true);
      } else {
        setEmail('');
        setPassword('');
        setRememberMe(true);
      }
      setEmailTouched(false);
      setPasswordTouched(false);
    }
  };

  // Field focus states for floating labels
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);

  // Field touched states for real-time validation
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);

  // Micro-interaction states
  const [isShaking, setIsShaking] = useState(false);
  const [isMuted, setIsMuted] = useState(soundManager.isMuted());

  // Input element refs for instant browser autofill detection
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const nameInputRef = useRef(null);

  // Instant sync when browser autofills credentials
  useEffect(() => {
    const syncAutofill = () => {
      if (emailInputRef.current && emailInputRef.current.value && emailInputRef.current.value !== email) {
        setEmail(emailInputRef.current.value);
      }
      if (passwordInputRef.current && passwordInputRef.current.value && passwordInputRef.current.value !== password) {
        setPassword(passwordInputRef.current.value);
      }
      if (nameInputRef.current && nameInputRef.current.value && nameInputRef.current.value !== name) {
        setName(nameInputRef.current.value);
      }
    };

    syncAutofill();
    const t1 = setTimeout(syncAutofill, 50);
    const t2 = setTimeout(syncAutofill, 200);
    const t3 = setTimeout(syncAutofill, 600);

    const handleAutoFillAnimation = (e) => {
      if (e.animationName === 'onAutoFillStart') {
        syncAutofill();
      }
    };
    window.addEventListener('animationstart', handleAutoFillAnimation);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('animationstart', handleAutoFillAnimation);
    };
  }, [email, password, name]);

  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [emailAlreadyRegistered, setEmailAlreadyRegistered] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const isTeacher = role === 'TEACHER';

  // Validation helpers
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPasswordValid = password.length >= 4;
  const isNameValid = name.trim().length >= 2;

  // Real-time check when typing email in register mode
  useEffect(() => {
    if (mode !== 'register' || !isEmailValid) {
      setEmailAlreadyRegistered(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await checkEmail(email.trim());
        if (res && res.exists) {
          setEmailAlreadyRegistered(true);
        } else {
          setEmailAlreadyRegistered(false);
        }
      } catch {
        setEmailAlreadyRegistered(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [email, mode, isEmailValid]);

  const triggerCardShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleRandomAvatar = () => {
    setAvatar(getRandomAvatar());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setErrorCode('');

    // Capture exact current DOM input values or fallback to React state
    const currentEmail = (emailInputRef.current?.value || email || '').trim();
    const currentPassword = passwordInputRef.current?.value || password || '';
    const currentName = (nameInputRef.current?.value || name || '').trim();

    // Mark all as touched on submit
    setEmailTouched(true);
    setPasswordTouched(true);
    if (mode === 'register') setNameTouched(true);

    if (mode === 'register' && emailAlreadyRegistered) {
      setError('This email ID is registered. Please login.');
      setErrorCode('EMAIL_ALREADY_EXISTS');
      triggerCardShake();
      return;
    }

    if (!currentEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentEmail) || currentPassword.length < 4 || (mode === 'register' && currentName.length < 2)) {
      setError('Please fix the highlighted fields with valid information.');
      triggerCardShake();
      return;
    }

    setLoading(true);
    try {
      let loggedUser;
      if (mode === 'login') {
        loggedUser = await login({ email: currentEmail, password: currentPassword, role });
      } else {
        loggedUser = await register({
          name: currentName,
          email: currentEmail,
          password: currentPassword,
          role,
          avatar: !isTeacher ? avatar : '👨‍🏫',
          subject: isTeacher ? subject.trim() : null
        });
      }

      // Automatically remember credentials on BOTH successful login AND registration
      if (rememberMe) {
        try {
          const userRole = loggedUser?.role || role;
          const creds = { email: currentEmail, password: currentPassword, role: userRole, savedAt: Date.now() };
          localStorage.setItem('quiz_remember_me', JSON.stringify(creds));
          localStorage.setItem(`quiz_remember_${userRole}`, JSON.stringify(creds));
        } catch (storageErr) {
          console.warn('Failed to save credentials to localStorage:', storageErr);
        }
      } else {
        try {
          localStorage.removeItem('quiz_remember_me');
          localStorage.removeItem(`quiz_remember_${role}`);
        } catch (storageErr) {
          console.warn('Failed to remove credentials from localStorage:', storageErr);
        }
      }

      if (onAuthSuccess) {
        onAuthSuccess(loggedUser);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
      setErrorCode(err.code || '');
      triggerCardShake();
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (selectedRole = role) => {
    setError('');
    setDemoLoading(true);
    try {
      const loggedUser = await demoLogin(selectedRole);
      if (onAuthSuccess) {
        onAuthSuccess(loggedUser);
      }
    } catch (err) {
      setError(err.message || 'Quick demo login failed.');
      triggerCardShake();
    } finally {
      setDemoLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setError('');
    setShowGoogleModal(true);
  };

  const handleGoogleAuthSuccess = async ({ name, email, avatar, role: googleRole, googleId }) => {
    setGoogleLoading(true);
    setError('');
    try {
      const loggedUser = await googleLogin({
        email,
        name,
        avatar,
        role: googleRole || role,
        googleId
      });
      if (onAuthSuccess) {
        onAuthSuccess(loggedUser);
      }
    } catch (err) {
      setError(err.message || 'Google Sign-In failed. Please try again.');
      triggerCardShake();
      throw err;
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setResetError('');
    const targetEmail = (forgotEmail || emailInputRef.current?.value || email || '').trim();
    if (!targetEmail) {
      setResetError('Please enter your email address');
      return;
    }
    if (!newPasswordInput || newPasswordInput.length < 4) {
      setResetError('New password must be at least 4 characters');
      return;
    }

    setResetLoading(true);
    try {
      const loggedUser = await resetPassword({
        email: targetEmail,
        newPassword: newPasswordInput
      });

      setEmail(targetEmail);
      setPassword(newPasswordInput);

      try {
        const userRole = loggedUser?.role || role;
        const creds = { email: targetEmail, password: newPasswordInput, role: userRole, savedAt: Date.now() };
        localStorage.setItem('quiz_remember_me', JSON.stringify(creds));
        localStorage.setItem(`quiz_remember_${userRole}`, JSON.stringify(creds));
      } catch {}

      setShowForgotPassword(false);
      if (onAuthSuccess) {
        onAuthSuccess(loggedUser);
      }
    } catch (err) {
      setResetError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-center items-center px-4 py-8 sm:py-12 select-none overflow-x-hidden font-sans">
      {/* 1. Education-Themed Background with low-opacity, softly blurred edge elements & mouse parallax */}
      <AIEducationBackground />

      {/* Top Navbar / Brand Lockup Bar */}
      <div className="w-full max-w-6xl mb-6 relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-400 flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
            <span className="text-xl font-black">⚡</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-black text-xl text-white tracking-tight">
                Quiz<span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 font-black">Pop!</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black uppercase tracking-wider animate-pulse">
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Classroom Assessment</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all border border-white/10 backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95 group shadow-lg"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1 text-purple-400" />
              <span>Back</span>
            </button>
          )}

          {/* Sound Toggle Button */}
          <button
            type="button"
            onClick={() => {
              const muted = soundManager.toggleMute();
              setIsMuted(muted);
            }}
            title={isMuted ? "Unmute Sound" : "Mute Sound"}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-purple-400" />}
          </button>

          {/* Online Status Pill with pulsing green dot */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Online</span>
          </div>
        </div>
      </div>

      {/* Main Dual-Column Container: Left Feature Showcase + Right Glassmorphism Card */}
      <div className="max-w-6xl w-full mx-auto relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-14">
        
        {/* LEFT COLUMN: Feature Highlights Panel (Staggered Animation + Icon Micro-Interactions) */}
        <div className="w-full lg:w-1/2 space-y-6 text-center lg:text-left">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider shadow-inner animate-reveal-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-sparkle" />
              <span className="badge-caps">AI-Powered Classroom Arena</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading text-white tracking-tight leading-tight animate-reveal-2">
              <span className="font-semibold text-slate-100">Master Any Subject with</span>{' '}
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 animate-gradient-flow inline-block">
                Live AI Quizzes
              </span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-lg mx-auto lg:mx-0 animate-reveal-3">
              The modern interactive assessment platform. Real-time quiz battles, instant leaderboards, and intelligent progress tracking.
            </p>
          </div>

          {/* 3 Staggered Feature Highlight Cards */}
          <div className="space-y-3.5 max-w-lg mx-auto lg:mx-0 pt-2 text-left">
            {/* Feature 1: AI-Generated Quizzes */}
            <div className="animate-feature-stagger-1 p-3.5 sm:p-4 rounded-2xl bg-slate-900/70 border border-slate-800/90 backdrop-blur-md flex items-center gap-4 hover:border-purple-500/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-950/40 transition-all duration-300 group cursor-default">
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-200">
                <BrainCircuit className="w-6 h-6 text-purple-400 animate-logo-pulse" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-white text-sm sm:text-base flex items-center gap-2">
                  <span>AI-Generated Quizzes</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-extrabold uppercase badge-caps animate-badge-pulse">Smart</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Curriculum-aligned questions generated dynamically from text, syllabus, or lecture topics.
                </p>
              </div>
            </div>

            {/* Feature 2: Real-Time Leaderboard */}
            <div className="animate-feature-stagger-2 p-3.5 sm:p-4 rounded-2xl bg-slate-900/70 border border-slate-800/90 backdrop-blur-md flex items-center gap-4 hover:border-amber-500/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-950/30 transition-all duration-300 group cursor-default">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0 group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-200">
                <Trophy className="w-6 h-6 text-amber-400 animate-icon-bounce" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-white text-sm sm:text-base flex items-center gap-2">
                  <span>Real-Time Leaderboard</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-extrabold uppercase badge-caps animate-badge-pulse">Live</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Live leaderboard rankings updated after every answered question with podium celebrations.
                </p>
              </div>
            </div>

            {/* Feature 3: Track Your Progress */}
            <div className="animate-feature-stagger-3 p-3.5 sm:p-4 rounded-2xl bg-slate-900/70 border border-slate-800/90 backdrop-blur-md flex items-center gap-4 hover:border-emerald-500/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-950/30 transition-all duration-300 group cursor-default">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shrink-0 group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-200">
                <TrendingUp className="w-6 h-6 text-emerald-400 animate-icon-grow" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-white text-sm sm:text-base flex items-center gap-2">
                  <span>Track Your Progress</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold uppercase badge-caps animate-badge-pulse">Analytics</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Detailed score trends, accuracy percentages, time tracking, and answer reviews.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Modern Glassmorphism Login Card */}
        <div className="w-full lg:w-[440px] shrink-0">
          <div className={`max-w-[440px] w-full mx-auto relative z-10 animated-glow-border ${isShaking ? 'animate-card-shake' : ''}`}>
            <div className="glass-login-card rounded-3xl p-6 sm:p-8 space-y-5 text-white animate-card-entrance transition-all duration-300">
          
          {/* Top Logo / App Icon with Animated SVG Pulse */}
          <div className="text-center space-y-2.5">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[2px] shadow-2xl mx-auto animate-logo-pulse">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/25 to-cyan-500/25 opacity-70 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center justify-center text-purple-300">
                  <BrainCircuit className="w-8 h-8 text-purple-400 transition-transform duration-500 group-hover:scale-110" />
                  <GraduationCap className="w-4 h-4 text-amber-300 absolute -top-1 -right-1 transform rotate-12 transition-transform duration-300 group-hover:rotate-45" />
                </div>
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[11px] font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
                <span>AI Assessment Arena</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-heading font-bold text-white tracking-tight">
                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h1>
              <p className="text-slate-400 text-xs mt-0.5">
                {mode === 'login'
                  ? 'Sign in to access your leaderboard and quiz history'
                  : 'Join thousands of students and teachers today'}
              </p>
            </div>
          </div>

          {/* Preserved Room PIN Banner (if student scanned room code) */}
          {initialRoomCode && (
            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center justify-between animate-pulse">
              <span className="flex items-center gap-2">
                <span>🎯 Joining Room PIN:</span>
                <span className="font-mono font-black text-amber-300 text-sm tracking-wider">{initialRoomCode}</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-amber-400">Preserved</span>
            </div>
          )}

          {/* Role Selector Tabs (Student vs Teacher) with Smooth Sliding Pill */}
          <div>
            <div className="relative p-1 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner flex overflow-hidden">
              {/* Smooth Animated Sliding Pill Background */}
              <div 
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  !isTeacher
                    ? 'left-1 bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg shadow-purple-600/30 border border-purple-400/40'
                    : 'left-[calc(50%+2px)] bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg shadow-emerald-600/30 border border-emerald-400/40'
                }`}
              />

              {/* Student Tab */}
              <button
                type="button"
                onClick={() => handleRoleChange('STUDENT')}
                className={`relative z-10 w-1/2 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-heading font-bold text-xs sm:text-sm transition-colors duration-200 cursor-pointer ${
                  !isTeacher ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Student / Player</span>
              </button>

              {/* Teacher Tab */}
              <button
                type="button"
                onClick={() => handleRoleChange('TEACHER')}
                className={`relative z-10 w-1/2 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-heading font-bold text-xs sm:text-sm transition-colors duration-200 cursor-pointer ${
                  isTeacher ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Teacher / Host</span>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name (Register Mode Only) */}
            {mode === 'register' && (
              <div className="space-y-1">
                <div
                  className={`floating-label-wrap ${name.length > 0 || nameFocused ? 'is-filled' : ''} rounded-xl bg-slate-950/70 border transition-all duration-200 ${
                    nameTouched
                      ? isNameValid
                        ? 'border-emerald-500/70 shadow-sm shadow-emerald-500/10'
                        : 'border-rose-500/70 shadow-sm shadow-rose-500/10'
                      : nameFocused
                      ? 'border-purple-500 shadow-sm shadow-purple-500/20'
                      : 'border-slate-700/80 hover:border-slate-600'
                  }`}
                >
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    ref={nameInputRef}
                    type="text"
                    required
                    placeholder=" "
                    value={name}
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => {
                      setNameFocused(false);
                      setNameTouched(true);
                    }}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!nameTouched) setNameTouched(true);
                    }}
                    className="floating-label-input w-full pl-10 pr-10 py-3 bg-transparent text-white text-sm focus:outline-none"
                  />
                  <span className="floating-label-text">
                    {isTeacher ? 'Instructor Full Name' : 'Student Full Name'}
                  </span>

                  {nameTouched && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      {isNameValid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-fade-scale" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400 animate-fade-scale" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Subject (Teacher Register Only) */}
            {mode === 'register' && isTeacher && (
              <div className="space-y-1">
                <div className="floating-label-wrap is-filled rounded-xl bg-slate-950/70 border border-slate-700/80 hover:border-slate-600">
                  <BookMarked className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder=" "
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="floating-label-input w-full pl-10 pr-4 py-3 bg-transparent text-white text-sm focus:outline-none"
                  />
                  <span className="floating-label-text">Subject / Department</span>
                </div>
              </div>
            )}

            {/* Avatar Selector (Student Register Only) */}
            {mode === 'register' && !isTeacher && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    Player Avatar
                  </label>
                  <button
                    type="button"
                    onClick={handleRandomAvatar}
                    className="text-[11px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Dices className="w-3 h-3" />
                    <span>Random</span>
                  </button>
                </div>

                <div className="flex items-center justify-center gap-3 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-3xl select-none animate-bounce-subtle">{avatar}</span>
                  <div className="flex flex-wrap gap-1.5 justify-center max-w-[200px]">
                    {AVATARS.slice(0, 8).map((a, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setAvatar(a)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm hover:scale-110 transition-transform cursor-pointer ${
                          avatar === a
                            ? 'bg-purple-600 border border-white shadow-md'
                            : 'bg-slate-800 hover:bg-slate-700 border border-slate-700'
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Email Field with Floating Label & Real-Time Validation */}
            <div className="space-y-1">
              <div
                className={`floating-label-wrap ${email.length > 0 || emailFocused ? 'is-filled' : ''} rounded-xl bg-slate-950/70 border transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  mode === 'register' && emailAlreadyRegistered
                    ? 'border-rose-500/80 shadow-md shadow-rose-500/15 ring-2 ring-rose-500/20'
                    : emailTouched
                    ? isEmailValid
                      ? 'border-emerald-500/80 shadow-md shadow-emerald-500/15'
                      : 'border-rose-500/80 shadow-md shadow-rose-500/15'
                    : emailFocused
                    ? 'border-purple-500 shadow-lg shadow-purple-500/25 ring-2 ring-purple-500/20'
                    : 'border-slate-700/80 hover:border-slate-600'
                }`}
              >
                <Mail className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none ${emailFocused ? 'text-purple-400' : 'text-slate-400'}`} />
                <input
                  ref={emailInputRef}
                  type="email"
                  required
                  placeholder=" "
                  value={email}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => {
                    setEmailFocused(false);
                    setEmailTouched(true);
                  }}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (!emailTouched) setEmailTouched(true);
                  }}
                  className="floating-label-input w-full pl-10 pr-10 py-3 bg-transparent text-white text-sm focus:outline-none"
                />
                <span className="floating-label-text">
                  {isTeacher ? 'Teacher Email' : 'Student Email'}
                </span>

                {/* Real-time validation status icon */}
                {(emailTouched || (mode === 'register' && emailAlreadyRegistered)) && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    {mode === 'register' && emailAlreadyRegistered ? (
                      <AlertCircle className="w-4 h-4 text-rose-400 animate-scale-pop" />
                    ) : isEmailValid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-scale-pop" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 animate-scale-pop" />
                    )}
                  </div>
                )}
              </div>

              {/* Inline duplicate warning with immediate Go to Login action */}
              {mode === 'register' && emailAlreadyRegistered && (
                <div className="p-2 px-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center justify-between animate-fade-scale shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>This email ID is registered, please login.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError('');
                      setErrorCode('');
                      setEmailAlreadyRegistered(false);
                      const roleCreds = getSavedCredentials(role);
                      if (roleCreds && roleCreds.email === email) {
                        setPassword(roleCreds.password || '');
                      } else {
                        setPassword('');
                      }
                      setPasswordTouched(false);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0 ml-2"
                  >
                    Go to Login
                  </button>
                </div>
              )}
            </div>

            {/* Password Field with Floating Label, Real-Time Validation & Eye Toggle */}
            <div className="space-y-1">
              <div
                className={`floating-label-wrap ${password.length > 0 || passwordFocused ? 'is-filled' : ''} rounded-xl bg-slate-950/70 border transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  passwordTouched
                    ? isPasswordValid
                      ? 'border-emerald-500/80 shadow-md shadow-emerald-500/15'
                      : 'border-rose-500/80 shadow-md shadow-rose-500/15'
                    : passwordFocused
                    ? 'border-purple-500 shadow-lg shadow-purple-500/25 ring-2 ring-purple-500/20'
                    : 'border-slate-700/80 hover:border-slate-600'
                }`}
              >
                <Lock className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none ${passwordFocused ? 'text-purple-400' : 'text-slate-400'}`} />
                <input
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder=" "
                  value={password}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => {
                    setPasswordFocused(false);
                    setPasswordTouched(true);
                  }}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (!passwordTouched) setPasswordTouched(true);
                  }}
                  className="floating-label-input w-full pl-10 pr-16 py-3 bg-transparent text-white text-sm focus:outline-none"
                />
                <span className="floating-label-text">Password</span>

                {/* Trailing Controls: Validation Icon + Animated Eye Toggle */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {passwordTouched && (
                    <div>
                      {isPasswordValid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-scale-pop" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400 animate-scale-pop" />
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                    tabIndex={-1}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <span className="inline-block transition-transform duration-200">
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-purple-400 animate-scale-pop" />
                      ) : (
                        <Eye className="w-4 h-4 text-slate-400 animate-scale-pop" />
                      )}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Remember Me Checkbox + Forgot Password Link */}
            {mode === 'login' && (
              <div className="flex items-center justify-between pt-0.5 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-purple-500 focus:ring-offset-slate-900 cursor-pointer"
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(emailInputRef.current?.value || email);
                    setNewPasswordInput('');
                    setResetError('');
                    setShowForgotPassword(true);
                  }}
                  className="text-purple-400 hover:text-purple-300 font-semibold transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Error Message with Contextual Action CTAs */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-semibold flex flex-col gap-2.5 animate-fade-scale shadow-lg">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{error}</span>
                </div>

                {/* Sign Up Flow: If email already exists -> provide "Go to Login" button */}
                {(errorCode === 'EMAIL_ALREADY_EXISTS' || error.toLowerCase().includes('registered') || error.toLowerCase().includes('already exists') || error.toLowerCase().includes('log in') || error.toLowerCase().includes('login')) && (
                  <div className="pl-6 pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setError('');
                        setErrorCode('');
                        setEmailAlreadyRegistered(false);
                        const targetEmail = emailInputRef.current?.value || email;
                        const roleCreds = getSavedCredentials(role);
                        if (roleCreds && roleCreds.email === targetEmail) {
                          setPassword(roleCreds.password || '');
                        } else {
                          setPassword('');
                        }
                        setPasswordTouched(false);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
                    >
                      <span>Go to Login</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Login Flow: If email not registered yet -> provide "Go to Sign Up" button */}
                {(errorCode === 'EMAIL_NOT_FOUND' || error.includes('not registered yet') || error.includes('sign up first')) && (
                  <div className="pl-6 pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        setError('');
                        setErrorCode('');
                        setPassword('');
                        setPasswordTouched(false);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
                    >
                      <span>Go to Sign Up</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Reset / Set Password Link if password was incorrect or other login error */}
                {mode === 'login' && errorCode !== 'EMAIL_NOT_FOUND' && !error.includes('not registered') && (
                  <div className="pl-6 flex items-center gap-3 text-[11px] text-slate-300">
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(emailInputRef.current?.value || email);
                        setNewPasswordInput('');
                        setResetError('');
                        setShowForgotPassword(true);
                      }}
                      className="text-purple-300 hover:text-white underline font-bold cursor-pointer"
                    >
                      Forgot / Reset Password
                    </button>
                    <span className="text-slate-500">•</span>
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      className="text-cyan-300 hover:text-white underline font-bold cursor-pointer"
                    >
                      Sign in with Google
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Primary CTA Button with Gradient Fill, Hover Scale/Glow & Loading Spinner */}
            <button
              type="submit"
              disabled={loading || demoLoading || googleLoading}
              className={`group w-full py-3.5 font-heading font-black text-sm sm:text-base rounded-xl flex items-center justify-center gap-2 transition-all duration-300 transform active:scale-[0.97] hover:scale-[1.01] disabled:opacity-50 cursor-pointer shadow-xl bg-[length:200%_auto] hover:bg-right ${
                isTeacher
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 text-slate-950 shadow-emerald-600/30 hover:shadow-emerald-500/50'
                  : 'bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-600 text-white shadow-purple-600/30 hover:shadow-purple-500/50'
              }`}
            >
              {loading ? (
                <div className="flex items-center gap-2 animate-fade-scale">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 animate-fade-scale">
                  <span>
                    {mode === 'login'
                      ? `Sign In as ${isTeacher ? 'Teacher' : 'Student'}`
                      : `Create ${isTeacher ? 'Teacher' : 'Student'} Account`}
                  </span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              )}
            </button>
          </form>

          {/* Animated Divider */}
          <div className="relative flex items-center justify-center my-3">
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
            <span className="bg-[#0e162a] px-3 text-[10px] font-bold tracking-wider uppercase text-slate-400 absolute rounded-full border border-slate-800/80">
              Or continue with
            </span>
          </div>

          {/* Social Sign-In (Google) & Quick Demo Logins */}
          <div className="space-y-2">
            {/* Sign in with Google Button with Hover Lift Effect & Border Glow */}
            <button
              type="button"
              disabled={loading || demoLoading || googleLoading}
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-700 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] text-slate-200 text-xs font-bold flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
            >
              {googleLoading ? (
                <div className="flex items-center gap-2 animate-fade-scale">
                  <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                  <span>Connecting with Google...</span>
                </div>
              ) : (
                <>
                  {/* Official Google SVG Icon */}
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>

            {/* Instant 1-Click Demo Login with Continuous Soft Glow Pulse */}
            <button
              type="button"
              disabled={loading || demoLoading || googleLoading}
              onClick={() => handleQuickDemoLogin(role)}
              className="w-full py-2.5 px-4 rounded-xl bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/40 hover:border-purple-500/70 text-purple-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01] active:scale-95 animate-demo-pulse shadow-md"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 animate-sparkle" />
              <span>
                {demoLoading
                  ? 'Accessing Demo...'
                  : `1-Click Demo: ${isTeacher ? 'Prof. Alan Davis (Teacher)' : 'Alex Rivera (Student)'}`}
              </span>
            </button>
          </div>

          {/* Bottom Switch: Don't have an account? Sign up / Sign in with animated underline */}
          <div className="pt-2 text-center text-xs text-slate-400 border-t border-slate-800/80">
            {mode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError('');
                    setPassword('');
                    setPasswordTouched(false);
                  }}
                  className="font-bold text-purple-400 hover:text-purple-300 link-animated-underline cursor-pointer ml-1"
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                    const roleCreds = getSavedCredentials(role);
                    if (roleCreds) {
                      setEmail(roleCreds.email || '');
                      setPassword(roleCreds.password || '');
                      setRememberMe(true);
                    } else {
                      setPassword('');
                    }
                    setPasswordTouched(false);
                  }}
                  className="font-bold text-purple-400 hover:text-purple-300 link-animated-underline cursor-pointer ml-1"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
        </div>
      </div>

      {/* Forgot / Reset Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-scale">
          <div className="glass-login-card max-w-sm w-full rounded-3xl p-6 space-y-4 border border-white/20 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowForgotPassword(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1.5">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-heading font-black text-white">
                Set / Reset Password
              </h3>
              <p className="text-xs text-slate-400">
                Enter your account email and new password to immediately update your credentials and sign in.
              </p>
            </div>

            {resetError && (
              <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="input-ai-focus w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter new password (min 4 chars)"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="input-ai-focus w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {resetLoading ? 'Updating Password...' : 'Reset Password & Sign In'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Google Sign-In Account Selector Modal */}
      <GoogleSignInModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onGoogleSuccess={handleGoogleAuthSuccess}
        currentRole={role}
        onSwitchRole={(newRole) => setRole(newRole)}
      />
    </div>
  );
}

