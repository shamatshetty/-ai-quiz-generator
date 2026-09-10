import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  BookOpen,
  Zap,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Play,
  X,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const TEACHER_NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, badge: null },
  { id: 'create', label: 'Create Quiz', icon: Sparkles, badge: 'AI' },
  { id: 'quizzes', label: 'My Quizzes', icon: BookOpen, badge: null },
  { id: 'reports', label: 'Reports', icon: BarChart3, badge: null },
];

export default function TeacherSidebarNav({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  totalQuizzes = 0,
  activeRoomCode = null
}) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out of the Teacher Console?')) {
      logout();
    }
  };

  const displayName = user?.name || 'Teacher';
  const displayAvatar = user?.avatar || '👨‍🏫';
  const department = user?.subject || 'Instructor';

  const sidebarContent = (
    <div className="flex flex-col h-full select-none text-white">
      {/* 1. Brand Header */}
      <div className={`flex items-center justify-between px-4 py-5 border-b border-slate-800/80 ${isCollapsed ? 'justify-center' : ''}`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20 shrink-0 font-bold">
            <GraduationCap className="w-5 h-5 text-slate-950" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-black text-lg text-white tracking-tight">Quiz<span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 font-black">Pop!</span></span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 badge-caps">HOST</span>
              </div>
              <span className="text-xs text-slate-400 font-medium">Classroom Assessment • Teacher</span>
            </div>
          )}
        </div>

        {/* Mobile Close Button */}
        {mobileOpen && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 2. Teacher Profile Summary Card */}
      <div className="px-3 py-3 border-b border-slate-800/80">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-700/80 flex items-center justify-center text-xl shadow-sm shrink-0">
              {displayAvatar}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-white truncate font-heading">{displayName}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-600 text-slate-950 shadow-sm badge-caps tracking-wider">
                  PRO
                </span>
                <span className="text-xs text-emerald-300/80 font-medium truncate">{department}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title={`${displayName} - ${department}`}>
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xl shadow-sm">
              {displayAvatar}
            </div>
          </div>
        )}
      </div>

      {/* 3. Navigation Links List with Smooth Sliding Background Pill */}
      <nav className="relative flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {/* Animated Sliding Background Pill */}
        {TEACHER_NAV_ITEMS.findIndex((item) => item.id === activeTab) !== -1 && (
          <div
            className="absolute left-3 right-3 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 shadow-inner pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{
              height: '40px',
              top: '12px',
              transform: `translateY(${TEACHER_NAV_ITEMS.findIndex((item) => item.id === activeTab) * 44}px)`
            }}
          >
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-5 rounded-r-full bg-emerald-400 shadow-md shadow-emerald-500/60" />
          </div>
        )}

        {TEACHER_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isLiveActive = item.id === 'live' && activeRoomCode;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectTab(item.id);
                if (mobileOpen && onCloseMobile) onCloseMobile();
              }}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-sm transition-all duration-200 cursor-pointer group relative ${
                isActive
                  ? 'text-white font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40 font-medium'
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-300'
                  }`}
                />
                {isLiveActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                )}
              </div>

              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="truncate tracking-tight font-heading font-bold">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full badge-caps ${
                        item.badge === 'AI'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-badge-pulse'
                          : item.badge === 'Host' && isLiveActive
                          ? 'bg-amber-500 text-slate-950 font-black animate-bounce-subtle'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {isLiveActive ? `PIN ${activeRoomCode}` : item.badge}
                    </span>
                  )}
                  {item.id === 'quizzes' && totalQuizzes > 0 && (
                    <span className="text-xs font-bold text-slate-300 bg-slate-800/90 px-2 py-0.5 rounded-full tabular-nums font-mono border border-slate-700/50">
                      {totalQuizzes}
                    </span>
                  )}
                </div>
              )}

              {/* Collapsed Active Indicator Pill */}
              {isCollapsed && isActive && (
                <div className="absolute right-0 top-2 bottom-2 w-1 rounded-l-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </nav>

      {/* 4. Footer Utilities */}
      <div className="p-3 border-t border-slate-800/80 space-y-2">
        {/* Desktop Collapse / Expand Toggle */}
        <div className="hidden lg:flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {!isCollapsed && (
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-sm font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          )}

          {isCollapsed && (
            <button
              type="button"
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Left Sidebar */}
      <aside
        className={`hidden lg:block fixed top-0 left-0 bottom-0 z-30 bg-[#090D1F]/95 backdrop-blur-2xl border-r border-slate-800/80 transition-all duration-300 shadow-2xl ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Off-Canvas Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-[80vw] bg-[#090D1F] border-r border-slate-800 shadow-2xl z-10 flex flex-col h-full animate-slideRight">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
