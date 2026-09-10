import React, { useState, useEffect } from 'react';
import educationBg from '../assets/simple_education_bg.jpg';

export default function AnimatedCollegeBackground() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Subtle 3D mouse parallax tracking
  useEffect(() => {
    let animationFrameId;
    const handleMouseMove = (e) => {
      // Calculate normalized offset from center (-1 to +1)
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;

      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        setMousePos({ x, y });
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Parallax transform styles
  const bgParallax = {
    transform: `scale(1.06) translate3d(${mousePos.x * -10}px, ${mousePos.y * -6}px, 0)`
  };

  const sunbeamParallax = {
    transform: `translate3d(${mousePos.x * 16}px, ${mousePos.y * 10}px, 0)`
  };

  // Floating gentle classroom light motes caught in the window sunlight
  const motes = [
    { top: '25%', left: '15%', size: 4, delay: '0s', duration: '7s' },
    { top: '35%', left: '28%', size: 5, delay: '1.2s', duration: '9s' },
    { top: '48%', left: '42%', size: 3, delay: '2.5s', duration: '6s' },
    { top: '60%', left: '22%', size: 4, delay: '3.1s', duration: '8s' },
    { top: '70%', left: '35%', size: 4, delay: '0.8s', duration: '7.5s' },
    { top: '80%', left: '55%', size: 5, delay: '1.9s', duration: '10s' },
    { top: '30%', left: '50%', size: 3, delay: '4s', duration: '6.5s' },
    { top: '18%', left: '32%', size: 5, delay: '2.8s', duration: '8.5s' },
    { top: '65%', left: '18%', size: 4, delay: '3.6s', duration: '7s' },
    { top: '42%', left: '20%', size: 3, delay: '1.5s', duration: '9.5s' },
    { top: '55%', left: '65%', size: 4, delay: '0.3s', duration: '6.8s' },
    { top: '22%', left: '26%', size: 5, delay: '2.1s', duration: '8.2s' },
    { top: '75%', left: '45%', size: 4, delay: '4.2s', duration: '7.8s' },
    { top: '50%', left: '30%', size: 3, delay: '3.3s', duration: '6.2s' },
    { top: '28%', left: '40%', size: 4, delay: '0.5s', duration: '8.7s' },
    { top: '62%', left: '58%', size: 4, delay: '2.4s', duration: '7.3s' }
  ];

  return (
    <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden select-none">
      {/* 1. Simple, Clean, Realistic Classroom with Living Ken Burns Camera Movement */}
      <div 
        className="absolute inset-[-4%] w-[108%] h-[108%] transition-transform duration-700 ease-out animate-living-bg"
        style={bgParallax}
      >
        <img
          src={educationBg}
          alt="Simple Modern Classroom with Wooden Desks and Chalkboard"
          className="w-full h-full object-cover object-center filter brightness-[0.74] contrast-[1.08] saturate-[1.12]"
        />
      </div>

      {/* 2. Soft Natural Window Daylight Glow from the Classroom Window */}
      <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-amber-100/15 via-amber-200/5 to-transparent animate-warm-atmosphere" />

      {/* 3. Volumetric Natural Sunlight Rays Streaming from the Classroom Window */}
      <div 
        className="absolute -top-10 left-0 w-[500px] h-[1000px] pointer-events-none transition-transform duration-1000 ease-out animate-sunbeams opacity-50"
        style={sunbeamParallax}
      >
        {/* Soft Sunlight Beam 1 */}
        <div className="absolute top-0 left-8 w-40 h-full bg-gradient-to-b from-amber-100/25 via-amber-200/10 to-transparent blur-3xl transform rotate-12 origin-top-left" />
        {/* Soft Sunlight Beam 2 */}
        <div className="absolute top-0 left-48 w-48 h-full bg-gradient-to-b from-amber-100/20 via-amber-200/8 to-transparent blur-3xl transform rotate-16 origin-top-left" />
      </div>

      {/* 4. Floating Gentle Sunlight Motes in the Classroom Air */}
      <div className="absolute inset-0">
        {motes.map((m, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-amber-200 shadow-sm shadow-amber-100"
            style={{
              top: m.top,
              left: m.left,
              width: `${m.size}px`,
              height: `${m.size}px`,
              opacity: 0.65,
              filter: 'blur(0.5px)',
              animation: `floatDrift ${m.duration} ease-in-out ${m.delay} infinite alternate`
            }}
          />
        ))}
      </div>

      {/* 5. Edge Vignette & Readability Balance */}
      {/* Central focus clarity with soft peripheral framing */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 48%, rgba(7, 10, 15, 0.15) 0%, rgba(7, 10, 15, 0.50) 70%, rgba(7, 10, 15, 0.85) 100%)'
        }}
      />

      {/* Top Navbar Soft Shadow */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#070A0F]/85 via-[#070A0F]/45 to-transparent" />

      {/* Bottom Grounding Shadow */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#070A0F] via-[#070A0F]/65 to-transparent" />

      {/* 6. Discreet Live Classroom Camera Badge at Bottom Left */}
      <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/70 border border-white/10 backdrop-blur-md shadow-xl text-[11px] text-slate-300 font-semibold select-none">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-white font-bold">CLASSROOM VIEW</span>
        <span className="text-slate-500">•</span>
        <span className="text-amber-300/90 font-medium">Modern Smart Class</span>
      </div>
    </div>
  );
}
