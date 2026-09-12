import React from 'react';
import {
  Target,
  Award,
  TrendingUp,
  Flame,
  Zap,
  ArrowRight,
  Sparkles,
  Calendar,
  Clock,
  BookOpen,
  BrainCircuit
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
      // easeOutExpo
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

export default function OverviewTab({
  user,
  stats,
  history,
  currentUserRank,
  notifications = [],
  onJoinFromNotification,
  onSelectTab,
  onSelectQuizToReview,
  onOpenJoinModal,
  onStartSubjectQuiz
}) {
  const quizzesAttended = stats?.totalQuizzesAttended || history.length || 0;
  const overallAccuracy = stats?.overallAccuracy || (history.length > 0 ? Math.round(history.reduce((a, b) => a + b.accuracyPercentage, 0) / history.length) : 0);
  const currentRank = currentUserRank?.rank ? `#${currentUserRank.rank}` : '#1';
  const currentStreak = currentUserRank?.streak || (history.length > 0 ? history[0].streak || 3 : 1);

  const recentQuizzes = history.slice(0, 3);

  // Real-time second-by-second ticker to track quiz time expiration
  const [now, setNow] = React.useState(Date.now());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute active live quiz: disappears automatically once the time of the quiz finishes
  const activeLiveQuiz = React.useMemo(() => {
    return notifications.find((n) => {
      if (!n.isLive) return false;
      const createdAtMs = new Date(n.createdAt).getTime();
      if (!createdAtMs || isNaN(createdAtMs)) return false;

      const totalQuestions = Math.max(1, Number(n.totalQuestions) || 5);
      const timeLimitSec = Math.max(5, Number(n.timeLimit) || 20);
      // Total duration: questions duration + 45s lobby buffer
      const totalDurationMs = (totalQuestions * timeLimitSec * 1000) + (45 * 1000);
      const elapsedMs = now - createdAtMs;

      // Once the time of the quiz finishes, it should NOT display on the dashboard!
      if (elapsedMs >= totalDurationMs) {
        return false;
      }
      return true;
    });
  }, [notifications, now]);

  // Remaining countdown seconds
  const remainingSeconds = React.useMemo(() => {
    if (!activeLiveQuiz) return 0;
    const createdAtMs = new Date(activeLiveQuiz.createdAt).getTime();
    const totalQuestions = Math.max(1, Number(activeLiveQuiz.totalQuestions) || 5);
    const timeLimitSec = Math.max(5, Number(activeLiveQuiz.timeLimit) || 20);
    const totalDurationMs = (totalQuestions * timeLimitSec * 1000) + (45 * 1000);
    const remainingMs = totalDurationMs - (now - createdAtMs);
    return Math.max(0, Math.floor(remainingMs / 1000));
  }, [activeLiveQuiz, now]);

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-6 animate-tab-enter text-white">
      {/* 0. Real-time Live Quiz Active Alert Banner (auto-hides once quiz time finishes) */}
      {activeLiveQuiz && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-orange-500/20 border-2 border-amber-400/80 backdrop-blur-xl shadow-2xl shadow-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-bounce-subtle">
          <div className="flex items-center gap-3.5">
            <div className="relative flex shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-2xl bg-amber-400 opacity-75"></span>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/30 border border-amber-400/60 flex items-center justify-center text-2xl relative shadow-md">
                ⚡
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 border border-amber-400/40 animate-badge-pulse">
                  🔴 Live Classroom Quiz Active Now
                </span>
                <span className="text-xs text-amber-300/80 font-mono font-bold">
                  PIN: {activeLiveQuiz.roomCode}
                </span>
                <span className="text-xs text-amber-200 font-mono font-bold bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-300" />
                  <span>{formatTimer(remainingSeconds)} left</span>
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-heading font-black text-white mt-1">
                {activeLiveQuiz.quizTitle}
              </h3>
              <p className="text-xs text-slate-300">
                Hosted by <strong>{activeLiveQuiz.hostName || 'Teacher'}</strong> in <em>{activeLiveQuiz.subject || 'General'}</em> ({activeLiveQuiz.totalQuestions || 'Multiple'} questions • {activeLiveQuiz.timeLimit || 20}s timer)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onJoinFromNotification && onJoinFromNotification(activeLiveQuiz.roomCode)}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-heading font-black text-sm shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 transition-all whitespace-nowrap shrink-0 self-stretch sm:self-auto justify-center"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Join Live Room (PIN {activeLiveQuiz.roomCode}) &rarr;</span>
          </button>
        </div>
      )}

      {/* 1. Welcome Banner with Slowly Shifting Gradient & Waving Hand Loop */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-900/80 via-indigo-900/80 to-purple-950/90 bg-[length:200%_200%] animate-gradient-flow border border-purple-500/30 text-white shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-sparkle" />
              <span className="badge-caps">AI Learning Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-white flex items-center gap-2">
              <span>Welcome back, {user?.name?.split(' ')[0] || 'Scholar'}!</span>
              <span className="inline-block animate-wave select-none text-2xl sm:text-3xl">👋</span>
            </h1>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              Track your daily study streaks, review answer rationales, and join live multiplayer classroom competitions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onStartSubjectQuiz && onStartSubjectQuiz('')}
              className="shimmer-btn px-5 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-heading font-bold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-95 group whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-4 h-4 text-slate-950 animate-sparkle shrink-0" />
              <span>Take Online Quiz</span>
            </button>
            <button
              type="button"
              onClick={onOpenJoinModal}
              className="shimmer-btn px-5 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-heading font-bold text-sm shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-95 group whitespace-nowrap shrink-0"
            >
              <Zap className="w-4 h-4 text-amber-300 animate-zap-pulse shrink-0" />
              <span>Join Live Quiz</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1.8 Take Online Quiz by Subject Showcase Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-900/90 to-purple-950/80 border border-purple-500/30 backdrop-blur-xl shadow-xl space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-sm">
              <BrainCircuit className="w-5 h-5 text-purple-400 animate-logo-pulse" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-white text-base sm:text-lg flex items-center gap-2">
                <span>Take an Online Quiz by Subject</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 badge-caps animate-badge-pulse">
                  On-Demand AI
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Choose any subject or type your own to generate an instant, self-paced assessment with answers and explanations.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onStartSubjectQuiz && onStartSubjectQuiz('')}
            className="shimmer-btn px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-heading font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30 hover:shadow-purple-600/50 cursor-pointer self-start sm:self-auto hover:scale-105 active:scale-95 transition-all shrink-0"
          >
            <span>Start Online Quiz &rarr;</span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium">Pick a topic:</span>
          {[
            'Photosynthesis',
            'World War 2',
            'Algebra Basics',
            'Computer Science',
            'Biology',
            'Physics'
          ].map((subj) => (
            <button
              key={subj}
              type="button"
              onClick={() => onStartSubjectQuiz && onStartSubjectQuiz(subj)}
              className="px-3 py-1 rounded-xl bg-slate-800/80 hover:bg-purple-600/30 border border-slate-700 hover:border-purple-400 text-slate-200 hover:text-white text-xs font-semibold transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] active:translate-y-0 active:scale-95"
            >
              ⚡ {subj}
            </button>
          ))}
        </div>
      </div>

      {/* 2. 4 Quick Stat Metric Cards (Staggered Fade + Slide + Animated Count Up) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Quizzes */}
        <div className="dashboard-card p-5 space-y-3 animate-stat-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider badge-caps">Quizzes Taken</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-heading font-bold text-white stat-number">
              <AnimatedCounter value={quizzesAttended} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Total sessions completed</p>
          </div>
        </div>

        {/* Average Accuracy */}
        <div className="dashboard-card p-5 space-y-3 animate-stat-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider badge-caps">Avg Accuracy</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-heading font-bold text-white stat-number">
              <AnimatedCounter value={overallAccuracy} suffix="%" />
            </div>
            <p className="text-xs text-emerald-400 font-medium mt-0.5">Mastery target: 80%+</p>
          </div>
        </div>

        {/* Leaderboard Rank */}
        <div className="dashboard-card p-5 space-y-3 animate-stat-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider badge-caps">Leaderboard Rank</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-heading font-bold text-white stat-number tabular-nums">
              {currentRank}
            </div>
            <p className="text-xs text-amber-400 font-medium mt-0.5">Top score in class</p>
          </div>
        </div>

        {/* Daily Streak with Looping Flame Flicker */}
        <div className="dashboard-card p-5 space-y-3 animate-stat-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider badge-caps">Daily Streak</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center">
              <Flame className="w-4 h-4 animate-flame-flicker text-rose-400" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-heading font-bold text-white stat-number tabular-nums flex items-center gap-2">
              <span>{currentStreak} Days</span>
              <span className="text-xl animate-flame-flicker inline-block">🔥</span>
            </div>
            <p className="text-xs text-rose-400 font-medium mt-0.5">Keep the flame alive!</p>
          </div>
        </div>
      </div>

      {/* 3. Two-Column Row: Recent Activity + Study Roadmap (Scroll/Mount Revealed) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up-delayed">
        {/* Left Column: Recent Quiz History (2 cols) */}
        <div className="lg:col-span-2 dashboard-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-heading font-bold text-white">Recent Quiz Activity</h2>
              <p className="text-xs text-slate-400 font-sans">Your latest quiz completions and answer results</p>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab('scores')}
              className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View All Scores</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentQuizzes.length === 0 ? (
            <div className="text-center py-10 text-slate-400 space-y-2">
              <BookOpen className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm font-semibold text-slate-300 font-sans">No quizzes attempted yet</p>
              <p className="text-xs text-slate-500 font-sans">Join a classroom quiz or practice session to see results here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentQuizzes.map((q) => (
                <div
                  key={q.playerSessionId}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-slate-950/60 hover:bg-purple-950/40 border border-slate-800/80 hover:border-purple-500/50 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-950/30 transition-all duration-200 gap-3 group cursor-pointer"
                  onClick={() => onSelectQuizToReview(q.playerSessionId)}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-lg font-bold shadow-sm shrink-0">
                      {q.accuracyPercentage >= 80 ? '🌟' : q.accuracyPercentage >= 60 ? '⚡' : '🎯'}
                    </div>
                    <div>
                      <h4 className="text-sm font-heading font-bold text-white group-hover:text-purple-300 transition-colors">
                        {q.quizTitle}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="font-medium text-slate-300">{q.subject}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {new Date(q.attendedAt).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {q.timeTaken}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="text-sm font-heading font-bold text-white">
                        {q.correctCount}/{q.totalQuestions} ({q.accuracyPercentage}%)
                      </div>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full inline-block ${
                          q.performanceBadge === 'Excellent'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : q.performanceBadge === 'Good'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {q.performanceBadge}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectQuizToReview(q.playerSessionId);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-purple-400 text-slate-300 hover:text-white text-xs font-bold shadow-sm flex items-center gap-1 transition-all"
                    >
                      <span>Review</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Study Roadmap */}
        <div className="dashboard-card p-6 space-y-4">
          <div>
            <h2 className="text-base font-heading font-bold text-white">Study Roadmap</h2>
            <p className="text-xs text-slate-400">Fast paths to improve your standing</p>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                <span>Top Strength</span>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 rounded-full font-black border border-emerald-500/30">94%</span>
              </div>
              <p className="text-xs text-emerald-200/90 leading-relaxed">Science & Computing fundamentals — ready for advanced quizzes!</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-purple-300">
                <span>Next Milestone</span>
                <span className="text-[10px] px-2 py-0.5 bg-purple-500/20 rounded-full font-black border border-purple-500/30">150 Marks to #1</span>
              </div>
              <p className="text-xs text-purple-200/90 leading-relaxed">Score 80%+ on your next quiz to climb to 1st place on the leaderboard!</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                <span>Review Recommended</span>
                <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 rounded-full font-black border border-amber-500/30">2 Missed</span>
              </div>
              <p className="text-xs text-amber-200/90 leading-relaxed">You have 2 questions to review from your last tech blitz.</p>
              <button
                type="button"
                onClick={() => onSelectTab('review')}
                className="text-xs font-bold text-amber-300 hover:text-amber-200 underline inline-flex items-center gap-1 mt-1 cursor-pointer"
              >
                Inspect Missed Questions &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
