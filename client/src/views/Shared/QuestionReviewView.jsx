import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  Award,
  BarChart3,
  Lightbulb,
  Check,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Filter
} from 'lucide-react';
import { KAHOOT_COLORS } from '../../utils/avatars';

export default function QuestionReviewView({
  questions = [],
  playerReview = null,
  scoreAnalysis = null,
  isHost = false
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'correct' | 'incorrect'
  const [expandedIndex, setExpandedIndex] = useState(null); // null = all expanded by default, or specific index

  const totalQuestions = questions.length;
  const userAnswers = playerReview?.answers || [];

  // Metrics for student
  const correctCount = playerReview?.correctCount ?? 0;
  const incorrectCount = playerReview?.incorrectCount ?? 0;
  const unansweredCount = playerReview?.unansweredCount ?? 0;
  const totalScore = playerReview?.score ?? 0;
  const accuracyPercentage = playerReview?.accuracyPercentage ?? (totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0);

  // Performance Badge
  const getMasteryGrade = (acc) => {
    if (acc >= 90) return { label: 'Outstanding Mastery', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', icon: '🌟' };
    if (acc >= 75) return { label: 'Proficient & Strong', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', icon: '🎯' };
    if (acc >= 50) return { label: 'Developing Knowledge', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', icon: '📚' };
    return { label: 'Needs Practice & Review', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30', icon: '🌱' };
  };

  const mastery = getMasteryGrade(accuracyPercentage);

  // Filter questions list
  const filteredQuestions = questions.filter((q, idx) => {
    if (filter === 'all') return true;
    const ans = userAnswers[idx];
    if (filter === 'correct') return ans?.isCorrect === true;
    if (filter === 'incorrect') return !ans || ans.isCorrect === false;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
      {/* ------------------------------------------------------------------ */}
      {/* SECTION 1: SCORE SUMMARY & PERFORMANCE ANALYSIS                    */}
      {/* ------------------------------------------------------------------ */}
      {!isHost && playerReview && (
        <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 space-y-6 border border-purple-500/30 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left: Big Score & Grade */}
            <div className="space-y-3 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-purple-500/30 bg-purple-500/20 text-purple-300">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Final Score & Performance Analysis</span>
              </div>

              <div className="flex items-baseline justify-center md:justify-start gap-3">
                <span className="font-heading font-black text-6xl sm:text-7xl text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                  {totalScore}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-slate-400">
                  / {totalQuestions}
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  (+1 per correct)
                </span>
              </div>

              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${mastery.color}`}>
                  <span>{mastery.icon}</span>
                  <span>{mastery.label}</span>
                </span>
                <span className="text-xs font-black text-purple-300 bg-purple-950/60 border border-purple-500/30 px-3 py-1 rounded-xl">
                  {accuracyPercentage}% Accuracy
                </span>
              </div>
            </div>

            {/* Right: 3 Metric Cards */}
            <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
              {/* Correct Card */}
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center min-w-[90px] sm:min-w-[110px]">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <div className="text-2xl sm:text-3xl font-heading font-black text-emerald-300">
                  {correctCount}
                </div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400/80">
                  Correct (+{correctCount})
                </div>
              </div>

              {/* Incorrect Card */}
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-center min-w-[90px] sm:min-w-[110px]">
                <XCircle className="w-5 h-5 text-rose-400 mx-auto mb-1" />
                <div className="text-2xl sm:text-3xl font-heading font-black text-rose-300">
                  {incorrectCount}
                </div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-rose-400/80">
                  Wrong (+0)
                </div>
              </div>

              {/* Unanswered Card */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700/80 text-center min-w-[90px] sm:min-w-[110px]">
                <Clock className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                <div className="text-2xl sm:text-3xl font-heading font-black text-slate-300">
                  {unansweredCount}
                </div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Skipped
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 2: CLASSROOM-WIDE ANALYSIS (HOST VIEW)                     */}
      {/* ------------------------------------------------------------------ */}
      {isHost && scoreAnalysis && (
        <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 space-y-6 border border-emerald-500/30 shadow-2xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-400">
              <BarChart3 className="w-4 h-4" />
              <span>Classroom Performance & Score Analytics</span>
            </div>
            <span className="text-xs font-bold text-slate-400">
              {scoreAnalysis.totalStudents} Students Evaluated
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
              <span className="text-xs font-semibold text-slate-400 uppercase">Class Average</span>
              <div className="text-3xl font-black font-heading text-emerald-400 mt-1">
                {scoreAnalysis.averageScore} <span className="text-sm font-normal text-slate-400">/ {totalQuestions}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
              <span className="text-xs font-semibold text-slate-400 uppercase">Overall Accuracy</span>
              <div className="text-3xl font-black font-heading text-cyan-400 mt-1">
                {scoreAnalysis.averageAccuracy}%
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
              <span className="text-xs font-semibold text-slate-400 uppercase">Highest Score</span>
              <div className="text-3xl font-black font-heading text-amber-400 mt-1">
                {scoreAnalysis.highestScore} <span className="text-sm font-normal text-slate-400">pts</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
              <span className="text-xs font-semibold text-slate-400 uppercase">Total Questions</span>
              <div className="text-3xl font-black font-heading text-purple-400 mt-1">
                {totalQuestions}
              </div>
            </div>
          </div>

          {/* Hardest vs Easiest Question Insights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {scoreAnalysis.hardestQuestion && (
              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                  ⚠️
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-rose-400 block">
                    Most Challenging Question (#{scoreAnalysis.hardestQuestion.questionIndex + 1})
                  </span>
                  <p className="text-sm font-bold text-white line-clamp-1 mt-0.5">
                    {scoreAnalysis.hardestQuestion.text}
                  </p>
                  <span className="text-xs text-rose-300/80 mt-1 inline-block">
                    Only {scoreAnalysis.hardestQuestion.accuracyRate}% of students answered correctly
                  </span>
                </div>
              </div>
            )}

            {scoreAnalysis.easiestQuestion && (
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  🎯
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400 block">
                    Highest Mastery Question (#{scoreAnalysis.easiestQuestion.questionIndex + 1})
                  </span>
                  <p className="text-sm font-bold text-white line-clamp-1 mt-0.5">
                    {scoreAnalysis.easiestQuestion.text}
                  </p>
                  <span className="text-xs text-emerald-300/80 mt-1 inline-block">
                    {scoreAnalysis.easiestQuestion.accuracyRate}% of students answered correctly
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 3: QUESTION & ANSWER REVIEW TOOLBAR                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black font-heading text-white flex items-center gap-2">
            <span>Question & Answer Breakdown</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {filteredQuestions.length} shown
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Review every question, the correct answer, your response, and explanation.
          </p>
        </div>

        {/* Filters for Student */}
        {!isHost && playerReview && (
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === 'all'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({totalQuestions})
            </button>
            <button
              onClick={() => setFilter('correct')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === 'correct'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              Correct ({correctCount})
            </button>
            <button
              onClick={() => setFilter('incorrect')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === 'incorrect'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-rose-300'
              }`}
            >
              Missed ({incorrectCount + unansweredCount})
            </button>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 4: QUESTION CARDS WITH FULL OPTIONS & ANSWERS              */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-6">
        {filteredQuestions.map((q) => {
          const originalIndex = q.orderIndex;
          const studentAns = userAnswers[originalIndex];
          const isCorrect = studentAns?.isCorrect === true;
          const isAnswered = studentAns && studentAns.selectedOption !== null && studentAns.selectedOption !== undefined;
          const hostStat = scoreAnalysis?.questionStats?.find(s => s.questionIndex === originalIndex);

          return (
            <div
              key={originalIndex}
              className={`glass-panel rounded-3xl p-5 sm:p-7 border-2 transition-all space-y-5 ${
                !isHost && studentAns
                  ? isCorrect
                    ? 'border-emerald-500/40 bg-slate-900/60'
                    : 'border-rose-500/40 bg-slate-900/60'
                  : 'border-slate-800 bg-slate-900/60'
              }`}
            >
              {/* Question Header & Status Badge */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 font-black text-sm flex items-center justify-center">
                    Q{originalIndex + 1}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Question {originalIndex + 1} of {totalQuestions}
                  </span>
                </div>

                {/* Status Badge */}
                {!isHost ? (
                  isCorrect ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Correct (+1 pt)</span>
                    </div>
                  ) : isAnswered ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-black">
                      <XCircle className="w-4 h-4 text-rose-400" />
                      <span>Incorrect (+0 pts)</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Unanswered (+0 pts)</span>
                    </div>
                  )
                ) : (
                  hostStat && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold">
                      <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
                      <span>{hostStat.accuracyRate}% Accuracy ({hostStat.correctCount} / {scoreAnalysis?.totalStudents || 0})</span>
                    </div>
                  )
                )}
              </div>

              {/* Question Statement */}
              <h3 className="text-lg sm:text-xl font-heading font-black text-white leading-snug">
                {q.text}
              </h3>

              {/* 4 Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {(q.options || []).map((optText, optIdx) => {
                  const isThisCorrect = Number(optIdx) === Number(q.correctOptionIndex);
                  const isThisUserSelection = studentAns && studentAns.selectedOption !== null && studentAns.selectedOption !== undefined && Number(studentAns.selectedOption) === Number(optIdx);
                  const color = KAHOOT_COLORS[optIdx % 4];

                  // Vote counts for host view
                  const optVotes = hostStat?.optionDistribution?.[optIdx] || 0;
                  const totalVotes = hostStat?.totalAnswered || 1;
                  const optPercent = Math.round((optVotes / totalVotes) * 100);

                  return (
                    <div
                      key={optIdx}
                      className={`relative rounded-2xl p-4 border-2 transition-all flex flex-col justify-between overflow-hidden ${
                        isThisCorrect
                          ? 'border-emerald-500 bg-emerald-950/60 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/10'
                          : isThisUserSelection && !isThisCorrect
                          ? 'border-rose-500 bg-rose-950/60 ring-2 ring-rose-500/40'
                          : 'border-slate-800 bg-slate-800/50 opacity-70'
                      }`}
                    >
                      {/* Host Vote Bar background */}
                      {isHost && (
                        <div
                          className="absolute inset-0 bg-white/5 pointer-events-none transition-all duration-700"
                          style={{ width: `${optPercent}%` }}
                        />
                      )}

                      <div className="relative z-10 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className={`text-sm sm:text-base font-bold ${
                            isThisCorrect
                              ? 'text-emerald-200'
                              : isThisUserSelection
                              ? 'text-rose-200'
                              : 'text-slate-300'
                          }`}>
                            {optText}
                          </span>
                        </div>

                        {/* Badges on Option */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isThisCorrect && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] uppercase shadow">
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>Correct</span>
                            </span>
                          )}

                          {isThisUserSelection && !isThisCorrect && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500 text-white font-black text-[10px] uppercase shadow">
                              <X className="w-3 h-3 stroke-[3]" />
                              <span>Your Choice</span>
                            </span>
                          )}

                          {isThisUserSelection && isThisCorrect && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white text-emerald-900 font-black text-[10px] uppercase shadow">
                              <span>Your Choice</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Host Vote Counts */}
                      {isHost && (
                        <div className="relative z-10 mt-2 text-right">
                          <span className="text-[11px] font-bold text-slate-400">
                            {optVotes} votes ({optPercent}%)
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Educational Explanation Box */}
              {q.explanation && (
                <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-start gap-3 mt-2">
                  <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-indigo-300 block mb-0.5">
                      Explanation
                    </span>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                      {q.explanation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
