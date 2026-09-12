import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  Flame,
  ArrowRight,
  RotateCcw,
  Trophy,
  BrainCircuit,
  HelpCircle,
  Zap,
  Award,
  Check,
  Play,
  Download,
  Printer,
  FileSpreadsheet,
  LayoutDashboard,
  ArrowLeft
} from 'lucide-react';
import TimerRing from '../../../components/TimerRing';
import soundManager from '../../../utils/sound';
import {
  printStudentQuizReport
} from '../../../utils/exportReport';

const QUICK_TOPICS = [
  'Photosynthesis',
  'World War 2',
  'Algebra Basics',
  'Computer Science',
  'Biology',
  'Physics',
  'World Geography',
  'Chemistry'
];


export default function OnlineQuizTab({
  user,
  token,
  serverUrl,
  initialSubject = '',
  onQuizCompleted,
  onViewReview,
  onReturnToDashboard
}) {
  // Phase: 'setup' | 'loading' | 'active' | 'completed'
  const [phase, setPhase] = useState('setup');

  // Setup Form State
  const [subject, setSubject] = useState(initialSubject || '');
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [questionType, setQuestionType] = useState('mcq');
  const [isTimed, setIsTimed] = useState(true);

  // Active Quiz State
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState([]); // { questionIndex, selectedOption, isCorrect, timeTakenMs, pointsAwarded }

  // Timer State for active question
  const [remainingSeconds, setRemainingSeconds] = useState(20);
  const timerRef = useRef(null);

  // 5-second Auto-Redirect to Dashboard State
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const redirectTimerRef = useRef(null);

  const handleReturnToDashboard = () => {
    if (redirectTimerRef.current) clearInterval(redirectTimerRef.current);
    setPhase('setup');
    setSubject('');
    if (typeof onQuizCompleted === 'function') {
      onQuizCompleted();
    }
    if (typeof onReturnToDashboard === 'function') {
      onReturnToDashboard();
    }
  };

  // Auto-redirect timer when quiz completes (5 seconds)
  useEffect(() => {
    if (phase !== 'completed') return;

    setRedirectCountdown(5);
    redirectTimerRef.current = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(redirectTimerRef.current);
          handleReturnToDashboard();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (redirectTimerRef.current) clearInterval(redirectTimerRef.current);
    };
  }, [phase]);

  // Clear timeouts on component unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (redirectTimerRef.current) clearInterval(redirectTimerRef.current);
    };
  }, []);

  // Loading animation state
  const [loadingText, setLoadingText] = useState('Consulting AI curriculum synthesizer...');

  // Reset when initialSubject changes
  useEffect(() => {
    if (initialSubject) {
      setSubject(initialSubject);
    }
  }, [initialSubject]);

  // Loading messages loop
  useEffect(() => {
    let interval = null;
    if (phase === 'loading') {
      const messages = [
        `Synthesizing questions for "${subject}"...`,
        "Formulating realistic multiple-choice options...",
        "Validating curriculum accuracy and distractors...",
        "Preparing personalized feedback & explanations..."
      ];
      let i = 0;
      interval = setInterval(() => {
        i = (i + 1) % messages.length;
        setLoadingText(messages[i]);
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [phase, subject]);

  // Timer countdown per question
  useEffect(() => {
    if (phase !== 'active' || !isTimed || selectedOption !== null) return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [phase, currentIndex, isTimed, selectedOption]);

  const handleStartQuiz = async (e) => {
    if (e) e.preventDefault();
    if (!subject.trim()) {
      return alert('Please enter or select a subject to take a quiz on.');
    }

    setPhase('loading');

    try {
      const authToken = token || localStorage.getItem('quiz_auth_token');
      const headers = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      // Retrieve or create persistent student session ID
      let clientSessionId = localStorage.getItem('quiz_student_session_id');
      if (!clientSessionId) {
        clientSessionId = 'sess-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now();
        localStorage.setItem('quiz_student_session_id', clientSessionId);
      }

      const res = await fetch(`${serverUrl}/api/quizzes/generate-ai`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          subject: subject.trim(),
          difficulty,
          numQuestions: Number(numQuestions) || 5,
          questionType,
          timeLimit: isTimed ? 20 : 0,
          userId: user?.id || null,
          sessionId: clientSessionId
        })
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        setQuestions(data.questions);
        setCurrentIndex(0);
        setSelectedOption(null);
        setScore(0);
        setStreak(0);
        setStudentAnswers([]);
        setRemainingSeconds(20);
        setPhase('active');
      } else {
        alert(data.error || 'Failed to generate online quiz. Please try again.');
        setPhase('setup');
      }
    } catch (err) {
      console.error('Quiz start error:', err);
      alert('Error connecting to quiz engine: ' + err.message);
      setPhase('setup');
    }
  };

  const currentQuestion = questions[currentIndex] || {};

  const advanceToNextOrFinish = (updatedAnswers, updatedScore) => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setRemainingSeconds(20);
    } else {
      finishQuiz(updatedAnswers, updatedScore);
    }
  };

  const handleOptionClick = (optIdx) => {
    if (selectedOption !== null) return;

    if (timerRef.current) clearInterval(timerRef.current);

    const isCorrect = optIdx === currentQuestion.correctOptionIndex;
    const pointsAwarded = isCorrect ? 1 : 0;
    const updatedScore = score + pointsAwarded;

    try {
      if (isCorrect) {
        soundManager.playCorrect();
      } else {
        soundManager.playIncorrect();
      }
    } catch (e) {
      // ignore audio errors
    }

    if (isCorrect) {
      setScore(updatedScore);
      setStreak((prev) => prev + 1);
    } else {
      setStreak(0);
    }

    const timeSpentMs = (20 - remainingSeconds) * 1000;
    const newAnswer = {
      questionIndex: currentIndex,
      selectedOption: optIdx,
      isCorrect,
      timeTakenMs: Math.max(1000, timeSpentMs),
      pointsAwarded
    };
    const updatedAnswers = [...studentAnswers, newAnswer];
    setStudentAnswers(updatedAnswers);

    // Directly and immediately advance to the next question
    advanceToNextOrFinish(updatedAnswers, updatedScore);
  };

  const handleTimeExpired = () => {
    if (selectedOption !== null) return;

    try {
      soundManager.playIncorrect();
    } catch (e) {}

    setStreak(0);

    const timeoutAnswer = {
      questionIndex: currentIndex,
      selectedOption: -1,
      isCorrect: false,
      timeTakenMs: 20000,
      pointsAwarded: 0
    };
    const updatedAnswers = [...studentAnswers, timeoutAnswer];
    setStudentAnswers(updatedAnswers);

    // Directly and immediately advance to next question on timeout
    advanceToNextOrFinish(updatedAnswers, score);
  };

  const handleNextQuestion = () => {
    advanceToNextOrFinish(studentAnswers, score);
  };

  const finishQuiz = async (finalAnswers = studentAnswers, finalScore = score) => {
    setPhase('completed');
    soundManager.playFanfare();

    // Trigger celebratory confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Save session to student performance history in backend
    const totalCorrect = finalAnswers.filter((a) => a.isCorrect).length;
    const finalAccuracy = Math.round((totalCorrect / questions.length) * 100);

    try {
      await fetch(`${serverUrl}/api/student/practice-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          subject: subject.trim(),
          quizTitle: `${subject.trim()} Online Quiz`,
          difficulty,
          questions,
          answers: finalAnswers,
          score: finalScore,
          accuracy: finalAccuracy,
          userId: user?.id || null
        })
      });
      // onQuizCompleted is deferred to handleReturnToDashboard to preserve the full 5-second score duration
    } catch (err) {
      console.error('Failed to record practice quiz in history:', err);
    }
  };

  const correctCount = studentAnswers.filter((a) => a.isCorrect).length;
  const accuracyPercentage = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-tab-enter text-white">
      {/* 1. SETUP PHASE */}
      {phase === 'setup' && (
        <div className="space-y-6">
          {/* Edge Back to Dashboard Button */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleReturnToDashboard}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 text-slate-300 hover:text-white text-xs font-bold transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95 group"
            >
              <ArrowLeft className="w-4 h-4 text-purple-400 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Dashboard</span>
            </button>
          </div>

          {/* Hero Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-900/90 via-indigo-900/80 to-slate-900/90 border border-purple-500/40 shadow-2xl relative overflow-hidden backdrop-blur-md">
            <div className="space-y-2 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-black uppercase tracking-wider border border-purple-500/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>On-Demand Online Assessment</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-heading font-black text-white tracking-tight">
                Take an Online Quiz by Subject
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
                Choose or type any topic to test your knowledge. The AI synthesizer will generate an instant, self-paced online quiz with answer explanations.
              </p>
            </div>
          </div>

          {/* Form Card */}
          <form onSubmit={handleStartQuiz} className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6 shadow-2xl">
            {/* Subject Input */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                What subject or topic do you want to be quizzed on? <span className="text-purple-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Photosynthesis, World War 2, Algebra Basics, Cell Biology, Python, Solar System"
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 font-bold text-base focus:outline-none focus:border-purple-500 shadow-inner"
                />
                <BrainCircuit className="w-5 h-5 text-purple-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Quick Topic Pills */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] text-slate-500 font-semibold mr-1">Quick pick:</span>
                {QUICK_TOPICS.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => setSubject(topic)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      subject === topic
                        ? 'bg-purple-600 text-white border border-purple-400 shadow-sm'
                        : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700/60'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {/* Parameter Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Difficulty */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-purple-500"
                >
                  <option value="easy">Easy (Fundamentals)</option>
                  <option value="medium">Medium (Standard)</option>
                  <option value="hard">Hard (Deep Thinking)</option>
                  <option value="mixed">Mixed (Progressive)</option>
                </select>
              </div>

              {/* Number of Questions */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Questions
                </label>
                <select
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-purple-500"
                >
                  <option value={3}>3 Questions (Quick Blitz)</option>
                  <option value={5}>5 Questions (Standard)</option>
                  <option value={10}>10 Questions (Challenge)</option>
                </select>
              </div>

              {/* Question Type */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Question Format
                </label>
                <select
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-purple-500"
                >
                  <option value="mcq">Multiple Choice (MCQ)</option>
                  <option value="true_false">True / False</option>
                  <option value="mixed">Mixed Format</option>
                </select>
              </div>
            </div>

            {/* Timer Preference */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-bold text-sm text-white flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span>Timed Mode (20s per question)</span>
                </span>
                <p className="text-xs text-slate-400">
                  Challenge yourself against the clock or toggle off for relaxed self-paced study.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsTimed(!isTimed)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  isTimed ? 'bg-purple-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    isTimed ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Start CTA */}
            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-heading font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-purple-600/30 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer border-b-4 border-purple-900"
            >
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>Start Online Quiz on "{subject || 'Your Subject'}" &rarr;</span>
            </button>
          </form>
        </div>
      )}

      {/* 2. LOADING PHASE */}
      {phase === 'loading' && (
        <div className="glass-panel rounded-3xl p-12 sm:p-16 text-center border border-purple-500/40 shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-purple-600/20 border-2 border-purple-400/40 flex items-center justify-center mx-auto text-purple-300 animate-logo-pulse">
            <BrainCircuit className="w-8 h-8 animate-spin-slow text-purple-400" />
          </div>

          <div className="space-y-2">
            <h3 className="font-heading font-black text-2xl text-white">
              Preparing Your Online Quiz
            </h3>
            <p className="text-sm text-purple-300 font-semibold">{loadingText}</p>
          </div>

          <div className="max-w-md mx-auto h-2 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 rounded-full animate-bar-grow w-full" />
          </div>

          <p className="text-xs text-slate-400">
            Topic: <span className="text-white font-bold">{subject}</span> • Format: {questionType.toUpperCase()} • Level: {difficulty}
          </p>
        </div>
      )}

      {/* 3. ACTIVE QUIZ RUNNER PHASE */}
      {phase === 'active' && currentQuestion && (
        <div className="space-y-4 animate-fadeIn">
          {/* Top Status Bar */}
          <div className="glass-panel rounded-3xl p-4 sm:p-5 border border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Exit the current quiz and return to dashboard?')) {
                    handleReturnToDashboard();
                  }
                }}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-slate-400 hover:text-white transition-all cursor-pointer shrink-0 hover:scale-105 active:scale-95 group"
                title="Exit Quiz and Return to Dashboard"
              >
                <ArrowLeft className="w-4 h-4 text-purple-400 group-hover:-translate-x-0.5 transition-transform" />
              </button>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-black uppercase tracking-wider">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {subject}
                </span>
                {streak > 1 && (
                  <span className="text-xs font-black text-amber-400 flex items-center gap-1 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30 animate-pulse">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    <span>{streak} Streak!</span>
                  </span>
                )}
              </div>

              <div className="w-48 sm:w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 block">Score</span>
                <span className="font-heading font-black text-amber-400 text-lg sm:text-xl">
                  {score} pts
                </span>
              </div>

              {isTimed && (
                <div className="shrink-0">
                  <TimerRing
                    remainingSeconds={remainingSeconds}
                    totalSeconds={20}
                    size="sm"
                    isPaused={false}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Question Prompt Box */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-purple-400">
              Question {currentIndex + 1}
            </span>
            <h2 className="text-xl sm:text-2xl font-heading font-black text-white leading-snug">
              {currentQuestion.text}
            </h2>
          </div>

          {/* Uniform Modern Answer Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            {(currentQuestion.options || []).map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const letter = ['A', 'B', 'C', 'D'][idx] || idx + 1;

              let cardStyle = isSelected
                ? 'bg-purple-900/40 border-2 border-purple-400 ring-4 ring-purple-500/20 shadow-xl shadow-purple-600/25 scale-[1.01]'
                : selectedOption !== null
                ? 'bg-slate-950/60 border-2 border-slate-800/60 text-slate-500 opacity-50 pointer-events-none'
                : 'bg-slate-900/90 border-2 border-slate-800/90 hover:border-purple-500/60 hover:bg-slate-850 hover:shadow-lg hover:shadow-purple-500/10 cursor-pointer';

              let badgeStyle = isSelected
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-300 shadow-md'
                : 'bg-slate-800/90 border-slate-700/80 text-slate-300 group-hover:border-purple-400 group-hover:text-purple-300';

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={selectedOption !== null}
                  onClick={() => handleOptionClick(idx)}
                  className={`group min-h-[90px] sm:min-h-[110px] p-4 sm:p-5 rounded-3xl text-left flex items-center gap-3.5 relative overflow-hidden transition-all duration-200 ${cardStyle} ${
                    selectedOption !== null ? 'cursor-default' : 'cursor-pointer'
                  }`}
                >
                  {/* Option Letter Indicator */}
                  <div
                    className={`w-9 h-9 rounded-2xl border font-heading font-bold text-sm flex items-center justify-center shrink-0 transition-colors ${badgeStyle}`}
                  >
                    {letter}
                  </div>

                  {/* Option Text */}
                  <div className="font-heading font-medium text-white text-sm sm:text-base drop-shadow-sm leading-snug tracking-tight flex-1">
                    {opt}
                  </div>

                  {/* Selected Status Badge */}
                  {isSelected && (
                    <div className="bg-purple-500/25 border border-purple-400/60 text-purple-200 px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-fadeIn shrink-0">
                      <Check className="w-4 h-4 text-purple-300 stroke-[3]" />
                      <span className="text-xs font-black uppercase tracking-wider">Selected</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. COMPLETED / SCORECARD PHASE */}
      {phase === 'completed' && (
        <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-purple-500/40 shadow-2xl space-y-8 text-center animate-fadeIn">
          {/* Badge & Trophy */}
          <div className="space-y-3">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border-2 border-amber-400/40 flex items-center justify-center mx-auto text-amber-300 shadow-xl shadow-amber-500/20 animate-bounce-subtle">
              <Trophy className="w-10 h-10" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white">
              Quiz Completed! 🎉
            </h2>
            <p className="text-sm text-slate-300">
              Great job completing the <span className="text-purple-300 font-bold">{subject}</span> online assessment.
            </p>
          </div>

          {/* 5-Second Auto-Return Countdown Banner */}
          <div className="max-w-xl mx-auto p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-purple-950/90 via-slate-900/95 to-indigo-950/90 border border-purple-500/50 shadow-2xl flex items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-purple-500/30 border border-purple-400/60 flex items-center justify-center font-heading font-black text-amber-300 text-xl shadow-inner shrink-0 animate-pulse">
                {redirectCountdown}s
              </div>
              <div className="text-left">
                <p className="text-white font-heading font-black text-sm sm:text-base">
                  Returning to Dashboard in {redirectCountdown} second{redirectCountdown === 1 ? '' : 's'}...
                </p>
                <p className="text-xs text-purple-300">
                  Your score and performance have been auto-saved
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleReturnToDashboard}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-heading font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-purple-600/30 shrink-0 hover:scale-105 active:scale-95 flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Back Now</span>
            </button>
          </div>

          {/* Stats Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold block">Total Score</span>
              <span className="font-heading font-black text-2xl text-amber-400 mt-1 block">
                {score} {score === 1 ? 'mark' : 'marks'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold block">Accuracy</span>
              <span className="font-heading font-black text-2xl text-emerald-400 mt-1 block">
                {accuracyPercentage}%
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold block">Correct</span>
              <span className="font-heading font-black text-2xl text-purple-300 mt-1 block">
                {correctCount} / {questions.length}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold block">Rating</span>
              <span className="font-heading font-black text-lg text-cyan-400 mt-1 block truncate">
                {accuracyPercentage >= 80 ? 'Master' : accuracyPercentage >= 60 ? 'Proficient' : 'Developing'}
              </span>
            </div>
          </div>

          {/* Detailed Question Review List */}
          <div className="text-left space-y-3 pt-2">
            <h4 className="font-heading font-black text-base text-white">
              Answer Review Breakdown
            </h4>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const ans = studentAnswers.find((a) => a.questionIndex === idx);
                const isCorrect = ans?.isCorrect;
                const chosenText = ans && ans.selectedOption >= 0 ? q.options[ans.selectedOption] : 'Time Expired / Skipped';
                const correctText = q.options[q.correctOptionIndex];

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                      isCorrect
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-rose-500/10 border-rose-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-white">
                        Question {idx + 1}: {q.text}
                      </span>
                      <span
                        className={`font-black uppercase text-[10px] px-2 py-0.5 rounded-full ${
                          isCorrect
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {isCorrect ? 'Correct ✓' : 'Incorrect ✗'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-slate-300">
                      <div>
                        Your Answer: <span className={isCorrect ? 'text-emerald-300 font-bold' : 'text-rose-300 font-bold'}>{chosenText}</span>
                      </div>
                      {!isCorrect && (
                        <div>
                          Correct Solution: <span className="text-emerald-300 font-bold">{correctText}</span>
                        </div>
                      )}
                    </div>

                    {q.explanation && (
                      <p className="text-slate-400 italic pt-1 border-t border-slate-800/60">
                        💡 {q.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => {
                printStudentQuizReport({
                  studentName: user?.name || 'Student',
                  subject: subject || 'General Knowledge',
                  quizTitle: `${subject} Assessment`,
                  score,
                  maxScore: questions.length,
                  accuracyPercentage,
                  timeTaken: 'Completed',
                  date: new Date(),
                  questions,
                  studentAnswers
                });
              }}
              className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/50 text-slate-200 hover:text-white font-heading font-black text-sm flex items-center gap-2 shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="Print quiz report or save as PDF"
            >
              <Printer className="w-4 h-4 text-purple-400" />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={handleReturnToDashboard}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-heading font-black text-sm flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Back to Dashboard ({redirectCountdown}s)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (redirectTimerRef.current) clearInterval(redirectTimerRef.current);
                handleStartQuiz();
              }}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-heading font-black text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="Generate a completely new set of questions on the same subject"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Retake Same Topic (New Questions)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (redirectTimerRef.current) clearInterval(redirectTimerRef.current);
                setPhase('setup');
                setSubject('');
              }}
              className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/50 text-slate-200 hover:text-white font-heading font-black text-sm flex items-center gap-2 shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Choose Another Topic</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
