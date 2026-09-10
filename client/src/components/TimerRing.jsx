import React from 'react';

export default function TimerRing({ remainingSeconds = 20, totalSeconds = 20, size = 'md', isPaused = false }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const progress = totalSeconds > 0 ? (remainingSeconds / totalSeconds) : 0;
  const strokeDashoffset = circumference - progress * circumference;

  const isUrgent = remainingSeconds <= 5 && remainingSeconds > 0;

  const sizeClasses = {
    sm: 'w-12 h-12 text-sm',
    md: 'w-20 h-20 text-2xl',
    lg: 'w-28 h-28 text-3xl sm:w-32 sm:h-32 sm:text-4xl'
  }[size] || 'w-20 h-20 text-2xl';

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses}`}>
      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
        {/* Background track */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          className="stroke-slate-800"
          strokeWidth="8"
          fill="transparent"
        />
        {/* Progress stroke */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          className={`transition-all duration-1000 ease-linear ${
            isUrgent
              ? 'stroke-rose-500 animate-pulse'
              : remainingSeconds <= 10
              ? 'stroke-amber-400'
              : 'stroke-purple-500'
          }`}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      {/* Central Number */}
      <div className="absolute inset-0 flex flex-col items-center justify-center font-heading font-black">
        <span className={`${isUrgent ? 'text-rose-400 scale-110' : 'text-white'} transition-all`}>
          {remainingSeconds}
        </span>
        {isPaused && (
          <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">
            Paused
          </span>
        )}
      </div>
    </div>
  );
}
