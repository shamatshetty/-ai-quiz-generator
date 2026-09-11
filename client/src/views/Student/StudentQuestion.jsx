import React from 'react';
import { Lock, Check, Sparkles } from 'lucide-react';
import TimerRing from '../../components/TimerRing';


export default function StudentQuestion({
  questionData,
  timerData,
  selectedOption,
  hasAnswered,
  onSelectOption
}) {
  const question = questionData?.question || {};
  const options = question.options || [];
  const questionIndex = questionData?.questionIndex ?? 0;
  const totalQuestions = questionData?.totalQuestions ?? 1;

  const remainingSeconds = timerData?.remainingSeconds !== undefined ? timerData.remainingSeconds : 20;
  const totalSeconds = timerData?.totalSeconds || 20;
  const isPaused = timerData?.isPaused ?? false;
  const isTimeUp = remainingSeconds <= 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 sm:py-6 flex flex-col min-h-[calc(100vh-80px)] justify-between">
      {/* Top Header: Sleek Metallic Status Bar & Timer */}
      <div className="glass-panel rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-4 mb-3 border border-white/10 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-black uppercase tracking-widest">
              Question {questionIndex + 1} of {totalQuestions}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
              🔒 1 Attempt Limit
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold hidden sm:inline">
              ⚡ Instant Auto-Submit
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              • +1 pt for correct
            </span>
          </div>

          <h2 className="text-lg sm:text-2xl font-heading font-extrabold text-white line-clamp-2 leading-snug tracking-tight">
            {question.text}
          </h2>
        </div>

        <div className="shrink-0">
          <TimerRing
            remainingSeconds={remainingSeconds}
            totalSeconds={totalSeconds}
            size="sm"
            isPaused={isPaused}
          />
        </div>
      </div>

      {/* Answer Locked In Status Bar */}
      {hasAnswered ? (
        <div className="my-2 p-3.5 rounded-2xl bg-purple-950/90 border-2 border-purple-500/70 text-center animate-pulse flex items-center justify-center gap-2.5 text-purple-200 text-sm font-bold shadow-lg shadow-purple-900/40">
          <Lock className="w-4 h-4 text-purple-400" />
          <span>🔒 Answer Recorded</span>
        </div>
      ) : isTimeUp ? (
        <div className="my-2 p-3.5 rounded-2xl bg-amber-950/90 border-2 border-amber-500/70 text-center animate-pulse flex items-center justify-center gap-2.5 text-amber-200 text-sm font-bold shadow-lg shadow-amber-900/40">
          <Lock className="w-4 h-4 text-amber-400" />
          <span>⏱️ Time Expired</span>
        </div>
      ) : null}

      {/* Uniform Modern Answer Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 my-auto py-2">
        {options.map((optionText, idx) => {
          const isSelected = selectedOption === idx;
          const isDisabled = hasAnswered || isTimeUp;
          const letter = ['A', 'B', 'C', 'D'][idx] || idx + 1;

          return (
            <button
              key={idx}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelectOption(idx)}
              className={`group min-h-[90px] sm:min-h-[110px] p-4 sm:p-5 rounded-3xl text-left flex items-center gap-3.5 relative overflow-hidden transition-all duration-200 ${
                isSelected
                  ? 'bg-purple-900/35 border-2 border-purple-400 ring-4 ring-purple-500/20 shadow-xl shadow-purple-600/25 scale-[1.01]'
                  : isDisabled && hasAnswered
                  ? 'bg-slate-950/60 border-2 border-slate-800/60 opacity-40 grayscale-[30%] pointer-events-none'
                  : 'bg-slate-900/90 border-2 border-slate-800/90 hover:border-purple-500/60 hover:bg-slate-850 hover:shadow-lg hover:shadow-purple-500/10'
              } ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {/* Option Letter Indicator */}
              <div
                className={`w-10 h-10 rounded-2xl border font-heading font-black text-base flex items-center justify-center shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-300 shadow-md'
                    : 'bg-slate-800/90 border-slate-700/80 text-slate-300 group-hover:border-purple-400 group-hover:text-purple-300'
                }`}
              >
                {letter}
              </div>

              {/* Option Text */}
              <div className="font-heading font-bold text-white text-base sm:text-xl drop-shadow-sm leading-snug tracking-tight flex-1">
                {optionText}
              </div>

              {/* Selected Indicator Pill */}
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

      {/* Realistic Console Footer */}
      <div className="text-center text-xs text-slate-400 pt-2 flex items-center justify-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
        <span>
          {hasAnswered
            ? 'Answer registered.'
            : isTimeUp
            ? 'Time is up.'
            : 'Tap any option to submit your answer.'}
        </span>
      </div>
    </div>
  );
}
