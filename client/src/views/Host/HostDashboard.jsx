import React, { useState, useEffect } from 'react';
import {
  Menu,
  Sparkles,
  BookOpen,
  Zap,
  BarChart3,
  LayoutDashboard,
  Play,
  Clock,
  CheckCircle2,
  Bell,
  PenTool,
  ArrowLeft
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import TeacherSidebarNav from './TeacherSidebarNav';
import TeacherOverviewTab from './tabs/TeacherOverviewTab';
import CreateAIQuizTab from './tabs/CreateAIQuizTab';
import MyQuizzesTab from './tabs/MyQuizzesTab';
import TeacherReportsTab from './tabs/TeacherReportsTab';

export default function HostDashboard({
  onRoomCreated,
  activeRoomCode = null,
  onEnterActiveRoom = null,
  onBack
}) {
  const { socket, serverUrl } = useSocket();
  const { user } = useAuth();

  // Navigation State: 'overview' | 'create' | 'quizzes' | 'reports'
  const [activeTab, setActiveTab] = useState('overview');
  const [createInitialMode, setCreateInitialMode] = useState('manual');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Data States
  const [quizzes, setQuizzes] = useState([]);
  const [classLeaderboard, setClassLeaderboard] = useState([]);
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [notifiedQuizId, setNotifiedQuizId] = useState(null);

  useEffect(() => {
    fetchQuizzes();
    fetchClassLeaderboard();
    fetchReports();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${serverUrl}/api/quizzes?teacherOnly=true`);
      const data = await res.json();
      if (data.success) {
        setQuizzes(data.quizzes || []);
      }
    } catch (err) {
      console.error('Failed to load quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassLeaderboard = async () => {
    try {
      const res = await fetch(`${serverUrl}/api/student/leaderboard`);
      const data = await res.json();
      if (data.success) {
        setClassLeaderboard(data.leaderboard || []);
      }
    } catch (err) {
      console.error('Failed to load class leaderboard:', err);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch(`${serverUrl}/api/reports/host-summary`);
      const data = await res.json();
      if (data.success) {
        setReportsData(data);
      }
    } catch (err) {
      console.error('Failed to load host summary reports:', err);
    }
  };

  // Launch a live quiz room
  const handleLaunchQuiz = (quizId) => {
    if (!socket || creatingRoom) return;
    setCreatingRoom(true);

    socket.emit('host:create-room', {
      quizId,
      hostName: user?.name || 'Teacher',
      hostId: user?.id || null
    }, (res) => {
      setCreatingRoom(false);
      if (res && res.success) {
        if (typeof onRoomCreated === 'function') {
          onRoomCreated(res);
        }
      } else {
        alert(res?.error || 'Failed to create room');
      }
    });
  };

  // Delete a quiz from My Quizzes
  const handleDeleteQuiz = async (quizId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`${serverUrl}/api/quizzes/${quizId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
      } else {
        alert(data.error || 'Failed to delete quiz');
      }
    } catch (err) {
      alert('Delete error: ' + err.message);
    }
  };

  // Update Question Timer for a quiz & broadcast real-time notification
  const handleUpdateQuizTimer = async (quiz, newTimeLimit) => {
    try {
      const res = await fetch(`${serverUrl}/api/quizzes/${quiz.id}/timer`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultTimeLimit: newTimeLimit,
          hostName: user?.name || 'Teacher'
        })
      });
      const data = await res.json();
      if (data.success) {
        setQuizzes((prev) =>
          prev.map((q) => (q.id === quiz.id ? { ...q, defaultTimeLimit: newTimeLimit } : q))
        );
        setNotifiedQuizId(quiz.id);

        setTimeout(() => {
          setNotifiedQuizId((curr) => (curr === quiz.id ? null : curr));
        }, 3500);
      }
    } catch (err) {
      console.error('Failed to update timer:', err);
    }
  };

  const handleQuizSaved = (newQuiz) => {
    setQuizzes((prev) => [newQuiz, ...prev.filter((q) => q.id !== newQuiz.id)]);
    fetchReports();
  };

  const handleNavigateTab = (tab, mode = 'manual') => {
    setActiveTab(tab);
    if (tab === 'create') {
      setCreateInitialMode(mode);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B1E] text-slate-100 flex relative overflow-x-hidden font-sans">
      {/* 1. Subtle Education Classroom Background Image Layer with Ken Burns slow zoom */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20 bg-cover bg-no-repeat transition-opacity duration-700 animate-ken-burns"
        style={{
          backgroundImage: 'url(/src/assets/education_classroom_bg.jpg)',
          backgroundPosition: 'center',
          filter: 'brightness(0.6) contrast(1.1)'
        }}
      />

      {/* 2. Film Grain Texture Overlay */}
      <div className="noise-overlay" />

      {/* 3. Soft Gradient Layer for optimal text & card contrast */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(7, 11, 30, 0.92) 0%, rgba(13, 21, 55, 0.84) 50%, rgba(6, 9, 24, 0.94) 100%)'
        }}
      />

      {/* 4. Faint Tech Dot-Grid Overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '54px 54px'
        }}
      />

      {/* 5. Ambient Purple & Emerald Glow Orbs */}
      <div className="fixed -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />
      <div className="fixed -bottom-40 -right-40 w-96 h-96 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />
      <div className="fixed top-1/2 right-1/4 w-80 h-80 rounded-full bg-teal-900/10 blur-3xl pointer-events-none" />

      {/* 6. Fixed Left Sidebar */}
      <TeacherSidebarNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        totalQuizzes={quizzes.length}
        activeRoomCode={activeRoomCode}
        onBack={onBack}
      />

      {/* 7. Main Content Area */}
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-white text-xs font-bold transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95 group shrink-0"
              title={activeTab !== 'overview' ? 'Back to Overview' : 'Back to Login Page'}
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1 text-emerald-400" />
              <span>{activeTab !== 'overview' ? 'Back' : 'Back to Login'}</span>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-base sm:text-lg font-heading font-bold text-white capitalize leading-tight flex items-center gap-2 tracking-tight">
                {activeTab === 'overview' && 'Teacher Overview'}
                {activeTab === 'create' && 'Quiz Creation Studio'}
                {activeTab === 'quizzes' && 'My Quizzes'}
                {activeTab === 'reports' && 'Classroom Reports'}
                {activeRoomCode && (
                  <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 badge-caps">
                    Live Room {activeRoomCode}
                  </span>
                )}
              </h2>
              <span className="text-xs text-emerald-400 font-medium hidden sm:block">
                Manual Custom Quizzes & AI Generation Studio
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick action buttons based on tab */}
            {activeTab !== 'create' && (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleNavigateTab('create', 'manual')}
                  className="shimmer-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                >
                  <PenTool className="w-3.5 h-3.5 text-purple-300" />
                  <span>Type My Own Quiz</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigateTab('create', 'ai')}
                  className="shimmer-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-sparkle" />
                  <span>New AI Quiz</span>
                </button>
              </div>
            )}

            {activeRoomCode && onEnterActiveRoom && (
              <button
                type="button"
                onClick={onEnterActiveRoom}
                className="shimmer-btn px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer animate-bounce-subtle hover:scale-105 active:scale-95 transition-all"
              >
                <Zap className="w-3.5 h-3.5 fill-current animate-zap-pulse" />
                <span>Return to Live Quiz</span>
              </button>
            )}
          </div>
        </header>

        {/* Tab Content Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <TeacherOverviewTab
              user={user}
              stats={reportsData?.stats}
              quizzes={quizzes}
              classLeaderboard={classLeaderboard}
              onNavigateTab={handleNavigateTab}
              onLaunchQuiz={handleLaunchQuiz}
              creatingRoom={creatingRoom}
            />
          )}

          {/* TAB 2: CREATE QUIZ (MANUAL & AI) */}
          {activeTab === 'create' && (
            <CreateAIQuizTab
              user={user}
              initialMode={createInitialMode}
              onQuizSaved={handleQuizSaved}
              onSaveAndHost={(quizId) => handleLaunchQuiz(quizId)}
              creatingRoom={creatingRoom}
            />
          )}

          {/* TAB 3: MY QUIZZES */}
          {activeTab === 'quizzes' && (
            <MyQuizzesTab
              quizzes={quizzes}
              onLaunchQuiz={handleLaunchQuiz}
              onDeleteQuiz={handleDeleteQuiz}
              onUpdateQuizTimer={handleUpdateQuizTimer}
              notifiedQuizId={notifiedQuizId}
              creatingRoom={creatingRoom}
              onNavigateCreate={(mode) => handleNavigateTab('create', mode || 'manual')}
            />
          )}

          {/* TAB 4: REPORTS */}
          {activeTab === 'reports' && (
            <TeacherReportsTab
              reportsData={reportsData}
              classLeaderboard={classLeaderboard}
              onRefresh={fetchReports}
            />
          )}
        </main>
      </div>
    </div>
  );
}
