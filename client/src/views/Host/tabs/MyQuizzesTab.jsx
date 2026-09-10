import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Clock,
  FileText,
  Play,
  Trash2,
  Edit,
  CheckCircle2,
  Sparkles,
  Bell,
  Eye,
  Plus,
  Copy,
  PenTool,
  GraduationCap,
  X
} from 'lucide-react';
import { useSocket } from '../../../context/SocketContext';

export default function MyQuizzesTab({
  quizzes,
  onLaunchQuiz,
  onDeleteQuiz,
  onUpdateQuizTimer,
  notifiedQuizId,
  creatingRoom,
  onNavigateCreate
}) {
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [previewQuiz, setPreviewQuiz] = useState(null);

  // Subject categories list
  const subjects = useMemo(() => {
    const list = Array.from(new Set(quizzes.map((q) => q.subject || 'General')));
    return ['all', ...list];
  }, [quizzes]);

  // Filtered quizzes
  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((q) => {
      const matchSearch =
        q.title.toLowerCase().includes(search.toLowerCase()) ||
        (q.subject && q.subject.toLowerCase().includes(search.toLowerCase()));
      const matchSubject = selectedSubject === 'all' || q.subject === selectedSubject;
      return matchSearch && matchSubject;
    });
  }, [quizzes, search, selectedSubject]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header & Search Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-white tracking-tight flex items-center gap-2.5">
            <span>Teacher Quizzes</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-purple-300 border border-slate-700 tabular-nums font-mono">
              {quizzes.length} Hosted
            </span>
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Verified teacher-hosted curriculum assessments. Only quizzes created or hosted by teachers are listed here.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => onNavigateCreate('manual')}
            className="shimmer-btn px-3.5 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <PenTool className="w-4 h-4 text-slate-950" />
            <span>Type My Own Quiz</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateCreate('ai')}
            className="shimmer-btn px-3.5 py-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-sparkle" />
            <span>Create AI Quiz</span>
          </button>
        </div>
      </div>

      {/* Search & Subject Filter Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search quizzes by title or topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-400 shrink-0 badge-caps">Subject:</span>
          {subjects.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => setSelectedSubject(sub)}
              className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer shrink-0 ${
                selectedSubject === sub
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 scale-105'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* Quiz Cards Grid */}
      {filteredQuizzes.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-slate-800 space-y-4">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto animate-bounce" />
          <h3 className="font-heading font-bold text-white text-base">No Teacher Quizzes Found</h3>
          <p className="text-slate-400 text-xs max-w-sm mx-auto">
            {search
              ? 'Try adjusting your search terms or filters.'
              : 'Only quizzes created and hosted by teachers appear here. Build your first quiz using the manual builder or AI generator!'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigateCreate('manual')}
              className="shimmer-btn px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              <PenTool className="w-4 h-4" />
              <span>Type My Own Quiz</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateCreate('ai')}
              className="shimmer-btn px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-600/20 hover:scale-105 active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create AI Quiz</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="glass-panel card-interactive-glow rounded-3xl p-6 flex flex-col justify-between border border-slate-800 hover:border-purple-500/40 transition-all group hover:scale-[1.02] shadow-xl"
            >
              <div>
                {/* Card Header with Subject and Teacher Attribution */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 badge-caps">
                    {quiz.subject}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{quiz.author?.name || 'Teacher'}</span>
                    </span>
                    <div className="flex items-center gap-1 text-xs text-slate-400 font-medium tabular-nums font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{quiz.defaultTimeLimit}s / Q</span>
                    </div>
                  </div>
                </div>

                <h3 className="text-base sm:text-lg font-bold font-heading text-white group-hover:text-purple-300 transition-colors mb-2 line-clamp-2">
                  {quiz.title}
                </h3>

                {quiz.description && (
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                    {quiz.description}
                  </p>
                )}

                <div className="flex items-center gap-3 text-xs text-slate-400 font-medium mb-4">
                  <span className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 tabular-nums font-mono">
                    <FileText className="w-3.5 h-3.5 text-purple-400" />
                    {quiz._count?.questions || quiz.questions?.length || 0} Questions
                  </span>
                  <span className="text-emerald-400 flex items-center gap-1 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Ready
                  </span>
                </div>

                {/* Question Timer Presets with instant class alert */}
                <div className="mb-4 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-inner">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-purple-400" />
                      <span>Timer:</span>
                      <span className="text-purple-300 font-mono font-bold tabular-nums">{quiz.defaultTimeLimit}s</span>
                    </div>
                    {notifiedQuizId === quiz.id ? (
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1 animate-bounce-subtle badge-caps">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Notified Class!
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        <Bell className="w-3 h-3 text-amber-400" />
                        Alerts class
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[15, 20, 30, 45, 60].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => onUpdateQuizTimer(quiz, t)}
                        className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer tabular-nums font-mono ${
                          quiz.defaultTimeLimit === t
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/40 scale-105 border border-purple-400/40'
                            : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700/80 border border-slate-700/40 hover:scale-105'
                        }`}
                        title={`Set timer to ${t}s and notify students`}
                      >
                        {t}s
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => onLaunchQuiz(quiz.id)}
                  disabled={creatingRoom}
                  className="shimmer-btn w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 transition-all transform active:scale-95 hover:scale-[1.02] disabled:opacity-50 cursor-pointer border-b-4 border-purple-900 group text-xs"
                >
                  <Play className="w-4 h-4 fill-current group-hover:scale-125 transition-transform" />
                  <span>{creatingRoom ? 'Generating Room...' : 'Host Live Room'}</span>
                </button>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setPreviewQuiz(quiz)}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-purple-400" />
                    <span>Questions</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteQuiz(quiz.id, quiz.title)}
                    className="py-1.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] cursor-pointer"
                    title="Delete quiz"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Questions Modal */}
      {previewQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl bg-[#090D1F] border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 max-h-[85vh] flex flex-col animate-card-entrance">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {previewQuiz.subject}
                </span>
                <h3 className="font-heading font-black text-xl sm:text-2xl text-white mt-1.5">
                  {previewQuiz.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewQuiz(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {previewQuiz.questions && previewQuiz.questions.length > 0 ? (
                previewQuiz.questions.map((q, idx) => {
                  const opts = Array.isArray(q.options)
                    ? q.options
                    : typeof q.options === 'string'
                    ? JSON.parse(q.options || '[]')
                    : [];

                  return (
                    <div
                      key={q.id || idx}
                      className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-purple-400">
                          Question {idx + 1}
                        </span>
                        <span className="text-sm text-slate-500 tabular-nums font-mono">
                          {q.timeLimit || previewQuiz.defaultTimeLimit}s
                        </span>
                      </div>
                      <p className="font-semibold text-base text-white">{q.text}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {opts.map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            className={`p-2.5 rounded-xl text-sm font-medium flex items-center gap-2 ${
                              optIdx === q.correctOptionIndex
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                                : 'bg-slate-950 text-slate-400 border border-slate-800'
                            }`}
                          >
                            <span className="text-slate-500 font-bold">{['A', 'B', 'C', 'D'][optIdx]}.</span>
                            <span className="truncate">{opt}</span>
                            {optIdx === q.correctOptionIndex && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <p className="text-sm text-slate-400 italic pt-1.5 border-t border-slate-800/80">
                          💡 {q.explanation}
                        </p>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No question details loaded. Launch to preview in game.
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-sm text-slate-400 font-semibold">
                {previewQuiz._count?.questions || previewQuiz.questions?.length || 0} Questions Total
              </span>
              <button
                type="button"
                onClick={() => {
                  setPreviewQuiz(null);
                  onLaunchQuiz(previewQuiz.id);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer transition-all hover:scale-105 active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Host Live Room Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
