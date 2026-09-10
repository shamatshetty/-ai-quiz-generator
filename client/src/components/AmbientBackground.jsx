import React from 'react';

export default function AmbientBackground({ variant = 'default' }) {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none">
      {/* 1. Subtle, Soft Corner Glows (Strictly in the corners, not full screen) */}
      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-600/10 rounded-full blur-2xl animate-pulse-glow" />
      <div className="absolute -top-20 -left-20 w-56 h-56 bg-indigo-600/10 rounded-full blur-2xl animate-float-slow" />

      {/* 2. Small Little Animated Things at the Corners */}
      
      {/* Bottom-Right Corner Animated Cluster */}
      <div className="absolute bottom-6 right-6 hidden sm:flex items-center gap-2 p-2 rounded-2xl bg-slate-900/40 border border-slate-800/60 backdrop-blur-sm animate-float-slow">
        <span className="text-base animate-bounce-subtle">✨</span>
        <span className="text-[11px] font-bold text-slate-400">QuizPop Live</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
      </div>

      {/* Top-Left Corner Micro Sparkle */}
      <div className="absolute top-16 left-6 text-purple-400/40 text-sm animate-float-delayed">
        ✦
      </div>

      {/* Bottom-Left Corner Micro Lightning */}
      <div className="absolute bottom-8 left-6 text-amber-400/30 text-xs animate-float-drift">
        ⚡
      </div>

      {/* Top-Right Corner Micro Star */}
      <div className="absolute top-20 right-8 text-pink-400/30 text-xs animate-float-slow">
        ★
      </div>

      {/* School-Themed Animated Floating Micro-Elements for Auth Variant */}
      {variant === 'auth' && (
        <>
          <div className="absolute top-28 left-10 text-purple-400/30 text-2xl animate-float-slow hidden md:block select-none" aria-hidden="true">
            🎓
          </div>
          <div className="absolute bottom-24 left-14 text-indigo-400/30 text-2xl animate-float-delayed hidden md:block select-none" aria-hidden="true">
            📚
          </div>
          <div className="absolute top-24 right-20 text-pink-400/30 text-2xl animate-float-drift hidden md:block select-none" aria-hidden="true">
            ✏️
          </div>
          <div className="absolute bottom-28 right-24 text-teal-400/30 text-2xl animate-float-slow hidden md:block select-none" aria-hidden="true">
            🧪
          </div>
          <div className="absolute top-1/2 left-6 text-amber-400/25 text-xl animate-float-delayed hidden lg:block select-none" aria-hidden="true">
            💡
          </div>
          <div className="absolute top-2/3 right-8 text-emerald-400/25 text-xl animate-float-drift hidden lg:block select-none" aria-hidden="true">
            🎒
          </div>
        </>
      )}
    </div>
  );
}
