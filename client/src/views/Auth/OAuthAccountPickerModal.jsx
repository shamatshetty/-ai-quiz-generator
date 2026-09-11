import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  Check,
  Sparkles,
  Shield,
  ArrowRight,
  User,
  Mail,
  AlertCircle,
  Laptop,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Official Google Letter Avatar Color Palette
const GOOGLE_COLORS = [
  'bg-[#4285F4]', // Google Blue
  'bg-[#EA4335]', // Google Red
  'bg-[#FBBC05] text-slate-950', // Google Yellow
  'bg-[#34A853]', // Google Green
  'bg-purple-600',
  'bg-indigo-600'
];

const getGoogleColor = (str = '') => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GOOGLE_COLORS[Math.abs(hash) % GOOGLE_COLORS.length];
};

export default function OAuthAccountPickerModal({
  isOpen,
  onClose,
  onOAuthSuccess,
  currentRole = 'STUDENT'
}) {
  const { googleLogin, getGoogleDeviceAccounts } = useAuth();

  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [deviceAccounts, setDeviceAccounts] = useState([]);
  const [isAddingAnother, setIsAddingAnother] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setSelectedRole(currentRole);
  }, [currentRole]);

  // Discover and aggregate Google accounts present on this device / browser
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setError('');
    setIsAddingAnother(false);
    setNewEmail('');
    setNewName('');

    const loadAccounts = async () => {
      const accountMap = new Map();

      // 1. Check local storage for previously used Google accounts on this device
      try {
        const stored = localStorage.getItem('quiz_google_device_accounts');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            parsed.forEach((acc) => {
              if (acc.email) {
                accountMap.set(acc.email.toLowerCase(), {
                  ...acc,
                  email: acc.email.toLowerCase(),
                  source: 'device'
                });
              }
            });
          }
        }
      } catch (e) {
        console.warn('Error reading device Google accounts:', e);
      }

      // 2. Check remembered credentials from localStorage
      try {
        const savedCreds = localStorage.getItem('quiz_remember_me');
        if (savedCreds) {
          const parsed = JSON.parse(savedCreds);
          if (parsed.email && parsed.email.includes('@')) {
            const normalized = parsed.email.toLowerCase();
            if (!accountMap.has(normalized)) {
              accountMap.set(normalized, {
                name: parsed.email.split('@')[0],
                email: normalized,
                avatar: parsed.role === 'TEACHER' ? '👨‍🏫' : '🚀',
                role: parsed.role || selectedRole,
                source: 'device'
              });
            }
          }
        }
      } catch (e) {
        console.warn('Error reading saved credentials:', e);
      }

      // 3. Fetch known Google/Gmail accounts registered on this system
      try {
        if (typeof getGoogleDeviceAccounts === 'function') {
          const serverAccounts = await getGoogleDeviceAccounts();
          if (Array.isArray(serverAccounts)) {
            serverAccounts.forEach((acc) => {
              if (acc.email) {
                const normalized = acc.email.toLowerCase();
                if (!accountMap.has(normalized)) {
                  accountMap.set(normalized, {
                    name: acc.name || normalized.split('@')[0],
                    email: normalized,
                    avatar: acc.avatar || (acc.role === 'TEACHER' ? '👨‍🏫' : '🚀'),
                    role: acc.role || selectedRole,
                    source: 'device'
                  });
                }
              }
            });
          }
        }
      } catch (e) {
        console.warn('Error fetching server Google accounts:', e);
      }

      // Fallback: If no account detected at all, supply initial profile
      if (accountMap.size === 0) {
        accountMap.set('alex.rivera@gmail.com', {
          name: 'Alex Rivera',
          email: 'alex.rivera@gmail.com',
          avatar: '🚀',
          role: 'STUDENT',
          source: 'device'
        });
      }

      if (isMounted) {
        const accountsList = Array.from(accountMap.values());
        setDeviceAccounts(accountsList);
      }
    };

    loadAccounts();

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedRole]);

  // Google Identity Services (GIS) button and prompt initialization
  useEffect(() => {
    if (!isOpen) return;

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (window.google?.accounts?.id && clientId) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential) {
              handleGoogleCredential(response.credential);
            }
          },
          auto_select: false
        });

        const btnContainer = document.getElementById('gsi-official-native-btn');
        if (btnContainer) {
          window.google.accounts.id.renderButton(btnContainer, {
            theme: 'filled_blue',
            size: 'large',
            width: 320,
            text: 'continue_with',
            shape: 'pill'
          });
        }

        // Prompt Google One Tap natively if available
        window.google.accounts.id.prompt();
      } catch (err) {
        console.warn('GIS notice:', err.message);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Google Token Credential from GIS
  const handleGoogleCredential = (credential) => {
    try {
      const base64Url = credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const googlePayload = JSON.parse(jsonPayload);

      executeGoogleLogin({
        email: googlePayload.email,
        name: googlePayload.name || googlePayload.email.split('@')[0],
        avatar: googlePayload.picture,
        googleId: googlePayload.sub,
        token: credential
      });
    } catch (err) {
      console.error('Failed to parse Google credential token:', err);
    }
  };

  // Perform Google Sign-In or Sign-Up through the selected account
  const executeGoogleLogin = async ({ email, name, avatar, googleId, token }) => {
    setError('');
    setLoading(true);
    setLoadingEmail(email);

    try {
      const loggedUser = await googleLogin({
        email: email.trim().toLowerCase(),
        name: name || email.split('@')[0],
        avatar: avatar || (selectedRole === 'TEACHER' ? '👨‍🏫' : '🚀'),
        role: selectedRole,
        googleId: googleId || `g_${Date.now()}`,
        token
      });

      // Save to device Google accounts list for instant 1-click logins
      const newEntry = {
        name: loggedUser.name || name || email.split('@')[0],
        email: email.trim().toLowerCase(),
        avatar: loggedUser.avatar || avatar || '🌟',
        role: loggedUser.role || selectedRole,
        lastUsed: Date.now()
      };

      const updated = [
        newEntry,
        ...deviceAccounts.filter((acc) => acc.email.toLowerCase() !== email.toLowerCase())
      ];
      localStorage.setItem('quiz_google_device_accounts', JSON.stringify(updated));

      if (typeof onOAuthSuccess === 'function') {
        onOAuthSuccess(loggedUser);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
      setLoadingEmail(null);
    }
  };

  // Handle "Use another account" submission
  const handleAddNewAccountSubmit = (e) => {
    e.preventDefault();
    const cleanEmail = newEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your Google / Gmail address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    executeGoogleLogin({
      email: cleanEmail,
      name: newName.trim() || cleanEmail.split('@')[0],
      avatar: selectedRole === 'TEACHER' ? '👨‍🏫' : '🚀'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-tab-enter">
      <div className="relative w-full max-w-md bg-slate-900/95 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-blue-950/40 text-white overflow-hidden">
        
        {/* Soft Google Blue & Purple Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Google Header */}
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
              Choose an account
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              to continue to <strong className="text-purple-300">QuizPop Classroom</strong> as{' '}
              <span className="text-emerald-400 font-bold uppercase">{selectedRole}</span>
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5 animate-scale-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* Native GSI button container if active */}
        <div id="gsi-official-native-btn" className="empty:hidden mb-4 flex justify-center" />

        {/* Google Accounts Present on Device */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-blue-400" />
              <span>Google Accounts on this Device</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-500">
              {deviceAccounts.length} found
            </span>
          </div>

          {/* List of Accounts */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {deviceAccounts.map((account, index) => {
              const isItemLoading = loading && loadingEmail === account.email;
              const firstLetter = (account.name || account.email || 'G').charAt(0).toUpperCase();
              const colorBg = getGoogleColor(account.email);

              return (
                <button
                  key={`${account.email}-${index}`}
                  type="button"
                  disabled={loading}
                  onClick={() => executeGoogleLogin({
                    email: account.email,
                    name: account.name,
                    avatar: account.avatar
                  })}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950/70 border border-slate-800/90 hover:border-blue-500/60 hover:bg-slate-800/90 transition-all duration-200 cursor-pointer group text-left shadow-sm hover:shadow-md hover:shadow-blue-500/10 disabled:opacity-50"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Account Avatar or Google Colored Initial */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white shadow-inner shrink-0 group-hover:scale-105 transition-transform ${colorBg}`}
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
                        <span>{firstLetter}</span>
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

                  <div className="shrink-0 pl-2 flex items-center gap-2">
                    {isItemLoading ? (
                      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        <Check className="w-3 h-3 text-blue-400" />
                        <span>Sign In</span>
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* "Use another account" Accordion / Toggle */}
          {!isAddingAnother ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => setIsAddingAnother(true)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl border border-dashed border-slate-700/90 hover:border-blue-500/60 hover:bg-blue-950/20 text-slate-300 hover:text-white transition-all text-xs font-bold cursor-pointer justify-center"
            >
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400">
                <UserPlus className="w-3.5 h-3.5" />
              </div>
              <span>Use another Google account</span>
            </button>
          ) : (
            /* Inline Form to Add Another Google Account */
            <form onSubmit={handleAddNewAccountSubmit} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 animate-scale-in">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-blue-400" />
                  <span>Enter Google Account</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingAnother(false)}
                  className="text-[11px] text-slate-400 hover:text-white font-semibold"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Google / Gmail Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={newEmail}
                    onChange={(e) => {
                      setNewEmail(e.target.value);
                      setError('');
                    }}
                    placeholder="yourname@gmail.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Full Name (Optional)
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading || !newEmail.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Signing in with Google...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue with Google</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Google Official Disclaimer Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            To continue, Google will share your name, email address, and profile picture with{' '}
            <strong className="text-slate-300">QuizPop Classroom</strong>.
          </p>
        </div>

      </div>
    </div>
  );
}
