import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Gift, Trophy, Sparkles, X, Flame, Dices } from 'lucide-react';
import soundManager from '../../utils/sound';

export default function PrizeMomentOverlay({ prizeData, onClose, isHost = false }) {
  const { prizeType = 'lucky_draw', winner = {} } = prizeData || {};

  useEffect(() => {
    // Play celebratory prize fanfare
    soundManager.playPrize();

    // Trigger explosive multi-color confetti burst
    const duration = 3.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.6 }
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.6 }
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const prizeLabels = {
    lucky_draw: {
      title: 'Lucky Draw Winner!',
      icon: <Dices className="w-8 h-8 text-amber-300" />,
      color: 'from-amber-500 via-pink-500 to-purple-600'
    },
    current_leader: {
      title: 'Current Crown Leader!',
      icon: <Trophy className="w-8 h-8 text-yellow-300" />,
      color: 'from-yellow-400 via-amber-500 to-orange-500'
    },
    most_improved: {
      title: 'Hottest Fire Streak!',
      icon: <Flame className="w-8 h-8 text-rose-300" />,
      color: 'from-red-500 via-pink-500 to-rose-600'
    }
  }[prizeType] || {
    title: 'Classroom Prize Award!',
    icon: <Gift className="w-8 h-8 text-purple-300" />,
    color: 'from-purple-500 to-pink-500'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-fadeIn">
      <div className="relative max-w-lg w-full glass-panel-glow rounded-3xl p-8 text-center space-y-6 overflow-hidden border-2 border-pink-500/60 shadow-2xl shadow-pink-500/30 animate-scaleUp">
        {/* Animated Background Glow */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-pink-500/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-purple-500/30 rounded-full blur-3xl" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Prize Type Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/20 text-pink-300 text-xs font-black uppercase tracking-widest border border-pink-500/40">
          <Sparkles className="w-4 h-4 text-pink-400" />
          <span>Special Classroom Prize Moment</span>
        </div>

        {/* Big Avatar Spotlight */}
        <div className="relative inline-block my-2">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-tr from-pink-500 via-purple-600 to-amber-400 p-1.5 shadow-2xl mx-auto transform hover:rotate-6 transition-transform">
            <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center text-6xl sm:text-7xl select-none">
              {winner.avatar || '🎁'}
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 p-2 rounded-2xl shadow-lg font-black text-xs uppercase flex items-center gap-1">
            <Trophy className="w-4 h-4 fill-current" />
            <span>Winner!</span>
          </div>
        </div>

        {/* Winner Name & Details */}
        <div className="space-y-2">
          <h2 className="text-3xl sm:text-5xl font-heading font-black text-white tracking-tight">
            {winner.name || 'Lucky Student'}
          </h2>
          <p className="text-pink-300 font-bold text-base sm:text-lg">
            {winner.reason || 'Outstanding performance in today’s challenge!'}
          </p>
        </div>

        {/* Score Pill */}
        {winner.score !== undefined && (
          <div className="inline-block px-5 py-2 rounded-2xl bg-slate-800/90 border border-slate-700 text-slate-300 font-heading font-black text-lg">
            Score: <span className="text-amber-400">{winner.score.toLocaleString()} pts</span>
          </div>
        )}

        {/* Dismiss Button */}
        <div>
          <button
            onClick={onClose}
            className="w-full py-4 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:opacity-95 text-white font-heading font-black text-lg rounded-2xl shadow-xl shadow-purple-600/30 transition-all transform active:scale-95"
          >
            {isHost ? 'Continue Quiz' : 'Awesome! 🎉'}
          </button>
        </div>
      </div>
    </div>
  );
}
