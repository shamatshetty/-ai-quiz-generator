import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  KeyRound,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  initialEmail = '',
  onSuccessRedirect
}) {
  const { requestPasswordReset, verifyResetToken, confirmPasswordReset } = useAuth();

  // Steps: 'request' | 'verify_and_reset' | 'success'
  const [step, setStep] = useState('request');

  const [email, setEmail] = useState(initialEmail || '');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEmailNotFound, setIsEmailNotFound] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Timer for 15-minute expiration
  const [remainingTime, setRemainingTime] = useState(15 * 60);

  useEffect(() => {
    if (isOpen) {
      if (initialEmail) setEmail(initialEmail);
      setError('');
      setIsEmailNotFound(false);
    } else {
      // Reset on close
      setTimeout(() => {
        setStep('request');
        setOtpCode('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setIsEmailNotFound(false);
      }, 200);
    }
  }, [isOpen, initialEmail]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Expiration countdown in step 2
  useEffect(() => {
    if (step !== 'verify_and_reset') return;
    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setError('Verification code has expired. Please request a new one.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  if (!isOpen) return null;

  const formatRemainingTime = () => {
    const mins = Math.floor(remainingTime / 60);
    const secs = remainingTime % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Step 1: Send Reset Link & OTP
  const handleSendReset = async (e) => {
    e?.preventDefault();
    if (!email.trim()) {
      setError('Please enter your registered email address');
      return;
    }

    setError('');
    setIsEmailNotFound(false);
    setLoading(true);

    try {
      await requestPasswordReset(email.trim());
      setStep('verify_and_reset');
      setRemainingTime(15 * 60);
      setResendCooldown(60); // 60s cooldown before next resend
    } catch (err) {
      if (err.code === 'EMAIL_NOT_FOUND' || err.message?.includes('not registered')) {
        setIsEmailNotFound(true);
        setError('This email is not registered. Please sign up first.');
      } else if (err.code === 'RATE_LIMIT_EXCEEDED') {
        setError(err.message || 'Too many attempts. Please wait a few minutes.');
      } else {
        setError(err.message || 'Failed to send reset code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend Code
  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;
    setError('');
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setRemainingTime(15 * 60);
      setResendCooldown(60);
    } catch (err) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Confirm Reset & Set New Password
  const handleResetPassword = async (e) => {
    e?.preventDefault();

    if (!otpCode.trim() || otpCode.trim().length < 6) {
      setError('Please enter the 6-digit verification code from your email');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please check again.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await confirmPasswordReset({
        email: email.trim(),
        otpCode: otpCode.trim(),
        newPassword: newPassword.trim()
      });

      setStep('success');
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please check your verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    onClose();
    if (typeof onSuccessRedirect === 'function') {
      onSuccessRedirect(email.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-tab-enter">
      <div className="relative w-full max-w-md bg-slate-900/95 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/40 text-white overflow-hidden">
        
        {/* Subtle Ambient Accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ================= STEP 1: REQUEST CODE ================= */}
        {step === 'request' && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-heading font-black text-white tracking-tight">
                  Forgot Password?
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  Enter your email to receive a secure reset code
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-scale-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">{error}</p>
                  {isEmailNotFound && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (typeof onSuccessRedirect === 'function') {
                          onSuccessRedirect(email.trim(), 'register');
                        }
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
                    >
                      <span>Go to Sign Up</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSendReset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                      setIsEmailNotFound(false);
                    }}
                    placeholder="student@classroom.edu"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-sm font-bold shadow-lg shadow-purple-600/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Checking Email...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Reset Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= STEP 2: ENTER OTP & NEW PASSWORD ================= */}
        {step === 'verify_and_reset' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('request')}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Email</span>
              </button>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatRemainingTime()}</span>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-heading font-black text-white tracking-tight">
                Enter Verification Code
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                We sent a 6-digit code to <span className="text-purple-300 font-semibold">{email}</span>
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-scale-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <p className="font-semibold">{error}</p>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* 6-Digit OTP */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setOtpCode(val);
                    setError('');
                  }}
                  placeholder="123456"
                  className="w-full text-center py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-purple-300 placeholder-slate-600 text-2xl font-black font-mono tracking-[0.5em] focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                />
                <div className="flex items-center justify-end mt-1.5">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || loading}
                    className="text-xs text-slate-400 hover:text-purple-400 disabled:opacity-50 inline-flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    <span>{resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}</span>
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-10 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Repeat new password"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || otpCode.length < 6 || !newPassword}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-sm font-bold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= STEP 3: SUCCESS ================= */}
        {step === 'success' && (
          <div className="text-center py-4 space-y-5 animate-scale-in">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-heading font-black text-white">
                Password Reset Complete!
              </h2>
              <p className="text-sm text-slate-300 font-medium max-w-sm mx-auto leading-relaxed">
                Password updated successfully. Please log in with your new password.
              </p>
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={handleFinish}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <span>Back to Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
