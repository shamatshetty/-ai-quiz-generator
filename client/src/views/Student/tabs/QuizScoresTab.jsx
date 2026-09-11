import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  Clock,
  BookOpen,
  Award,
  ChevronRight
} from 'lucide-react';

export default function QuizScoresTab({
  history,
  onSelectQuizToReview
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [selectedBadge, setSelectedBadge] = useState('ALL');
  const [sortBy, setSortBy] = useState('date_desc'); // date_desc, date_asc, score_desc, accuracy_desc, time_asc

  // Unique subjects
  const subjects = useMemo(() => {
    const s = new Set();
    history.forEach((q) => {
      if (q.subject) s.add(q.subject);
    });
    return ['ALL', ...Array.from(s)];
  }, [history]);

  // Filtered & Sorted History
  const filteredList = useMemo(() => {
    let list = [...history];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.quizTitle?.toLowerCase().includes(q) ||
          item.subject?.toLowerCase().includes(q) ||
          item.roomCode?.toLowerCase().includes(q)
      );
    }

    // Subject filter
    if (selectedSubject !== 'ALL') {
      list = list.filter((item) => item.subject === selectedSubject);
    }

    // Badge filter
    if (selectedBadge !== 'ALL') {
      list = list.filter((item) => item.performanceBadge === selectedBadge);
    }

    // Sorting
    list.sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':
          return new Date(a.attendedAt) - new Date(b.attendedAt);
        case 'score_desc':
          return b.score - a.score;
        case 'score_asc':
          return a.score - b.score;
        case 'accuracy_desc':
          return b.accuracyPercentage - a.accuracyPercentage;
        case 'time_asc':
          return (a.timeTakenMs || 0) - (b.timeTakenMs || 0);
        case 'date_desc':
        default:
          return new Date(b.attendedAt) - new Date(a.attendedAt);
      }
    });

    return list;
  }, [history, searchQuery, selectedSubject, selectedBadge, sortBy]);

  return (
    <div className="space-y-6 animate-tab-enter text-white">
      {/* 1. Header & Quick Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-black text-white">Quiz Scores History</h1>
          <p className="text-sm text-slate-400">
            Review all completed quizzes, score breakdowns, and time metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl shadow-sm">
            Total Records: <strong className="text-purple-400">{filteredList.length}</strong>
          </span>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="dashboard-card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search quiz, subject, or PIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/15 text-white placeholder-slate-500"
            />
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500 shrink-0" />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full py-2 px-3 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-purple-500 text-slate-200 cursor-pointer"
            >
              <option value="ALL">All Subjects</option>
              {subjects.filter((s) => s !== 'ALL').map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Performance Badge Filter */}
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-slate-500 shrink-0" />
            <select
              value={selectedBadge}
              onChange={(e) => setSelectedBadge(e.target.value)}
              className="w-full py-2 px-3 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-purple-500 text-slate-200 cursor-pointer"
            >
              <option value="ALL">All Ratings</option>
              <option value="Excellent">Excellent (80%+)</option>
              <option value="Good">Good (60-79%)</option>
              <option value="Needs Improvement">Needs Improvement (&lt;60%)</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-500 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full py-2 px-3 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-purple-500 text-slate-200 cursor-pointer"
            >
              <option value="date_desc">Most Recent First</option>
              <option value="date_asc">Oldest First</option>
              <option value="score_desc">Highest Score</option>
              <option value="accuracy_desc">Highest Accuracy</option>
              <option value="time_asc">Fastest Completion</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Quiz History Data Table */}
      <div className="dashboard-card overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="text-center py-16 text-slate-500 space-y-3">
            <BookOpen className="w-12 h-12 mx-auto text-slate-600" />
            <h3 className="text-base font-bold text-slate-300">No quiz records found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search terms or filter chips, or join a live quiz to create your first session.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Quiz Title & Room</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Score & Accuracy</th>
                  <th className="py-3.5 px-4">Time Taken</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredList.map((item, index) => (
                  <tr
                    key={item.playerSessionId}
                    onClick={() => onSelectQuizToReview(item.playerSessionId)}
                    className="hover:bg-purple-950/30 transition-colors cursor-pointer group"
                  >
                    {/* Title & Room PIN */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 group-hover:bg-purple-950 group-hover:border-purple-500/50 text-slate-400 group-hover:text-purple-300 flex items-center justify-center font-bold text-xs shrink-0 transition-colors">
                          {index + 1}
                        </span>
                        <div>
                          <div className="font-heading font-bold text-white group-hover:text-purple-300 transition-colors">
                            {item.quizTitle}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">PIN: {item.roomCode}</div>
                        </div>
                      </div>
                    </td>

                    {/* Subject */}
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium">
                        {item.subject}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(item.attendedAt).toLocaleDateString()}</span>
                      </div>
                    </td>

                    {/* Score & Accuracy */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-white">
                          {item.correctCount}/{item.totalQuestions}
                        </span>
                        <span className="text-xs font-bold text-purple-400">
                          ({item.accuracyPercentage}%)
                        </span>
                      </div>
                      <div className="w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden mt-1">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-500"
                          style={{ width: `${item.accuracyPercentage}%` }}
                        />
                      </div>
                    </td>

                    {/* Time Taken */}
                    <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{item.timeTaken}</span>
                      </div>
                    </td>

                    {/* Performance Badge */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full inline-block ${
                          item.performanceBadge === 'Excellent'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : item.performanceBadge === 'Good'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {item.performanceBadge}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectQuizToReview(item.playerSessionId);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-purple-600 hover:border-purple-600 text-slate-300 hover:text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
                        >
                          <span>Review</span>
                          <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
