import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Award,
  Target,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Clock,
  Lightbulb,
  X,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function StudentCornerWidget() {
  const { user, token } = useAuth();
  const { serverUrl } = useSocket();

  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedQuizId, setExpandedQuizId] = useState(null);

  useEffect(() => {
    if (!user) return;
    fetchHistory();
  }, [user, token]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const url = user?.id
        ? `${serverUrl}/api/student/history?userId=${user.id}`
        : `${serverUrl}/api/student/history`;

      const res = await fetch(url, { headers });
      const data = await res.json();
      if (data.success) {
        setHistory(data.history || []);
        setStats(data.stats || null);
        if (data.history && data.history.length > 0) {
          setExpandedQuizId(data.history[0].playerSessionId);
        }
      }
    } catch (err) {
      console.error('Failed to load student history:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedQuizId((prev) => (prev === id ? null : id));
  };

  if (!user || user.role !== 'STUDENT') return null;

  return (
    <div className="fixed top-20 right-4 sm:right-6 z-30 select-none">
      {/* 1. COMPACT CORNER BADGE ("Little things at the corner") */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group card-interactive-glow flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-slate-900/95 border border-purple-500/30 hover:border-purple-400/60 shadow-xl shadow-purple-950/40 backdrop-blur-md transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 animate-fade-scale"
          title="Click to view your attended quizzes, scores & answers"
        >
          {/* Animated Avatar with Aura & Sparkle */}
          <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 p-0.5 shadow-md">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-sm">
              {user.avatar || '🚀'}
            </div>
            <span className="absolute -top-1 -right-1 text-[10px] animate-bounce-subtle">✨</span>
          </div>

          {/* Student Name & Points Pill */}
          <div className="text-left leading-tight hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-heading font-black text-white">{user.name}</span>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold">
              <span className="text-amber-400 flex items-center gap-0.5">
                <Trophy className="w-3 h-3 text-amber-400 inline" />
                <span>+{stats ? stats.totalPointsWon : 0} pts</span>
              </span>
              <span>•</span>
              <span className="text-purple-300">
                {history.length} {history.length === 1 ? 'quiz' : 'quizzes'}
              </span>
            </div>
          </div>

          {/* Micro Expand Arrow Badge */}
          <span className="px-2 py-1 rounded-lg bg-purple-500/15 border border-purple-500/30 text-[10px] font-bold text-purple-300 group-hover:bg-purple-500/25 flex items-center gap-1 transition-colors">
            <span>Scores</span>
            <ChevronDown className="w-3 h-3 text-purple-400 group-hover:translate-y-0.5 transition-transform" />
          </span>
        </button>
      )}

      {/* 2. EXPANDED CORNER SLIDE-OVER / POPOVER CARD */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[480px] max-h-[85vh] flex flex-col glass-panel-glow rounded-3xl border border-purple-500/40 shadow-2xl shadow-purple-950/60 overflow-hidden animate-fade-scale">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 p-0.5 shadow-md">
                <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-lg">
                  {user.avatar || '🚀'}
                </div>
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-heading font-black text-white flex items-center gap-1.5">
                  <span>{user.name}'s Quiz History</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                    Student
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">Scores & Detailed Question Review</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close corner dashboard"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Lifetime Stats Bar */}
          {stats && (
            <div className="grid grid-cols-3 gap-2 px-4 py-3 bg-slate-950/60 border-b border-slate-800 text-center">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Points</span>
                <span className="text-base font-heading font-black text-amber-400">
                  +{stats.totalPointsWon}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Accuracy</span>
                <span className="text-base font-heading font-black text-emerald-400">
                  {stats.overallAccuracy}%
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Attended</span>
                <span className="text-base font-heading font-black text-purple-300">
                  {stats.totalQuizzesAttended}
                </span>
              </div>
            </div>
          )}

          {/* Scrollable Attended Quizzes List with Q&A Breakdown */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className="py-10 text-center text-slate-400 space-y-2">
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-semibold">Loading scores...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="py-10 text-center text-slate-400 space-y-2">
                <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-300">No Quizzes Attended Yet</p>
                <p className="text-[11px] text-slate-500">
                  Join a live quiz using the room PIN on your screen!
                </p>
              </div>
            ) : (
              history.map((quizItem) => {
                const isExpanded = expandedQuizId === quizItem.playerSessionId;
                const formattedDate = new Date(quizItem.attendedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={quizItem.playerSessionId}
                    className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden transition-all shadow-md"
                  >
                    {/* Quiz Item Header */}
                    <div
                      onClick={() => toggleExpand(quizItem.playerSessionId)}
                      className="p-3.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.2 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                            {quizItem.subject}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-amber-400 font-mono text-[10px] font-black">
                            {quizItem.roomCode}
                          </span>
                          <span className="text-[10px] text-slate-400">{formattedDate}</span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-heading font-black text-white truncate">
                          {quizItem.quizTitle}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <span className="text-xs font-heading font-black text-amber-400">
                            +{quizItem.score}
                          </span>
                          <span className="text-[10px] text-slate-400"> / {quizItem.totalQuestions}</span>
                        </div>

                        <span className={`px-2 py-0.5 rounded-xl text-[10px] font-bold border ${
                          quizItem.rank === 1
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                            : 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                        }`}>
                          {quizItem.rank === 1 ? '🥇 1st' : `#${quizItem.rank}`}
                        </span>

                        <div className="p-1 rounded-lg bg-slate-800 text-slate-400">
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Q&A Breakdown */}
                    {isExpanded && (
                      <div className="border-t border-slate-800 bg-slate-950/80 p-3 space-y-3 animate-fade-scale">
                        <div className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
                          <span>Question & Answer Breakdown</span>
                          <span className="text-emerald-400">+{quizItem.correctCount} Correct</span>
                        </div>

                        <div className="space-y-3">
                          {quizItem.questions.map((q, qIdx) => {
                            const isStudentCorrect = q.isCorrect;
                            const studentChoice = q.selectedOption;
                            const correctChoice = q.correctOptionIndex;

                            return (
                              <div
                                key={q.questionId || qIdx}
                                className={`p-3 rounded-xl border text-xs ${
                                  isStudentCorrect
                                    ? 'bg-emerald-950/20 border-emerald-500/30'
                                    : studentChoice === -1
                                    ? 'bg-amber-950/20 border-amber-500/30'
                                    : 'bg-rose-950/20 border-rose-500/30'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <span className="font-bold text-slate-300 text-[11px]">
                                    Q{qIdx + 1}: {q.text}
                                  </span>
                                  {isStudentCorrect ? (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold whitespace-nowrap">
                                      +1 Pt
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold whitespace-nowrap">
                                      0 Pts
                                    </span>
                                  )}
                                </div>

                                {/* Options breakdown */}
                                <div className="space-y-1">
                                  {q.options.map((opt, optIdx) => {
                                    const isCorrectOpt = optIdx === correctChoice;
                                    const isStudentPick = optIdx === studentChoice;

                                    let bg = 'text-slate-400 bg-slate-900/60';
                                    if (isCorrectOpt) {
                                      bg = 'bg-emerald-950/80 text-emerald-200 font-bold border border-emerald-500/50';
                                    } else if (isStudentPick && !isCorrectOpt) {
                                      bg = 'bg-rose-950/80 text-rose-200 font-bold border border-rose-500/50';
                                    }

                                    return (
                                      <div
                                        key={optIdx}
                                        className={`px-2 py-1 rounded-lg flex items-center justify-between text-[11px] ${bg}`}
                                      >
                                        <span>
                                          <strong className="mr-1 opacity-70">
                                            {['A', 'B', 'C', 'D'][optIdx]}:
                                          </strong>
                                          {opt}
                                        </span>
                                        {isCorrectOpt && (
                                          <span className="text-[10px] text-emerald-400 font-bold">
                                            ✔ Correct
                                          </span>
                                        )}
                                        {isStudentPick && !isCorrectOpt && (
                                          <span className="text-[10px] text-rose-400 font-bold">
                                            ✕ Your Pick
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>

                                {q.explanation && (
                                  <div className="mt-2 p-2 rounded-lg bg-purple-950/30 border border-purple-500/20 text-[10px] text-purple-200 flex items-start gap-1.5">
                                    <Lightbulb className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                                    <span>{q.explanation}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-slate-900/80 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Minimize to Corner &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
