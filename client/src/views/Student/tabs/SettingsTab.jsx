import React, { useState } from 'react';
import {
  User,
  Lock,
  Volume2,
  VolumeX,
  Bell,
  CheckCircle2,
  AlertCircle,
  Dices,
  Save,
  KeyRound,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { AVATARS, getRandomAvatar } from '../../../utils/avatars';
import { useSocket } from '../../../context/SocketContext';
import { useAuth } from '../../../context/AuthContext';

export default function SettingsTab({
  user,
  token,
  serverUrl
}) {
  const { updateUser } = useAuth();
  const { isMuted, toggleSound } = useSocket();

  // Profile fields
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '🚀');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Preferences toggles
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);

  // Profile Save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    if (!name.trim()) {
      return setProfileError('Full name cannot be empty');
    }

    try {
      setProfileSaving(true);
      const res = await fetch(`${serverUrl}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: name.trim(), avatar })
      });

      const data = await res.json();
      if (data.success) {
        if (updateUser) {
          updateUser(data.user);
        }
        setProfileSuccess('Profile details saved successfully!');
        setTimeout(() => setProfileSuccess(''), 3000);
      } else {
        setProfileError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setProfileError(err.message || 'Error updating profile');
    } finally {
      setProfileSaving(false);
    }
  };

  // Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      return setPasswordError('Please fill in all password fields');
    }

    if (newPassword.length < 6) {
      return setPasswordError('New password must be at least 6 characters');
    }

    if (newPassword !== confirmPassword) {
      return setPasswordError('New password and confirmation do not match');
    }

    try {
      setPasswordSaving(true);
      const res = await fetch(`${serverUrl}/api/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (data.success) {
        setPasswordSuccess('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(''), 3000);
      } else {
        setPasswordError(data.error || 'Failed to change password');
      }
    } catch (err) {
      setPasswordError(err.message || 'Error changing password');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-tab-enter">
      {/* 1. Header */}
      <div>
        <h1 className="text-2xl font-heading font-black text-white">Profile & Preferences</h1>
        <p className="text-sm text-slate-400">
          Manage your student profile avatar, login credentials, and classroom sound preferences.
        </p>
      </div>

      {/* 2. Edit Profile Form */}
      <div className="dashboard-card p-6 space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
          <User className="w-5 h-5 text-purple-400" />
          <h2 className="text-base font-heading font-bold text-white">Student Profile</h2>
        </div>

        {profileSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{profileSuccess}</span>
          </div>
        )}

        {profileError && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{profileError}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-5">
          {/* Avatar Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Select Your Avatar Emoji
              </label>
              <button
                type="button"
                onClick={() => setAvatar(getRandomAvatar())}
                className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Dices className="w-3.5 h-3.5" />
                <span>Randomize</span>
              </button>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border-2 border-purple-500/70 shadow-lg shadow-purple-500/20 flex items-center justify-center text-4xl shrink-0">
                {avatar}
              </div>
              <div className="flex flex-wrap gap-2">
                {AVATARS.map((a, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setAvatar(a)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-transform cursor-pointer ${
                      avatar === a
                        ? 'bg-purple-600 border-2 border-purple-400 text-white shadow-lg shadow-purple-600/30 scale-110'
                        : 'bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-800 hover:scale-105'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Display Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full py-2.5 px-3.5 text-sm bg-slate-950/70 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-medium transition-colors"
              />
            </div>

            {/* Email (Readonly) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Registered Email</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full py-2.5 px-3.5 text-sm bg-slate-900/60 border border-slate-800/80 rounded-xl text-slate-400 cursor-not-allowed font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={profileSaving}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-heading font-bold text-xs shadow-lg shadow-purple-600/25 flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{profileSaving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. Change Password Form */}
      <div className="dashboard-card p-6 space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
          <Lock className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-heading font-bold text-white">Security & Password</h2>
        </div>

        {passwordSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Current Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full py-2.5 px-3.5 text-sm bg-slate-950/70 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">New Password (min 6 chars)</label>
              <input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full py-2.5 px-3.5 text-sm bg-slate-950/70 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Confirm New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full py-2.5 px-3.5 text-sm bg-slate-950/70 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={passwordSaving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-heading font-bold text-xs shadow-lg shadow-purple-600/20 flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all"
            >
              <KeyRound className="w-4 h-4 text-amber-300" />
              <span>{passwordSaving ? 'Updating...' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 4. Classroom Sound & Notification Preferences */}
      <div className="dashboard-card p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
          <Volume2 className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-heading font-bold text-white">Audio & Notifications</h2>
        </div>

        <div className="divide-y divide-slate-800">
          {/* Quiz Audio Toggle */}
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="text-sm font-bold text-white">Multiplayer Quiz Sound Effects</div>
              <p className="text-xs text-slate-400">Play chime, countdown, and reveal audio during live quizzes</p>
            </div>
            <button
              type="button"
              onClick={toggleSound}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                !isMuted
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-850 bg-slate-900/80 text-slate-400 border border-slate-800'
              }`}
            >
              {!isMuted ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>

          {/* Email Performance Digest Toggle */}
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="text-sm font-bold text-white">Weekly Score Summary Email</div>
              <p className="text-xs text-slate-400">Receive an email breakdown of your quiz accuracy and rank</p>
            </div>
            <input
              type="checkbox"
              checked={weeklyDigest}
              onChange={(e) => setWeeklyDigest(e.target.checked)}
              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-slate-700 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
