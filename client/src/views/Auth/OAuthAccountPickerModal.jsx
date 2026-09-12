import React, { useState, useEffect } from 'react';
import {
  X,
  AlertCircle,
  ChevronDown,
  ExternalLink,
  Laptop,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function OAuthAccountPickerModal({
  isOpen,
  onClose,
  onOAuthSuccess,
  currentRole = 'STUDENT'
}) {
  const { googleLogin, getGoogleDeviceAccounts } = useAuth();

  const [emailInput, setEmailInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [deviceAccounts, setDeviceAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Discover accounts on device
  useEffect(() => {
    if (!isOpen) return;

    setError('');
    setEmailInput('');
    setIsFocused(false);
    let isMounted = true;

    const fetchAccounts = async () => {
      const accountMap = new Map();

      // Check localStorage
      try {
        const stored = localStorage.getItem('quiz_google_device_accounts');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            parsed.forEach((acc) => {
              if (acc.email) {
                accountMap.set(acc.email.toLowerCase(), acc);
              }
            });
          }
        }
      } catch (e) {
        console.warn('Local accounts read notice:', e);
      }

      // Check server
      try {
        if (typeof getGoogleDeviceAccounts === 'function') {
          const serverAccounts = await getGoogleDeviceAccounts();
          if (Array.isArray(serverAccounts)) {
            serverAccounts.forEach((acc) => {
              if (acc.email) {
                accountMap.set(acc.email.toLowerCase(), acc);
              }
            });
          }
        }
      } catch (e) {
        console.warn('Server accounts read notice:', e);
      }

      if (isMounted) {
        setDeviceAccounts(Array.from(accountMap.values()));
      }
    };

    fetchAccounts();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleSubmit = async (e) => {
    e?.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Enter an email or phone number');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError("Couldn't find your Google Account. Please enter a valid email.");
      return;
    }

    setError('');
    setLoading(true);

    try {
      const displayName = cleanEmail.split('@')[0];
      const loggedUser = await googleLogin({
        email: cleanEmail,
        name: displayName,
        avatar: currentRole === 'TEACHER' ? '👨‍🏫' : '🚀',
        role: currentRole
      });

      // Save to device accounts
      const newEntry = {
        name: loggedUser.name || displayName,
        email: cleanEmail,
        avatar: loggedUser.avatar || (currentRole === 'TEACHER' ? '👨‍🏫' : '🚀'),
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
      setError(err.message || "Couldn't find your Google Account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-tab-enter font-sans select-none">
      {/* Outer wrapper replicating the authentic Google Sign-in Window */}
      <div className="relative w-full max-w-[450px] bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-[#dadce0] text-[#202124] overflow-hidden">
        
        {/* Top Google animated progress bar when loading */}
        {loading && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#e8f0fe] overflow-hidden">
            <div className="h-full bg-[#1a73e8] animate-[pulse_1s_infinite_ease-in-out] w-full" />
          </div>
        )}

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. Official Google 4-Color Logo */}
        <div className="mb-4">
          <svg className="w-12 h-12" viewBox="0 0 24 24">
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

        {/* 2. Heading & Subtitle */}
        <div className="space-y-1 mb-7 text-left">
          <h1 className="text-2xl sm:text-[28px] font-normal text-[#202124] tracking-tight">
            Sign in
          </h1>
          <p className="text-sm sm:text-base text-[#202124] font-normal">
            Use your Google Account
          </p>
        </div>

        {/* Quick Accounts on Device (if available) */}
        {deviceAccounts.length > 0 && (
          <div className="mb-5 p-2.5 rounded-2xl bg-[#f8fafd] border border-[#dadce0] space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#5f6368] px-1 flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-[#1a73e8]" />
              <span>Accounts on this device</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {deviceAccounts.map((acc, idx) => (
                <button
                  key={`${acc.email}-${idx}`}
                  type="button"
                  onClick={() => setEmailInput(acc.email)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                    emailInput === acc.email
                      ? 'bg-[#e8f0fe] text-[#1a73e8] border-[#1a73e8]'
                      : 'bg-white text-[#3c4043] border-[#dadce0] hover:bg-[#f1f3f4]'
                  }`}
                >
                  <span className="font-semibold">{acc.name || acc.email.split('@')[0]}</span>
                  <span className="text-[#5f6368] text-[11px]">({acc.email})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. Form: Exact Google Material Outlined Text Field */}
        <form onSubmit={handleGoogleSubmit} className="space-y-2">
          <div className="relative pt-1">
            <input
              id="google-account-email-input"
              type="text"
              autoFocus
              required
              value={emailInput}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={(e) => {
                setEmailInput(e.target.value);
                setError('');
              }}
              placeholder=" "
              className={`w-full px-4 py-3.5 text-base text-[#202124] bg-white rounded-[4px] outline-none transition-all duration-200 ${
                error
                  ? 'border-2 border-[#d93025]'
                  : isFocused || emailInput
                  ? 'border-2 border-[#1a73e8]'
                  : 'border border-[#747775] hover:border-[#202124]'
              }`}
            />
            {/* Google floating notched label */}
            <label
              htmlFor="google-account-email-input"
              className={`absolute left-3 transition-all duration-150 pointer-events-none px-1 bg-white leading-none ${
                isFocused || emailInput
                  ? '-top-1 text-xs font-medium ' + (error ? 'text-[#d93025]' : 'text-[#1a73e8]')
                  : 'top-4 text-base text-[#444746]'
              }`}
            >
              Email or phone
            </label>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-1.5 pt-1 text-xs text-[#d93025] font-normal animate-scale-in">
              <AlertCircle className="w-3.5 h-3.5 text-[#d93025] shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Forgot email link */}
          <div className="pt-1 text-left">
            <button
              type="button"
              onClick={() => {
                onClose();
                // User can click Forgot password on login card
              }}
              className="text-sm font-medium text-[#1a73e8] hover:text-[#174ea6] transition-colors cursor-pointer"
            >
              Forgot email?
            </button>
          </div>

          {/* Guest mode privacy notice */}
          <div className="text-sm text-[#5f6368] leading-relaxed pt-7 text-left space-y-1">
            <p>Not your computer? Use Guest mode to sign in privately.</p>
            <p className="text-[#1a73e8] font-medium hover:underline cursor-pointer">
              Learn more about using Guest mode
            </p>
          </div>

          {/* Action buttons: Create account & Next */}
          <div className="flex items-center justify-between pt-8">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-[#1a73e8] hover:bg-[#f8fafd] hover:text-[#174ea6] px-3 py-2 rounded-md transition-colors cursor-pointer"
            >
              Create account
            </button>

            <button
              type="submit"
              disabled={loading || !emailInput.trim()}
              className="px-6 py-2.5 rounded-full bg-[#1a73e8] hover:bg-[#1b66c9] active:bg-[#174ea6] text-white text-sm font-medium transition-colors shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <span>Next</span>
              )}
            </button>
          </div>
        </form>

        {/* 4. Footer outside/inside: Language & Google Legal links */}
        <div className="mt-8 pt-4 border-t border-[#f1f3f4] flex items-center justify-between text-xs text-[#5f6368]">
          <div className="flex items-center gap-1 cursor-pointer hover:text-[#202124]">
            <span>English (United States)</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-4 text-xs font-normal">
            <a
              href="https://support.google.com/accounts"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#202124] transition-colors"
            >
              Help
            </a>
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#202124] transition-colors"
            >
              Privacy
            </a>
            <a
              href="https://policies.google.com/terms"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#202124] transition-colors"
            >
              Terms
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
