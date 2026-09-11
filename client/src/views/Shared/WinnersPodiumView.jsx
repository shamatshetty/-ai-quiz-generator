import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Download, RotateCcw, Crown, Award, Medal, Users, FileText, BarChart2 } from 'lucide-react';
import soundManager from '../../utils/sound';
import QuestionReviewView from './QuestionReviewView';
import {
  downloadStudentQuizReportCSV,
  triggerBlobDownload
} from '../../utils/exportReport';

export default function WinnersPodiumView({
  podiumData,
  roomCode,
  isHost = false,
  onPlayAgain,
  onReturnToDashboard,
  serverUrl,
  currentUserToken = null
}) {
  const [activeTab, setActiveTab] = useState('review'); // 'review' | 'podium'
  const [isExporting, setIsExporting] = useState(false);
  const [returnCountdown, setReturnCountdown] = useState(5);

  const {
    podium = {},
    fullLeaderboard = [],
    quizTitle = 'Classroom Quiz',
    questions = [],
    playerReviews = {},
    scoreAnalysis = null
  } = podiumData || {};

  const { first, second, third } = podium;

  // Identify specific student review if this is student view
  const myReview = currentUserToken ? playerReviews[currentUserToken] : null;

  useEffect(() => {
    // Play winner fanfare
    soundManager.playFanfare();

    // Trigger celebratory confetti
    const duration = 4 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      const particleCount = 40 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 300);

    return () => clearInterval(interval);
  }, []);

  // Auto-return to dashboard after 5 seconds for students
  useEffect(() => {
    if (isHost || !onReturnToDashboard) return;

    const timer = setInterval(() => {
      setReturnCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onReturnToDashboard();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isHost, onReturnToDashboard]);

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  const handleExportCSV = async () => {
    if (!roomCode) return;
    setIsExporting(true);
    try {
      const res = await fetch(`${serverUrl}/api/rooms/${roomCode}/export-csv`);
      if (res.ok) {
        const blob = await res.blob();
        triggerBlobDownload(blob, `QuizResults_${roomCode}_${Date.now()}.csv`);
        setIsExporting(false);
        return;
      }
    } catch (err) {
      console.warn('Backend CSV download failed, generating client-side CSV', err);
    }

    // Client-side fallback if backend fetch fails
    const rows = [
      ['QUIZPOP! - CLASSROOM ASSESSMENT REPORT'],
      ['Quiz Title', quizTitle],
      ['Room PIN', roomCode],
      ['Generated On', new Date().toLocaleString()],
      [],
      ['Rank', 'Student Name', 'Total Score', 'Questions Answered']
    ];

    (fullLeaderboard || []).forEach((student, idx) => {
      rows.push([
        student.rank || idx + 1,
        student.name,
        student.score,
        questions.length
      ]);
    });

    const csvContent = rows
      .map((row) => row.map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    triggerBlobDownload(csvContent, `QuizResults_${roomCode}_${Date.now()}.csv`);
    setIsExporting(false);
  };

  const handleDownloadMyReportCSV = () => {
    const studentName = myReview?.name || 'Student';
    const userAnswers = myReview?.answers || [];
    const formattedQuestions = questions.map((q, idx) => {
      const studentAns = userAnswers[idx];
      return {
        ...q,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        isCorrect: studentAns?.isCorrect,
        explanation: q.explanation
      };
    });

    downloadStudentQuizReportCSV({
      studentName,
      subject: 'Classroom Live Assessment',
      quizTitle,
      score: myReview?.score ?? 0,
      maxScore: questions.length,
      accuracyPercentage: myReview?.accuracyPercentage ?? 0,
      timeTaken: 'Live Multiplayer Session',
      date: new Date(),
      questions: formattedQuestions,
      studentAnswers: userAnswers
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10 space-y-8">
      {/* Top Header & Navigation Tabs */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-widest border border-amber-500/40">
          <Crown className="w-4 h-4 text-amber-400" />
          Quiz Completed • Final Results
        </div>
        <h1 className="text-3xl sm:text-5xl font-heading font-black text-white tracking-tight">
          {quizTitle}
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
          {isHost
            ? 'Review classroom question statistics, student accuracy, and winner rankings.'
            : 'Review all questions, check your answers against the correct solutions, and analyze your score.'}
        </p>

        {/* Tab Switcher */}
        <div className="inline-flex items-center p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('review')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'review'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Questions & Score Analysis</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('podium')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'podium'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/30 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Winners Podium & Standings</span>
          </button>
        </div>

        {/* 5-Second Auto-Return Countdown Banner for Students */}
        {!isHost && onReturnToDashboard && (
          <div className="max-w-xl mx-auto p-4 rounded-2xl bg-gradient-to-r from-purple-950/90 via-slate-900/95 to-indigo-950/90 border border-purple-500/50 shadow-2xl flex items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/30 border border-purple-400/60 flex items-center justify-center font-heading font-black text-amber-300 text-lg shrink-0 animate-pulse">
                {returnCountdown}s
              </div>
              <div className="text-left">
                <p className="text-white font-heading font-bold text-sm">
                  Returning to Dashboard in {returnCountdown}s...
                </p>
                <p className="text-xs text-purple-300">
                  Scores recorded in database
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onReturnToDashboard}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-heading font-black text-xs uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              Back Now &rarr;
            </button>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* TAB 1: QUESTIONS REVIEW & SCORE ANALYSIS                            */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'review' && (
        <div className="space-y-6 animate-fadeIn">
          <QuestionReviewView
            questions={questions}
            playerReview={myReview || (Object.values(playerReviews)[0] || null)}
            scoreAnalysis={scoreAnalysis}
            isHost={isHost}
          />
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 2: WINNERS PODIUM & LEADERBOARD                                */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'podium' && (
        <div className="space-y-8 animate-fadeIn">
          {/* 3D Olympic Podium Display */}
          <div className="flex items-end justify-center gap-3 sm:gap-6 pt-10 pb-4 max-w-2xl mx-auto">
            {/* 2nd Place (Silver) */}
            <div className="flex-1 flex flex-col items-center">
              {second ? (
                <div className="text-center space-y-2 mb-2">
                  <div className="text-3xl sm:text-4xl select-none animate-bounce-subtle">
                    {second.avatar || '🥈'}
                  </div>
                  <div className="font-heading font-black text-sm sm:text-base text-slate-200 truncate max-w-[100px] sm:max-w-[140px]">
                    {second.name}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-400">
                    {second.score} / {questions.length} pts
                  </div>
                </div>
              ) : (
                <div className="text-slate-600 text-xs mb-2">Empty</div>
              )}
              {/* Silver Pillar */}
              <div className="w-full h-36 sm:h-48 rounded-t-3xl podium-silver flex flex-col items-center justify-start p-4 shadow-xl">
                <span className="font-heading font-black text-2xl sm:text-4xl text-slate-800 drop-shadow-sm">2</span>
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-700 mt-1">Silver</span>
              </div>
            </div>

            {/* 1st Place (Gold Champion) */}
            <div className="flex-1 flex flex-col items-center -mt-8">
              {first ? (
                <div className="text-center space-y-2 mb-2 relative">
                  <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 fill-amber-400 mx-auto animate-pulse" />
                  <div className="text-4xl sm:text-5xl select-none animate-bounce-subtle">
                    {first.avatar || '👑'}
                  </div>
                  <div className="font-heading font-black text-base sm:text-xl text-amber-300 truncate max-w-[110px] sm:max-w-[160px]">
                    {first.name}
                  </div>
                  <div className="text-xs sm:text-base font-black text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30 inline-block">
                    {first.score} / {questions.length} pts
                  </div>
                </div>
              ) : (
                <div className="text-slate-600 text-xs mb-2">Empty</div>
              )}
              {/* Gold Pillar */}
              <div className="w-full h-48 sm:h-64 rounded-t-3xl podium-gold flex flex-col items-center justify-start p-4 shadow-2xl">
                <span className="font-heading font-black text-3xl sm:text-5xl text-amber-950 drop-shadow-sm">1</span>
                <span className="text-[10px] uppercase font-black tracking-widest text-amber-950 font-extrabold mt-1">Champion</span>
              </div>
            </div>

            {/* 3rd Place (Bronze) */}
            <div className="flex-1 flex flex-col items-center">
              {third ? (
                <div className="text-center space-y-2 mb-2">
                  <div className="text-3xl sm:text-4xl select-none animate-bounce-subtle">
                    {third.avatar || '🥉'}
                  </div>
                  <div className="font-heading font-black text-sm sm:text-base text-slate-200 truncate max-w-[100px] sm:max-w-[140px]">
                    {third.name}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-400">
                    {third.score} / {questions.length} pts
                  </div>
                </div>
              ) : (
                <div className="text-slate-600 text-xs mb-2">Empty</div>
              )}
              {/* Bronze Pillar */}
              <div className="w-full h-28 sm:h-36 rounded-t-3xl podium-bronze flex flex-col items-center justify-start p-4 shadow-xl">
                <span className="font-heading font-black text-xl sm:text-3xl text-orange-950 drop-shadow-sm">3</span>
                <span className="text-[10px] uppercase font-black tracking-widest text-orange-950 mt-1">Bronze</span>
              </div>
            </div>
          </div>

          {/* Full Leaderboard Table Below Podium */}
          {fullLeaderboard.length > 0 && (
            <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4 max-w-3xl mx-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  <span>Full Class Standings</span>
                  <span className="text-xs text-slate-400 font-normal">({fullLeaderboard.length} students)</span>
                </h3>
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {fullLeaderboard.map((student, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 font-bold text-slate-400 text-center">
                        #{student.rank || idx + 1}
                      </span>
                      <span className="text-xl">{student.avatar || '🦊'}</span>
                      <span className="font-bold text-white">{student.name}</span>
                    </div>

                    <div className="font-mono font-bold text-amber-400">
                      {student.score} / {questions.length} pts
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Action Buttons (CSV Export & Play Again) */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-slate-800/80">
        {isHost ? (
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="px-6 py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-heading font-black rounded-2xl shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-5 h-5 text-emerald-400" />
            <span>{isExporting ? 'Generating CSV...' : 'Export Class Results (CSV)'}</span>
          </button>
        ) : (
          <button
            onClick={handleDownloadMyReportCSV}
            className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-black rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer"
          >
            <Download className="w-5 h-5" />
            <span>Download My Scorecard (CSV)</span>
          </button>
        )}

        {!isHost && onReturnToDashboard && (
          <button
            onClick={onReturnToDashboard}
            className="px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-heading font-black rounded-2xl shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer"
          >
            <span>Back to Dashboard ({returnCountdown}s)</span>
          </button>
        )}

        <button
          onClick={onPlayAgain}
          className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-heading font-black rounded-2xl border border-slate-700 flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" />
          <span>{isHost ? 'Back to Dashboard' : 'Play Another Quiz'}</span>
        </button>
      </div>
    </div>
  );
}
