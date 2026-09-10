import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Trophy, 
  Gift, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Flame, 
  Users, 
  Copy, 
  Check, 
  Sparkles,
  Bot,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Award
} from 'lucide-react';
import TimerRing from '../../components/TimerRing';
import { useSocket } from '../../context/SocketContext';

export default function HostLiveControl({
  roomCode,
  questionData,
  timerData,
  liveDashboardData,
  status, // 'QUESTION' | 'REVEAL'
  answeredCount = 0,
  totalPlayers = 0,
  onNextQuestion,
  onPauseTimer,
  onResumeTimer,
  onSkipQuestion,
  onTriggerPrize,
  onEndQuiz
}) {
  const { socket } = useSocket();
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [selectedPrizeType, setSelectedPrizeType] = useState('lucky_draw');
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState(false);

  // Extract question info (read-only for teacher context)
  const question = questionData?.question || {};
  const questionIndex = questionData?.questionIndex ?? liveDashboardData?.currentQuestionIndex ?? 0;
  const totalQuestions = questionData?.totalQuestions ?? liveDashboardData?.totalQuestions ?? 1;
  const questionText = liveDashboardData?.questionText || question.text || 'Loading question...';
  const correctOptionText = liveDashboardData?.correctOptionText || 
    (question.options && questionData?.correctOptionIndex !== undefined ? question.options[questionData.correctOptionIndex] : '');
  const explanation = liveDashboardData?.explanation || questionData?.explanation || '';

  const remainingSeconds = timerData?.remainingSeconds ?? 0;
  const totalSeconds = timerData?.totalSeconds ?? 20;
  const isPaused = timerData?.isPaused ?? false;

  // Students list from live dashboard (sorted by score descending)
  const students = liveDashboardData?.students || [];
  const effectiveTotalPlayers = liveDashboardData?.totalPlayers ?? totalPlayers;
  const effectiveAnsweredCount = liveDashboardData?.totalAnswered ?? answeredCount;
  const accuracy = liveDashboardData?.accuracy ?? 0;
  const avgTimeMs = liveDashboardData?.averageTimeMs ?? 0;
  const allAnswered = liveDashboardData?.allAnswered || (effectiveTotalPlayers > 0 && effectiveAnsweredCount >= effectiveTotalPlayers);

  // Top student currently in 1st place
  const topStudent = students.length > 0 ? students[0] : null;

  const handlePrizeConfirm = () => {
    if (typeof onTriggerPrize === 'function') {
      onTriggerPrize(selectedPrizeType);
    }
    setShowPrizeModal(false);
  };

  const copyPin = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateStudents = (count = 5) => {
    if (!socket || simulating) return;
    setSimulating(true);
    socket.emit('host:simulate-students', { roomCode, count }, () => {
      setSimulating(false);
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* 1. Teacher Console Header */}
      <div className="glass-panel rounded-3xl p-4 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4 border border-purple-500/30 shadow-2xl">
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-black uppercase tracking-wider border border-purple-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Teacher Live Console
              </span>
              <span className="text-xs font-bold text-slate-400">
                Question {questionIndex + 1} of {totalQuestions}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-300">Room PIN:</span>
              <button
                type="button"
                onClick={copyPin}
                className="font-mono font-black text-amber-400 text-xl tracking-wider hover:text-amber-300 transition-colors flex items-center gap-1.5"
                title="Click to copy room code"
              >
                <span>{roomCode}</span>
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              </button>
            </div>
          </div>

          {/* Quick Timer Pill for Mobile */}
          <div className="md:hidden">
            <TimerRing
              remainingSeconds={remainingSeconds}
              totalSeconds={totalSeconds}
              size="sm"
              isPaused={isPaused}
            />
          </div>
        </div>

        {/* Progress Pill: X / Y Students Answered */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-center bg-slate-900/60 border border-slate-800 rounded-2xl px-5 py-3">
          <div className="text-center">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
              Live Submissions
            </div>
            <div className="text-lg font-black text-white flex items-center gap-2">
              <span>{effectiveAnsweredCount} / {effectiveTotalPlayers} Answered</span>
              {allAnswered && effectiveTotalPlayers > 0 && (
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  All In!
                </span>
              )}
            </div>
          </div>

          <div className="hidden md:block">
            <TimerRing
              remainingSeconds={remainingSeconds}
              totalSeconds={totalSeconds}
              size="sm"
              isPaused={isPaused}
            />
          </div>
        </div>

        {/* Teacher Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {isPaused ? (
            <button
              onClick={onResumeTimer}
              className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Play className="w-4 h-4" />
              <span>Resume</span>
            </button>
          ) : (
            <button
              onClick={onPauseTimer}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Pause className="w-4 h-4" />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={() => setShowPrizeModal(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-pink-600/30 to-rose-600/30 hover:from-pink-600/50 hover:to-rose-600/50 text-pink-300 border border-pink-500/40 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
            title="Celebrate top student or give lucky classroom prize"
          >
            <Gift className="w-4 h-4 text-pink-400" />
            <span className="hidden sm:inline">Prize Moment</span>
          </button>

          {/* High-visibility Next Question Button */}
          <button
            onClick={onNextQuestion}
            className={`px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-all transform active:scale-95 cursor-pointer ${
              allAnswered ? 'animate-bounce ring-4 ring-emerald-400/40' : ''
            }`}
          >
            <span>Next Question</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to end this live quiz early?')) {
                onEndQuiz();
              }
            }}
            className="px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs font-bold border border-rose-500/20 transition-colors"
          >
            End Quiz
          </button>
        </div>
      </div>

      {/* 2. Question Reference Banner (Teacher Only - Informational, NOT an answering pad) */}
      <div className="bg-gradient-to-br from-slate-900/90 via-purple-950/40 to-slate-900/90 border border-purple-500/30 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 border-b border-purple-500/20 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
              Live Question Active on Students' Devices
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span>🔒 Answering runs only on student screens</span>
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl font-heading font-black text-white leading-relaxed mb-4">
          {questionText}
        </h2>

        {/* Teacher Key Reference */}
        <div className="flex flex-wrap items-center gap-3">
          {correctOptionText && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Correct Key: <strong className="text-white underline">{correctOptionText}</strong></span>
              <span className="text-[10px] bg-emerald-600/30 px-1.5 py-0.5 rounded text-emerald-200">+1 Pt</span>
            </div>
          )}

          {explanation && (
            <div className="text-xs text-slate-300 bg-slate-800/80 border border-slate-700/80 px-3.5 py-1.5 rounded-xl">
              💡 <span className="font-semibold text-slate-200">Note:</span> {explanation}
            </div>
          )}
        </div>
      </div>

      {/* 3. Live Student Scoreboard Dashboard ("whose score is more after each question they answer") */}
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 space-y-6">
        {/* Dashboard Title & Quick Metric Summary */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-wider mb-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Live Student Leaderboard
            </div>
            <h3 className="text-xl sm:text-2xl font-heading font-black text-white">
              Student Score Rankings
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Ranked by highest score in real time as students submit answers (+1 point per correct answer)
            </p>
          </div>

          {/* Quick Stat Badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {topStudent && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-3.5 py-2 flex items-center gap-2">
                <span className="text-xl">{topStudent.avatar || '👑'}</span>
                <div>
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    Current Leader
                  </div>
                  <div className="text-xs font-black text-white">
                    {topStudent.name} ({topStudent.score} pts)
                  </div>
                </div>
              </div>
            )}

            <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl px-3.5 py-2 text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Accuracy
              </div>
              <div className="text-xs font-black text-emerald-400">
                {accuracy}% Correct
              </div>
            </div>

            {avgTimeMs > 0 && (
              <div className="bg-slate-800/70 border border-slate-700/70 rounded-2xl px-3.5 py-2 text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Avg Speed
                </div>
                <div className="text-xs font-black text-purple-300">
                  {(avgTimeMs / 1000).toFixed(1)}s
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. Ranked Students Score List */}
        {students.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-3xl">
              👥
            </div>
            <div>
              <h4 className="text-lg font-bold text-white mb-1">Waiting for Students to Join</h4>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Students join with Room PIN <span className="font-mono font-bold text-amber-400">{roomCode}</span> on their phone or laptop.
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={() => handleSimulateStudents(5)}
                disabled={simulating}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-2xl border border-purple-500/40 inline-flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
              >
                <Bot className="w-4 h-4" />
                <span>{simulating ? 'Adding Students...' : '+ Add 5 Demo Students to Test Scoreboard'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Live Top 3 Class Leaders Podium */}
            {students.length >= 2 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl mb-4 animate-fade-scale">
                {/* 2nd Place */}
                {students[1] && (
                  <div className="p-3 rounded-2xl bg-gradient-to-b from-slate-400/15 to-slate-500/5 border border-slate-400/30 flex items-center sm:flex-col justify-between sm:justify-center text-center gap-2 order-2 sm:order-1">
                    <div className="flex items-center sm:flex-col gap-2.5">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800 border-2 border-slate-300/60 flex items-center justify-center text-2xl shadow-md">
                          {students[1].avatar || '🥈'}
                        </div>
                        <span className="absolute -bottom-1 -right-1 text-base">🥈</span>
                      </div>
                      <div className="text-left sm:text-center min-w-0">
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-300">2nd Rank</div>
                        <div className="text-sm font-heading font-black text-white truncate max-w-[120px]">{students[1].name}</div>
                      </div>
                    </div>
                    <div className="text-right sm:text-center">
                      <div className="text-lg font-heading font-black text-slate-200">{students[1].score} pts</div>
                      {students[1].streak >= 2 && <div className="text-[10px] text-amber-400 font-bold">🔥 {students[1].streak} streak</div>}
                    </div>
                  </div>
                )}

                {/* 1st Place (Leader) */}
                {students[0] && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-b from-amber-500/20 to-yellow-600/5 border-2 border-amber-400/60 flex items-center sm:flex-col justify-between sm:justify-center text-center gap-2 order-1 sm:order-2 shadow-lg shadow-amber-500/10 scale-100 sm:scale-105">
                    <div className="flex items-center sm:flex-col gap-2.5">
                      <div className="relative">
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg animate-bounce-subtle">👑</span>
                        <div className="w-14 h-14 rounded-2xl bg-slate-900 border-2 border-amber-400 flex items-center justify-center text-3xl shadow-lg shadow-amber-400/20">
                          {students[0].avatar || '🥇'}
                        </div>
                        <span className="absolute -bottom-1 -right-1 text-base">🥇</span>
                      </div>
                      <div className="text-left sm:text-center min-w-0">
                        <div className="text-[10px] font-black uppercase tracking-wider text-amber-400">Class Leader</div>
                        <div className="text-base font-heading font-black text-amber-300 truncate max-w-[130px]">{students[0].name}</div>
                      </div>
                    </div>
                    <div className="text-right sm:text-center">
                      <div className="text-2xl font-heading font-black text-white">{students[0].score} pts</div>
                      {students[0].streak >= 2 && <div className="text-[10px] text-amber-400 font-bold">🔥 {students[0].streak} streak</div>}
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {students[2] && (
                  <div className="p-3 rounded-2xl bg-gradient-to-b from-amber-700/15 to-orange-800/5 border border-amber-600/30 flex items-center sm:flex-col justify-between sm:justify-center text-center gap-2 order-3">
                    <div className="flex items-center sm:flex-col gap-2.5">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800 border-2 border-amber-600/60 flex items-center justify-center text-2xl shadow-md">
                          {students[2].avatar || '🥉'}
                        </div>
                        <span className="absolute -bottom-1 -right-1 text-base">🥉</span>
                      </div>
                      <div className="text-left sm:text-center min-w-0">
                        <div className="text-[10px] font-black uppercase tracking-wider text-amber-300">3rd Rank</div>
                        <div className="text-sm font-heading font-black text-white truncate max-w-[120px]">{students[2].name}</div>
                      </div>
                    </div>
                    <div className="text-right sm:text-center">
                      <div className="text-lg font-heading font-black text-amber-200">{students[2].score} pts</div>
                      {students[2].streak >= 2 && <div className="text-[10px] text-amber-400 font-bold">🔥 {students[2].streak} streak</div>}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
            {students.map((student, idx) => {
              const rank = student.rank || idx + 1;
              const hasAnswered = student.hasAnswered;
              const isCorrect = student.isCorrect;
              const pointsAwarded = student.pointsAwarded || 0;
              const streak = student.streak || 0;
              const timeSec = student.timeTakenMs ? (student.timeTakenMs / 1000).toFixed(1) : null;

              // Rank styling (Top 3 get medals)
              const rankBadge = {
                1: { medal: '🥇', label: '1st', bg: 'from-amber-500/20 to-yellow-600/20 border-amber-400/50 text-amber-300 ring-2 ring-amber-400/30' },
                2: { medal: '🥈', label: '2nd', bg: 'from-slate-300/20 to-slate-400/20 border-slate-300/50 text-slate-200' },
                3: { medal: '🥉', label: '3rd', bg: 'from-amber-700/20 to-orange-800/20 border-amber-600/50 text-amber-200' }
              }[rank] || { medal: `#${rank}`, label: `#${rank}`, bg: 'from-slate-800/60 to-slate-900/60 border-slate-700/60 text-slate-400' };

              return (
                <div
                  key={student.sessionToken || idx}
                  className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 rounded-2xl border transition-all duration-300 gap-3 bg-gradient-to-r ${rankBadge.bg} ${
                    rank === 1 ? 'shadow-xl shadow-amber-500/10' : ''
                  }`}
                >
                  {/* Left: Rank Medal + Avatar + Name + Streak */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Rank Badge */}
                    <div className="w-10 h-10 rounded-xl bg-slate-900/90 border border-white/10 flex items-center justify-center font-heading font-black text-base shrink-0">
                      {rank <= 3 ? (
                        <span className="text-xl">{rankBadge.medal}</span>
                      ) : (
                        <span className="text-slate-400 text-xs font-bold">#{rank}</span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                      {student.avatar || '🦊'}
                    </div>

                    {/* Name & Badges */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-black text-white text-base truncate">
                          {student.name}
                        </span>
                        {student.isBot && (
                          <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            Demo
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5">
                        {streak >= 2 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                            <Flame className="w-3 h-3 text-amber-400 animate-pulse" />
                            <span>{streak} Streak</span>
                          </span>
                        )}
                        {rank === 1 && (
                          <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full">
                            Top Score 👑
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Question Answering Status & Total Score */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pl-14 sm:pl-0">
                    {/* Question Status Badge */}
                    <div>
                      {hasAnswered ? (
                        isCorrect ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black shadow-sm">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Correct</span>
                            <span className="text-[10px] bg-emerald-600/30 px-1 rounded text-emerald-200">+1 Pt</span>
                            {timeSec && <span className="text-[10px] text-emerald-400/80 font-normal">({timeSec}s)</span>}
                          </div>
                        ) : student.isAutoSubmitted ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-xs font-bold">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Timed Out (0 Pts)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-black shadow-sm">
                            <XCircle className="w-4 h-4 text-rose-400" />
                            <span>Incorrect</span>
                            <span className="text-[10px] bg-rose-600/30 px-1 rounded text-rose-200">0 Pts</span>
                            {timeSec && <span className="text-[10px] text-rose-400/80 font-normal">({timeSec}s)</span>}
                          </div>
                        )
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                          <span>Answering...</span>
                        </div>
                      )}
                    </div>

                    {/* Total Cumulative Score */}
                    <div className="text-right min-w-[85px]">
                      <div className="text-xl sm:text-2xl font-heading font-black text-white flex items-center justify-end gap-1">
                        <span>{student.score}</span>
                        <span className="text-xs font-bold text-slate-400">pts</span>
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Total Score
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

        {/* Helper footer: Add demo students if needed */}
        {students.length > 0 && students.length < 10 && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
            <span>Score updates instantly when students click their answer.</span>
            <button
              type="button"
              onClick={() => handleSimulateStudents(5)}
              disabled={simulating}
              className="text-purple-400 hover:text-purple-300 font-bold underline transition-colors cursor-pointer"
            >
              {simulating ? 'Simulating...' : '+ Add 5 more demo students'}
            </button>
          </div>
        )}
      </div>

      {/* Prize Modal */}
      {showPrizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel-glow max-w-md w-full rounded-3xl p-6 sm:p-8 space-y-6 border border-pink-500/30 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center mx-auto text-3xl">
                🎁
              </div>
              <h3 className="text-2xl font-heading font-black text-white">
                Classroom Prize Moment
              </h3>
              <p className="text-slate-300 text-xs">
                Celebrate student effort and energize the classroom!
              </p>
            </div>

            <div className="space-y-3">
              {[
                { id: 'lucky_draw', label: '🎲 Lucky Draw', desc: 'Randomly picks a student who answered correctly' },
                { id: 'current_leader', label: '👑 Current Leader', desc: 'Highlights the #1 ranked student on screen' },
                { id: 'most_improved', label: '🔥 Hot Streak', desc: 'Celebrates the student with the highest active streak' }
              ].map((type) => (
                <div
                  key={type.id}
                  onClick={() => setSelectedPrizeType(type.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedPrizeType === type.id
                      ? 'border-pink-400 bg-pink-950/40 ring-2 ring-pink-400/40 shadow-lg'
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-white text-sm">{type.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{type.desc}</div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowPrizeModal(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold border border-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePrizeConfirm}
                className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white rounded-2xl text-xs font-black shadow-lg shadow-pink-500/30"
              >
                Broadcast Prize 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
