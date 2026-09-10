import React, { useState } from 'react';
import {
  Zap,
  Play,
  Users,
  Smartphone,
  Sparkles,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  Trophy,
  BarChart2,
  Copy,
  Check
} from 'lucide-react';

export default function TeacherLiveSessionTab({
  quizzes,
  activeRoomCode,
  onLaunchQuiz,
  onReturnToActiveRoom,
  creatingRoom
}) {
  const [selectedQuizId, setSelectedQuizId] = useState(quizzes[0]?.id || '');
  const [copied, setCopied] = useState(false);

  const selectedQuiz = quizzes.find((q) => q.id === selectedQuizId) || quizzes[0] || null;

  const handleCopyPin = () => {
    if (!activeRoomCode) return;
    navigator.clipboard.writeText(activeRoomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* 1. Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-500/30 mb-2">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Real-Time Multiplayer Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-heading font-black text-white tracking-tight">
          Live Quiz Hosting Control
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
          Host interactive, synchronized Kahoot-style classroom quizzes with live response telemetry and animated podium celebrations.
        </p>
      </div>

      {/* 2. Active Session Card (If room currently active) */}
      {activeRoomCode && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500/20 via-purple-600/20 to-slate-900 border-2 border-amber-400/70 shadow-2xl shadow-amber-500/20 backdrop-blur-xl relative overflow-hidden animate-bounce-subtle">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  Live Session In Progress
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-black text-white">
                Active Room PIN: <span className="text-amber-400 font-mono tracking-widest">{activeRoomCode}</span>
              </h2>
              <p className="text-xs text-slate-300">
                Your live multiplayer session is running. Students can join via Room PIN or QR Code.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCopyPin}
                className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied PIN' : 'Copy PIN'}</span>
              </button>

              <button
                type="button"
                onClick={onReturnToActiveRoom}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-heading font-black text-sm flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Enter Live Screen &rarr;</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Quick Host Launcher */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Play className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-black text-white">
              Launch a New Live Classroom Quiz
            </h2>
            <p className="text-xs text-slate-400">
              Select any saved quiz below and generate a Kahoot-style Room PIN with QR code for students to scan.
            </p>
          </div>
        </div>

        {quizzes.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No saved quizzes found. Please create or generate an AI quiz first!
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quiz Selector Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-300">
                Choose Assessment to Host
              </label>
              <select
                value={selectedQuizId}
                onChange={(e) => setSelectedQuizId(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-purple-500"
              >
                {quizzes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title} ({q.subject} • {q._count?.questions || q.questions?.length || 0} Questions • {q.defaultTimeLimit}s/Q)
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Quiz Preview Card */}
            {selectedQuiz && (
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {selectedQuiz.subject}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {selectedQuiz.defaultTimeLimit}s per question
                    </span>
                  </div>
                  <h4 className="font-heading font-black text-white text-base">
                    {selectedQuiz.title}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {selectedQuiz.description || 'Live questions with randomized options & auto-save.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onLaunchQuiz(selectedQuiz.id)}
                  disabled={creatingRoom}
                  className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-heading font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{creatingRoom ? 'Generating Room...' : 'Launch Live Room Now &rarr;'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Feature Highlights of Live Engine */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Kahoot-Style PIN & QR */}
        <div className="glass-panel rounded-3xl p-5 border border-slate-800 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-black text-white text-sm">Kahoot-Style PIN & QR</h3>
          <p className="text-xs text-slate-400">
            Instant 6-character room codes with QR code projection. Students join in 3 seconds from phones or laptops.
          </p>
        </div>

        {/* Real-Time Telemetry */}
        <div className="glass-panel rounded-3xl p-5 border border-slate-800 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <BarChart2 className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-black text-white text-sm">Live Response Distribution</h3>
          <p className="text-xs text-slate-400">
            Real-time countdown timer ring and dynamic live bar charts showing student answer submissions.
          </p>
        </div>

        {/* Top 3 Celebratory Podium */}
        <div className="glass-panel rounded-3xl p-5 border border-slate-800 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
          <h3 className="font-heading font-black text-white text-sm">Podium Celebration & CSV</h3>
          <p className="text-xs text-slate-400">
            Gold, Silver, Bronze podium with celebratory confetti bursts, fanfare audio, and 1-click CSV report export.
          </p>
        </div>
      </div>
    </div>
  );
}
