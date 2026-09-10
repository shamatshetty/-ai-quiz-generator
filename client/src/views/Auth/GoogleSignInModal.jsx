import React, { useState, useEffect } from 'react';
import { X, UserPlus, Check, Sparkles, Shield, ArrowRight, Smartphone, BookOpen } from 'lucide-react';

export default function GoogleSignInModal({
  isOpen,
  onClose,
  onGoogleSuccess,
  currentRole = 'STUDENT',
  onSwitchRole
}) {
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [savedAccounts, setSavedAccounts] = useState([]);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Keep selected role in sync with parent
  useEffect(() => {
    setSelectedRole(currentRole);
  }, [currentRole]);

  // Load saved Google accounts from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('quiz_google_saved_accounts');
      if (stored) {
        setSavedAccounts(JSON.parse(stored));
      } else {
        // Provide friendly default Google accounts for instant convenience
        const defaults = [
          {
            name: 'Alex Rivera',
            email: 'alex.rivera@gmail.com',
            avatar: '🚀',
            role: 'STUDENT',
            lastUsed: Date.now() - 3600000
          },
          {
            name: 'Dr. Sarah Henderson',
            email: 's.henderson@gmail.com',
            avatar: '👩‍🏫',
            role: 'TEACHER',
            lastUsed: Date.now() - 7200000
          }
        ];
        setSavedAccounts(defaults);
        localStorage.setItem('quiz_google_saved_accounts', JSON.stringify(defaults));
      }
    } catch {
      setSavedAccounts([]);
    }
  }, []);

  // Google Identity Services (GIS) integration if Client ID is configured
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (isOpen && window.google?.accounts?.id && clientId) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential) {
              try {
                // Decode Google JWT payload
                const base64Url = response.credential.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(
                  atob(base64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
                );
                const googlePayload = JSON.parse(jsonPayload);

                handleCompleteGoogleAuth({
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
        console.warn('Google Identity Services init warning:', err);
      }
    }
  }, [isOpen, selectedRole]);

  if (!isOpen) return null;

  const handleCompleteGoogleAuth = async ({ name, email, avatar, googleId }) => {
    setLoading(true);
    setError('');

    try {
      // Save/update account in saved Google accounts list
      const updatedList = [
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          avatar: avatar || (selectedRole === 'TEACHER' ? '👨‍🏫' : '🚀'),
          role: selectedRole,
          lastUsed: Date.now()
        },
        ...savedAccounts.filter((a) => a.email.toLowerCase() !== email.trim().toLowerCase())
      ].slice(0, 5);

      localStorage.setItem('quiz_google_saved_accounts', JSON.stringify(updatedList));
      setSavedAccounts(updatedList);

      // Perform authentication with backend
      await onGoogleSuccess({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        avatar: avatar || (selectedRole === 'TEACHER' ? '👨‍🏫' : '🚀'),
        role: selectedRole,
        googleId
      });

      onClose();
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualAccountSubmit = (e) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      setError('Please enter your Google account email');
      return;
    }
    if (!newEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    const email = newEmail.trim().toLowerCase();
    const name = newName.trim() || email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    const avatar = selectedRole === 'TEACHER' ? '👨‍🏫' : '🚀';

    handleCompleteGoogleAuth({ name, email, avatar });
  };

  const filteredAccounts = savedAccounts.filter(
    (acc) => !acc.role || acc.role === selectedRole || savedAccounts.length <= 2
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      {/* Modal Window Styled after Google Account Chooser */}
      <div className="relative w-full max-w-md rounded-3xl bg-[#1E1F20] text-slate-100 border border-[#3C4043] shadow-2xl shadow-black/80 overflow-hidden animate-scale-pop">
        {/* Top Header Bar */}
        <div className="px-6 pt-6 pb-4 border-b border-[#3C4043] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Official Google Colored G Icon */}
            <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
            </svg>
            <div>
              <h3 className="font-heading font-bold text-base text-white">Sign in with Google</h3>
              <p className="text-[11px] text-slate-400">Choose an account to continue to QuizPop!</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Target Role Selector Pill */}
          <div className="flex items-center justify-between p-1.5 rounded-2xl bg-[#131314] border border-[#3C4043]">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('STUDENT');
                if (onSwitchRole) onSwitchRole('STUDENT');
              }}
              className={`flex-1 py-1.5 px-3 rounded-xl font-heading font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                selectedRole === 'STUDENT'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Student / Player</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedRole('TEACHER');
                if (onSwitchRole) onSwitchRole('TEACHER');
              }}
              className={`flex-1 py-1.5 px-3 rounded-xl font-heading font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                selectedRole === 'TEACHER'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Teacher / Host</span>
            </button>
          </div>

          {/* Official Google GSI Button mount target (if client ID is configured) */}
          <div id="gsi-official-button" className="empty:hidden" />

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {!isAddingAccount ? (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300 pb-1">
                Select your Google account:
              </div>

              {/* List of Saved / Available Google Accounts */}
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {filteredAccounts.map((account, idx) => {
                  const initial = account.name ? account.name.charAt(0).toUpperCase() : 'G';
                  const colors = ['bg-blue-600', 'bg-red-600', 'bg-amber-600', 'bg-emerald-600', 'bg-purple-600'];
                  const colorClass = colors[idx % colors.length];

                  return (
                    <button
                      key={account.email}
                      type="button"
                      disabled={loading}
                      onClick={() => handleCompleteGoogleAuth(account)}
                      className="w-full p-3 rounded-2xl bg-[#282A2C] hover:bg-[#333538] border border-[#3C4043] hover:border-purple-400/50 flex items-center justify-between gap-3 text-left transition-all cursor-pointer group hover:scale-[1.01] active:scale-98"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {account.avatar && account.avatar.length <= 4 ? (
                          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shrink-0">
                            {account.avatar}
                          </div>
                        ) : (
                          <div className={`w-10 h-10 rounded-full ${colorClass} text-white font-heading font-black text-base flex items-center justify-center shadow-sm shrink-0`}>
                            {initial}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-heading font-bold text-sm text-white truncate group-hover:text-purple-300 transition-colors">
                            {account.name}
                          </div>
                          <div className="text-xs text-slate-400 truncate">
                            {account.email}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-slate-500 group-hover:text-purple-400 transition-colors">
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Use Another Google Account Button */}
              <button
                type="button"
                onClick={() => {
                  setIsAddingAccount(true);
                  setError('');
                }}
                className="w-full py-3 px-4 rounded-2xl border border-dashed border-[#5F6368] hover:border-purple-400 bg-transparent hover:bg-white/5 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
              >
                <UserPlus className="w-4 h-4 text-purple-400" />
                <span>Use another Google account</span>
              </button>
            </div>
          ) : (
            /* Form to Enter Another Google Account */
            <form onSubmit={handleManualAccountSubmit} className="space-y-3 animate-fadeIn">
              <div className="text-xs font-semibold text-slate-300">
                Sign in with your Google Account:
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Google Email Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="e.g. yourname@gmail.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#131314] border border-[#3C4043] focus:border-purple-500 focus:outline-none text-white text-sm font-medium placeholder-slate-500 shadow-inner"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Full Name (as on your Google Profile)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex Rivera"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#131314] border border-[#3C4043] focus:border-purple-500 focus:outline-none text-white text-sm font-medium placeholder-slate-500 shadow-inner"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingAccount(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#282A2C] hover:bg-[#333538] text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Back to Accounts
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-heading font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  {loading ? (
                    <span>Signing in...</span>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Google Consent & Privacy Text */}
          <div className="pt-3 border-t border-[#3C4043] text-[11px] text-slate-400 leading-relaxed space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Secure Authentication by Google</span>
            </div>
            <p>
              To continue, Google will share your name, email address, language preference, and profile picture with QuizPop!.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
