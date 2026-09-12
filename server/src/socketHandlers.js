import roomManager from './roomManager.js';
import prisma from './prisma.js';
import notificationManager from './notificationManager.js';
import notificationService from './services/notificationService.js';

/**
 * SCALE & RELIABILITY ARCHITECTURE NOTE:
 * For deployments requiring horizontal scaling across multiple Node.js instances
 * (>500 concurrent users across multiple server nodes):
 * 1. Attach `@socket.io/redis-adapter` to Socket.IO server:
 *    io.adapter(createAdapter(pubClient, subClient));
 * 2. Store `rooms` state in Redis hashes or Redis JSON instead of local Map.
 * 3. Use Redis Pub/Sub for cross-instance timer broadcasts and prize triggers.
 */

const BOT_NAMES = [
  'Alex_M', 'Sam_T', 'Taylor_K', 'Jordan_W', 'Casey_B', 'Riley_P', 'Morgan_L', 'Avery_H',
  'Quinn_D', 'Dakota_R', 'Skyler_C', 'Reese_F', 'Cameron_G', 'Logan_N', 'Rowan_V', 'Jesse_S',
  'Finley_Z', 'Hayden_X', 'Emerson_J', 'Peyton_Q', 'Kai_Star', 'Harper_B', 'Nova_Spark',
  'Leo_Apex', 'Zoe_Quantum', 'Maya_Cosmic', 'Ethan_Code', 'Lucas_Byte', 'Chloe_Pixel', 'Aria_Wave'
];
const BOT_AVATARS = ['🚀', '🦊', '⚡', '🦉', '🎯', '🦁', '🌟', '🦄', '🐯', '🐼', '🔥', '👾', '🌈', '💎', '🏆'];

