import React from 'react';
import { CheckCircle2, Smartphone, Sparkles, Loader2, ArrowLeft } from 'lucide-react';
import StudentCornerWidget from '../../components/StudentCornerWidget';
import AmbientBackground from '../../components/AmbientBackground';

export default function StudentLobby({ playerName, playerAvatar, roomCode, quizTitle, onLeave = null }) {
  return (
    <div className="relative max-w-md mx-auto px-4 py-12 sm:py-20 text-center space-y-6">
      <AmbientBackground variant="default" />
      <StudentCornerWidget />
      <div className="glass-panel-glow rounded-3xl p-8 space-y-6 animate-fade-scale">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-3xl bg-slate-800 border-2 border-purple-500/50 flex items-center justify-center text-5xl shadow-2xl mx-auto animate-bounce-subtle">
            {playerAvatar || '🦊'}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 p-1.5 rounded-xl shadow-lg">
            <CheckCircle2 className="w-5 h-5 stroke-[3]" />
          </div>
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-purple-400 block mb-1">
            You are ready!
          </span>
          <h1 className="text-3xl font-heading font-black text-white">
            {playerName}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Joined Room <span className="font-mono font-bold text-amber-400">{roomCode}</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-slate-300 text-sm flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
          <span>Waiting for host to start the quiz...</span>
        </div>

        {/* In-Page Leave Room Button */}
        {onLeave && (
          <div>
            <button
              type="button"
              onClick={onLeave}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-800/90 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 text-xs font-bold transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95 group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
              <span>Leave Room / Change PIN</span>
            </button>
          </div>
        )}

        <div className="text-xs text-slate-500">
          👀 Keep an eye on the big screen! When the question appears, tap your answer as fast as you can.
        </div>
      </div>
    </div>
  );
}
