import React from 'react';
import { Trophy, Flame, ArrowUp, ArrowDown, Minus, ArrowRight, Gift, Sparkles } from 'lucide-react';

export default function LeaderboardView({
  leaderboardData,
  currentUserToken,
  isHost = false,
  onNextQuestion,
  onTriggerPrize,
  onEndQuiz
}) {
  const topPlayers = leaderboardData?.topPlayers || [];
  const totalPlayers = leaderboardData?.totalPlayers || topPlayers.length;
  const questionIndex = leaderboardData?.currentQuestionIndex ?? 0;
  const totalQuestions = leaderboardData?.totalQuestions ?? 1;

  // Find user's own standing if not in top 10
  const userInTop10 = topPlayers.some(p => p.sessionToken === currentUserToken);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 uppercase tracking-wider">
          <Trophy className="w-3.5 h-3.5" />
          Live Standings
        </div>
        <h1 className="text-3xl sm:text-5xl font-heading font-black text-white tracking-tight">
          Leaderboard
        </h1>
        <p className="text-slate-400 text-sm">
          After Question {questionIndex + 1} of {totalQuestions} • {totalPlayers} Total Students
        </p>
      </div>

      {/* Host Control Quick Bar */}
      {isHost && (
        <div className="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Host Controls:
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onTriggerPrize && onTriggerPrize('lucky_draw')}
              className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-pink-500/20"
            >
              <Gift className="w-4 h-4" />
              <span>Prize Moment</span>
            </button>

            {onEndQuiz && (
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to end this quiz early and view results?')) {
                    onEndQuiz();
                  }
                }}
                className="px-3.5 py-2 bg-slate-800 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/30 text-slate-400 hover:text-rose-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                End Early &times;
              </button>
            )}

            <button
              onClick={onNextQuestion}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <span>Next Question</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Ranked Players List */}
      <div className="space-y-2.5">
        {topPlayers.map((player, idx) => {
          const isCurrentUser = player.sessionToken === currentUserToken;
          const rank = player.rank || idx + 1;
          const diff = player.diff ?? 0;

          // Rank badge styling
          const rankColors = {
            1: 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-400/30',
            2: 'bg-slate-300 text-slate-950 border-white shadow-md',
            3: 'bg-amber-700 text-white border-amber-600 shadow-md'
          }[rank] || 'bg-slate-800 text-slate-300 border-slate-700';

          return (
            <div
              key={player.sessionToken || idx}
              className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all duration-500 transform ${
                isCurrentUser
                  ? 'bg-purple-900/60 border-purple-500 ring-2 ring-purple-400/50 shadow-xl'
                  : 'glass-panel hover:border-slate-600'
              }`}
            >
              {/* Left: Rank + Avatar + Name */}
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl font-heading font-black text-base sm:text-lg flex items-center justify-center border shrink-0 ${rankColors}`}
                >
                  {rank === 1 ? '👑' : rank}
                </div>

                <span className="text-2xl sm:text-3xl shrink-0 select-none">
                  {player.avatar || '🦊'}
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-heading font-bold text-base sm:text-lg truncate ${
                        isCurrentUser ? 'text-purple-300 underline' : 'text-white'
                      }`}
                    >
                      {player.name}
                    </span>
                    {isCurrentUser && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500 text-white">
                        YOU
                      </span>
                    )}
                  </div>

                  {/* Streak Flame Badge */}
                  {player.streak >= 2 && (
                    <div className="flex items-center gap-1 text-xs text-amber-400 font-bold">
                      <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                      <span>{player.streak} Streak</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Position Change + Score */}
              <div className="flex items-center gap-3 sm:gap-6 shrink-0 text-right">
                {/* Position Change */}
                <div className="flex items-center gap-1 text-xs font-bold w-12 justify-end">
                  {diff > 0 ? (
                    <span className="text-emerald-400 flex items-center">
                      <ArrowUp className="w-3.5 h-3.5 stroke-[3]" />
                      +{diff}
                    </span>
                  ) : diff < 0 ? (
                    <span className="text-rose-400 flex items-center">
                      <ArrowDown className="w-3.5 h-3.5 stroke-[3]" />
                      {diff}
                    </span>
                  ) : (
                    <span className="text-slate-500 flex items-center">
                      <Minus className="w-3 h-3" />
                    </span>
                  )}
                </div>

                <div className="font-heading font-black text-lg sm:text-2xl text-amber-400 min-w-[70px] sm:min-w-[90px]">
                  {player.score.toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