export function setupSocketHandlers(io) {
  const botTimers = new Map(); // roomCode -> timeoutIds[]

  function clearBotTimers(roomCode) {
    const timers = botTimers.get(roomCode);
    if (timers && timers.length) {
      timers.forEach(t => clearTimeout(t));
      botTimers.set(roomCode, []);
    }
  }

  /**
   * Complete remaining bot answers immediately so scores stay accurate
   */
  function completeRemainingBotsForQuestion(roomCode) {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;
    const currentQ = room.quiz.questions[room.currentQuestionIndex];
    if (!currentQ) return;
    const answersMap = room.questionAnswers.get(room.currentQuestionIndex) || new Map();

    const bots = Array.from(room.players.values()).filter(p => p.isBot);
    bots.forEach(bot => {
      if (!answersMap.has(bot.sessionToken)) {
        const picksCorrect = Math.random() < 0.7;
        const chosenOption = picksCorrect ? currentQ.correctOptionIndex : Math.floor(Math.random() * 4);
        roomManager.submitAnswer(roomCode, bot.sessionToken, chosenOption);
      }
    });
  }

  /**
   * Helper to start authoritative server countdown
   */
  function startServerTimer(roomCode) {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    if (room.timer.interval) {
      clearInterval(room.timer.interval);
    }

    room.timer.interval = setInterval(() => {
      if (room.timer.isPaused) return;

      room.timer.remainingSeconds--;

      // Broadcast timer tick to room
      io.to(`room:${roomCode}`).emit('question:timer-tick', {
        remainingSeconds: Math.max(0, room.timer.remainingSeconds),
        totalSeconds: room.timer.totalSeconds
      });

      if (room.timer.remainingSeconds <= 0) {
        clearInterval(room.timer.interval);
        room.timer.interval = null;

        // Feature: AUTO SUBMIT ON TIMEOUT (Automatically submits timeout response for unanswered players)
        const timedOutPlayers = roomManager.autoSubmitTimeouts(roomCode);
        timedOutPlayers.forEach(({ sessionToken, player }) => {
          const timeoutPayload = {
            questionIndex: room.currentQuestionIndex,
            selectedOption: -1,
            hasAnswered: true,
            timedOut: true,
            isCorrect: false,
            pointsAwarded: 0
          };
          if (player.socketId) {
            io.to(player.socketId).emit('student:answer-result', timeoutPayload);
          }
          io.to(`student:${sessionToken}`).emit('student:answer-result', timeoutPayload);
        });

        // Emit updated live dashboard so host sees final scores and who timed out
        const timeoutDashboard = roomManager.getLiveQuestionDashboard(roomCode);
        if (timeoutDashboard) {
          io.to(`host:${roomCode}`).emit('host:live-dashboard', timeoutDashboard);
        }

        // Give comfortable time for host and students to review scores after question timeout
        setTimeout(() => {
          advanceToNextQuestionDirectly(roomCode);
        }, 3500);
      }
    }, 1000);
  }

  /**
   * Advance to next question or final podium directly without waiting
   */
  function advanceToNextQuestionDirectly(roomCode) {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    if (room.timer.interval) {
      clearInterval(room.timer.interval);
      room.timer.interval = null;
    }

    // Ensure any remaining unanswered player is auto-submitted before advancing
    const remainingTimeouts = roomManager.autoSubmitTimeouts(roomCode);
    remainingTimeouts.forEach(({ sessionToken, player }) => {
      const timeoutPayload = {
        questionIndex: room.currentQuestionIndex,
        selectedOption: -1,
        hasAnswered: true,
        timedOut: true,
        isCorrect: false,
        pointsAwarded: 0
      };
      if (player.socketId) {
        io.to(player.socketId).emit('student:answer-result', timeoutPayload);
      }
      io.to(`student:${sessionToken}`).emit('student:answer-result', timeoutPayload);
    });

    clearBotTimers(roomCode);
    completeRemainingBotsForQuestion(roomCode);

    // Update ranks in the background
    roomManager.updateLeaderboardRanks(room);

    if (room.currentQuestionIndex + 1 < room.quiz.questions.length) {
      deliverQuestion(roomCode, room.currentQuestionIndex + 1);
    } else {
      triggerQuizEnd(roomCode);
    }
  }

  /**
   * Helper: Deliver Question to Room
   */
  function deliverQuestion(roomCode, index) {
    const questionPayload = roomManager.prepareQuestion(roomCode, index);
    if (!questionPayload) {
      triggerQuizEnd(roomCode);
      return;
    }

    // Send to students (without correctOptionIndex to prevent cheating)
    io.to(`room:${roomCode}`).emit('question:next', {
      questionIndex: questionPayload.questionIndex,
      totalQuestions: questionPayload.totalQuestions,
      timeLimit: questionPayload.timeLimit,
      question: questionPayload.question
    });

    // Send full question details (including correctOptionIndex) to host screen
    io.to(`host:${roomCode}`).emit('host:question-details', {
      ...questionPayload,
      answeredCount: 0,
      totalPlayers: roomManager.getRoom(roomCode).players.size
    });

    // Send initial live dashboard for this question to host screen
    const initialDashboard = roomManager.getLiveQuestionDashboard(roomCode);
    if (initialDashboard) {
      io.to(`host:${roomCode}`).emit('host:live-dashboard', initialDashboard);
    }

    // Start authoritative server timer
    startServerTimer(roomCode);

    // Trigger simulated bot answers if virtual students exist
    simulateBotAnswersForQuestion(roomCode);
  }

  /**
   * Helper: Finalize quiz and deliver podium
   */
  async function triggerQuizEnd(roomCode) {
    clearBotTimers(roomCode);

    try {
      await notificationService.markRoomEnded(roomCode);
    } catch (e) {
      console.warn('Could not mark notification room ended:', e.message);
    }

    const podiumData = await roomManager.endQuiz(roomCode);
    if (podiumData) {
      io.to(`room:${roomCode}`).emit('quiz:end', podiumData);
      io.to(`host:${roomCode}`).emit('winners:final-podium', podiumData);
    }
  }

  /**
   * Simulate answers for bots on the current question
   */
  function simulateBotAnswersForQuestion(roomCode) {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    const currentQ = room.quiz.questions[room.currentQuestionIndex];
    if (!currentQ) return;

    clearBotTimers(roomCode);
    const timers = [];

    const bots = Array.from(room.players.values()).filter(p => p.isBot);
    const timeLimitSec = currentQ.timeLimit || 20;

    bots.forEach((bot) => {
      const delayMs = Math.floor(Math.random() * (timeLimitSec - 3) * 1000) + 1500;

      const timeoutId = setTimeout(() => {
        if (room.status !== 'QUESTION' || room.currentQuestionIndex !== currentQ.orderIndex) return;

        const picksCorrect = Math.random() < 0.7;
        const chosenOption = picksCorrect 
          ? currentQ.correctOptionIndex 
          : Math.floor(Math.random() * 4);

        const res = roomManager.submitAnswer(roomCode, bot.sessionToken, chosenOption);
        if (res && res.success) {
          // Emit updated live student score dashboard to host
          const liveDashboard = roomManager.getLiveQuestionDashboard(roomCode);
          if (liveDashboard) {
            io.to(`host:${roomCode}`).emit('host:live-dashboard', liveDashboard);
          }

          io.to(`host:${roomCode}`).emit('host:answer-count-update', {
            answeredCount: res.totalAnswered,
            totalPlayers: res.totalPlayers
          });

          if (res.allAnswered) {
            io.to(`host:${roomCode}`).emit('host:all-players-answered', {
              totalAnswered: res.totalAnswered
            });

            setTimeout(() => {
              const r = roomManager.getRoom(roomCode);
              if (r && r.status === 'QUESTION') {
                advanceToNextQuestionDirectly(roomCode);
              }
            }, 4000);
          }
        }
      }, delayMs);

      timers.push(timeoutId);
    });

    botTimers.set(roomCode, timers);
  }

  // --------------------------------------------------------------------------
  // Socket.IO Connection Lifecycle
  // --------------------------------------------------------------------------
  io.on('connection', (socket) => {
    // HOST: Create Room
    socket.on('host:create-room', async (payload, callback) => {
      try {
        const { quizId, customQuiz } = payload || {};
        let quizData = customQuiz;

        if (quizId && !customQuiz) {
          quizData = await prisma.quiz.findUnique({
            where: { id: quizId },
            include: { questions: { orderBy: { orderIndex: 'asc' } } }
          });
        }

        if (!quizData || !quizData.questions || quizData.questions.length === 0) {
          const firstQuiz = await prisma.quiz.findFirst({
            include: { questions: { orderBy: { orderIndex: 'asc' } } }
          });
          if (firstQuiz) {
            quizData = firstQuiz;
          } else {
            quizData = {
              title: 'Default Classroom Challenge',
              subject: 'General Knowledge',
              defaultTimeLimit: 20,
              questions: [
                {
                  text: 'Which planet is known as the Red Planet?',
                  options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
                  correctOptionIndex: 1,
                  timeLimit: 20,
                  explanation: 'Mars appears reddish because of iron oxide (rust) on its surface.'
                }
              ]
            };
          }
        }

        const room = roomManager.createRoom(socket.id, quizData);
        socket.join(`room:${room.roomCode}`);
        socket.join(`host:${room.roomCode}`);

        const hostName = payload?.hostName || quizData?.author?.name || 'Teacher';
        const hostId = payload?.hostId || quizData?.authorId || null;

        // Feature: Broadcast Live Quiz Notification to all registered students (DB, Real-time Socket, Email)
        let studentsNotifiedCount = 0;
        try {
          const notifResult = await notificationService.notifyLiveQuizHosted({
            quiz: room.quiz,
            roomCode: room.roomCode,
            hostName,
            hostId,
            io
          });
          studentsNotifiedCount = notifResult?.studentsNotifiedCount || 0;
        } catch (notifErr) {
          console.error('Failed to notify registered students of live quiz:', notifErr);
        }

        const response = {
          roomCode: room.roomCode,
          quizTitle: room.quiz.title,
          totalQuestions: room.quiz.questions.length,
          players: roomManager.getPlayerList(room.roomCode),
          studentsNotified: studentsNotifiedCount
        };

        if (typeof callback === 'function') callback({ success: true, ...response });
        socket.emit('host:room-created', response);
      } catch (err) {
        console.error('Error in host:create-room:', err);
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    });

    // HOST: Broadcast Custom Quiz Creation / Time Limit Setting Notification
    socket.on('host:broadcast-quiz-notice', (payload, callback) => {
      try {
        const notif = notificationManager.addNotification(payload || {});
        io.emit('classroom:notification', notif);
        if (typeof callback === 'function') callback({ success: true, notif });
      } catch (err) {
        console.error('Error in host:broadcast-quiz-notice:', err);
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    });

    // STUDENT: Identify authenticated student socket
    socket.on('student:identify', ({ userId, role, name, email }) => {
      if (role === 'STUDENT' || userId) {
        socket.join('students:registered');
        if (userId) socket.join(`user:${userId}`);
        console.log(`👤 Registered Student joined socket room: ${name || email || userId} (Socket: ${socket.id})`);
      }
    });

    // STUDENT: Join Room
    socket.on('student:join-room', ({ roomCode, name, avatar, sessionToken, userId }, callback) => {
      const code = roomCode?.trim().toUpperCase();
      const token = sessionToken || `player_${socket.id}`;

      const result = roomManager.joinPlayer(code, token, name, avatar, socket.id, userId);
      if (result.error) {
        if (typeof callback === 'function') callback({ success: false, error: result.error });
        socket.emit('student:join-error', { message: result.error });
        return;
      }

      const { room, player } = result;
      socket.join(`room:${code}`);
      socket.join(`student:${token}`);

      const currentQ = room.quiz.questions[room.currentQuestionIndex];
      const answersMap = room.questionAnswers.get(room.currentQuestionIndex);
      const hasAnsweredCurrent = answersMap ? answersMap.has(token) : false;

      const response = {
        success: true,
        roomCode: code,
        sessionToken: token,
        player: {
          sessionToken: player.sessionToken,
          name: player.name,
          avatar: player.avatar,
          score: player.score,
          streak: player.streak,
          rank: player.rank
        },
        quizTitle: room.quiz.title,
        status: room.status,
        currentQuestionIndex: room.currentQuestionIndex,
        totalQuestions: room.quiz.questions.length,
        hasAnsweredCurrent,
        currentQuestion: (room.status === 'QUESTION' && currentQ) ? {
          questionIndex: room.currentQuestionIndex,
          totalQuestions: room.quiz.questions.length,
          timeLimit: currentQ.timeLimit || 20,
          question: {
            text: currentQ.text,
            options: currentQ.options,
            orderIndex: room.currentQuestionIndex,
            timeLimit: currentQ.timeLimit || 20
          }
        } : null,
        remainingSeconds: room.timer.remainingSeconds,
        totalSeconds: room.timer.totalSeconds
      };

      if (typeof callback === 'function') callback(response);
      socket.emit('student:joined-success', response);

      const playerList = roomManager.getPlayerList(code);
      io.to(`room:${code}`).emit('room:player-list-update', {
        playerCount: playerList.length,
        players: playerList
      });
    });

    // STUDENT: Reconnect
    socket.on('student:reconnect', ({ roomCode, sessionToken }, callback) => {
      const code = roomCode?.trim().toUpperCase();
      const room = roomManager.getRoom(code);
      if (!room) {
        if (typeof callback === 'function') callback({ success: false, error: 'Room expired or not found' });
        return;
      }

      const player = room.players.get(sessionToken);
      if (!player) {
        if (typeof callback === 'function') callback({ success: false, error: 'Session not found in room' });
        return;
      }

      player.socketId = socket.id;
      player.connected = true;
      socket.join(`room:${code}`);
      socket.join(`student:${sessionToken}`);

      let hasAnsweredCurrent = false;
      let playerAns = null;
      if (room.status === 'QUESTION' || room.status === 'REVEAL') {
        const answersMap = room.questionAnswers.get(room.currentQuestionIndex);
        if (answersMap && answersMap.has(sessionToken)) {
          hasAnsweredCurrent = true;
          playerAns = answersMap.get(sessionToken);
        }
      }

      const currentQ = room.quiz.questions[room.currentQuestionIndex];

      const state = {
        success: true,
        roomCode: code,
        player: {
          sessionToken: player.sessionToken,
          name: player.name,
          avatar: player.avatar,
          score: player.score,
          streak: player.streak,
          rank: player.rank
        },
        quizTitle: room.quiz.title,
        status: room.status,
        currentQuestionIndex: room.currentQuestionIndex,
        totalQuestions: room.quiz.questions.length,
        hasAnsweredCurrent,
        selectedOption: playerAns ? playerAns.selectedOption : null,
        currentQuestion: (room.status === 'QUESTION' && currentQ) ? {
          text: currentQ.text,
          options: currentQ.options,
          orderIndex: room.currentQuestionIndex,
          timeLimit: currentQ.timeLimit
        } : null,
        remainingSeconds: room.timer.remainingSeconds,
        totalSeconds: room.timer.totalSeconds
      };

      if (typeof callback === 'function') callback(state);
      socket.emit('student:reconnected-state', state);

      io.to(`room:${code}`).emit('room:player-list-update', {
        playerCount: room.players.size,
        players: roomManager.getPlayerList(code)
      });
    });

    // HOST: Start Quiz
    socket.on('host:start-quiz', ({ roomCode }) => {
      const code = roomCode?.trim().toUpperCase();
      const room = roomManager.getRoom(code);
      if (!room) return;

      roomManager.startQuiz(code);
      io.to(`room:${code}`).emit('quiz:started', {
        totalQuestions: room.quiz.questions.length,
        quizTitle: room.quiz.title
      });

      // Deliver first question
      deliverQuestion(code, 0);
    });

    // HOST: Next Question
    socket.on('host:next-question', ({ roomCode }) => {
      const code = roomCode?.trim().toUpperCase();
      advanceToNextQuestionDirectly(code);
    });

    // STUDENT: Submit Answer
    socket.on('student:submit-answer', ({ roomCode, sessionToken, questionIndex, selectedOptionIndex }, callback) => {
      const code = roomCode?.trim().toUpperCase();
      const room = roomManager.getRoom(code);
      if (!room) {
        if (typeof callback === 'function') callback({ success: false, error: 'Room not found' });
        return;
      }

      let player = null;
      if (sessionToken && room.players.has(sessionToken)) {
        player = room.players.get(sessionToken);
        player.socketId = socket.id;
        socket.join(`student:${sessionToken}`);
      } else {
        for (const p of room.players.values()) {
          if (p.socketId === socket.id) {
            player = p;
            break;
          }
        }
      }

      if (!player) {
        if (typeof callback === 'function') callback({ success: false, error: 'Player session not found in this room' });
        return;
      }

      const result = roomManager.submitAnswer(code, player.sessionToken, selectedOptionIndex);

      if (result.error) {
        if (typeof callback === 'function') callback({ success: false, error: result.error });
        return;
      }

      if (typeof callback === 'function') {
        callback({ success: true, selectedOption: selectedOptionIndex });
      }

      // Live dashboard update: broadcast updated student scores and rankings to host immediately
      const updatedDashboard = roomManager.getLiveQuestionDashboard(code);
      if (updatedDashboard) {
        io.to(`host:${code}`).emit('host:live-dashboard', updatedDashboard);
      }

      // Notify host of updated answer count
      io.to(`host:${code}`).emit('host:answer-count-update', {
        answeredCount: result.totalAnswered,
        totalPlayers: result.totalPlayers
      });

      // Acknowledge answer submission to the student
      const ack = {
        questionIndex: room.currentQuestionIndex,
        selectedOption: selectedOptionIndex,
        hasAnswered: true,
        isCorrect: result.answerData?.isCorrect,
        pointsAwarded: result.answerData?.pointsAwarded
      };

      io.to(player.socketId).emit('student:answer-result', ack);
      io.to(`student:${player.sessionToken}`).emit('student:answer-result', ack);

      // If all players have answered, advance directly to next question
      if (result.allAnswered) {
        io.to(`host:${code}`).emit('host:all-players-answered', {
          totalAnswered: result.totalAnswered
        });

        setTimeout(() => {
          const r = roomManager.getRoom(code);
          if (r && r.status === 'QUESTION') {
            advanceToNextQuestionDirectly(code);
          }
        }, 300);
      }
    });

    // HOST: Reveal Answer
    socket.on('host:reveal-answer', ({ roomCode }) => {
      const code = roomCode?.trim().toUpperCase();
      advanceToNextQuestionDirectly(code);
    });

    // HOST: Show Leaderboard
    socket.on('host:show-leaderboard', ({ roomCode }) => {
      const code = roomCode?.trim().toUpperCase();
      const room = roomManager.getRoom(code);
      if (!room) return;

      room.status = 'LEADERBOARD';
      const leaderboardData = roomManager.getLeaderboard(code);
      io.to(`room:${code}`).emit('leaderboard:update', leaderboardData);
    });

    // HOST: Pause / Resume Timer
    socket.on('host:pause-timer', ({ roomCode }) => {
      const code = roomCode?.trim().toUpperCase();
      const room = roomManager.getRoom(code);
      if (!room) return;
      room.timer.isPaused = true;
      io.to(`room:${code}`).emit('question:timer-paused', { remainingSeconds: room.timer.remainingSeconds });
    });

    socket.on('host:resume-timer', ({ roomCode }) => {
      const code = roomCode?.trim().toUpperCase();
      const room = roomManager.getRoom(code);
      if (!room) return;
      room.timer.isPaused = false;
      io.to(`room:${code}`).emit('question:timer-resumed', { remainingSeconds: room.timer.remainingSeconds });
    });

    // HOST: Skip Question
    socket.on('host:skip-question', ({ roomCode }) => {
      const code = roomCode?.trim().toUpperCase();
      advanceToNextQuestionDirectly(code);
    });

    // HOST: Trigger Prize Moment
    socket.on('host:trigger-prize-moment', ({ roomCode, prizeType }) => {
      const code = roomCode?.trim().toUpperCase();
      const prizeRecord = roomManager.triggerPrizeMoment(code, prizeType);

      if (prizeRecord) {
        io.to(`room:${code}`).emit('prize:announcement', prizeRecord);
      }
    });

    // HOST: End Quiz & Winners Podium
    socket.on('host:end-quiz', async ({ roomCode }) => {
      const code = roomCode?.trim().toUpperCase();
      await triggerQuizEnd(code);
    });

    // SIMULATION: Host one-click generate N virtual students
    socket.on('host:simulate-students', ({ roomCode, count = 10 }, callback) => {
      const code = roomCode?.trim().toUpperCase();
      const room = roomManager.getRoom(code);
      if (!room) {
        if (typeof callback === 'function') callback({ success: false, error: 'Room not found' });
        return;
      }

      const numBots = Math.min(100, Math.max(1, count));
      const addedBots = [];

      for (let i = 0; i < numBots; i++) {
        const botName = BOT_NAMES[(room.players.size + i) % BOT_NAMES.length] + `_${Math.floor(Math.random() * 90 + 10)}`;
        const botAvatar = BOT_AVATARS[Math.floor(Math.random() * BOT_AVATARS.length)];
        const botToken = `bot_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`;
        const botSocketId = `virtual_sock_${botToken}`;

        const res = roomManager.joinPlayer(code, botToken, botName, botAvatar, botSocketId);
        if (res.player) {
          res.player.isBot = true;
          addedBots.push(res.player);
        }
      }

      const playerList = roomManager.getPlayerList(code);
      io.to(`room:${code}`).emit('room:player-list-update', {
        playerCount: playerList.length,
        players: playerList
      });

      if (typeof callback === 'function') {
        callback({ success: true, countAdded: addedBots.length, totalPlayers: playerList.length });
      }
    });

    // DISCONNECT
    socket.on('disconnect', () => {
      const result = roomManager.disconnectPlayer(socket.id);
      if (result) {
        const { room, player } = result;
        io.to(`room:${room.roomCode}`).emit('room:player-list-update', {
          playerCount: room.players.size,
          players: roomManager.getPlayerList(room.roomCode)
        });
      }
    });
  });
}
