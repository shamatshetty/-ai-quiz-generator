import React, { useState } from 'react';
import { Volume2, VolumeX, Wifi, WifiOff, Copy, Check, Users, Sparkles, LogOut, Shield, ArrowLeft } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar({
  roomCode,
  playerCount = 0,
  role = null,
  playerName = '',
  playerAvatar = '',
  onLeave = null,
  onLogout = null,
  onDashboard = null,
  onBack = null,
  backLabel = 'Back'
}) {
  const { isConnected, isMuted, toggleSound } = useSocket();
  const { user, logout, isAuthenticated } = useAuth();
  const [copied, setCopied] = useState(false);

  const copyRoomCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSignOut = () => {
    logout();
    if (onLogout) onLogout();
  };

  const displayName = playerName || user?.name || '';
  const displayAvatar = playerAvatar || user?.avatar || (user?.role === 'TEACHER' ? '👨‍🏫' : '🚀');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Universal Back Button & Brand */}
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95 group shrink-0"
              title={backLabel ? `Back: ${backLabel}` : 'Go back'}
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1 text-purple-400" />
              <span>{backLabel}</span>
            </button>
          )}

          {/* Brand */}
          <div
            className="flex items-center space-x-2.5 cursor-pointer group"
            onClick={onDashboard || onBack || onLeave}
            title="Return to Dashboard / Login"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <span className="text-lg font-bold select-none">⚡</span>
            </div>
            <div>
              <div className="font-heading text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                <span>Quiz<span className="text-purple-400">Pop!</span></span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block leading-none">Classroom Assessment</p>
            </div>
          </div>
        </div>

        {/* Center: Room Code Display */}
        {roomCode && (
          <div className="flex items-center gap-2 sm:gap-3 bg-slate-800/90 border border-slate-700/80 rounded-full px-3 sm:px-4 py-1.5 shadow-inner">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline">Room:</span>
            <span className="font-mono text-base sm:text-lg font-extrabold tracking-widest text-amber-400">
              {roomCode}
            </span>
            <button
              onClick={copyRoomCode}
              title="Copy Room Code"
              className="p-1 rounded-md hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            {playerCount > 0 && (
              <div className="flex items-center gap-1 text-xs font-bold text-slate-300 pl-2 border-l border-slate-700">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span>{playerCount}</span>
              </div>
            )}
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* User profile badge */}
          {isAuthenticated && user && (
            <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-full pl-2 pr-3 py-1 text-xs font-semibold text-slate-200">
              <span className="text-sm select-none">{displayAvatar}</span>
              <span className="max-w-[80px] sm:max-w-[120px] truncate">{displayName}</span>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded ${
                user.role === 'TEACHER'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              }`}>
                {user.role === 'TEACHER' ? 'Teacher' : 'Student'}
              </span>
            </div>
          )}

          {/* Sound Mute Toggle */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all shadow-sm cursor-pointer"
            title={isMuted ? 'Unmute audio' : 'Mute audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Connection Status Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border ${
              isConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
            }`}
            title={isConnected ? 'Server connected' : 'Connecting to server...'}
          >
            {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{isConnected ? 'Online' : 'Offline'}</span>
          </div>

          {/* Sign Out button if authenticated */}
          {isAuthenticated && (
            <button
              onClick={handleSignOut}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/30 text-slate-400 hover:text-rose-300 transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Sign Out</span>
            </button>
          )}

          {/* Leave/Back Button */}
          {role && (
            <button
              onClick={onLeave}
              className="text-xs px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              Exit
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
