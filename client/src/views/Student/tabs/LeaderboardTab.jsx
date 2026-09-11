import React, { useState, useMemo } from 'react';
import {
  Flame,
  Search,
  Sparkles,
  Crown
} from 'lucide-react';

export default function LeaderboardTab({
  leaderboard,
  currentUserRank,
  user
}) {
  const [searchFilter, setSearchFilter] = useState('');

  // Top 3 Podium Students
  const top3 = useMemo(() => leaderboard.slice(0, 3), [leaderboard]);

  // Filtered Rankings List
  const filteredList = useMemo(() => {
    if (!searchFilter.trim()) return leaderboard;
    const q = searchFilter.toLowerCase();
    return leaderboard.filter((item) => item.name?.toLowerCase().includes(q));
  }, [leaderboard, searchFilter]);

  return (
    <div className="space-y-6 animate-tab-enter text-white">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1 border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Class Leaderboard Rankings</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-white">Class Leaderboard</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time rankings based on quiz score achievements and accuracy.
          </p>
        </div>

        {/* Current User Quick Badge */}
        {currentUserRank && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-purple-950/50 border border-purple-500/30 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-heading font-bold text-sm shadow-md shadow-purple-500/30">
              #{currentUserRank.rank}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase">Your Standing</div>
              <div className="text-sm font-heading font-bold text-white">
                {currentUserRank.score} Marks ({currentUserRank.accuracy}%)
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Podium Display (Top 3 Learners) */}
      {top3.length >= 3 && (
        <div className="dashboard-card p-6 sm:p-8 bg-gradient-to-b from-slate-900/90 to-[#0A0E24]/90">
          <div className="flex items-end justify-center gap-3 sm:gap-6 pt-4 pb-2">
            {/* Rank 2 - Silver */}
            <div className="flex flex-col items-center flex-1 max-w-[150px] sm:max-w-[180px]">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-800 border-2 border-slate-400 flex items-center justify-center text-xl sm:text-2xl shadow-lg mb-2 relative">
                <span>{top3[1].avatar}</span>
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-300 text-slate-900 text-xs font-bold flex items-center justify-center border-2 border-slate-900">
                  2
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-heading font-bold text-white text-center truncate w-full">
                {top3[1].name}
              </h4>
              <span className="text-xs font-bold text-purple-400 mt-0.5">{top3[1].score} Marks</span>
              <div className="w-full h-24 sm:h-28 rounded-t-2xl bg-gradient-to-t from-slate-800 to-slate-700/80 mt-3 flex items-center justify-center border-t-2 border-slate-400 shadow-inner">
                <span className="font-heading font-bold text-xl sm:text-2xl text-slate-300">#2</span>
              </div>
            </div>

            {/* Rank 1 - Gold (Tallest Center) */}
            <div className="flex flex-col items-center flex-1 max-w-[170px] sm:max-w-[210px] -mt-6">
              <Crown className="w-8 h-8 text-amber-400 animate-bounce-subtle mb-1" />
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-950/80 border-2 border-amber-400 flex items-center justify-center text-2xl sm:text-3xl shadow-xl shadow-amber-400/30 mb-2 relative">
                <span>{top3[0].avatar}</span>
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-amber-400 text-amber-950 text-xs font-bold flex items-center justify-center border-2 border-slate-900 shadow-sm">
                  👑 1
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-heading font-bold text-white text-center truncate w-full">
                {top3[0].name}
              </h4>
              <span className="text-xs sm:text-sm font-bold text-amber-400 mt-0.5">{top3[0].score} Marks</span>
              <div className="w-full h-32 sm:h-36 rounded-t-2xl bg-gradient-to-t from-amber-950/90 via-amber-900/60 to-amber-800/40 mt-3 flex items-center justify-center border-t-2 border-amber-400 shadow-inner">
                <span className="font-heading font-bold text-2xl sm:text-3xl text-amber-300">#1</span>
              </div>
            </div>

            {/* Rank 3 - Bronze */}
            <div className="flex flex-col items-center flex-1 max-w-[150px] sm:max-w-[180px]">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-orange-950/60 border-2 border-orange-400 flex items-center justify-center text-xl sm:text-2xl shadow-lg mb-2 relative">
                <span>{top3[2].avatar}</span>
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-orange-400 text-orange-950 text-xs font-bold flex items-center justify-center border-2 border-slate-900">
                  3
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-heading font-bold text-white text-center truncate w-full">
                {top3[2].name}
              </h4>
              <span className="text-xs font-bold text-purple-400 mt-0.5">{top3[2].score} Marks</span>
              <div className="w-full h-20 sm:h-24 rounded-t-2xl bg-gradient-to-t from-orange-950/80 to-orange-900/40 mt-3 flex items-center justify-center border-t-2 border-orange-400 shadow-inner">
                <span className="font-heading font-bold text-xl sm:text-2xl text-orange-300">#3</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Search & Leaderboard Table */}
      <div className="dashboard-card overflow-hidden space-y-4 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-lg font-heading font-black text-white">Leaderboard Standings</h3>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search peer name..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:border-purple-500 text-white placeholder-slate-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 sm:px-6">Rank</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Quizzes Played</th>
                <th className="py-3 px-4">Accuracy</th>
                <th className="py-3 px-4">Streak</th>
                <th className="py-3 px-4 sm:px-6 text-right">Leaderboard Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredList.map((peer) => {
                const isCurrent = peer.isCurrentUser || peer.id === user?.id;

                return (
                  <tr
                    key={peer.id}
                    className={`transition-all ${
                      isCurrent
                        ? 'bg-purple-950/60 font-bold border-l-4 border-purple-500 pinned-user-glow text-white'
                        : 'hover:bg-slate-900/60'
                    }`}
                  >
                    {/* Rank Badge */}
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {peer.rank === 1 ? (
                          <span className="w-7 h-7 rounded-xl bg-amber-400 text-amber-950 font-bold text-xs flex items-center justify-center shadow-sm">
                            🥇
                          </span>
                        ) : peer.rank === 2 ? (
                          <span className="w-7 h-7 rounded-xl bg-slate-300 text-slate-900 font-bold text-xs flex items-center justify-center shadow-sm">
                            🥈
                          </span>
                        ) : peer.rank === 3 ? (
                          <span className="w-7 h-7 rounded-xl bg-orange-300 text-orange-950 font-bold text-xs flex items-center justify-center shadow-sm">
                            🥉
                          </span>
                        ) : (
                          <span className="w-7 h-7 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center">
                            #{peer.rank}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Student Avatar + Name */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-lg shadow-sm">
                          {peer.avatar || '🚀'}
                        </div>
                        <div>
                          <div className="font-heading font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                            <span>{peer.name}</span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-600 text-white shadow-sm">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Level {Math.max(1, Math.floor(peer.score / 300) + 1)} Scholar
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Quizzes Played */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs sm:text-sm font-semibold text-slate-400">
                      {peer.quizzesPlayed} sessions
                    </td>

                    {/* Accuracy */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-emerald-400 text-xs sm:text-sm">
                        {peer.accuracy}%
                      </span>
                    </td>

                    {/* Streak */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-bold text-rose-400 text-xs sm:text-sm">
                        <Flame className="w-3.5 h-3.5 text-rose-500" />
                        <span>{peer.streak}</span>
                      </div>
                    </td>

                    {/* Score */}
                    <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap font-mono font-bold text-purple-400 text-xs sm:text-sm">
                      {peer.score} Marks
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
