import React, { useState, useEffect, useMemo } from 'react';
import {
  Menu,
  Zap,
  ArrowRight,
  X,
  Sparkles,
  Volume2,
  VolumeX,
  Bell,
  Clock,
  Radio,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

import SidebarNav from './SidebarNav';
import OverviewTab from './tabs/OverviewTab';
import OnlineQuizTab from './tabs/OnlineQuizTab';
import QuizScoresTab from './tabs/QuizScoresTab';
import AnswerReviewTab from './tabs/AnswerReviewTab';
import LeaderboardTab from './tabs/LeaderboardTab';
import SettingsTab from './tabs/SettingsTab';
import educationBg from '../../assets/simple_education_bg.jpg';

function formatRelativeTime(isoString) {
  if (!isoString) return 'Just now';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function StudentDashboard({ onJoinRoom, initialRoomCode = '', onBack }) {
  const { user, token } = useAuth();
  const { socket, serverUrl, isMuted, toggleSound } = useSocket();

  // Navigation & Layout States
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPracticeSubject, setSelectedPracticeSubject] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedQuizToReviewId, setSelectedQuizToReviewId] = useState(null);

  // Data states
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [loading, setLoading] = useState(true);

  // Quick Join Modal state
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [pin, setPin] = useState(initialRoomCode);
  const [joinError, setJoinError] = useState('');

  // Classroom Notification System State
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [liveToast, setLiveToast] = useState(null);
  const [activeNotifFilter, setActiveNotifFilter] = useState('all'); // 'all' | 'live' | 'quizzes'

  useEffect(() => {
    fetchDashboardData(true);
    fetchNotifications();
  }, [token, user]);

  // Real-time Socket.IO notification listener for live quiz launches & quiz timer updates
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notif) => {
      setNotifications((prev) => [notif, ...prev.filter((n) => n.id !== notif.id)]);
      setLiveToast(notif);

      // Auto-dismiss live toast alert after 7 seconds
      setTimeout(() => {
        setLiveToast((curr) => (curr?.id === notif.id ? null : curr));
      }, 7000);
    };

    socket.on('classroom:notification', handleNewNotification);
    return () => {
      socket.off('classroom:notification', handleNewNotification);
    };
  }, [socket]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${serverUrl}/api/student/notifications`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const fetchDashboardData = async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const historyUrl = user?.id
        ? `${serverUrl}/api/student/history?userId=${user.id}`
        : `${serverUrl}/api/student/history`;

      const leaderboardUrl = user?.id
        ? `${serverUrl}/api/student/leaderboard?userId=${user.id}`
        : `${serverUrl}/api/student/leaderboard`;

      const [historyRes, leaderboardRes] = await Promise.all([
        fetch(historyUrl, { headers }).then((r) => r.json()).catch(() => ({ success: false })),
        fetch(leaderboardUrl, { headers }).then((r) => r.json()).catch(() => ({ success: false }))
      ]);

      if (historyRes.success) {
        setHistory(historyRes.history || []);
        setStats(historyRes.stats || null);
        if (historyRes.history && historyRes.history.length > 0) {
          setSelectedQuizToReviewId(historyRes.history[0].playerSessionId);
        }
      }

      if (leaderboardRes.success) {
        setLeaderboard(leaderboardRes.leaderboard || []);
        setCurrentUserRank(leaderboardRes.currentUser || null);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  const handleQuickJoin = (e) => {
    e.preventDefault();
    setJoinError('');
    if (!pin.trim()) {
      return setJoinError('Please enter a 6-character room PIN');
    }
    if (onJoinRoom) {
      onJoinRoom(pin.trim().toUpperCase());
    }
  };

  const handleSelectQuizToReview = (quizId) => {
    setSelectedQuizToReviewId(quizId);
    setActiveTab('review');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = useMemo(() => {
    if (activeNotifFilter === 'live') {
      return notifications.filter((n) => n.isLive || n.type === 'LIVE_ROOM');
    }
    if (activeNotifFilter === 'quizzes') {
      return notifications.filter((n) => n.type === 'NEW_QUIZ' || n.type === 'TIME_SET');
    }
    return notifications;
  }, [notifications, activeNotifFilter]);

  const handleMarkAllRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      await fetch(`${serverUrl}/api/student/notifications/read-all`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  };

  const handleJoinFromNotification = (roomCode) => {
    setShowNotifications(false);
    setLiveToast(null);
    if (!roomCode) return;
    if (onJoinRoom) {
      onJoinRoom(roomCode.trim().toUpperCase());
    } else {
      setPin(roomCode.trim().toUpperCase());
      setShowJoinModal(true);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#070B1E] text-white font-sans flex select-none relative overflow-x-hidden">
      {/* 1. Subtle Education Classroom Background matching Login page with Ken Burns zoom */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-15 animate-ken-burns"
        style={{
          backgroundImage: `url(${educationBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.65) contrast(1.1)'
        }}
      />

      {/* Subtle Noise Texture Overlay */}
      <div className="noise-overlay" />

      {/* 2. Soft Gradient Layer for optimal text & card contrast */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(7, 11, 30, 0.90) 0%, rgba(13, 21, 55, 0.82) 50%, rgba(6, 9, 24, 0.92) 100%)'
        }}
      />

      {/* 3. Faint Tech Dot-Grid Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-10 animate-grid-breathe"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '54px 54px'
        }}
      />

      {/* 4. Ambient Purple & Indigo Glow Orbs */}
      <div className="fixed -top-40 -left-40 w-96 h-96 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />
      <div className="fixed -bottom-40 -right-40 w-96 h-96 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />
      <div className="fixed top-1/2 right-1/4 w-80 h-80 rounded-full bg-purple-900/10 blur-3xl pointer-events-none" />

      {/* Real-time Slide-in Notification Toast */}
      {liveToast && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-md w-full animate-bounce-subtle">
          <div className="p-4 rounded-2xl bg-[#090D1F]/95 border-2 border-amber-400/80 backdrop-blur-2xl shadow-2xl shadow-amber-500/20 text-white flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-xl shrink-0">
              {liveToast.type === 'LIVE_ROOM' ? '⚡' : liveToast.type === 'TIME_SET' ? '⏰' : '📝'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  {liveToast.type === 'LIVE_ROOM'
                    ? 'Live Quiz Active'
                    : liveToast.type === 'TIME_SET'
                    ? 'Quiz Timer Configured'
                    : 'New Quiz Added'}
                </span>
                <button
                  type="button"
                  onClick={() => setLiveToast(null)}
                  className="text-slate-400 hover:text-white text-xs p-1"
                >
                  ✕
                </button>
              </div>
              <h4 className="font-heading font-black text-sm text-white mt-0.5 truncate">
                {liveToast.title}
              </h4>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                {liveToast.message}
              </p>

              {liveToast.roomCode && (
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleJoinFromNotification(liveToast.roomCode)}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/25 cursor-pointer hover:scale-105 transition-all"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Join Live Quiz (PIN {liveToast.roomCode}) &rarr;</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 1. Fixed Left Sidebar */}
      <SidebarNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onOpenJoinModal={() => setShowJoinModal(true)}
        currentUserRank={currentUserRank}
        stats={stats}
        onBack={onBack}
      />

      {/* 2. Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 relative z-10 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Sleek Dark Top Header Bar */}
        <header className="sticky top-0 z-20 bg-[#090D1F]/90 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            {/* Edge Back Button */}
            <button
              type="button"
              onClick={() => {
                if (activeTab !== 'overview') {
                  setActiveTab('overview');
                } else if (typeof onBack === 'function') {
                  onBack();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-slate-300 hover:text-white text-xs font-bold transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95 group shrink-0"
              title={activeTab !== 'overview' ? 'Back to Overview' : 'Back to Login Page'}
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1 text-purple-400" />
              <span className="hidden sm:inline">{activeTab !== 'overview' ? 'Back' : 'Login'}</span>
              <span className="sm:hidden">{activeTab !== 'overview' ? 'Back' : 'Login'}</span>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-base sm:text-lg font-heading font-bold text-white capitalize leading-tight">
                {activeTab === 'overview' && 'Dashboard Overview'}
                {activeTab === 'practice' && 'Online Quiz by Subject'}
                {activeTab === 'scores' && 'Quiz Scores & Results'}
                {activeTab === 'review' && 'Detailed Answer Review'}
                {activeTab === 'leaderboard' && 'Leaderboard'}
                {activeTab === 'settings' && 'Account & Preferences'}
              </h2>
              <span className="text-xs text-purple-300 font-medium hidden sm:block">
                AI Assessment & Interactive Study Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Sound Toggle Button */}
            <button
              type="button"
              onClick={toggleSound}
              title={isMuted ? 'Unmute game audio' : 'Mute game audio'}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Top Bar Join Live Quiz Action */}
            <button
              type="button"
              onClick={() => setShowJoinModal(true)}
              className="shimmer-btn px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-heading font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30 hover:shadow-purple-600/50 cursor-pointer hover:scale-105 active:scale-95 transition-all group"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 animate-zap-pulse" />
              <span className="hidden sm:inline">Join Live Quiz</span>
              <span className="sm:hidden">Join Quiz</span>
            </button>

            {/* Far Right Edge: Classroom Announcements & Teacher Quiz Alerts */}
            <button
              type="button"
              onClick={() => {
                setShowNotifications(true);
                if (unreadCount > 0) {
                  handleMarkAllRead();
                }
              }}
              title="Classroom Announcements & Teacher Quiz Alerts"
              className={`px-3 py-1.5 rounded-xl border font-heading font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer relative ${
                showNotifications
                  ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/30'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-purple-500/40'
              }`}
            >
              <Bell className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden md:inline">Announcements</span>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-gradient-to-r from-amber-500 to-pink-500 text-white shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Slide-out Off-Canvas Drawer at Right Edge of Dashboard Screen */}
        {showNotifications && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
              onClick={() => setShowNotifications(false)}
            />

            {/* Drawer Panel Sliding Out from Right Edge */}
            <aside className="relative w-full max-w-md bg-[#090D1F]/98 border-l border-slate-800 shadow-2xl backdrop-blur-2xl flex flex-col h-full z-10 transition-all">
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-sm shrink-0">
                    <Bell className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-base text-white">
                      Classroom Announcements
                    </h3>
                    <span className="text-xs text-slate-400">
                      Teacher quiz alerts & live room updates
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Filter Tabs & Quick Action */}
              <div className="px-4 py-2.5 bg-slate-950/50 border-b border-slate-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setActiveNotifFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      activeNotifFilter === 'all'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    All ({notifications.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveNotifFilter('live')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      activeNotifFilter === 'live'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    ⚡ Live ({notifications.filter((n) => n.isLive || n.type === 'LIVE_ROOM').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveNotifFilter('quizzes')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      activeNotifFilter === 'quizzes'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    Teacher Quizzes
                  </button>
                </div>

                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-xs text-purple-400 hover:text-purple-300 font-bold cursor-pointer transition-colors shrink-0"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification List Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-72 text-center text-slate-400 space-y-3 px-4">
                    <div className="w-16 h-16 rounded-2xl bg-purple-900/20 border border-purple-500/20 flex items-center justify-center text-3xl">
                      📭
                    </div>
                    <div>
                      <p className="font-heading font-black text-white text-base">No Teacher Announcements</p>
                      <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
                        Notifications appear here only when your teacher publishes a new quiz, sets a timer, or starts a live room session.
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredNotifications.map((n) => {
                    const isLive = n.isLive || n.type === 'LIVE_ROOM';
                    const isTimeSet = n.type === 'TIME_SET';

                    return (
                      <div
                        key={n.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isLive
                            ? 'bg-gradient-to-br from-amber-500/15 via-slate-900/90 to-slate-900/90 border-amber-400/50 shadow-lg shadow-amber-500/10'
                            : 'bg-slate-900/80 border-slate-800/90 hover:border-purple-500/40'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${
                              isLive
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                : isTimeSet
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                                : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                            }`}
                          >
                            {isLive ? '⚡' : isTimeSet ? '⏰' : '📝'}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span
                                className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  isLive
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : isTimeSet
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                }`}
                              >
                                {isLive ? 'Live Room Active' : isTimeSet ? 'Timer Configured' : 'Teacher Quiz'}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {formatRelativeTime(n.createdAt)}
                              </span>
                            </div>

                            <h4 className="font-heading font-black text-sm text-white leading-snug">
                              {n.quizTitle || n.title}
                            </h4>

                            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                              {n.message}
                            </p>

                            <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2 border-t border-slate-800/80">
                              {n.hostName && (
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 font-bold">
                                  👨‍🏫 {n.hostName}
                                </span>
                              )}
                              {n.subject && (
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
                                  {n.subject}
                                </span>
                              )}
                              {n.timeLimit && (
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5 text-purple-400" />
                                  <span>{n.timeLimit}s timer</span>
                                </span>
                              )}

                              {isLive && n.roomCode && (
                                <button
                                  type="button"
                                  onClick={() => handleJoinFromNotification(n.roomCode)}
                                  className="w-full mt-2 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-heading font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                  <Zap className="w-3.5 h-3.5" />
                                  <span>Join Live Quiz (PIN: {n.roomCode}) &rarr;</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </aside>
          </div>
        )}

        {/* Dynamic Tab Content Area */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-4">
              <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <p className="font-heading text-sm font-bold text-slate-300">Loading student metrics...</p>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <OverviewTab
                  user={user}
                  stats={stats}
                  history={history}
                  currentUserRank={currentUserRank}
                  notifications={notifications}
                  onJoinFromNotification={handleJoinFromNotification}
                  onSelectTab={setActiveTab}
                  onSelectQuizToReview={handleSelectQuizToReview}
                  onOpenJoinModal={() => setShowJoinModal(true)}
                  onStartSubjectQuiz={(sub) => {
                    setSelectedPracticeSubject(sub);
                    setActiveTab('practice');
                  }}
                />
              )}

              {activeTab === 'practice' && (
                <OnlineQuizTab
                  user={user}
                  token={token}
                  serverUrl={serverUrl}
                  initialSubject={selectedPracticeSubject}
                  onReturnToDashboard={() => {
                    setActiveTab('overview');
                    fetchDashboardData();
                  }}
                  onQuizCompleted={() => {
                    fetchDashboardData();
                  }}
                  onViewReview={(sessionId) => {
                    if (sessionId) setSelectedQuizToReviewId(sessionId);
                    setActiveTab('scores');
                  }}
                />
              )}

              {activeTab === 'scores' && (
                <QuizScoresTab
                  history={history}
                  onSelectQuizToReview={handleSelectQuizToReview}
                />
              )}

              {activeTab === 'review' && (
                <AnswerReviewTab
                  history={history}
                  selectedQuizId={selectedQuizToReviewId}
                  onSelectQuiz={(id) => setSelectedQuizToReviewId(id)}
                />
              )}

              {activeTab === 'leaderboard' && (
                <LeaderboardTab
                  leaderboard={leaderboard}
                  currentUserRank={currentUserRank}
                  user={user}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsTab
                  user={user}
                  token={token}
                  serverUrl={serverUrl}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Quick Join Live Quiz Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-scale">
          <div className="bg-slate-900 border border-slate-800 max-w-sm w-full rounded-3xl p-6 space-y-4 shadow-2xl relative text-white">
            <button
              type="button"
              onClick={() => setShowJoinModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-300 shadow-xs">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-heading font-black text-white">
                Join Classroom Quiz
              </h3>
              <p className="text-xs text-slate-400">
                Enter the 6-character room PIN displayed on the teacher's screen.
              </p>
            </div>

            <form onSubmit={handleQuickJoin} className="space-y-3">
              <input
                type="text"
                maxLength={6}
                placeholder="ABC123"
                value={pin}
                onChange={(e) => setPin(e.target.value.toUpperCase())}
                className="w-full py-3 px-4 rounded-xl bg-slate-950 border-2 border-slate-700 text-amber-400 font-mono text-2xl font-black text-center uppercase tracking-widest focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/15 transition-all"
              />

              {joinError && (
                <p className="text-xs text-rose-400 font-bold text-center">⚠️ {joinError}</p>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-heading font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all"
              >
                <span>Enter Live Quiz</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
