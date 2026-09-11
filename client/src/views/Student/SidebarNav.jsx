import React from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  CheckCircle2,
  Trophy,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Zap,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, badge: null },
  { id: 'practice', label: 'Online Quiz', icon: Sparkles, badge: 'AI' },
  { id: 'scores', label: 'Quiz Scores', icon: GraduationCap, badge: null },
  { id: 'review', label: 'Answer Review', icon: CheckCircle2, badge: null },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, badge: 'Live' },
  { id: 'settings', label: 'Settings', icon: Settings, badge: null },
];

export default function SidebarNav({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  onOpenJoinModal,
  currentUserRank,
  stats,
  onBack
}) {
  const { user, logout } = useAuth();
  const { isMuted, toggleSound } = useSocket();

  const handleLogout = () => {
    if (typeof onBack === 'function') {
      onBack();
    } else {
      logout();
    }
  };

  const displayName = user?.name || 'Student';
  const displayAvatar = user?.avatar || '🚀';
  const rankNumber = currentUserRank?.rank ? `#${currentUserRank.rank}` : '#1';
  const rankTitle = currentUserRank?.rank <= 3 ? 'Top Scholar' : 'Active Learner';

  const sidebarContent = (
    <div className="flex flex-col h-full select-none text-white">
      {/* 1. App Brand Header */}
      <div className={`flex items-center justify-between px-4 py-5 border-b border-slate-800/80 ${isCollapsed ? 'justify-center' : ''}`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-400 flex items-center justify-center text-white shadow-md shadow-purple-500/20 shrink-0">
            <span className="text-xl font-bold">⚡</span>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-black text-lg text-white tracking-tight">Quiz<span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 font-black">Pop!</span></span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 badge-caps">LIVE</span>
              </div>
              <span className="text-xs text-slate-400 font-medium">Classroom Assessment</span>
            </div>
          )}
        </div>

        {/* Mobile Close Button */}
        {mobileOpen && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 2. User Profile Summary Pill */}
      <div className="px-3 py-3 border-b border-slate-800/80">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-700/80 flex items-center justify-center text-xl shadow-sm shrink-0">
              {displayAvatar}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-white truncate font-heading">{displayName}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-600 text-white shadow-sm badge-caps">
                  {rankNumber}
                </span>
                <span className="text-xs text-slate-400 font-medium truncate">{rankTitle}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title={`${displayName} (${rankNumber})`}>
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xl shadow-sm relative">
              {displayAvatar}
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-purple-600 text-white text-[9px] font-black flex items-center justify-center border-2 border-slate-900">
                {currentUserRank?.rank || 1}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Navigation Links List with Smooth Sliding Background Pill */}
      <nav className="relative flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {/* Animated Sliding Background Pill */}
        {NAV_ITEMS.findIndex((item) => item.id === activeTab) !== -1 && (
          <div
            className="absolute left-3 right-3 rounded-xl bg-purple-950/70 border border-purple-500/40 shadow-inner pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{
              height: '40px',
              top: '12px',
              transform: `translateY(${NAV_ITEMS.findIndex((item) => item.id === activeTab) * 44}px)`
            }}
          >
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-5 rounded-r-full bg-purple-500 shadow-md shadow-purple-500/60" />
          </div>
        )}

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectTab(item.id);
                if (mobileOpen && onCloseMobile) onCloseMobile();
              }}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors duration-200 group relative z-10 cursor-pointer ${
                isActive
                  ? 'text-purple-200 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-transform duration-200 ${
                  isActive ? 'text-purple-400' : 'text-slate-400 group-hover:text-purple-300'
                }`}
              />
              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="truncate tracking-tight">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full badge-caps ${
                        item.badge === 'LIVE'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-badge-pulse'
                          : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* 4. Footer Utilities & Sign Out */}
      <div className="p-3 border-t border-slate-800/80">
        <div className="flex items-center justify-between gap-1">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            title={isMuted ? 'Unmute game sounds' : 'Mute game sounds'}
            className={`p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer ${isCollapsed ? 'w-full flex justify-center' : ''}`}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={handleLogout}
            title="Sign Out"
            className={`p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-all cursor-pointer ${isCollapsed ? 'w-full flex justify-center' : ''}`}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside
        className={`hidden lg:flex fixed top-0 bottom-0 left-0 z-30 bg-[#090D1F]/95 backdrop-blur-xl border-r border-slate-800/80 transition-all duration-300 ease-in-out flex-col ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-md lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Off-Canvas Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#090D1F] border-r border-slate-800/80 lg:hidden transform transition-transform duration-300 ease-in-out flex flex-col ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
