import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  User,
  ArrowRight,
  Shield,
  Laptop,
  Check,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Official Google Letter Avatar Palette
const GOOGLE_PALETTE = [
  'bg-[#4285F4]', // Google Blue
  'bg-[#EA4335]', // Google Red
  'bg-[#FBBC05] text-slate-950', // Google Yellow
  'bg-[#34A853]'  // Google Green
];

const getAvatarColor = (str = '') => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GOOGLE_PALETTE[Math.abs(hash) % GOOGLE_PALETTE.length];
};

export default function OAuthAccountPickerModal({
  isOpen,
  onClose,
  onOAuthSuccess,
  currentRole = 'STUDENT'
}) {
  const { googleLogin, getGoogleDeviceAccounts } = useAuth();

  const [deviceAccounts, setDeviceAccounts] = useState([]);
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeAccountEmail, setActiveAccountEmail] = useState(null);
  const [error, setError] = useState('');

  // Discover and load Google accounts on this device
  useEffect(() => {
    if (!isOpen) return;

    setError('');
    setEmailInput('');
    setNameInput('');
    let isMounted = true;

    const loadAccounts = async () => {
      const accountMap = new Map();

      // 1. Read locally cached device Google accounts
      try {
        const stored = localStorage.getItem('quiz_google_device_accounts');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            parsed.forEach((acc) => {
              if (acc.email) {
                accountMap.set(acc.email.toLowerCase(), {
                  name: acc.name || acc.email.split('@')[0],
                  email: acc.email.toLowerCase(),
                  avatar: acc.avatar || (currentRole === 'TEACHER' ? '👨‍🏫' : '🚀'),
                  role: acc.role || currentRole
                });
              }
            });
          }
        }
      } catch (e) {
        console.warn('Local accounts read notice:', e);
      }

      // 2. Fetch registered Google/Gmail accounts from server
      try {
        if (typeof getGoogleDeviceAccounts === 'function') {
          const serverAccounts = await getGoogleDeviceAccounts();
          if (Array.isArray(serverAccounts)) {
            serverAccounts.forEach((acc) => {
              if (acc.email) {
                const norm = acc.email.toLowerCase();
                if (!accountMap.has(norm)) {
                  accountMap.set(norm, {
                    name: acc.name || norm.split('@')[0],
                    email: norm,
                    avatar: acc.avatar || (currentRole === 'TEACHER' ? '👨‍🏫' : '🚀'),
                    role: acc.role || currentRole
                  });
                }
              }
            });
          }
        }
      } catch (e) {
        console.warn('Server accounts notice:', e);
      }

      if (isMounted) {
        setDeviceAccounts(Array.from(accountMap.values()));
      }
    };

    loadAccounts();

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentRole]);

  if (!isOpen) return null;

  // Execute sign in or auto-registration through Google email ID
  const handleSignInWithGoogleEmail = async (targetEmail, targetName, targetAvatar) => {
    const cleanEmail = (targetEmail || emailInput || '').trim().toLowerCase();

    if (!cleanEmail) {
      setError('Please enter your Google / Gmail address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address (e.g. name@gmail.com)');
      return;
    }

    setError('');
    setLoading(true);
    setActiveAccountEmail(cleanEmail);

    try {
      const displayName = targetName || nameInput.trim() || cleanEmail.split('@')[0];
      const userAvatar = targetAvatar || (currentRole === 'TEACHER' ? '👨‍🏫' : '🎓');

      const loggedUser = await googleLogin({
        email: cleanEmail,
        name: displayName,
        avatar: userAvatar,
        role: currentRole
      });

      // Save to device Google accounts list for instant 1-click logins next time
      const newEntry = {
        name: loggedUser.name || displayName,
        email: cleanEmail,
        avatar: loggedUser.avatar || userAvatar,
        role: loggedUser.role || currentRole,
        lastUsed: Date.now()
      };

      const updated = [
        newEntry,
        ...deviceAccounts.filter((a) => a.email.toLowerCase() !== cleanEmail)
      ];
      localStorage.setItem('quiz_google_device_accounts', JSON.stringify(updated));

      if (typeof onOAuthSuccess === 'function') {
        onOAuthSuccess(loggedUser);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please verify your email.');
    } finally {
      setLoading(false);
      setActiveAccountEmail(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-tab-enter">
      <div className="relative w-full max-w-md bg-slate-900/95 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-blue-950/40 text-white overflow-hidden">
        
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-3 mb-6">
          {/* Official Google "G" Logo Pill */}
          <div className="w-12 h-12 mx-auto rounded-2xl bg-white shadow-lg flex items-center justify-center p-2.5">
            <svg className="w-full h-full" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          </div>

          <div>
            <h2 className="text-xl font-heading font-black text-white tracking-tight">
              Sign in with Google
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Continue to <strong className="text-purple-300">QuizPop Classroom</strong> as{' '}
              <span className="text-emerald-400 font-bold uppercase">{currentRole}</span>
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5 animate-scale-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <p className="font-semibold leading-relaxed">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Section 1: Detected Google Accounts on Device (if any) */}
          {deviceAccounts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-blue-400" />
                  <span>Choose Google Account</span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium">1-Click Sign In</span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {deviceAccounts.map((account, index) => {
                  const isAccountLoading = loading && activeAccountEmail === account.email;
                  const firstChar = (account.name || account.email || 'G').charAt(0).toUpperCase();
                  const avatarBg = getAvatarColor(account.email);

                  return (
                    <button
                      key={`${account.email}-${index}`}
                      type="button"
                      disabled={loading}
                      onClick={() => handleSignInWithGoogleEmail(account.email, account.name, account.avatar)}
                      className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-blue-500/60 hover:bg-slate-800/90 transition-all duration-200 cursor-pointer group text-left shadow-sm disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white shadow-inner shrink-0 group-hover:scale-105 transition-transform ${avatarBg}`}
                        >
                          {account.avatar && !account.avatar.startsWith('http') ? (
                            <span className="text-xl">{account.avatar}</span>
                          ) : account.avatar && account.avatar.startsWith('http') ? (
                            <img
                              src={account.avatar}
                              alt={account.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span>{firstChar}</span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-white truncate group-hover:text-blue-300 transition-colors">
                            {account.name || account.email.split('@')[0]}
                          </p>
                          <p className="text-xs text-slate-400 truncate font-mono">
                            {account.email}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 pl-2">
                        {isAccountLoading ? (
                          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            <span>Sign In</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="relative py-2 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <span className="relative px-3 bg-slate-900 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  or enter email
                </span>
              </div>
            </div>
          )}

          {/* Section 2: Enter Google / Gmail Address Directly */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSignInWithGoogleEmail();
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Google / Gmail Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  autoFocus={deviceAccounts.length === 0}
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    setError('');
                  }}
                  placeholder="name@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name (Optional)
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Shamat"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !emailInput.trim()}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white font-heading font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer hover:scale-[1.01] active:scale-95 disabled:opacity-50 mt-1"
            >
              {loading && !activeAccountEmail ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in with Google...</span>
                </>
              ) : (
                <>
                  <span>Sign In with Google</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            If your Google account is new, we'll automatically create your{' '}
            <strong className="text-slate-300">{currentRole.toLowerCase()}</strong> profile.
          </p>
        </div>

      </div>
    </div>
  );
}
