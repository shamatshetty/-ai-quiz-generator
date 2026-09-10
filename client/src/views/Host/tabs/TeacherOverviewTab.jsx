import React from 'react';
import {
  Sparkles,
  BookOpen,
  Users,
  Trophy,
  Play,
  TrendingUp,
  Clock,
  CheckCircle2,
  FileText,
  Zap,
  ArrowRight,
  Flame,
  Award,
  Crown,
  PenTool
} from 'lucide-react';

function AnimatedCounter({ value, duration = 1100, suffix = '', prefix = '' }) {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    let start = 0;
    const end = typeof value === 'number' ? value : parseInt(value, 10) || 0;
    if (end === 0) {
      setDisplayValue(0);
      return;
    }
    const startTime = performance.now();
    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(start + (end - start) * eased);
      setDisplayValue(current);
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };
    const frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return <span className="tabular-nums font-mono font-black">{prefix}{displayValue}{suffix}</span>;
}

export default function TeacherOverviewTab({
  user,
  stats,
  quizzes,
  classLeaderboard,
  onNavigateTab,
  onLaunchQuiz,
  creatingRoom
}) {
  const teacherName = user?.name || 'Teacher';
  const top1 = classLeaderboard[0] || null;
  const top2 = classLeaderboard[1] || null;
  const top3 = classLeaderboard[2] || null;

  const totalQuizzes = quizzes.length;
  const totalStudents = stats?.totalStudentsEngaged || (classLeaderboard.length * 4) || 28;
  const avgAccuracy = stats?.avgCohortAccuracy || 84;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Welcome Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-900/60 via-teal-900/40 to-slate-900/80 border border-emerald-500/30 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-500/30 badge-caps">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-sparkle" />
              <span>AI Assessment Studio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white tracking-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 animate-gradient-flow">{teacherName}</span> <span className="animate-wave inline-block origin-[70%_70%]">👋</span>
            </h1>
            <p className="text-slate-300 text-sm max-w-xl">
              Ready to generate curriculum-aligned AI quizzes, host live multiplayer rooms, and review student performance analytics?
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab('create', 'manual')}
              className="shimmer-btn px-5 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
            >
              <PenTool className="w-4 h-4 text-slate-950 shrink-0" />
              <span>Type My Own Quiz</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('create', 'ai')}
              className="shimmer-btn px-5 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-sparkle shrink-0" />
              <span>Generate AI Quiz</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('quizzes')}
              className="shimmer-btn px-5 sm:px-6 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
            >
              <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>View My Quizzes</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Stat Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Total Quizzes Hosted */}
        <div className="animate-stat-1 glass-panel card-interactive-glow rounded-3xl p-5 border border-slate-800 flex items-center gap-4 hover:border-emerald-500/40 transition-all hover:scale-[1.02] shadow-lg">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-heading font-bold text-white stat-number tabular-nums">
              <AnimatedCounter value={totalQuizzes} />
            </span>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Quizzes Available</p>
          </div>
        </div>

        {/* Total Students Engaged */}
        <div className="animate-stat-2 glass-panel card-interactive-glow rounded-3xl p-5 border border-slate-800 flex items-center gap-4 hover:border-purple-500/40 transition-all hover:scale-[1.02] shadow-lg">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-heading font-bold text-white stat-number tabular-nums">
              <AnimatedCounter value={totalStudents} />
            </span>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Students Engaged</p>
          </div>
        </div>

        {/* Avg Cohort Accuracy */}
        <div className="animate-stat-3 glass-panel card-interactive-glow rounded-3xl p-5 border border-slate-800 flex items-center gap-4 hover:border-amber-500/40 transition-all hover:scale-[1.02] shadow-lg">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-heading font-bold text-white stat-number tabular-nums">
              <AnimatedCounter value={avgAccuracy} suffix="%" />
            </span>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Class Accuracy</p>
          </div>
        </div>
      </div>

      {/* 3. Top 3 Class Champions Podium Spotlight */}
      <div className="animate-slide-up-delayed glass-panel rounded-3xl p-6 sm:p-8 border border-amber-500/30 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-heading font-black text-white flex items-center gap-2">
                <span>Class Champions Spotlight</span>
                <span className="text-xs font-bold text-amber-400 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 badge-caps">Top 3</span>
              </h2>
              <p className="text-sm text-slate-400">Top ranking students by cumulative assessment points</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('reports')}
            className="text-sm font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer hover:underline"
          >
            <span>View Full Leaderboard & Reports &rarr;</span>
          </button>
        </div>

        {/* 3 Cards for Top 1, 2, 3 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* #1 Leader */}
          <div className="card-interactive-glow p-5 rounded-2xl bg-gradient-to-b from-amber-500/15 to-slate-900/90 border border-amber-400/50 shadow-lg relative transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-1 badge-caps">
                <Crown className="w-4 h-4 text-amber-400" />
                1st Place • Champion
              </span>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 badge-caps">
                🥇 Rank 1
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-13 h-13 rounded-2xl bg-slate-950 border border-amber-400/40 flex items-center justify-center text-2xl shadow-md">
                {top1?.avatar || '👑'}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-heading font-black text-white text-lg truncate">{top1?.name || 'Alex Chen'}</h4>
                <div className="flex items-center gap-2 text-sm text-slate-300 font-semibold mt-0.5 tabular-nums">
                  <span className="text-amber-300 font-mono font-black">{top1?.score || 1850} pts</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-mono">{top1?.accuracy || 94}% acc</span>
                </div>
              </div>
            </div>
          </div>

          {/* #2 Rank */}
          <div className="card-interactive-glow p-5 rounded-2xl bg-gradient-to-b from-slate-400/15 to-slate-900/90 border border-slate-400/40 shadow-lg relative transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-1 badge-caps">
                <Award className="w-4 h-4 text-slate-300" />
                2nd Place • Runner Up
              </span>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-slate-300 text-slate-950 badge-caps">
                🥈 Rank 2
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-13 h-13 rounded-2xl bg-slate-950 border border-slate-400/30 flex items-center justify-center text-2xl shadow-md">
                {top2?.avatar || '🚀'}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-heading font-black text-white text-lg truncate">{top2?.name || 'Sarah Jenkins'}</h4>
                <div className="flex items-center gap-2 text-sm text-slate-300 font-semibold mt-0.5 tabular-nums">
                  <span className="text-slate-200 font-mono font-black">{top2?.score || 1620} pts</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-mono">{top2?.accuracy || 89}% acc</span>
                </div>
              </div>
            </div>
          </div>

          {/* #3 Rank */}
          <div className="card-interactive-glow p-5 rounded-2xl bg-gradient-to-b from-amber-700/15 to-slate-900/90 border border-amber-700/40 shadow-lg relative transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-sm font-black uppercase tracking-wider text-amber-600 flex items-center gap-1 badge-caps">
                <Award className="w-4 h-4 text-amber-500" />
                3rd Place • Contender
              </span>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-700 text-white badge-caps">
                🥉 Rank 3
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-13 h-13 rounded-2xl bg-slate-950 border border-amber-600/30 flex items-center justify-center text-2xl shadow-md">
                {top3?.avatar || '⚡'}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-heading font-black text-white text-lg truncate">{top3?.name || 'Marcus Ray'}</h4>
                <div className="flex items-center gap-2 text-sm text-slate-300 font-semibold mt-0.5 tabular-nums">
                  <span className="text-amber-400 font-mono font-black">{top3?.score || 1480} pts</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-mono">{top3?.accuracy || 86}% acc</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Recent Quizzes Ready to Host */}
      <div className="animate-slide-up-delayed space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-heading font-black text-white flex items-center gap-2 tracking-tight">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <span>Ready-to-Host Quizzes</span>
          </h2>
          <button
            type="button"
            onClick={() => onNavigateTab('quizzes')}
            className="text-sm font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer hover:underline"
          >
            <span>View All ({quizzes.length}) &rarr;</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.slice(0, 3).map((quiz) => (
            <div
              key={quiz.id}
              className="glass-panel card-interactive-glow rounded-3xl p-5 flex flex-col justify-between border border-slate-800 hover:border-purple-500/40 transition-all hover:scale-[1.02] shadow-lg group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 badge-caps">
                    {quiz.subject}
                  </span>
                  <span className="text-sm font-semibold text-slate-400 flex items-center gap-1 tabular-nums font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {quiz.defaultTimeLimit}s / Q
                  </span>
                </div>
                <h3 className="font-heading font-bold text-white text-lg line-clamp-1 mb-1 group-hover:text-purple-300 transition-colors">
                  {quiz.title}
                </h3>
                <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                  {quiz.description || 'Curriculum assessment ready for live multiplayer gameplay.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-slate-400 flex items-center gap-1 tabular-nums font-mono">
                  <FileText className="w-4 h-4 text-purple-400" />
                  {quiz._count?.questions || quiz.questions?.length || 0} Questions
                </span>
                <button
                  type="button"
                  onClick={() => onLaunchQuiz(quiz.id)}
                  disabled={creatingRoom}
                  className="shimmer-btn px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-extrabold flex items-center gap-1.5 shadow-md shadow-purple-600/20 cursor-pointer hover:scale-105 active:scale-95 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Host Live</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
