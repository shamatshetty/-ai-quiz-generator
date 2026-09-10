import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Dices,
  Trophy,
  Target,
  BookOpen,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Award,
  Eye,
  EyeOff
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { AVATARS, getRandomAvatar } from '../../utils/avatars';
import AmbientBackground from '../../components/AmbientBackground';
import educationBg from '../../assets/education_classroom_bg.jpg';

export default function StudentJoin({ onJoinSuccess, initialRoomCode = '', onBack = null }) {
  const { socket, sessionToken, serverUrl } = useSocket();
  const { user, token } = useAuth();

  // Join Form State
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || getRandomAvatar());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Previous Quiz Scores & Answers State
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedQuizId, setExpandedQuizId] = useState(null);

  // Update name/avatar when user profile loads or changes
  useEffect(() => {
    if (user?.name && !name) {
      setName(user.name);
    }
    if (user?.avatar) {
      setAvatar(user.avatar);
    }
  }, [user]);

  // Check URL query parameters for auto room fill
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('room');
    if (codeParam) {
      setRoomCode(codeParam.toUpperCase());
    }
  }, []);

  // Fetch previous quiz scores & answers if user is logged in
  useEffect(() => {
    if (!user) return;
    fetchStudentHistory();
  }, [user, token]);

  const fetchStudentHistory = async () => {
    try {
      setHistoryLoading(true);
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
      }
    } catch (err) {
      console.error('Failed to load quiz scores:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleRandomAvatar = () => {
    setAvatar(getRandomAvatar());
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!roomCode.trim()) return setError('Please enter a 6-character room code');
    if (!name.trim()) return setError('Please enter your name');
    if (!socket) return setError('Connecting to server, please wait...');

    setError('');
    setLoading(true);

    socket.emit('student:join-room', {
      roomCode: roomCode.trim().toUpperCase(),
      name: name.trim(),
      avatar,
      sessionToken,
      userId: user?.id || null
    }, (res) => {
      setLoading(false);
      if (res && res.success) {
        onJoinSuccess(res);
      } else {
        setError(res?.error || 'Failed to join room. Please check the code.');
      }
    });
  };

  const toggleQuizAnswers = (quizSessionId) => {
    setExpandedQuizId((prev) => (prev === quizSessionId ? null : quizSessionId));
  };

  return (
    <div className="relative max-w-6xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      {/* Full-Screen Education-Themed Background Image with Dark Gradient Overlay */}
      <div className="fixed inset-0 min-h-screen w-full pointer-events-none overflow-hidden select-none z-0">
        <img
          src={educationBg}
          alt="Modern Classroom Education Background"
          className="w-full h-full object-cover object-center filter brightness-[0.70] contrast-[1.08] transform scale-105 animate-living-bg"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1600&q=80';
          }}
        />
        {/* Dark Gradient Overlay: linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.75)) */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0.68) 50%, rgba(0, 0, 0, 0.78) 100%)'
          }}
        />
        {/* Soft edge vignette */}
        <div className="absolute inset-0 bg-radial-at-c from-transparent via-black/20 to-black/60" />
      </div>

      {/* Subtle Corner Animations Only */}
      <AmbientBackground variant="default" />

      {/* Main Responsive Grid: Join Live Quiz + Previous Quiz Scores & Answers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative z-10">
        
        {/* =========================================================
            LEFT COLUMN (5 cols): JOIN LIVE CLASSROOM QUIZ
            ========================================================= */}
        <div className="lg:col-span-5 glass-panel-glow rounded-3xl p-6 sm:p-8 space-y-6 text-center animate-fade-scale shadow-xl">
          {/* Header Icon with Rotating Neon Halo & Breathing Glow */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-400 p-[2px] mx-auto shadow-xl shadow-purple-500/20 animate-spin-slow">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-3xl select-none animate-bounce-subtle">
              ⚡
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-white tracking-tight">
              Join Live Quiz
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Enter the 6-character room PIN displayed on the teacher's screen to play.
            </p>
          </div>

          <form onSubmit={handleJoin} className="space-y-4 text-left">
            {/* Room PIN with Animated Live Search Beacon */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Room Code (PIN)
                </label>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Live Room Engine
                </span>
              </div>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="e.g. ABC123"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full text-center font-mono text-3xl font-black tracking-widest uppercase px-4 py-3.5 rounded-2xl bg-slate-900/90 border-2 border-slate-700 text-amber-400 placeholder-slate-600 focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20 transition-all shadow-inner"
              />
            </div>

            {/* Student Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Your Nickname / Name
              </label>
              <input
                type="text"
                required
                maxLength={20}
                placeholder="e.g. Alex"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-900/90 border-2 border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 font-bold transition-all shadow-inner"
              />
            </div>

            {/* Player Avatar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Player Avatar
                </label>
                <button
                  type="button"
                  onClick={handleRandomAvatar}
                  className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Dices className="w-3.5 h-3.5" />
                  Randomize
                </button>
              </div>

              <div className="flex items-center justify-center gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-inner">
                <span className="text-4xl animate-bounce-subtle select-none">{avatar}</span>
                <div className="flex flex-wrap gap-1.5 justify-center max-w-[200px]">
                  {AVATARS.slice(0, 10).map((a, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAvatar(a)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-base hover:scale-110 transition-transform cursor-pointer ${
                        avatar === a
                          ? 'bg-purple-600 border-2 border-white shadow-md'
                          : 'bg-slate-800 hover:bg-slate-700 border border-slate-700'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold text-center">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group shimmer-btn w-full py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-heading font-black text-lg rounded-2xl border-b-4 border-purple-900 shadow-[0_6px_0_#3b0764,0_12px_24px_rgba(147,51,234,0.35)] flex items-center justify-center gap-2 transition-all transform active:translate-y-1 active:shadow-[0_2px_0_#3b0764] active:border-b-2 hover:scale-[1.01] disabled:opacity-50 cursor-pointer animate-glow-breathe"
            >
              <span>{loading ? 'Joining Room...' : 'Enter Live Quiz'}</span>
              <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1.5" />
            </button>
          </form>

          {/* Back Option to Return to Portal */}
          {onBack && (
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 font-bold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>&larr; Back to Portal / Home</span>
              </button>
            </div>
          )}
        </div>

        {/* =========================================================
            RIGHT COLUMN (7 cols): PREVIOUS QUIZ SCORES & ANSWERS
            ========================================================= */}
        <div className="lg:col-span-7 glass-panel rounded-3xl p-6 sm:p-8 space-y-5 animate-fade-scale shadow-xl border border-slate-800">
          
          {/* Card Header & Student Lifetime Score Pill */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 p-[2px] shadow-md shrink-0 animate-spin-slow">
                <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-2xl select-none">
                  {user?.avatar || '🚀'}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-heading font-black text-white">
                    {user?.name ? `${user.name}'s Quiz Scores` : 'Previous Quiz Scores'}
                  </h2>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  View your attended quiz scores and check correct answers
                </p>
              </div>
            </div>

            {/* Lifetime Performance Badge */}
            {stats && (
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="px-3 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 animate-glow-amber">
                  <Trophy className="w-3.5 h-3.5 text-amber-400 animate-bounce-subtle" />
                  <span>+{stats.totalPointsWon} Points</span>
                </div>
                <div className="px-3 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 animate-glow-emerald">
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{stats.overallAccuracy}% Acc</span>
                </div>
              </div>
            )}
          </div>

          {/* Animated Student Accuracy Meter Strip */}
          {stats && (
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 animate-fade-scale">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Overall Accuracy ({stats.overallAccuracy}%)</span>
                </span>
                <span className="text-amber-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{stats.quizzesAttended} Quizzes Completed</span>
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-1000 relative overflow-hidden"
                  style={{ width: `${Math.max(stats.overallAccuracy, 8)}%` }}
                >
                  <div className="absolute inset-0 bg-white/30 animate-progress-sweep" />
                </div>
              </div>
            </div>
          )}

          {/* Attended Quizzes List */}
          <div className="space-y-4">
            {historyLoading ? (
              <div className="py-12 text-center text-slate-400 space-y-3">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-semibold">Loading your previous scores & answers...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="py-10 text-center text-slate-400 space-y-3 bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
                <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-200">No Past Quizzes Recorded Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Join a live quiz using the room PIN on the left. Once completed, your scores and full answers will appear right here for review!
                </p>
              </div>
            ) : (
              history.map((quizItem) => {
                const isShowingAnswers = expandedQuizId === quizItem.playerSessionId;
                const formattedDate = new Date(quizItem.attendedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={quizItem.playerSessionId}
                    className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-lg transition-all card-interactive-glow"
                  >
                    {/* Quiz Card Header: Score, Rank & Big Action Button */}
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[11px] font-bold border border-purple-500/30">
                            {quizItem.subject}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 font-mono text-[11px] font-black tracking-wider border border-slate-700">
                            ROOM: {quizItem.roomCode}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            {formattedDate}
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-heading font-black text-white tracking-tight">
                          {quizItem.quizTitle}
                        </h3>
                      </div>

                      {/* Performance Scores & Answers Toggle Button */}
                      <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
                        {/* Score Pill */}
                        <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-center">
                          <span className="block text-[9px] uppercase font-bold text-slate-400">Score</span>
                          <span className="text-base font-heading font-black text-amber-400">
                            +{quizItem.score} <span className="text-slate-400 text-xs">/ {quizItem.totalQuestions}</span>
                          </span>
                        </div>

                        {/* Rank Badge */}
                        <div className={`px-3 py-1.5 rounded-xl border text-center ${
                          quizItem.rank === 1
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm animate-pulse-glow'
                            : 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                        }`}>
                          <span className="block text-[9px] uppercase font-bold opacity-75">Rank</span>
                          <span className="text-xs font-bold">
                            {quizItem.rank === 1 ? '🥇 1st Place' : `Rank #${quizItem.rank}`}
                          </span>
                        </div>

                        {/* PROMINENT OPTION TO SEE ANSWERS */}
                        <button
                          type="button"
                          onClick={() => toggleQuizAnswers(quizItem.playerSessionId)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-heading font-black flex items-center gap-1.5 transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95 ${
                            isShowingAnswers
                              ? 'bg-purple-600 text-white border border-purple-400'
                              : 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40'
                          }`}
                        >
                          {isShowingAnswers ? (
                            <>
                              <EyeOff className="w-4 h-4" />
                              <span>Hide Answers</span>
                              <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 text-purple-400" />
                              <span>See Answers ({quizItem.totalQuestions})</span>
                              <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* =======================================================
                        EXPANDED QUESTION-BY-QUESTION REVIEW & ANSWERS
                        ======================================================= */}
                    {isShowingAnswers && (
                      <div className="border-t border-slate-800 bg-slate-950/90 p-4 sm:p-6 space-y-5 animate-fade-scale">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Questions & Answers Review (+1 Correct / 0 Wrong)</span>
                          </h4>
                          <span className="text-xs text-slate-400 font-medium">
                            {quizItem.correctCount} Correct • {quizItem.incorrectCount} Incorrect
                          </span>
                        </div>

                        <div className="space-y-4">
                          {quizItem.questions.map((q, qIdx) => {
                            const isStudentCorrect = q.isCorrect;
                            const studentChoice = q.selectedOption;
                            const correctChoice = q.correctOptionIndex;
                            const isTimeout = studentChoice === -1 || !q.isAnswered;

                            return (
                              <div
                                key={q.questionId || qIdx}
                                className={`rounded-2xl p-4 sm:p-5 border transition-all ${
                                  isStudentCorrect
                                    ? 'bg-emerald-950/20 border-emerald-500/30'
                                    : isTimeout
                                    ? 'bg-amber-950/20 border-amber-500/30'
                                    : 'bg-rose-950/20 border-rose-500/30'
                                }`}
                              >
                                {/* Question Title & Result Badge */}
                                <div className="flex items-start justify-between gap-3 mb-2.5">
                                  <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-black text-slate-300">
                                      Q{qIdx + 1}
                                    </span>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                      Question {qIdx + 1} of {quizItem.totalQuestions}
                                    </span>
                                  </div>

                                  <div>
                                    {isStudentCorrect ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                        <span>Correct (+1 Pt)</span>
                                      </span>
                                    ) : isTimeout ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold">
                                        <Clock className="w-3 h-3 text-amber-400" />
                                        <span>Unanswered (0 Pts)</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-bold">
                                        <XCircle className="w-3 h-3 text-rose-400" />
                                        <span>Incorrect (0 Pts)</span>
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <h5 className="text-sm sm:text-base font-heading font-bold text-white mb-3">
                                  {q.text}
                                </h5>

                                {/* 4 Options: Highlights Correct Option in Emerald Green & Student's Choice */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                                  {q.options.map((optText, optIdx) => {
                                    const isThisCorrect = optIdx === correctChoice;
                                    const isStudentPick = optIdx === studentChoice;

                                    let optStyles = 'bg-slate-900/80 border-slate-800 text-slate-300';
                                    let badge = null;

                                    if (isThisCorrect) {
                                      optStyles = 'bg-emerald-950/70 border-2 border-emerald-500 text-emerald-100 font-bold shadow-sm';
                                      badge = (
                                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                                          <CheckCircle2 className="w-3 h-3" />
                                          <span>Correct Answer</span>
                                        </span>
                                      );
                                    } else if (isStudentPick && !isThisCorrect) {
                                      optStyles = 'bg-rose-950/70 border-2 border-rose-500 text-rose-100 font-bold shadow-sm';
                                      badge = (
                                        <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                                          <XCircle className="w-3 h-3" />
                                          <span>Your Pick</span>
                                        </span>
                                      );
                                    }

                                    return (
                                      <div
                                        key={optIdx}
                                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition-all ${optStyles}`}
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="w-5 h-5 rounded-md bg-black/40 flex items-center justify-center text-[10px] font-bold shrink-0">
                                            {['A', 'B', 'C', 'D'][optIdx]}
                                          </span>
                                          <span>{optText}</span>
                                        </div>
                                        {badge}
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Teacher Explanation */}
                                {q.explanation && (
                                  <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs text-purple-200 flex items-start gap-2">
                                    <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                    <div>
                                      <span className="font-bold text-purple-300 block text-[11px]">Explanation:</span>
                                      <span>{q.explanation}</span>
                                    </div>
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
        </div>
      </div>
    </div>
  );
}
