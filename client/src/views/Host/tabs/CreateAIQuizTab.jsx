import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  BookOpen,
  ArrowRight,
  BrainCircuit,
  Shuffle,
  Zap,
  Play,
  HelpCircle,
  Check,
  AlertCircle,
  PenTool,
  Copy,
  Layers
} from 'lucide-react';
import { useSocket } from '../../../context/SocketContext';

const WITTY_STATUSES = [
  "Consulting the AI knowledge base...",
  "Brewing curriculum-aligned questions...",
  "Formulating plausible distractors...",
  "Shuffling answer options and verifying solutions...",
  "Polishing pedagogical explanations...",
  "Finalizing assessment balance..."
];

const createBlankQuestion = (isTF = false, defaultTimer = 20) => ({
  id: `custom-q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  text: '',
  options: isTF ? ['True', 'False'] : ['', '', '', ''],
  correctOptionIndex: 0,
  explanation: '',
  timeLimit: Number(defaultTimer) || 20,
  difficulty: 'medium',
  isTF
});

export default function CreateAIQuizTab({
  user,
  onQuizSaved,
  onSaveAndHost,
  creatingRoom,
  initialMode = 'manual'
}) {
  const { serverUrl, socket } = useSocket();

  // Mode: 'manual' (type my own) | 'ai' (AI generator)
  const [creationMode, setCreationMode] = useState(initialMode || 'manual');

  // Common Quiz Parameters
  const [quizTitle, setQuizTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [timeLimit, setTimeLimit] = useState(20);

  // AI Form Parameters
  const [numQuestions, setNumQuestions] = useState(5);
  const [questionType, setQuestionType] = useState('mcq');

  // Stage: 'form' (AI input) | 'loading' (AI synthesizing) | 'editor' (interactive editing/typing)
  const [stage, setStage] = useState(initialMode === 'ai' ? 'form' : 'editor');
  const [wittyIndex, setWittyIndex] = useState(0);
  const [generatedQuestions, setGeneratedQuestions] = useState(() => [
    createBlankQuestion(false, 20)
  ]);

  const [saving, setSaving] = useState(false);
  const [regeneratingIndex, setRegeneratingIndex] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Update mode if initialMode prop changes
  useEffect(() => {
    if (initialMode) {
      setCreationMode(initialMode);
      if (initialMode === 'manual') {
        setStage('editor');
        if (generatedQuestions.length === 0) {
          setGeneratedQuestions([createBlankQuestion(false, timeLimit)]);
        }
      } else if (initialMode === 'ai' && generatedQuestions.length === 0) {
        setStage('form');
      }
    }
  }, [initialMode]);

  // Cycle witty statuses while AI loading
  useEffect(() => {
    let interval = null;
    if (stage === 'loading') {
      interval = setInterval(() => {
        setWittyIndex((prev) => (prev + 1) % WITTY_STATUSES.length);
      }, 1400);
    }
    return () => clearInterval(interval);
  }, [stage]);

  const handleSwitchMode = (mode) => {
    setCreationMode(mode);
    if (mode === 'manual') {
      setStage('editor');
      if (generatedQuestions.length === 0) {
        setGeneratedQuestions([createBlankQuestion(false, timeLimit)]);
      }
    } else {
      // AI mode
      if (generatedQuestions.length === 0 || !quizTitle) {
        setStage('form');
      } else {
        setStage('editor');
      }
    }
  };

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!subject.trim()) {
      return alert('Please enter a subject or topic for the quiz (e.g. Photosynthesis, World War 2)');
    }

    setStage('loading');
    setWittyIndex(0);

    try {
      const authToken = localStorage.getItem('quiz_auth_token');
      const headers = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      let clientSessionId = localStorage.getItem('quiz_client_session_id');
      if (!clientSessionId) {
        clientSessionId = 'host-sess-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now();
        localStorage.setItem('quiz_client_session_id', clientSessionId);
      }

      const res = await fetch(`${serverUrl}/api/quizzes/generate-ai`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          subject: subject.trim(),
          difficulty,
          numQuestions: Number(numQuestions) || 5,
          questionType,
          timeLimit: Number(timeLimit) || 20,
          userId: user?.id || null,
          sessionId: clientSessionId
        })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.questions)) {
        setGeneratedQuestions(data.questions);
        setQuizTitle(`${subject.trim()} - Assessment`);
        setStage('editor');
      } else {
        alert(data.error || 'Failed to generate questions');
        setStage('form');
      }
    } catch (err) {
      console.error('Error in AI generation:', err);
      alert('Generation error: ' + err.message);
      setStage('form');
    }
  };

  const handleRegenerateSingle = async (idx) => {
    if (regeneratingIndex !== null) return;
    setRegeneratingIndex(idx);

    try {
      const authToken = localStorage.getItem('quiz_auth_token');
      const headers = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const clientSessionId = localStorage.getItem('quiz_client_session_id') || 'host-sess';

      const res = await fetch(`${serverUrl}/api/quizzes/regenerate-question`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          subject: subject.trim() || 'General Knowledge',
          difficulty,
          questionType,
          timeLimit,
          currentIndex: idx,
          userId: user?.id || null,
          sessionId: clientSessionId
        })
      });
      const data = await res.json();
      if (data.success && data.question) {
        setGeneratedQuestions((prev) =>
          prev.map((q, i) => (i === idx ? data.question : q))
        );
      }
    } catch (err) {
      console.error('Failed to regenerate question:', err);
    } finally {
      setRegeneratingIndex(null);
    }
  };

  const handleDeleteQuestion = (idx) => {
    if (generatedQuestions.length <= 1) {
      return alert('A quiz must contain at least 1 question.');
    }
    setGeneratedQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDuplicateQuestion = (idx) => {
    const q = generatedQuestions[idx];
    if (!q) return;
    const duplicate = {
      ...q,
      id: `q-dup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      options: [...q.options]
    };
    setGeneratedQuestions((prev) => [
      ...prev.slice(0, idx + 1),
      duplicate,
      ...prev.slice(idx + 1)
    ]);
  };

  const handleQuestionTextChange = (idx, newText) => {
    setGeneratedQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, text: newText } : q))
    );
  };

  const handleOptionTextChange = (qIdx, optIdx, newText) => {
    setGeneratedQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const newOptions = [...q.options];
        newOptions[optIdx] = newText;
        return { ...q, options: newOptions };
      })
    );
  };

  const handleCorrectOptionChange = (qIdx, newCorrectIdx) => {
    setGeneratedQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx ? { ...q, correctOptionIndex: newCorrectIdx } : q
      )
    );
  };

  const handleExplanationChange = (qIdx, newExpl) => {
    setGeneratedQuestions((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, explanation: newExpl } : q))
    );
  };

  const handleQuestionTimerChange = (qIdx, newTimer) => {
    setGeneratedQuestions((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, timeLimit: Number(newTimer) } : q))
    );
  };

  const handleAddBlankQuestion = (isTF = false) => {
    setGeneratedQuestions((prev) => [
      ...prev,
      createBlankQuestion(isTF, timeLimit)
    ]);
  };

  const handleResetQuiz = () => {
    if (window.confirm('Clear all typed questions and start over?')) {
      setGeneratedQuestions([createBlankQuestion(false, timeLimit)]);
      setQuizTitle('');
      setSubject('');
    }
  };

  const handleSaveQuiz = async (shouldLaunch = false) => {
    if (!quizTitle.trim()) {
      return alert('Please enter a quiz title (e.g. "Physics Chapter 4 Review")');
    }
    if (generatedQuestions.length === 0) {
      return alert('Please add at least 1 question to your quiz.');
    }

    // Comprehensive validation for teacher questions & options
    for (let i = 0; i < generatedQuestions.length; i++) {
      const q = generatedQuestions[i];
      if (!q.text.trim()) {
        return alert(`Question #${i + 1} is missing its question text.`);
      }
      if (!q.options || q.options.length < 2) {
        return alert(`Question #${i + 1} must have at least 2 options.`);
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          return alert(`Question #${i + 1} Option ${['A', 'B', 'C', 'D'][j] || j + 1} cannot be empty.`);
        }
      }
    }

    setSaving(true);
    setFeedbackMsg('');

    try {
      const res = await fetch(`${serverUrl}/api/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quizTitle.trim(),
          subject: subject.trim() || 'General',
          defaultTimeLimit: Number(timeLimit) || 20,
          authorId: user?.id || null,
          isTeacher: true,
          teacherName: user?.name || 'Teacher',
          questions: generatedQuestions.map((q, idx) => ({
            text: q.text.trim(),
            options: q.options.map((opt) => opt.trim()),
            correctOptionIndex: Number(q.correctOptionIndex) >= 0 ? Number(q.correctOptionIndex) : 0,
            timeLimit: Number(q.timeLimit) || Number(timeLimit) || 20,
            explanation: q.explanation?.trim() || ''
          }))
        })
      });

      const data = await res.json();
      if (data.success) {
        if (shouldLaunch && onSaveAndHost) {
          onSaveAndHost(data.quiz.id);
        } else {
          setFeedbackMsg('Quiz saved and published to student dashboards! 🎉');
          if (onQuizSaved) onQuizSaved(data.quiz);
          setTimeout(() => {
            setFeedbackMsg('');
          }, 3500);
        }
      } else {
        alert(data.error || 'Failed to save quiz');
      }
    } catch (err) {
      alert('Error saving quiz: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 select-none">
      {/* 1. Header & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-black uppercase tracking-wider border border-purple-500/30 mb-2 badge-caps">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-sparkle" />
            <span>Teacher Assessment Studio</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-white tracking-tight">
            {creationMode === 'manual' ? 'Create Custom Quiz' : 'AI Quiz Generator'}
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            {creationMode === 'manual'
              ? 'Type your own questions, options, and explanations. Launch live to students or save to your library.'
              : 'Generate curriculum-aligned quiz questions in seconds powered by AI.'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 self-start md:self-auto shadow-inner">
          <button
            type="button"
            onClick={() => handleSwitchMode('manual')}
            className={`px-3.5 py-2 rounded-xl font-heading font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              creationMode === 'manual'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25 scale-105'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>Type My Own Quiz</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchMode('ai')}
            className={`px-3.5 py-2 rounded-xl font-heading font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              creationMode === 'ai'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 scale-105'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-sparkle" />
            <span>AI Generator</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-bold flex items-center gap-3 animate-bounce-subtle">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* 2. STAGE: AI FORM INPUT */}
      {creationMode === 'ai' && stage === 'form' && (
        <form onSubmit={handleGenerate} className="glass-panel rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl space-y-6">
          {/* Subject / Topic Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Subject or Topic <span className="text-purple-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Photosynthesis, World War 2, Algebra Basics, Quantum Physics"
                className="w-full px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-medium text-sm shadow-inner"
              />
              <BrainCircuit className="w-5 h-5 text-purple-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Quick Suggestion Pills */}
            <div className="flex items-center gap-2 flex-wrap pt-1.5">
              <span className="text-xs font-medium text-slate-500">Quick ideas:</span>
              {['Photosynthesis', 'World War 2', 'Algebra Basics', 'Computer Science', "Newton's Laws"].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSubject(item)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-purple-600/30 border border-slate-700 hover:border-purple-500/40 text-slate-300 hover:text-purple-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Difficulty Level */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="easy">Easy (Fundamentals)</option>
                <option value="medium">Medium (Standard)</option>
                <option value="hard">Hard (Deep Thinking)</option>
                <option value="mixed">Mixed (Progressive)</option>
              </select>
            </div>

            {/* Number of Questions */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                Number of Questions
              </label>
              <select
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold text-sm focus:outline-none focus:border-purple-500"
              >
                <option value={3}>3 Questions (Quick Sprint)</option>
                <option value={5}>5 Questions (Standard)</option>
                <option value={8}>8 Questions</option>
                <option value={10}>10 Questions</option>
                <option value={15}>15 Questions</option>
              </select>
            </div>

            {/* Question Type */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                Question Type
              </label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="mcq">Multiple Choice (MCQ)</option>
                <option value="true_false">True / False Only</option>
                <option value="mixed">Mixed (MCQ & True/False)</option>
              </select>
            </div>

            {/* Question Timer */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                Time Per Question
              </label>
              <select
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold text-sm focus:outline-none focus:border-purple-500"
              >
                <option value={15}>15 Seconds (Rapid)</option>
                <option value={20}>20 Seconds (Standard)</option>
                <option value={30}>30 Seconds (Thoughtful)</option>
                <option value={45}>45 Seconds</option>
                <option value={60}>60 Seconds</option>
              </select>
            </div>
          </div>

          {/* CTA Generate Button */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => handleSwitchMode('manual')}
              className="text-xs font-bold text-slate-400 hover:text-emerald-400 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <PenTool className="w-4 h-4" />
              <span>Prefer to type questions manually? Switch to Manual Builder &rarr;</span>
            </button>

            <button
              type="submit"
              className="shimmer-btn w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-heading font-black text-base rounded-2xl shadow-xl shadow-purple-600/30 flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 cursor-pointer border-b-4 border-purple-900"
            >
              <Sparkles className="w-5 h-5 text-amber-300 animate-sparkle" />
              <span>Generate Quiz with AI</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </form>
      )}

      {/* 3. STAGE: AI LOADING */}
      {stage === 'loading' && (
        <div className="glass-panel rounded-3xl p-12 sm:p-16 text-center border border-purple-500/40 shadow-2xl relative overflow-hidden space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-purple-600/20 border-2 border-purple-400/40 flex items-center justify-center mx-auto text-purple-400 animate-logo-pulse shadow-lg shadow-purple-500/30">
            <BrainCircuit className="w-10 h-10 text-purple-300 animate-spin-slow" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="font-heading font-black text-2xl text-white">
              AI is crafting your quiz...
            </h3>
            <p className="text-sm text-purple-300 font-semibold h-6 transition-all duration-300">
              {WITTY_STATUSES[wittyIndex]}
            </p>
          </div>

          <div className="max-w-md mx-auto h-2 rounded-full bg-slate-800 overflow-hidden relative">
            <div className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 rounded-full animate-bar-grow w-full" />
          </div>

          <div className="flex items-center justify-center gap-3 text-xs text-slate-400 font-medium pt-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Generating {numQuestions} Questions
            </span>
            <span>•</span>
            <span>Topic: {subject}</span>
          </div>
        </div>
      )}

      {/* 4. STAGE: QUESTION EDITOR (Works for both Manual Typing & AI Review) */}
      {(stage === 'editor' || (creationMode === 'manual' && stage !== 'loading')) && (
        <div className="space-y-6">
          {/* Quiz Metadata Editor Card */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400">
                  Quiz Title <span className="text-purple-400">*</span>
                </label>
                <input
                  type="text"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="e.g. Cell Biology & Photosynthesis Unit Exam"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-white font-bold text-base focus:outline-none focus:border-purple-500 placeholder-slate-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400">
                  Topic / Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Biology, History, Chemistry"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-white font-semibold text-sm focus:outline-none focus:border-purple-500 placeholder-slate-500"
                />
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-800/80 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{generatedQuestions.length} Questions</span>
                </span>
                <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Default {timeLimit}s timer</span>
                </span>
                <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 capitalize">
                  {creationMode === 'manual' ? '✍️ Custom Quiz' : '🪄 AI Generated'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetQuiz}
                  className="text-xs text-slate-400 hover:text-rose-400 font-medium transition-colors cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>

          {/* List of Questions */}
          <div className="space-y-4">
            {generatedQuestions.map((q, qIdx) => {
              const isTF = q.options.length === 2 && q.options.includes('True');

              return (
                <div
                  key={q.id || qIdx}
                  className="glass-panel rounded-3xl p-5 sm:p-6 border border-slate-800 hover:border-purple-500/40 transition-all space-y-3.5 relative shadow-lg"
                >
                  {/* Card Header Row */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center font-heading font-bold text-purple-300 text-xs">
                        {qIdx + 1}
                      </span>
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Question {qIdx + 1}
                      </span>
                      <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {isTF ? 'True / False' : 'Multiple Choice (4 Options)'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Per-Question Timer Selector */}
                      <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-xl px-2 py-1">
                        <Clock className="w-3 h-3 text-purple-400" />
                        <select
                          value={q.timeLimit || timeLimit}
                          onChange={(e) => handleQuestionTimerChange(qIdx, e.target.value)}
                          className="bg-transparent text-xs font-medium text-slate-300 focus:outline-none cursor-pointer"
                        >
                          <option value={10}>10s</option>
                          <option value={15}>15s</option>
                          <option value={20}>20s</option>
                          <option value={30}>30s</option>
                          <option value={45}>45s</option>
                          <option value={60}>60s</option>
                          <option value={90}>90s</option>
                        </select>
                      </div>

                      {/* Duplicate Question */}
                      <button
                        type="button"
                        onClick={() => handleDuplicateQuestion(qIdx)}
                        title="Duplicate question"
                        className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-purple-300 border border-slate-800 transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Optional AI Regenerate */}
                      {subject.trim() && (
                        <button
                          type="button"
                          onClick={() => handleRegenerateSingle(qIdx)}
                          disabled={regeneratingIndex === qIdx}
                          title="Generate fresh text for this question with AI"
                          className="p-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 hover:text-white border border-purple-500/30 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <RotateCcw
                            className={`w-3.5 h-3.5 ${
                              regeneratingIndex === qIdx ? 'animate-spin' : ''
                            }`}
                          />
                        </button>
                      )}

                      {/* Delete Question */}
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(qIdx)}
                        title="Delete question"
                        className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Question Prompt Editor */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-300">
                      Question Prompt *
                    </label>
                    <textarea
                      rows={2}
                      value={q.text}
                      onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-white font-normal text-sm focus:outline-none focus:border-purple-500 placeholder-slate-500"
                      placeholder="Type your question here (e.g. Which cellular organelle is responsible for generating ATP?)"
                    />
                  </div>

                  {/* Options Editor with Clear Correct Answer Picker */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">
                        Answer Options <span className="text-purple-400 font-normal text-[11px]">(Click option card or radio button to set correct solution)</span>
                      </span>
                      <span className="text-xs font-bold text-emerald-400">
                        ✓ Correct: {['Option A', 'Option B', 'Option C', 'Option D'][q.correctOptionIndex] || 'Option A'}
                      </span>
                    </div>

                    <div className={`grid gap-2.5 ${isTF ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = q.correctOptionIndex === optIdx;
                        const letter = ['A', 'B', 'C', 'D'][optIdx] || optIdx + 1;

                        return (
                          <div
                            key={optIdx}
                            onClick={() => handleCorrectOptionChange(qIdx, optIdx)}
                            className={`flex items-center gap-2.5 p-2.5 rounded-2xl border-2 transition-all cursor-pointer ${
                              isCorrect
                                ? 'bg-emerald-950/40 border-emerald-400 shadow-md shadow-emerald-500/15'
                                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`correct-${qIdx}`}
                              checked={isCorrect}
                              onChange={() => handleCorrectOptionChange(qIdx, optIdx)}
                              className="text-emerald-500 focus:ring-0 cursor-pointer w-3.5 h-3.5"
                            />
                            <span
                              className={`w-6 h-6 rounded-lg flex items-center justify-center font-heading font-bold text-xs shrink-0 ${
                                isCorrect
                                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {letter}
                            </span>
                            <input
                              type="text"
                              value={opt}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleOptionTextChange(qIdx, optIdx, e.target.value)}
                              className="flex-1 bg-transparent text-sm text-white focus:outline-none font-normal placeholder-slate-500"
                              placeholder={`Type Option ${letter}...`}
                            />
                            {isCorrect && (
                              <span className="text-[10px] font-bold uppercase text-emerald-300 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 shrink-0">
                                Correct ✓
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Post-Quiz Pedagogical Explanation */}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                      <span>Explanation / Learning Tip (Optional — shown to students after answering)</span>
                    </label>
                    <input
                      type="text"
                      value={q.explanation || ''}
                      onChange={(e) => handleExplanationChange(qIdx, e.target.value)}
                      placeholder="e.g. Mitochondria produce cellular energy through oxidative phosphorylation..."
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-purple-500 font-normal placeholder-slate-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Question Controls */}
          <div className="flex flex-wrap items-center gap-2.5 p-3.5 rounded-3xl bg-slate-900/60 border border-slate-800">
            <button
              type="button"
              onClick={() => handleAddBlankQuestion(false)}
              className="px-3.5 py-2 rounded-2xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Multiple Choice Question (4 Options)</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddBlankQuestion(true)}
              className="px-3.5 py-2 rounded-2xl bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/40 text-teal-300 hover:text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add True / False Question</span>
            </button>
          </div>

          {/* Sticky Bottom Action Strip */}
          <div className="sticky bottom-4 z-20 glass-panel rounded-3xl p-4 border border-purple-500/40 shadow-2xl backdrop-blur-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 tabular-nums">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-mono">{generatedQuestions.length} Questions Ready</span>
              <span className="text-slate-500">•</span>
              <span className="text-purple-300 font-mono">Est. Time: ~{Math.round((generatedQuestions.length * timeLimit) / 60) || 1} min</span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => handleSaveQuiz(false)}
                disabled={saving}
                className="shimmer-btn flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{saving ? 'Saving...' : 'Save to My Quizzes'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveQuiz(true)}
                disabled={saving || creatingRoom}
                className="shimmer-btn flex-1 sm:flex-initial px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current text-slate-950" />
                <span>{creatingRoom ? 'Launching...' : 'Save & Host Live Session Now 🚀'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
