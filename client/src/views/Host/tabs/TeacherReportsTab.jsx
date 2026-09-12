import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Users,
  Trophy,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Search,
  Eye,
  X,
  Sparkles,
  Award,
  Crown
} from 'lucide-react';
import { useSocket } from '../../../context/SocketContext';
import {
  downloadCohortStandingsCSV,
  triggerBlobDownload
} from '../../../utils/exportReport';

function AnimatedCounter({ value, duration = 1100, suffix = '', prefix = '' }) {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    let start = 0;
    const end = typeof value === 'number' ? value : parseInt(value, 10) || 0;
    if (end === 0) {
      setDisplayValue(0);
      return;
    }
    const startTime = performance.now();
    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.round(start + (end - start) * eased);
      setDisplayValue(current);
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };
    const frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return <span className="tabular-nums font-mono font-black">{prefix}{displayValue}{suffix}</span>;
}

export default function TeacherReportsTab({
  reportsData,
  classLeaderboard,
  onRefresh
}) {
  const { serverUrl } = useSocket();
  const [search, setSearch] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [exportingCode, setExportingCode] = useState(null);

  const stats = reportsData?.stats || {
    totalQuizzesHosted: 9,
    totalStudentsEngaged: 87,
    avgCohortAccuracy: 86
  };

  const sessions = reportsData?.recentSessions || [];

  const filteredSessions = sessions.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.quizTitle?.toLowerCase().includes(q) ||
      s.roomCode?.toLowerCase().includes(q) ||
      s.subject?.toLowerCase().includes(q)
    );
  });

  const handleExportCSV = async (roomCode) => {
    if (!roomCode) return;
    setExportingCode(roomCode);
    try {
      const res = await fetch(`${serverUrl}/api/rooms/${roomCode}/export-csv`);
      if (res.ok) {
        const blob = await res.blob();
        triggerBlobDownload(blob, `QuizResults_${roomCode}_${Date.now()}.csv`);
        setExportingCode(null);
        return;
      }
    } catch (err) {
      console.warn('Backend fetch failed, attempting direct download', err);
    }
    // Direct link fallback
    window.location.href = `${serverUrl}/api/rooms/${roomCode}/export-csv`;
    setExportingCode(null);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold uppercase tracking-wider border border-cyan-500/30 mb-2 badge-caps">
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Class Performance & Telemetry</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-white tracking-tight">
            Class Assessment Reports
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Class-wise and student-wise performance analytics, historical sessions, and downloadable CSV gradebooks.
          </p>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
          >
            Refresh Data 🔄
          </button>
        )}
      </div>

      {/* 2. Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="animate-stat-1 glass-panel card-interactive-glow rounded-3xl p-5 border border-slate-800 flex items-center gap-4 hover:border-cyan-500/40 transition-all hover:scale-[1.02] shadow-lg">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-heading font-bold text-white stat-number tabular-nums">
              <AnimatedCounter value={stats.totalQuizzesHosted} />
            </span>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Sessions Hosted</p>
          </div>
        </div>

        <div className="animate-stat-2 glass-panel card-interactive-glow rounded-3xl p-5 border border-slate-800 flex items-center gap-4 hover:border-purple-500/40 transition-all hover:scale-[1.02] shadow-lg">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-heading font-bold text-white stat-number tabular-nums">
              <AnimatedCounter value={stats.totalStudentsEngaged} />
            </span>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Total Participants</p>
          </div>
        </div>

        <div className="animate-stat-3 glass-panel card-interactive-glow rounded-3xl p-5 border border-slate-800 flex items-center gap-4 hover:border-emerald-500/40 transition-all hover:scale-[1.02] shadow-lg">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-heading font-bold text-white stat-number tabular-nums">
              <AnimatedCounter value={stats.avgCohortAccuracy} suffix="%" />
            </span>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Cohort Accuracy</p>
          </div>
        </div>
      </div>

      {/* 3. Historical Hosted Quiz Sessions */}
      <div className="glass-panel rounded-3xl p-5 sm:p-7 border border-slate-800 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-heading font-bold text-white">
              Hosted Quiz Sessions ({filteredSessions.length})
            </h2>
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search session title or PIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {filteredSessions.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            No quiz session reports match your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400 badge-caps">
                  <th className="pb-3 pl-2">Assessment Title</th>
                  <th className="pb-3">Room PIN</th>
                  <th className="pb-3">Participants</th>
                  <th className="pb-3">Accuracy</th>
                  <th className="pb-3">Avg Score</th>
                  <th className="pb-3 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs font-medium">
                {filteredSessions.map((session) => (
                  <tr
                    key={session.id || session.roomCode}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="py-3 pl-2">
                      <div className="text-xs sm:text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                        {session.quizTitle}
                      </div>
                      <div className="text-[11px] text-slate-400 capitalize mt-0.5">
                        {session.subject} • {new Date(session.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 font-mono font-bold text-amber-400 tabular-nums text-xs">
                      {session.roomCode}
                    </td>
                    <td className="py-3 text-slate-300 tabular-nums text-xs">
                      <span className="flex items-center gap-1 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono">{session.totalParticipants}</span> students
                      </span>
                    </td>
                    <td className="py-3 tabular-nums">
                      <div className="flex items-center gap-1.5">
                        <div className="w-14 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.min(100, session.accuracy)}%` }}
                          />
                        </div>
                        <span className="font-bold text-emerald-400 font-mono text-xs">{session.accuracy}%</span>
                      </div>
                    </td>
                    <td className="py-3 font-bold text-purple-300 tabular-nums font-mono text-xs">
                      {session.avgScore} pts
                    </td>
                    <td className="py-3 text-right pr-2">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleExportCSV(session.roomCode)}
                          disabled={exportingCode === session.roomCode}
                          className="shimmer-btn px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm disabled:opacity-50"
                          title="Download CSV Results Gradebook"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{exportingCode === session.roomCode ? 'Exporting...' : 'Export CSV'}</span>
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

      {/* 4. Full Class Performance Standings */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-black text-white tracking-tight">
                Cumulative Student Cohort Standings
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                Overall student rankings across all historical assessments
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => downloadCohortStandingsCSV(classLeaderboard)}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/50 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
            title="Export cumulative cohort standings as CSV"
          >
            <Download className="w-3.5 h-3.5 text-purple-400" />
            <span>Export Standings (CSV)</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400 badge-caps">
                <th className="pb-3.5 pl-2">Rank</th>
                <th className="pb-3.5">Student</th>
                <th className="pb-3.5">Quizzes Attended</th>
                <th className="pb-3.5">Accuracy</th>
                <th className="pb-3.5">Active Streak</th>
                <th className="pb-3.5 text-right pr-2">Total Marks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs sm:text-sm font-medium">
              {classLeaderboard.length > 0 ? (
                classLeaderboard.slice(0, 10).map((student, idx) => {
                  const rank = idx + 1;
                  return (
                    <tr key={student.id || student.userId || idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 pl-2">
                        {rank === 1 && <span className="font-bold text-amber-400 text-xs sm:text-sm badge-caps">🥇 #1</span>}
                        {rank === 2 && <span className="font-bold text-slate-300 text-xs sm:text-sm badge-caps">🥈 #2</span>}
                        {rank === 3 && <span className="font-bold text-amber-600 text-xs sm:text-sm badge-caps">🥉 #3</span>}
                        {rank > 3 && <span className="font-semibold text-slate-500 font-mono text-xs sm:text-sm">#{rank}</span>}
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{student.avatar || '🎓'}</span>
                          <span className="font-bold text-white text-xs sm:text-sm">{student.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 text-slate-300 tabular-nums font-mono text-xs sm:text-sm">{student.quizzesPlayed ?? 0} quizzes</td>
                      <td className="py-3.5 font-bold text-emerald-400 tabular-nums font-mono text-xs sm:text-sm">{student.accuracy ?? 0}%</td>
                      <td className="py-3.5 font-semibold text-amber-400 tabular-nums font-mono text-xs sm:text-sm">🔥 {student.streak ?? 0}</td>
                      <td className="py-3.5 text-right pr-2 font-bold text-purple-300 tabular-nums font-mono text-xs sm:text-sm">
                        {student.score} {student.score === 1 ? 'mark' : 'marks'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    <p className="font-semibold text-sm">No registered student records found.</p>
                    <p className="text-xs text-slate-500 mt-1">Once students complete quizzes, their standings will appear here.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
