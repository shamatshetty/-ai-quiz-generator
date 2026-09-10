import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, Flame, Trophy, Award } from 'lucide-react';
import soundManager from '../../utils/sound';

export default function StudentFeedback({ feedbackData }) {
  const {
    isCorrect = false,
    pointsEarned = 0,
    totalScore = 0,
    streak = 0,
    currentRank = 1
  } = feedbackData || {};

  const safePoints = Number(pointsEarned) || 0;
  const safeTotalScore = Number(totalScore) || 0;
  const safeStreak = Number(streak) || 0;
  const safeRank = Number(currentRank) || 1;

  useEffect(() => {
    if (isCorrect) {
      soundManager.playCorrect();
    } else {
      soundManager.playIncorrect();
    }
  }, [isCorrect]);

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:py-16 text-center space-y-6">
      <div
        className={`glass-panel-glow rounded-3xl p-8 space-y-6 border-2 transition-all ${
          isCorrect
            ? 'border-emerald-500/60 bg-emerald-950/20'
            : 'border-rose-500/60 bg-rose-950/20'
        }`}
      >
        {/* Status Icon */}
        <div className="relative inline-block">
          <div
            className={`w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl mx-auto ${
              isCorrect
                ? 'bg-emerald-500 text-slate-950 animate-bounce'
                : 'bg-rose-500 text-white'
            }`}
          >
            {isCorrect ? (
              <CheckCircle2 className="w-14 h-14 stroke-[2.5]" />
            ) : (
              <XCircle className="w-14 h-14 stroke-[2.5]" />
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-heading font-black text-white">
            {isCorrect ? 'Correct!' : 'Incorrect!'}
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            {isCorrect ? 'Lightning-fast reflexes!' : 'Better luck on the next one!'}
          </p>
        </div>

        {/* Points Awarded Banner */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Points This Question
          </div>
          <div
            className={`text-4xl font-heading font-black ${
              isCorrect ? 'text-amber-400' : 'text-slate-500'
            }`}
          >
            {isCorrect ? `+${safePoints.toLocaleString()}` : '0'}
          </div>

          {safeStreak >= 2 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black border border-amber-500/30 animate-pulse">
              <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
              <span>{safeStreak} Answer Streak!</span>
            </div>
          )}
        </div>

        {/* Rank and Total Score */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Current Rank
            </div>
            <div className="text-2xl font-heading font-black text-white flex items-center justify-center gap-1">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>#{safeRank}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Total Score
            </div>
            <div className="text-2xl font-heading font-black text-white flex items-center justify-center gap-1">
              <Award className="w-5 h-5 text-purple-400" />
              <span>{safeTotalScore.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          Advancing directly to next question...
        </p>
      </div>
    </div>
  );
}
