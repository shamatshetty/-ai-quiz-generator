import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  Lightbulb,
  Clock,
  BookOpen,
  ChevronDown,
  Download,
  Printer
} from 'lucide-react';
import {
  downloadStudentQuizReportCSV,
  printStudentQuizReport
} from '../../../utils/exportReport';

export default function AnswerReviewTab({
  history,
  selectedQuizId,
  onSelectQuiz
}) {
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL', 'CORRECT', 'MISSED'

  // Identify current selected quiz session
  const activeQuiz = useMemo(() => {
    if (!history || history.length === 0) return null;
    if (selectedQuizId) {
      const found = history.find((q) => q.playerSessionId === selectedQuizId);
      if (found) return found;
    }
    return history[0];
  }, [history, selectedQuizId]);

  // Questions for active quiz
  const questions = activeQuiz?.questions || [];

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    if (filterMode === 'CORRECT') {
      return questions.filter((q) => q.isCorrect);
    }
    if (filterMode === 'MISSED') {
      return questions.filter((q) => !q.isCorrect);
    }
    return questions;
  }, [questions, filterMode]);

  if (!history || history.length === 0) {
    return (
      <div className="dashboard-card p-12 text-center text-slate-500 space-y-3 animate-tab-enter text-white">
        <BookOpen className="w-12 h-12 mx-auto text-slate-600" />
        <h3 className="text-base font-bold text-slate-300">No quizzes to review yet</h3>
        <p className="text-xs text-slate-500">Complete a quiz session to unlock detailed question breakdown and teacher explanations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-tab-enter text-white">
      {/* 1. Header & Quiz Switcher Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-black text-white">Answer Review Breakdown</h1>
          <p className="text-sm text-slate-400">
            Step through question rationales, see what you selected, and read teacher explanations.
          </p>
        </div>

        {/* Quiz Session Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
            Select Quiz:
          </label>
          <div className="relative min-w-[260px]">
            <select
              value={activeQuiz?.playerSessionId || ''}
              onChange={(e) => onSelectQuiz(e.target.value)}
              className="w-full py-2.5 pl-3 pr-8 text-xs font-bold bg-slate-950 border border-slate-800 rounded-xl shadow-sm text-white focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              {history.map((q) => (
                <option key={q.playerSessionId} value={q.playerSessionId}>
                  {q.quizTitle} ({q.score}/{q.totalQuestions} - {new Date(q.attendedAt).toLocaleDateString()})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 2. Active Quiz Summary Banner */}
      {activeQuiz && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900/90 via-indigo-950/80 to-purple-950/90 border border-purple-500/30 text-white shadow-xl space-y-4 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">
                <span>{activeQuiz.subject}</span>
                <span>•</span>
                <span>Room PIN: {activeQuiz.roomCode}</span>
              </div>
              <h2 className="text-xl font-heading font-black text-white">{activeQuiz.quizTitle}</h2>
              {activeQuiz.description && (
                <p className="text-xs text-slate-300 max-w-xl">{activeQuiz.description}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="text-center p-3 rounded-2xl bg-slate-900/80 border border-slate-800 min-w-[90px]">
                <span className="text-xs text-slate-400 font-bold block">Score</span>
                <span className="text-xl font-heading font-black text-amber-400">
                  {activeQuiz.score}/{activeQuiz.totalQuestions}
                </span>
              </div>
              <div className="text-center p-3 rounded-2xl bg-slate-900/80 border border-slate-800 min-w-[90px]">
                <span className="text-xs text-slate-400 font-bold block">Accuracy</span>
                <span className="text-xl font-heading font-black text-emerald-400">
                  {activeQuiz.accuracyPercentage}%
                </span>
              </div>
              <div className="text-center p-3 rounded-2xl bg-slate-900/80 border border-slate-800 min-w-[90px]">
                <span className="text-xs text-slate-400 font-bold block">Time</span>
                <span className="text-xl font-heading font-black text-purple-300">
                  {activeQuiz.timeTaken}
                </span>
              </div>
            </div>
          </div>

          {/* Question Filter Pills */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterMode('ALL')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterMode === 'ALL'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                All Questions ({questions.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('CORRECT')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterMode === 'CORRECT'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-slate-900 border border-slate-800 text-emerald-400 hover:bg-slate-800'
                }`}
              >
                Correct ({activeQuiz.correctCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('MISSED')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterMode === 'MISSED'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'bg-slate-900 border border-slate-800 text-rose-400 hover:bg-slate-800'
                }`}
              >
                Missed ({activeQuiz.incorrectCount})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!activeQuiz) return;
                  downloadStudentQuizReportCSV({
                    studentName: 'Student',
                    subject: activeQuiz.subject || 'General Knowledge',
                    quizTitle: activeQuiz.quizTitle || 'Quiz Assessment',
                    score: activeQuiz.score,
                    maxScore: activeQuiz.totalQuestions,
                    accuracyPercentage: activeQuiz.accuracyPercentage,
                    timeTaken: activeQuiz.timeTaken,
                    date: activeQuiz.attendedAt,
                    questions: activeQuiz.questions || []
                  });
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95"
                title="Download this quiz review report as CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!activeQuiz) return;
                  printStudentQuizReport({
                    studentName: 'Student',
                    subject: activeQuiz.subject || 'General Knowledge',
                    quizTitle: activeQuiz.quizTitle || 'Quiz Assessment',
                    score: activeQuiz.score,
                    maxScore: activeQuiz.totalQuestions,
                    accuracyPercentage: activeQuiz.accuracyPercentage,
                    timeTaken: activeQuiz.timeTaken,
                    date: activeQuiz.attendedAt,
                    questions: activeQuiz.questions || []
                  });
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-purple-500 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95"
                title="Print quiz review or save as PDF"
              >
                <Printer className="w-3.5 h-3.5 text-purple-400" />
                <span>Print PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Question Cards List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="dashboard-card p-12 text-center text-slate-500 space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
            <h4 className="text-sm font-bold text-slate-300">No questions match this filter</h4>
            <p className="text-xs text-slate-500">Switch back to "All Questions" to inspect the full list.</p>
          </div>
        ) : (
          filteredQuestions.map((q, idx) => {
            const isCorrect = q.isCorrect;
            const options = Array.isArray(q.options) ? q.options : [];

            return (
              <div
                key={q.questionId || idx}
                className={`dashboard-card p-5 sm:p-6 space-y-4 border-l-4 ${
                  isCorrect ? 'border-l-emerald-500' : 'border-l-rose-500'
                }`}
              >
                {/* Question Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                        isCorrect
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {q.orderIndex !== undefined ? q.orderIndex + 1 : idx + 1}
                    </span>
                    <div>
                      <h3 className="text-sm sm:text-base font-heading font-bold text-white leading-snug">
                        {q.text}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        {q.timeTakenMs ? (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{(q.timeTakenMs / 1000).toFixed(1)}s taken</span>
                          </span>
                        ) : null}
                        <span>•</span>
                        <span>{q.pointsAwarded > 0 ? `+${q.pointsAwarded} point` : '0 points'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Correct / Incorrect Pill */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                      isCorrect
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Correct</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Incorrect</span>
                      </>
                    )}
                  </span>
                </div>

                {/* 4 Choices Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {options.map((optText, optIdx) => {
                    const isSelected = q.selectedOption === optIdx;
                    const isCorrectAnswer = q.correctOptionIndex === optIdx;

                    let cardStyle = 'bg-slate-950/60 border-slate-800 text-slate-300';
                    let badge = null;

                    if (isSelected && isCorrectAnswer) {
                      cardStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-bold ring-1 ring-emerald-500/40';
                      badge = (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-500/40">
                          Your Answer ✓
                        </span>
                      );
                    } else if (isSelected && !isCorrectAnswer) {
                      cardStyle = 'bg-rose-950/60 border-rose-500 text-rose-200 font-bold ring-1 ring-rose-500/40';
                      badge = (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-300 border border-rose-500/40">
                          Your Answer ✗
                        </span>
                      );
                    } else if (isCorrectAnswer) {
                      cardStyle = 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 font-semibold';
                      badge = (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Correct Answer
                        </span>
                      );
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs sm:text-sm transition-all ${cardStyle}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                            {['A', 'B', 'C', 'D'][optIdx % 4]}
                          </span>
                          <span className="leading-tight">{optText}</span>
                        </div>
                        {badge}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Rationale */}
                {q.explanation && (
                  <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-xs sm:text-sm text-purple-200 flex items-start gap-3 mt-2">
                    <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-purple-300 block mb-0.5">Teacher Explanation:</span>
                      <p className="text-purple-200/90 leading-relaxed">{q.explanation}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
