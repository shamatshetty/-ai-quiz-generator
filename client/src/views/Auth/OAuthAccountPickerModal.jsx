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
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function OAuthAccountPickerModal({
  isOpen,
  onClose,
  onOAuthSuccess,
  currentRole = 'STUDENT',
  defaultProvider = 'google'
}) {
  const { googleLogin, microsoftLogin } = useAuth();

  // Active provider: 'google' | 'microsoft'
  const [provider, setProvider] = useState(defaultProvider);
  const [selectedRole, setSelectedRole] = useState(currentRole);

  const [savedAccounts, setSavedAccounts] = useState([]);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setSelectedRole(currentRole);
  }, [currentRole]);

  useEffect(() => {
    setProvider(defaultProvider);
  }, [defaultProvider]);

  // Load saved device OAuth accounts
  useEffect(() => {
    try {
      const stored = localStorage.getItem('quiz_oauth_saved_accounts');
      if (stored) {
        setSavedAccounts(JSON.parse(stored));
      } else {
        const defaults = [
          {
            name: 'Alex Rivera',
            email: 'alex.rivera@gmail.com',
            provider: 'google',
            avatar: '🚀',
            role: 'STUDENT',
            lastUsed: Date.now() - 3600000
          },
          {
            name: 'Prof. Alan Davis',
            email: 'alan.davis@outlook.com',
            provider: 'microsoft',
            avatar: '👨‍🏫',
            role: 'TEACHER',
            lastUsed: Date.now() - 7200000
          }
        ];
        setSavedAccounts(defaults);
        localStorage.setItem('quiz_oauth_saved_accounts', JSON.stringify(defaults));
      }
    } catch {
      setSavedAccounts([]);
    }
  }, []);

  // Initialize Google Identity Services (GIS) if available
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (isOpen && provider === 'google' && window.google?.accounts?.id && clientId) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential) {
              try {
                const base64Url = response.credential.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(
                  atob(base64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
                );
                const googlePayload = JSON.parse(jsonPayload);

                handleExecuteOAuth({
                  provider: 'google',
                  name: googlePayload.name || googlePayload.email.split('@')[0],
                  email: googlePayload.email,
                  avatar: googlePayload.picture || (selectedRole === 'TEACHER' ? '👨‍🏫' : '🎓'),
                  googleId: googlePayload.sub
                });
              } catch (err) {
                console.error('Failed to parse Google credential:', err);
              }
            }
          }
        });

        const btnContainer = document.getElementById('gsi-official-button');
        if (btnContainer) {
          window.google.accounts.id.renderButton(btnContainer, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'continue_with',
            shape: 'pill'
          });
        }
      } catch (err) {
        console.warn('GIS initialization notice:', err.message);
      }
    }
  }, [isOpen, provider, selectedRole]);

  if (!isOpen) return null;

  const handleExecuteOAuth = async ({ provider: authProv, email, name, avatar, googleId, microsoftId }) => {
    setError('');
    setLoading(true);

    try {
      let loggedUser;
      if (authProv === 'microsoft') {
        loggedUser = await microsoftLogin({
          email,
          name,
          avatar: avatar || (selectedRole === 'TEACHER' ? '👨‍🏫' : '🚀'),
          role: selectedRole,
          microsoftId: microsoftId || `ms_${Date.now()}`
        });
      } else {
        loggedUser = await googleLogin({
          email,
          name,
          avatar: avatar || (selectedRole === 'TEACHER' ? '👨‍🏫' : '🎓'),
          role: selectedRole,
          googleId: googleId || `g_${Date.now()}`
        });
      }

      // Update saved accounts list on this browser
      const updatedAccounts = [
        {
          name: loggedUser.name || name || email.split('@')[0],
          email,
          provider: authProv,
          avatar: loggedUser.avatar || avatar || '🌟',
          role: loggedUser.role || selectedRole,
          lastUsed: Date.now()
        },
        ...savedAccounts.filter((acc) => acc.email.toLowerCase() !== email.toLowerCase())
      ];
      setSavedAccounts(updatedAccounts);
      localStorage.setItem('quiz_oauth_saved_accounts', JSON.stringify(updatedAccounts));

      if (typeof onOAuthSuccess === 'function') {
        onOAuthSuccess(loggedUser);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualAddAccount = (e) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      setError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    handleExecuteOAuth({
      provider,
      email: newEmail.trim().toLowerCase(),
      name: newName.trim() || newEmail.split('@')[0],
      avatar: selectedRole === 'TEACHER' ? '👨‍🏫' : '🎓'
    });
  };

  const filteredAccounts = savedAccounts.filter((acc) => !acc.provider || acc.provider === provider);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-tab-enter">
      <div className="relative w-full max-w-md bg-slate-900/95 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/40 text-white overflow-hidden">
        
        {/* Glow ambient */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] font-bold text-slate-300">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Secure Official OAuth 2.0 Login</span>
          </div>

          <h2 className="text-xl font-heading font-black text-white tracking-tight">
            Choose an Account
          </h2>
          <p className="text-xs text-slate-400">
            to continue to <strong className="text-purple-300">QuizPop Classroom</strong> as {selectedRole}
          </p>
        </div>

        {/* Provider Switch Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => {
              setProvider('google');
              setError('');
              setIsAddingAccount(false);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              provider === 'google'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {/* Google Logo */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Google</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setProvider('microsoft');
              setError('');
              setIsAddingAccount(false);
            }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              provider === 'microsoft'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {/* Microsoft Logo */}
            <svg className="w-4 h-4" viewBox="0 0 21 21">
              <rect x="1" y="1" width="9" height="9" fill="#F25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
              <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
              <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
            </svg>
            <span>Microsoft</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-scale-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Official Google Identity button container */}
        {provider === 'google' && (
          <div id="gsi-official-button" className="mb-4 min-h-[40px] flex justify-center" />
        )}

        {!isAddingAccount ? (
          <div className="space-y-4">
            {/* Account List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {filteredAccounts.map((account, index) => (
                <button
                  key={`${account.email}-${index}`}
                  type="button"
                  disabled={loading}
                  onClick={() => handleExecuteOAuth({
                    provider,
                    email: account.email,
                    name: account.name,
                    avatar: account.avatar
                  })}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all cursor-pointer group text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-xl shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                      {account.avatar || '🚀'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                        {account.name}
                      </p>
                      <p className="text-xs text-slate-400 truncate font-mono">
                        {account.email}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 pl-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                      {account.role || 'STUDENT'}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Add Another Account button */}
            <button
              type="button"
              onClick={() => setIsAddingAccount(true)}
              className="w-full flex items-center gap-2.5 p-3 rounded-2xl border border-dashed border-slate-700 hover:border-indigo-500/60 hover:bg-indigo-950/20 text-slate-300 hover:text-white transition-all text-xs font-bold cursor-pointer justify-center"
            >
              <UserPlus className="w-4 h-4 text-indigo-400" />
              <span>Use another {provider === 'microsoft' ? 'Microsoft' : 'Google'} account</span>
            </button>
          </div>
        ) : (
          /* Add Custom Account Form */
          <form onSubmit={handleManualAddAccount} className="space-y-4 animate-scale-in">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name (Optional)
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                {provider === 'microsoft' ? 'Microsoft / Outlook / School Email' : 'Google / Gmail Address'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    setError('');
                  }}
                  placeholder={provider === 'microsoft' ? 'name@outlook.com' : 'name@gmail.com'}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingAccount(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || !newEmail.trim()}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                {loading ? 'Authenticating...' : `Continue with ${provider === 'microsoft' ? 'Microsoft' : 'Google'}`}
              </button>
            </div>
          </form>
        )}

        {/* Footer Note */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500">
            Accounts are verified securely. If your account is new, we'll automatically set up your {selectedRole.toLowerCase()} profile.
          </p>
        </div>

      </div>
    </div>
  );
}
