import React, { useState, useEffect, useMemo } from 'react';
import educationBg from '../assets/simple_education_bg.jpg';

/**
 * AI-Powered Modern Education Background
 * Features:
 * 1. Soft gradient base (Deep Blue/Purple/Indigo tones)
 * 2. Low-opacity, softly blurred education icons & math symbols placed around edges & corners
 * 3. Slow, natural floating drift on different timings
 * 4. Desktop mouse parallax interaction
 * 5. Faint animated dot-grid & data matrix overlay
 */
export default function AIEducationBackground() {
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  // Mouse Parallax (subtle, desktop only)
  useEffect(() => {
    let frameId;
    const onMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;

      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        setMouseOffset({ x, y });
      });
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(frameId);
    };
  }, []);

  // Education Elements strictly distributed around the perimeter/edges
  const floatingItems = useMemo(() => [
    // 1. Graduation Cap (Top Left Corner)
    {
      id: 'grad-1',
      type: 'svg',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
      ),
      top: '6%',
      left: '4%',
      depth: 18,
      duration: '22s',
      delay: '0s',
      color: 'text-purple-400'
    },
    // 2. AI Brain Node (Top Right Corner)
    {
      id: 'brain-1',
      type: 'svg',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-11 h-11">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 3a4.5 4.5 0 00-4.5 4.5c0 .7.16 1.36.44 1.95A4.5 4.5 0 004 13.5c0 1.9 1.18 3.52 2.86 4.19A4.5 4.5 0 0011 21h1a4.5 4.5 0 004.14-3.31A4.5 4.5 0 0019 13.5c0-1.63-.87-3.06-2.18-3.84.12-.37.18-.76.18-1.16A4.5 4.5 0 0012.5 4h-3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v17M8 9h4M12 15h4" />
        </svg>
      ),
      top: '7%',
      left: '92%',
      depth: 22,
      duration: '25s',
      delay: '1.5s',
      color: 'text-indigo-400'
    },
    // 3. Open Book (Mid-Upper Left)
    {
      id: 'book-1',
      type: 'svg',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      top: '32%',
      left: '3%',
      depth: 14,
      duration: '20s',
      delay: '3s',
      color: 'text-violet-400'
    },
    // 4. Light Bulb Idea (Mid-Upper Right)
    {
      id: 'bulb-1',
      type: 'svg',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      top: '28%',
      left: '94%',
      depth: 16,
      duration: '24s',
      delay: '2s',
      color: 'text-amber-300'
    },
    // 5. Laptop / Classroom Tech (Mid-Lower Left)
    {
      id: 'laptop-1',
      type: 'svg',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-9 h-9">
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M2 20h20" />
        </svg>
      ),
      top: '60%',
      left: '4%',
      depth: 17,
      duration: '21s',
      delay: '2.5s',
      color: 'text-cyan-400'
    },
    // 6. Chalkboard / Assessment Canvas (Mid-Lower Right)
    {
      id: 'chalk-1',
      type: 'svg',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-9 h-9">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
      top: '56%',
      left: '93%',
      depth: 19,
      duration: '26s',
      delay: '4s',
      color: 'text-teal-400'
    },
    // 7. Pencil / Note taking (Bottom Left Corner)
    {
      id: 'pencil-1',
      type: 'svg',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-9 h-9">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      ),
      top: '84%',
      left: '5%',
      depth: 15,
      duration: '23s',
      delay: '1s',
      color: 'text-pink-400'
    },
    // 8. Quiz Question Mark Bubble (Bottom Right Corner)
    {
      id: 'quiz-1',
      type: 'svg',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      top: '85%',
      left: '91%',
      depth: 20,
      duration: '27s',
      delay: '3s',
      color: 'text-purple-400'
    },
    // 9. Math Symbol: Pi (π) (Top Center-Left Edge)
    {
      id: 'pi-1',
      type: 'text',
      label: 'π',
      size: 'text-3xl font-serif font-bold',
      top: '4%',
      left: '25%',
      depth: 13,
      duration: '19s',
      delay: '3.5s',
      color: 'text-cyan-300'
    },
    // 10. Math Symbol: Square Root (√x) (Bottom Center-Left Edge)
    {
      id: 'sqrt-1',
      type: 'text',
      label: '√x',
      size: 'text-2xl font-mono font-bold',
      top: '92%',
      left: '28%',
      depth: 18,
      duration: '22s',
      delay: '1.2s',
      color: 'text-purple-300'
    },
    // 11. Math Symbol: Plus (+) (Top Center-Right Edge)
    {
      id: 'plus-1',
      type: 'text',
      label: '+',
      size: 'text-3xl font-bold',
      top: '5%',
      left: '74%',
      depth: 14,
      duration: '18s',
      delay: '2.8s',
      color: 'text-emerald-300'
    },
    // 12. Math Symbol: Equals (=) (Bottom Center-Right Edge)
    {
      id: 'equals-1',
      type: 'text',
      label: '=',
      size: 'text-3xl font-bold',
      top: '91%',
      left: '72%',
      depth: 15,
      duration: '20s',
      delay: '4.5s',
      color: 'text-amber-300'
    }
  ], []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* 
        0. Deep Cosmic Base Background
      */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #070B1E 0%, #0D1535 45%, #070A1A 100%)'
        }}
      />

      {/* 
        1. Realistic Education Background Image Layer - Slow Ken Burns Cinematic Zoom
      */}
      <div 
        className="absolute inset-[-4%] w-[108%] h-[108%] transition-transform duration-700 ease-out opacity-25 animate-ken-burns"
        style={{
          transform: `scale(1.04) translate3d(${mouseOffset.x * -12}px, ${mouseOffset.y * -8}px, 0)`
        }}
      >
        <img
          src={educationBg}
          alt="Realistic Education Classroom"
          className="w-full h-full object-cover object-center filter brightness-[0.70] contrast-[1.1] saturate-[1.05]"
        />
      </div>

      {/* Subtle Noise Texture Overlay */}
      <div className="noise-overlay" />

      {/* 
        2. Soft Education Indigo/Blue Gradient Overlay for seamless blending
      */}
      <div 
        className="absolute inset-0 transition-colors duration-700 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(7, 11, 30, 0.55) 0%, rgba(13, 21, 55, 0.40) 50%, rgba(6, 9, 24, 0.65) 100%)'
        }}
      />

      {/* 
        3. Subtle Natural Window Daylight Glow from the Classroom Window
      */}
      <div className="absolute top-0 left-0 w-2/5 h-full bg-gradient-to-r from-amber-200/6 via-amber-100/2 to-transparent pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-80 h-80 rounded-full bg-cyan-600/10 blur-3xl pointer-events-none" />

      {/* 
        4. Faint Tech Dot Grid & Connecting Pattern
      */}
      <div 
        className="absolute inset-0 opacity-15 animate-grid-breathe pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '54px 54px',
          transform: `translate3d(${mouseOffset.x * 4}px, ${mouseOffset.y * 4}px, 0)`
        }}
      />
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(168, 85, 247, 0.6) 1.2px, transparent 1.2px)',
          backgroundSize: '54px 54px',
          backgroundPosition: '-0.6px -0.6px',
          transform: `translate3d(${mouseOffset.x * 4}px, ${mouseOffset.y * 4}px, 0)`
        }}
      />

      {/* 
        5. Edge-Placed Floating Education Elements with Enhanced Visibility
      */}
      <div className="absolute inset-0 pointer-events-none">
        {floatingItems.map((item, idx) => {
          const parallaxX = mouseOffset.x * item.depth;
          const parallaxY = mouseOffset.y * item.depth;
          const animClass =
            idx % 3 === 0
              ? 'animate-edge-float-a'
              : idx % 3 === 1
              ? 'animate-edge-float-b'
              : 'animate-edge-float-c';

          return (
            <div
              key={item.id}
              className={`absolute transition-transform duration-700 ease-out opacity-45 filter blur-[0.2px] drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] ${item.color} ${animClass}`}
              style={{
                top: item.top,
                left: item.left,
                transform: `translate3d(${parallaxX}px, ${parallaxY}px, 0)`
              }}
            >
              {item.type === 'svg' ? (
                item.icon
              ) : (
                <span className={item.size}>{item.label}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* 
        6. Peripheral Vignette Shadow for high card contrast and reduced peripheral glare
      */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, transparent 36%, rgba(6, 9, 20, 0.42) 75%, rgba(6, 9, 20, 0.80) 100%)'
        }}
      />
    </div>
  );
}
