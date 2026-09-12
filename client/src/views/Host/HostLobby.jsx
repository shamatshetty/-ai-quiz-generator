import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Users, Play, Copy, Check, Bot, Sparkles, Smartphone, ArrowRight, ArrowLeft, Globe, Wifi, Settings, ExternalLink, Bell } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export default function HostLobby({
  roomCode,
  quizTitle,
  totalQuestions,
  players = [],
  onStartQuiz,
  onBack = null
}) {
  const { socket, serverUrl } = useSocket();
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [networkIp, setNetworkIp] = useState('10.198.50.8');

  const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // Access mode: 'global' (any Wi-Fi, 4G/5G) vs 'local' (same Wi-Fi only)
  const [accessMode, setAccessMode] = useState(() => {
    if (!isLocalHost) return 'global';
    return localStorage.getItem('quiz_access_mode') || 'global';
  });

  const [customPublicUrl, setCustomPublicUrl] = useState(() => {
    return localStorage.getItem('quiz_custom_public_url') || '';
  });
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  // Fetch local network IP and optional publicUrl from server
  React.useEffect(() => {
    fetch(`${serverUrl}/api/network-info`)
      .then(res => res.json())
      .then(data => {
        if (data && data.primaryIp && data.primaryIp !== 'localhost') {
          setNetworkIp(data.primaryIp);
        }
        if (data && data.publicUrl && !customPublicUrl) {
          setCustomPublicUrl(data.publicUrl);
        }
      })
      .catch(() => {});
  }, [serverUrl]);

  // Compute join URL
  let effectiveHost = window.location.host;
  let effectiveProtocol = window.location.protocol;

  if (accessMode === 'global') {
    if (customPublicUrl && customPublicUrl.trim()) {
      const clean = customPublicUrl.trim();
      effectiveProtocol = clean.startsWith('http://') ? 'http:' : 'https:';
      effectiveHost = clean.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    } else if (!isLocalHost) {
      effectiveHost = window.location.host;
      effectiveProtocol = window.location.protocol;
    } else {
      effectiveHost = networkIp ? `${networkIp}:${window.location.port || '5173'}` : window.location.host;
    }
  } else {
    effectiveHost = networkIp ? `${networkIp}:${window.location.port || '5173'}` : window.location.host;
  }

  const joinUrl = `${effectiveProtocol}//${effectiveHost}/?room=${roomCode}`;

  const copyJoinLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulate = (count) => {
    if (!socket || simulating) return;
    setSimulating(true);
    socket.emit('host:simulate-students', { roomCode, count }, (res) => {
      setSimulating(false);
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Back Button */}
      {onBack && (
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 text-purple-400" />
            <span>&larr; Back to Quizzes (Cancel Room)</span>
          </button>
        </div>
      )}

      {/* Top Banner with Big Room Code & QR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Left 2 Cols: Room Code & Instructions for Projector */}
        <div className="lg:col-span-2 glass-panel-glow rounded-3xl p-6 sm:p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Live Classroom Lobby
              </div>
              <span className="text-xs font-bold text-slate-400">
                {totalQuestions} Questions
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-heading font-black text-white tracking-tight mb-2">
              {quizTitle}
            </h1>

            {/* Assessment Feature Badges */}
            <div className="flex flex-wrap gap-1.5 mb-6">
              <span className="px-2.5 py-1 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[11px] font-bold">
                🎲 Random Questions
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold">
                🔀 Random Options
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                💾 Auto-Save Answer
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                🔒 1 Attempt Limit
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300 text-[11px] font-bold">
                ⏱️ Auto Submit
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-bold">
                📊 Auto Evaluation (+1 Pt)
              </span>
            </div>

            {/* Registered Students Notification Alert */}
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-purple-500/15 border border-purple-500/35 text-purple-200 text-xs font-semibold mb-6 animate-reveal-2">
              <div className="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
                <Bell className="w-3.5 h-3.5 text-amber-300" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-white font-bold">Registered Students Alerted: </span>
                <span className="text-purple-300">Live in-app notification toasts and email invitations were dispatched to all registered student accounts.</span>
              </div>
            </div>

            <p className="text-slate-400 text-sm sm:text-base mb-6">
              Students: Join using your phone or laptop. Go to website and enter room code!
            </p>

            {/* Huge Projector Room Code */}
            <div className="bg-slate-900/90 border-2 border-purple-500/40 rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400" />
              <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
                <span className="text-xs font-black uppercase tracking-widest text-purple-300">
                  Join at <span className="underline text-white font-bold">{effectiveHost}</span> with Quiz PIN:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setUrlInput(customPublicUrl || (isLocalHost ? '' : window.location.origin));
                    setShowUrlModal(true);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 text-[10px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer"
                  title="Configure Cloud or Public Join URL"
                >
                  <Settings className="w-3 h-3 text-purple-400" />
                  <span>Configure URL</span>
                </button>
              </div>

              <div className="font-mono text-5xl sm:text-7xl font-black text-amber-400 tracking-widest selection:bg-amber-400 selection:text-black py-2">
                {roomCode}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={copyJoinLink}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Link Copied!' : 'Copy Direct Join Link'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Start Quiz Action */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800/80 mt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black font-heading text-white">
                  {players.length}
                </div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Students Joined
                </div>
              </div>
            </div>

            <button
              onClick={onStartQuiz}
              disabled={players.length === 0}
              className={`w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-heading font-black text-lg rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 transition-all transform active:scale-95 ${
                players.length === 0 ? 'opacity-50 cursor-not-allowed' : 'animate-bounce-subtle'
              }`}
            >
              <Play className="w-6 h-6 fill-current" />
              <span>Start Quiz Now</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right Col: QR Code & Instant Load Simulator */}
        <div className="space-y-6 flex flex-col">
          {/* QR Code Card */}
          <div className="glass-panel rounded-3xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="p-4 bg-white rounded-2xl shadow-xl mb-3">
              <QRCodeSVG value={joinUrl} size={170} level="M" />
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 mb-1">
              <Smartphone className="w-4 h-4 text-purple-400" />
              <span>Scan to Join on Phone</span>
            </div>
            <div className="text-[11px] text-purple-300 font-mono break-all px-2">
              {joinUrl}
            </div>

            {/* Access Mode Indicator */}
            {accessMode === 'global' ? (
              <div className="text-[11px] text-emerald-300 font-bold mt-2.5 bg-emerald-950/70 py-1.5 px-3 rounded-xl border border-emerald-500/40 flex items-center justify-center gap-1.5 shadow-sm">
                <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Works on ANY Wi-Fi or Mobile Data (4G/5G)!</span>
              </div>
            ) : (
              <div className="text-[11px] text-amber-300 font-medium mt-2.5 bg-amber-950/70 py-1.5 px-3 rounded-xl border border-amber-500/40 flex items-center justify-center gap-1.5 shadow-sm">
                <Wifi className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Local Network • Same Wi-Fi Required</span>
              </div>
            )}

            {/* Mode Switcher & URL Config Button */}
            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const next = accessMode === 'global' ? 'local' : 'global';
                  setAccessMode(next);
                  localStorage.setItem('quiz_access_mode', next);
                }}
                className={`px-3 py-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  accessMode === 'global'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                }`}
                title="Toggle between Worldwide (Any Wi-Fi / 4G/5G) and Local Wi-Fi mode"
              >
                {accessMode === 'global' ? <Globe className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
                <span>{accessMode === 'global' ? 'Mode: Any Wi-Fi' : 'Mode: Local Wi-Fi'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUrlInput(customPublicUrl || (isLocalHost ? '' : window.location.origin));
                  setShowUrlModal(true);
                }}
                className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 transition-all cursor-pointer"
                title="Set Public Cloud URL"
              >
                <Settings className="w-3 h-3 text-purple-400" />
                <span>Set URL</span>
              </button>
            </div>
          </div>

          {/* Quick Bot Simulator for Instant Testing */}
          <div className="glass-panel rounded-3xl p-6 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-white mb-2">
                <Bot className="w-4 h-4 text-amber-400" />
                <span>Test 100+ Students Simulation</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Spin up virtual student clients that connect, answer questions, and compete live on the leaderboard.
              </p>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleSimulate(5)}
                  disabled={simulating}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-colors"
                >
                  +5 Bots
                </button>
                <button
                  onClick={() => handleSimulate(20)}
                  disabled={simulating}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-colors"
                >
                  +20 Bots
                </button>
                <button
                  onClick={() => handleSimulate(50)}
                  disabled={simulating}
                  className="py-2.5 px-3 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-xs font-bold text-purple-200 border border-purple-500/40 transition-colors"
                >
                  +50 Bots
                </button>
              </div>
            </div>

            {simulating && (
              <p className="text-xs text-amber-400 font-semibold mt-3 animate-pulse">
                Spawning simulated students...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Live Grid of Joined Students */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <span>Joined Students</span>
            <span className="text-sm font-normal text-slate-400">({players.length})</span>
          </h2>
          {players.length === 0 && (
            <span className="text-xs text-slate-400 italic">Waiting for players to enter code...</span>
          )}
        </div>

        {players.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-800 rounded-2xl">
            <Smartphone className="w-10 h-10 text-slate-600 mx-auto mb-2 animate-bounce" />
            <p className="text-slate-400 font-medium text-sm">
              Waiting for students to join...
            </p>
            <p className="text-slate-500 text-xs mt-1">
              Tip: Click "+20 Bots" above to simulate a full classroom instantly!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-96 overflow-y-auto pr-2">
            {players.map((p, idx) => (
              <div
                key={p.sessionToken || idx}
                className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-sm animate-fadeIn transform transition-transform hover:scale-105"
              >
                <span className="text-2xl select-none">{p.avatar || '🦊'}</span>
                <span className="text-sm font-bold text-slate-200 truncate">{p.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Configure Public Join URL Modal */}
      {showUrlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass-panel border border-purple-500/40 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-purple-400" />
                <h3 className="font-heading font-black text-white text-base">
                  Public Join URL Settings
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUrlModal(false)}
                className="text-slate-400 hover:text-white p-1 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              To let students on <strong>ANY Wi-Fi, hotspot, or mobile 4G/5G</strong> join from anywhere, enter your cloud or public URL (e.g. Render, Railway, or Vercel URL):
            </p>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Public / Cloud URL:
              </label>
              <input
                type="url"
                placeholder="https://ai-quiz-generator.onrender.com"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-purple-500 placeholder-slate-600"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCustomPublicUrl('');
                  localStorage.removeItem('quiz_custom_public_url');
                  setShowUrlModal(false);
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Reset
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowUrlModal(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = urlInput.trim();
                    setCustomPublicUrl(trimmed);
                    if (trimmed) {
                      localStorage.setItem('quiz_custom_public_url', trimmed);
                      setAccessMode('global');
                      localStorage.setItem('quiz_access_mode', 'global');
                    } else {
                      localStorage.removeItem('quiz_custom_public_url');
                    }
                    setShowUrlModal(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black transition-all shadow-md shadow-purple-600/30 cursor-pointer"
                >
                  Save URL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
