import React, { useState, useEffect } from 'react';
import { useSocket } from './context/SocketContext';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthView from './views/Auth/AuthView';
import HostDashboard from './views/Host/HostDashboard';
import HostLobby from './views/Host/HostLobby';
import HostLiveControl from './views/Host/HostLiveControl';
import StudentDashboard from './views/Student/StudentDashboard';
import StudentJoin from './views/Student/StudentJoin';
import StudentLobby from './views/Student/StudentLobby';
import StudentQuestion from './views/Student/StudentQuestion';
import StudentFeedback from './views/Student/StudentFeedback';
import LeaderboardView from './views/Shared/LeaderboardView';
import PrizeMomentOverlay from './views/Shared/PrizeMomentOverlay';
import WinnersPodiumView from './views/Shared/WinnersPodiumView';
import soundManager from './utils/sound';
import { Play, Sparkles, Smartphone, Users, BookOpen } from 'lucide-react';

export default function App() {
  const { socket, sessionToken, serverUrl } = useSocket();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();

  // App Role: null | 'host' | 'student'
  const [role, setRole] = useState(null);

  // App Screen:
  // Host screens: 'host-dashboard' | 'host-lobby' | 'host-live' | 'host-leaderboard' | 'host-podium'
  // Student screens: 'student-dashboard' | 'student-join' | 'student-lobby' | 'student-question' | 'student-feedback' | 'student-leaderboard' | 'student-podium'
  const [screen, setScreen] = useState('home');

  // Shared Room & Quiz State
  const [roomCode, setRoomCode] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [players, setPlayers] = useState([]);

  // Student-specific state
  const [playerName, setPlayerName] = useState('');
  const [playerAvatar, setPlayerAvatar] = useState('');
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [feedbackData, setFeedbackData] = useState(null);

  // Question & Timer state
  const [questionData, setQuestionData] = useState(null);
  const [timerData, setTimerData] = useState({ remainingSeconds: 20, totalSeconds: 20, isPaused: false });
  const [answerStats, setAnswerStats] = useState(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [liveDashboardData, setLiveDashboardData] = useState(null);

  // Leaderboard & Podium & Prize State
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [podiumData, setPodiumData] = useState(null);
  const [prizeOverlayData, setPrizeOverlayData] = useState(null);

  // Detect URL parameter ?room=XYZ
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room');
    if (code) {
      setRoomCode(code.toUpperCase());
    }
  }, []);

  // Synchronize authenticated user with role and default screens
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'TEACHER') {
        setRole('host');
        setScreen((prev) => (prev === 'home' || prev === 'auth' ? 'host-dashboard' : prev));
      } else if (user.role === 'STUDENT') {
        setRole('student');
        setPlayerName(user.name);
        setPlayerAvatar(user.avatar || '🚀');
        setScreen((prev) => {
          if (prev === 'home' || prev === 'auth') {
            return 'student-dashboard';
          }
          return prev;
        });
      }
    } else if (!isAuthenticated && !authLoading) {
      setRole(null);
      setScreen('home');
    }
  }, [isAuthenticated, user, authLoading, roomCode]);

  const handleAuthSuccess = (loggedUser) => {
    if (loggedUser.role === 'TEACHER') {
      setRole('host');
      setScreen('host-dashboard');
    } else {
      setRole('student');
      setPlayerName(loggedUser.name);
      setPlayerAvatar(loggedUser.avatar || '🚀');
      setScreen('student-dashboard');
    }
  };

  // Listen to Socket.IO events
  useEffect(() => {
    if (!socket) return;

    // Room player list update (lobby & mid-game roster)
    socket.on('room:player-list-update', (data) => {
      setPlayers(data.players || []);
    });

    // Quiz started
    socket.on('quiz:started', (data) => {
      setQuizTitle(data.quizTitle || 'Live Quiz');
      setTotalQuestions(data.totalQuestions || 0);
    });

    // New Question delivery
    socket.on('question:next', (data) => {
      setQuestionData(data);

      // Feature: AUTO-SAVE & ONE ATTEMPT RESTORATION
      const savedAns = localStorage.getItem(`quiz_ans_${roomCode}_${data.questionIndex}`);
      if (savedAns !== null && savedAns !== undefined) {
        setSelectedOption(Number(savedAns));
        setHasAnswered(true);
      } else {
        setSelectedOption(null);
        setHasAnswered(false);
      }

      setAnswerStats(null);
      setAnsweredCount(0);
      setLiveDashboardData(null);
      setTimerData({ remainingSeconds: data.timeLimit || 20, totalSeconds: data.timeLimit || 20, isPaused: false });

      if (role === 'student') {
        setScreen('student-question');
      } else if (role === 'host') {
        setScreen('host-live');
      }
    });

    // Host specific question details with answer counts
    socket.on('host:question-details', (data) => {
      setQuestionData(data);
      setAnsweredCount(data.answeredCount || 0);
    });

    // Host live answer count update
    socket.on('host:answer-count-update', (data) => {
      setAnsweredCount(data.answeredCount);
    });

    // Host live student score dashboard update
    socket.on('host:live-dashboard', (data) => {
      setLiveDashboardData(data);
      if (data?.totalAnswered !== undefined) {
        setAnsweredCount(data.totalAnswered);
      }
    });

    // Server-authoritative timer ticks
    socket.on('question:timer-tick', (data) => {
      setTimerData((prev) => ({
        ...prev,
        remainingSeconds: data.remainingSeconds,
        totalSeconds: data.totalSeconds
      }));

      // Sound FX for ticks
      if (data.remainingSeconds <= 5 && data.remainingSeconds > 0) {
        soundManager.playUrgentTick();
      } else if (data.remainingSeconds > 0) {
        soundManager.playTick();
      }
    });

    socket.on('question:timer-paused', (data) => {
      setTimerData((prev) => ({ ...prev, isPaused: true, remainingSeconds: data.remainingSeconds }));
    });

    socket.on('question:timer-resumed', (data) => {
      setTimerData((prev) => ({ ...prev, isPaused: false, remainingSeconds: data.remainingSeconds }));
    });

    // Question answer reveal
    socket.on('question:reveal-answer', (data) => {
      setAnswerStats(data.stats);
      if (role === 'host') {
        // Keep screen as host-live with revealed state
      }
    });

    // Individual student feedback result
    socket.on('student:answer-result', (result) => {
      setFeedbackData(result);
      if (result.isCorrect) {
        soundManager.playCorrect();
      } else {
        soundManager.playIncorrect();
      }
      // Note: Do not navigate away to student-feedback!
      // The server directly delivers question:next in ~450ms.
    });

    // Live leaderboard update broadcast
    socket.on('leaderboard:update', (data) => {
      setLeaderboardData(data);
      if (role === 'host') {
        setScreen('host-leaderboard');
      } else if (role === 'student') {
        setScreen('student-leaderboard');
      }
    });

    // Mid-quiz Prize Moment announcement
    socket.on('prize:announcement', (prizeRecord) => {
      setPrizeOverlayData(prizeRecord);
    });

    // Quiz End & Final Podium
    socket.on('quiz:end', (data) => {
      setPodiumData(data);
      if (role === 'student') {
        setScreen('student-podium');
      }
    });

    socket.on('winners:final-podium', (data) => {
      setPodiumData(data);
      if (role === 'host') {
        setScreen('host-podium');
      }
    });

    return () => {
      socket.off('room:player-list-update');
      socket.off('quiz:started');
      socket.off('question:next');
      socket.off('host:question-details');
      socket.off('host:answer-count-update');
      socket.off('question:timer-tick');
      socket.off('question:timer-paused');
      socket.off('question:timer-resumed');
      socket.off('question:reveal-answer');
      socket.off('student:answer-result');
      socket.off('leaderboard:update');
      socket.off('prize:announcement');
      socket.off('quiz:end');
      socket.off('winners:final-podium');
    };
  }, [socket, role]);

  // Host Actions
  const handleHostRoomCreated = (res) => {
    setRole('host');
    setRoomCode(res.roomCode);
    setQuizTitle(res.quizTitle);
    setTotalQuestions(res.totalQuestions);
    setPlayers(res.players || []);
    setScreen('host-lobby');
  };

  const handleHostStartQuiz = () => {
    socket.emit('host:start-quiz', { roomCode });
  };

  const handleHostRevealAnswer = () => {
    socket.emit('host:reveal-answer', { roomCode });
  };

  const handleHostShowLeaderboard = () => {
    socket.emit('host:show-leaderboard', { roomCode });
  };

  const handleHostNextQuestion = () => {
    socket.emit('host:next-question', { roomCode });
  };

  const handleHostPauseTimer = () => {
    socket.emit('host:pause-timer', { roomCode });
  };

  const handleHostResumeTimer = () => {
    socket.emit('host:resume-timer', { roomCode });
  };

  const handleHostSkipQuestion = () => {
    socket.emit('host:skip-question', { roomCode });
  };

  const handleHostTriggerPrize = (prizeType) => {
    socket.emit('host:trigger-prize-moment', { roomCode, prizeType });
  };

  const handleHostEndQuiz = () => {
    socket.emit('host:end-quiz', { roomCode });
  };

  // Student Actions
  const handleStudentJoinSuccess = (res) => {
    setRole('student');
    setRoomCode(res.roomCode);
    setPlayerName(res.player.name);
    setPlayerAvatar(res.player.avatar);
    setQuizTitle(res.quizTitle);
    setTotalQuestions(res.totalQuestions);

    if (res.status === 'QUESTION' && res.currentQuestion) {
      setQuestionData(res.currentQuestion);
      setTimerData({
        remainingSeconds: res.remainingSeconds !== undefined ? res.remainingSeconds : 20,
        totalSeconds: res.totalSeconds || 20,
        isPaused: false
      });
      setHasAnswered(res.hasAnsweredCurrent || false);
      setScreen('student-question');
    } else {
      setScreen('student-lobby');
    }
  };

  const handleStudentSubmitAnswer = (optionIndex) => {
    // Feature: ONE ATTEMPT RESTRICTION
    if (hasAnswered) return;
    setSelectedOption(optionIndex);
    setHasAnswered(true);

    // Feature: AUTO-SAVE ANSWER (persist locally immediately)
    if (roomCode && questionData?.questionIndex !== undefined) {
      try {
        localStorage.setItem(`quiz_ans_${roomCode}_${questionData.questionIndex}`, String(optionIndex));
      } catch (e) {
        // storage quota fallback
      }
    }

    // Feature: AUTO SUBMIT (instantly emit without blocking on confirm modal)
    socket.emit('student:submit-answer', {
      roomCode,
      sessionToken,
      questionIndex: questionData?.questionIndex,
      selectedOptionIndex: optionIndex
    });
  };

  const handleSignOutApp = () => {
    logout();
    setRole(null);
    setScreen('home');
    setRoomCode('');
    setPlayers([]);
    setQuestionData(null);
    setLeaderboardData(null);
    setPodiumData(null);
    setPrizeOverlayData(null);
  };

  const handleExitToHome = () => {
    if (window.confirm('Are you sure you want to leave the current quiz session?')) {
      if (user?.role === 'TEACHER') {
        setScreen('host-dashboard');
      } else if (user?.role === 'STUDENT') {
        setScreen('student-dashboard');
      } else {
        setRole(null);
        setScreen('home');
      }
      setRoomCode('');
      setPlayers([]);
      setQuestionData(null);
      setLeaderboardData(null);
      setPodiumData(null);
      setPrizeOverlayData(null);
    }
  };

  // Universal Back Navigation Resolution across all screens
  const getNavBack = () => {
    // 1. Host in lobby
    if (screen === 'host-lobby') {
      return {
        label: 'Quizzes',
        action: () => {
          if (players.length > 0) {
            if (!window.confirm('Cancel this room and return to quiz list?')) return;
          }
          setScreen('host-dashboard');
          setRoomCode('');
          setPlayers([]);
        }
      };
    }

    // 2. Host in live control or leaderboard
    if (screen === 'host-live' || screen === 'host-leaderboard') {
      return {
        label: 'Exit Game',
        action: () => {
          if (window.confirm('Are you sure you want to exit this live quiz?')) {
            setScreen('host-dashboard');
            setRoomCode('');
            setPlayers([]);
            setQuestionData(null);
            setLeaderboardData(null);
          }
        }
      };
    }

    // 3. Host in podium
    if (screen === 'host-podium') {
      return {
        label: 'Dashboard',
        action: () => {
          setScreen('host-dashboard');
          setRoomCode('');
          setPlayers([]);
          setPodiumData(null);
        }
      };
    }

    // 4. Host in dashboard (can return to home portal)
    if (screen === 'host-dashboard') {
      return {
        label: 'Home',
        action: () => setScreen('home')
      };
    }

    // 5. Student in lobby
    if (screen === 'student-lobby') {
      return {
        label: 'Leave Room',
        action: () => {
          setScreen('student-join');
          setRoomCode('');
        }
      };
    }

    // 6. Student in question or feedback or leaderboard
    if (screen === 'student-question' || screen === 'student-feedback' || screen === 'student-leaderboard') {
      return {
        label: 'Leave Quiz',
        action: () => {
          if (window.confirm('Are you sure you want to leave the live quiz?')) {
            setScreen('student-join');
            setRoomCode('');
            setQuestionData(null);
            setLeaderboardData(null);
          }
        }
      };
    }

    // 7. Student in podium
    if (screen === 'student-podium') {
      return {
        label: 'Back to Join',
        action: () => {
          setScreen('student-join');
          setRoomCode('');
          setPodiumData(null);
        }
      };
    }

    // 8. Student in student-join
    if (screen === 'student-join') {
      return {
        label: 'Dashboard',
        action: () => setScreen('student-dashboard')
      };
    }

    // 9. If screen is 'student-dashboard'
    if (screen === 'student-dashboard') {
      return null;
    }

    return null;
  };

  const navBack = getNavBack();

  return (
    <div className="min-h-screen bg-transparent flex flex-col selection:bg-purple-600 selection:text-white relative">
      {/* Top Navbar with Universal Back Navigation (Hidden on student-dashboard and host-dashboard to allow full-height fixed sidebars) */}
      {screen !== 'student-dashboard' && screen !== 'host-dashboard' && (
        <Navbar
          roomCode={roomCode}
          playerCount={players.length}
          role={role}
          playerName={playerName}
          playerAvatar={playerAvatar}
          onBack={navBack ? navBack.action : null}
          backLabel={navBack ? navBack.label : 'Back'}
          onLeave={role ? handleExitToHome : null}
          onLogout={handleSignOutApp}
          onDashboard={
            isAuthenticated
              ? () => setScreen(user?.role === 'TEACHER' ? 'host-dashboard' : 'student-dashboard')
              : null
          }
        />
      )}

      {/* Main App Content View Switcher */}
      <main className="flex-1 flex flex-col justify-center">
        {/* Loading Session */}
        {authLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="font-heading text-lg font-bold text-slate-300">Initializing Classroom Portal...</p>
          </div>
        ) : !isAuthenticated ? (
          /* Sign In & Registration at beginning */
          <AuthView initialRoomCode={roomCode} onAuthSuccess={handleAuthSuccess} />
        ) : (
          <>
            {/* Authenticated Landing Hub (if ever on 'home') */}
            {screen === 'home' && (
              <div className="max-w-4xl mx-auto px-4 py-12 sm:py-20 text-center space-y-12">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-black uppercase tracking-widest border border-purple-500/40 shadow-inner">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Classroom Assessment System</span>
                  </div>
                  <h1 className="text-4xl sm:text-6xl font-heading font-black text-white tracking-tight leading-tight">
                    Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400">{user?.name}</span>!
                  </h1>
                  <p className="text-slate-300 text-base sm:text-xl max-w-xl mx-auto leading-relaxed">
                    {user?.role === 'TEACHER'
                      ? 'Welcome back to your Teacher Console. Create quizzes, launch live sessions, and track student scores.'
                      : 'Welcome back! Join a live classroom quiz or review your past quiz performance and scores.'}
                  </p>
                </div>

                <div className="flex justify-center gap-4">
                  {user?.role === 'TEACHER' ? (
                    <button
                      onClick={() => setScreen('host-dashboard')}
                      className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-heading font-black text-lg rounded-2xl shadow-lg shadow-emerald-500/30 transition-all cursor-pointer"
                    >
                      Open Teacher Dashboard &rarr;
                    </button>
                  ) : (
                    <button
                      onClick={() => setScreen('student-join')}
                      className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-heading font-black text-lg rounded-2xl shadow-lg shadow-purple-500/30 transition-all cursor-pointer"
                    >
                      Join Live Quiz &rarr;
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* HOST SCREENS */}
            {screen === 'host-dashboard' && (
              <HostDashboard
                onRoomCreated={handleHostRoomCreated}
                activeRoomCode={roomCode}
                onEnterActiveRoom={() => setScreen(questionData ? 'host-live' : 'host-lobby')}
                onBack={() => setScreen('home')}
              />
            )}

            {screen === 'host-lobby' && (
              <HostLobby
                roomCode={roomCode}
                quizTitle={quizTitle}
                totalQuestions={totalQuestions}
                players={players}
                onStartQuiz={handleHostStartQuiz}
                onBack={navBack?.action || (() => setScreen('host-dashboard'))}
              />
            )}

            {screen === 'host-live' && (
              <HostLiveControl
                roomCode={roomCode}
                questionData={questionData}
                timerData={timerData}
                liveDashboardData={liveDashboardData}
                status={answerStats ? 'REVEAL' : 'QUESTION'}
                answeredCount={answeredCount}
                totalPlayers={players.length}
                onRevealAnswer={handleHostRevealAnswer}
                onShowLeaderboard={handleHostShowLeaderboard}
                onNextQuestion={handleHostNextQuestion}
                onPauseTimer={handleHostPauseTimer}
                onResumeTimer={handleHostResumeTimer}
                onSkipQuestion={handleHostSkipQuestion}
                onTriggerPrize={handleHostTriggerPrize}
                onEndQuiz={handleHostEndQuiz}
              />
            )}

            {screen === 'host-leaderboard' && (
              <LeaderboardView
                leaderboardData={leaderboardData}
                currentUserToken={sessionToken}
                isHost={true}
                onNextQuestion={handleHostNextQuestion}
                onTriggerPrize={handleHostTriggerPrize}
                onEndQuiz={handleHostEndQuiz}
              />
            )}

            {screen === 'host-podium' && (
              <WinnersPodiumView
                podiumData={podiumData}
                roomCode={roomCode}
                isHost={true}
                onPlayAgain={() => setScreen('host-dashboard')}
                serverUrl={serverUrl}
              />
            )}

            {/* STUDENT SCREENS */}
            {screen === 'student-dashboard' && (
              <StudentDashboard
                initialRoomCode={roomCode}
                onJoinRoom={(pin) => {
                  setRoomCode(pin);
                  setScreen('student-join');
                }}
                onBack={() => setScreen('home')}
              />
            )}

            {screen === 'student-join' && (
              <StudentJoin
                initialRoomCode={roomCode}
                onJoinSuccess={handleStudentJoinSuccess}
                onBack={navBack?.action || (() => setScreen('home'))}
              />
            )}

            {screen === 'student-lobby' && (
              <StudentLobby
                playerName={playerName}
                playerAvatar={playerAvatar}
                roomCode={roomCode}
                quizTitle={quizTitle}
                onLeave={navBack?.action || (() => setScreen('student-join'))}
              />
            )}

            {screen === 'student-question' && (
              <StudentQuestion
                questionData={questionData}
                timerData={timerData}
                selectedOption={selectedOption}
                hasAnswered={hasAnswered}
                onSelectOption={handleStudentSubmitAnswer}
              />
            )}

            {screen === 'student-feedback' && (
              <StudentFeedback feedbackData={feedbackData} />
            )}

            {screen === 'student-leaderboard' && (
              <LeaderboardView
                leaderboardData={leaderboardData}
                currentUserToken={sessionToken}
                isHost={false}
              />
            )}

            {screen === 'student-podium' && (
              <WinnersPodiumView
                podiumData={podiumData}
                roomCode={roomCode}
                isHost={false}
                currentUserToken={sessionToken}
                onReturnToDashboard={() => {
                  if (user?.role === 'STUDENT') {
                    setScreen('student-dashboard');
                  } else {
                    setScreen('home');
                    setRole(null);
                  }
                  setRoomCode('');
                  setPlayers([]);
                  setQuestionData(null);
                  setLeaderboardData(null);
                  setPodiumData(null);
                }}
                onPlayAgain={() => {
                  setScreen('student-join');
                  setRole('student');
                }}
                serverUrl={serverUrl}
              />
            )}
          </>
        )}
      </main>

      {/* MID-QUIZ PRIZE MOMENT OVERLAY */}
      {prizeOverlayData && (
        <PrizeMomentOverlay
          prizeData={prizeOverlayData}
          isHost={role === 'host'}
          onClose={() => setPrizeOverlayData(null)}
        />
      )}
    </div>
  );
}
