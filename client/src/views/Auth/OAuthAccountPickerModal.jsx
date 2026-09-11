import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Shield,
  ArrowRight,
  AlertCircle,
  Laptop,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function OAuthAccountPickerModal({
  isOpen,
  onClose,
  onOAuthSuccess,
  currentRole = 'STUDENT'
}) {
  const { googleLogin } = useAuth();

  // Retrieve Client ID from env or saved configuration
  const [clientId, setClientId] = useState(() => {
    return import.meta.env.VITE_GOOGLE_CLIENT_ID || localStorage.getItem('quiz_google_client_id') || '';
  });
  const [inputClientId, setInputClientId] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gisLoaded, setGisLoaded] = useState(false);

  const buttonContainerRef = useRef(null);

  // Check if Google Identity Services script is loaded
  useEffect(() => {
    if (!isOpen) return;

    setError('');
    const checkGis = () => {
      if (window.google?.accounts?.id) {
        setGisLoaded(true);
      }
    };

    checkGis();
    const interval = setInterval(checkGis, 300);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Initialize official Google Identity Services (GIS) when Client ID and SDK are available
  useEffect(() => {
    if (!isOpen || !clientId || !window.google?.accounts?.id) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId.trim(),
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        context: 'signin'
      });

      // Render official Google Sign-In Button
      const timer = setTimeout(() => {
        const btnContainer = document.getElementById('gsi-official-real-button');
        if (btnContainer && window.google?.accounts?.id) {
          btnContainer.innerHTML = '';
          window.google.accounts.id.renderButton(btnContainer, {
            type: 'standard',
            theme: 'filled_blue',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            width: 280,
            logo_alignment: 'left'
          });
        }
      }, 100);

      // Prompt Google One Tap natively (pops up real accounts on the device)
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('[GIS] Google One Tap dismissed or not displayed:', notification.getNotDisplayedReason());
        }
      });

      return () => clearTimeout(timer);
    } catch (err) {
      console.warn('GIS initialization error:', err);
    }
  }, [isOpen, clientId, gisLoaded]);

  if (!isOpen) return null;

  // Handle genuine Google ID Token from Google Identity Services
  const handleGoogleCredentialResponse = async (response) => {
    if (!response.credential) {
      setError('Google authentication was cancelled or did not return a valid credential.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Send genuine Google ID Token to backend for cryptographic verification
      const loggedUser = await googleLogin({
        credential: response.credential,
        role: currentRole
      });

      if (typeof onOAuthSuccess === 'function') {
        onOAuthSuccess(loggedUser);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Real Google authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Launch Google's official OAuth 2.0 Account Picker Popup Window
  const handleLaunchGooglePopup = () => {
    if (!clientId.trim()) {
      setShowConfig(true);
      return;
    }

    if (!window.google?.accounts?.oauth2) {
      setError('Google Identity Services SDK is still loading. Please wait a moment and try again.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId.trim(),
        scope: 'email profile openid',
        prompt: 'select_account', // Forces Google to display all accounts present on the device
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            setLoading(false);
            if (tokenResponse.error !== 'popup_closed_by_user') {
              setError(`Google Sign-In failed: ${tokenResponse.error_description || tokenResponse.error}`);
            }
            return;
          }

          if (tokenResponse.access_token) {
            try {
              // Verify and fetch real Google user profile
              const loggedUser = await googleLogin({
                token: tokenResponse.access_token,
                role: currentRole
              });

              if (typeof onOAuthSuccess === 'function') {
                onOAuthSuccess(loggedUser);
              }
              onClose();
            } catch (err) {
              setError(err.message || 'Failed to authenticate Google account with server.');
            } finally {
              setLoading(false);
            }
          }
        }
      });

      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      setLoading(false);
      setError('Failed to open Google account picker: ' + err.message);
    }
  };

  // Save entered Google Client ID
  const handleSaveClientId = (e) => {
    e.preventDefault();
    const cleanId = inputClientId.trim();
    if (!cleanId || !cleanId.includes('.apps.googleusercontent.com')) {
      setError('Please enter a valid Google OAuth Client ID ending with .apps.googleusercontent.com');
      return;
    }

    setClientId(cleanId);
    localStorage.setItem('quiz_google_client_id', cleanId);
    setShowConfig(false);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-tab-enter">
      <div className="relative w-full max-w-md bg-slate-900/95 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-blue-950/40 text-white overflow-hidden">
        
        {/* Ambient Glow */}
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

        {/* Header */}
        <div className="text-center space-y-3 mb-6">
          {/* Official Google "G" Logo */}
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
              Select your real Google account on this device to continue as{' '}
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

        {/* MAIN BODY: When Client ID is configured, show official Google Account Chooser */}
        {clientId && !showConfig ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-300">
                <Laptop className="w-4 h-4 text-blue-400" />
                <span>Device Google Accounts</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                Google will prompt the official account chooser showing the Google accounts present in your browser.
              </p>

              {/* Official Google Identity Services Rendered Button */}
              <div className="flex justify-center pt-2">
                <div id="gsi-official-real-button" className="min-h-[44px] flex justify-center" />
              </div>

              {/* Secondary Direct Trigger Popup Button */}
              <button
                type="button"
                disabled={loading}
                onClick={handleLaunchGooglePopup}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 hover:border-blue-500 text-blue-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying with Google...</span>
                  </>
                ) : (
                  <>
                    <span>Choose Google Account (Popup)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            {/* Change Client ID link */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setInputClientId(clientId);
                  setShowConfig(true);
                }}
                className="text-[11px] text-slate-500 hover:text-slate-400 underline cursor-pointer"
              >
                Configure Google Client ID
              </button>
            </div>
          </div>
        ) : (
          /* CONFIGURATION VIEW: When Google Client ID is needed */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30 text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-blue-300">
                <Shield className="w-4 h-4 text-blue-400" />
                <span>Real Google OAuth Setup</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                To connect directly to Google's servers and display your device's real Google accounts, your Google Cloud OAuth Client ID is required.
              </p>
            </div>

            <form onSubmit={handleSaveClientId} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Google OAuth 2.0 Client ID
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="xxxxxxxxxxxx.apps.googleusercontent.com"
                    value={inputClientId}
                    onChange={(e) => {
                      setInputClientId(e.target.value);
                      setError('');
                    }}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                {clientId && (
                  <button
                    type="button"
                    onClick={() => setShowConfig(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!inputClientId.trim()}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  Save & Open Real Google Sign-In
                </button>
              </div>
            </form>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p className="font-bold text-slate-300">How to get a Google Client ID (Free, 2 mins):</p>
              <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-400">
                <li>Visit <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-0.5">Google Cloud Console <ExternalLink className="w-3 h-3" /></a></li>
                <li>Create an <strong>OAuth Client ID</strong> (Application type: <em>Web application</em>)</li>
                <li>Add <code className="text-slate-300 bg-slate-800 px-1 py-0.5 rounded">http://localhost:5173</code> to <strong>Authorized JavaScript origins</strong></li>
                <li>Copy the Client ID and paste it above.</li>
              </ol>
            </div>
          </div>
        )}

        {/* Google Security & Privacy Disclaimer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
          <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verified securely by official Google Identity Services</span>
          </div>
        </div>

      </div>
    </div>
  );
}
