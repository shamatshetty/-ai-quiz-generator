import { customAlphabet } from 'nanoid';
import prisma from './prisma.js';

// Safe 6-character room codes (no ambiguous 0/O, 1/I)
const generateCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);

/**
 * Fisher-Yates shuffle returning a randomized copy of an array
 */
function shuffleArray(arr) {
  const array = [...arr];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Randomize question options while tracking the new correctOptionIndex with 100% accuracy
 */
function shuffleQuestionOptions(q) {
  const optionsArr = Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]');
  const originalCorrectIndex = Math.max(0, Math.min(optionsArr.length - 1, parseInt(q.correctOptionIndex, 10) || 0));

  const indexed = optionsArr.map((text, idx) => ({
    text,
    isCorrect: idx === originalCorrectIndex
  }));

  const shuffled = shuffleArray(indexed);
  const newCorrectIndex = shuffled.findIndex(item => item.isCorrect);

  return {
    ...q,
    options: shuffled.map(item => item.text),
    correctOptionIndex: newCorrectIndex >= 0 ? newCorrectIndex : 0
  };
}

class RoomManager {
  constructor() {
    /** @type {Map<string, Object>} */
    this.rooms = new Map();
  }

  /**
   * Create a new room with given host socket ID and quiz, with random question & option support
   */
  createRoom(hostSocketId, quiz, config = {}) {
    let roomCode = generateCode();
    while (this.rooms.has(roomCode)) {
      roomCode = generateCode();
    }

    // 1. Parse raw questions
    let parsedQuestions = quiz.questions.map((q, idx) => ({
      id: q.id || `q-${idx}`,
      text: q.text,
      options: Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]'),
      correctOptionIndex: Math.max(0, Math.min(3, parseInt(q.correctOptionIndex, 10) || 0)),
      timeLimit: q.timeLimit || quiz.defaultTimeLimit || 20,
      explanation: q.explanation || '',
      orderIndex: idx
    }));

    // 2. Feature: RANDOM OPTIONS (default active: shuffles 4 options per question & tracks correct index)
    if (config.randomizeOptions !== false) {
      parsedQuestions = parsedQuestions.map(q => shuffleQuestionOptions(q));
    }

    // 3. Feature: RANDOM QUESTIONS (default active: shuffles question sequence)
    if (config.randomizeQuestions !== false && parsedQuestions.length > 1) {
      parsedQuestions = shuffleArray(parsedQuestions);
    }

    // 4. Renumber orderIndex sequentially for clean display
    parsedQuestions = parsedQuestions.map((q, idx) => ({
      ...q,
      orderIndex: idx
    }));

    const room = {
      roomCode,
      hostSocketId,
      assessmentFeatures: {
        randomQuestions: config.randomizeQuestions !== false,
        randomOptions: config.randomizeOptions !== false,
        autoSaveAnswer: true,
        oneAttemptRestriction: true,
        autoSubmit: true,
        automaticEvaluation: true
      },
      quiz: {
        id: quiz.id || null,
        title: quiz.title,
        subject: quiz.subject || 'General',
        description: quiz.description || '',
        defaultTimeLimit: quiz.defaultTimeLimit || 20,
        questions: parsedQuestions
      },
      status: 'LOBBY', // 'LOBBY' | 'QUESTION' | 'REVEAL' | 'LEADERBOARD' | 'PRIZE' | 'PODIUM'
      currentQuestionIndex: -1,
      timer: {
        interval: null,
        remainingSeconds: 0,
        totalSeconds: 0,
        questionStartTime: 0,
        isPaused: false
      },
      players: new Map(), // sessionToken -> Player
      questionAnswers: new Map(), // questionIndex -> Map(sessionToken, Answer)
      prizeHistory: [],
      createdAt: Date.now()
    };

    this.rooms.set(roomCode, room);
    return room;
  }

  getRoom(roomCode) {
    return this.rooms.get(roomCode?.toUpperCase());
  }

  /**
   * Add or reconnect a player by sessionToken
   */
  joinPlayer(roomCode, sessionToken, name, avatar, socketId, userId = null) {
    const room = this.getRoom(roomCode);
    if (!room) return { error: 'Room not found. Please check the code.' };

    let player = room.players.get(sessionToken);

    if (player) {
      // Reconnect existing player
      player.socketId = socketId;
      player.connected = true;
      if (name) player.name = name;
      if (avatar) player.avatar = avatar;
      if (userId) player.userId = userId;
    } else {
      // New player
      player = {
        sessionToken,
        userId: userId || null,
        socketId,
        name: (name || 'Anonymous').trim().slice(0, 24),
        avatar: avatar || '🦊',
        score: 0,
        streak: 0,
        rank: room.players.size + 1,
        prevRank: room.players.size + 1,
        lastPoints: 0,
        lastIsCorrect: false,
        connected: true,
        joinedAt: Date.now()
      };
      room.players.set(sessionToken, player);
    }

    return { room, player };
  }

  /**
   * Handle player disconnect (does not delete player, marks disconnected)
   */
  disconnectPlayer(socketId) {
    for (const room of this.rooms.values()) {
      for (const player of room.players.values()) {
        if (player.socketId === socketId) {
          player.connected = false;
          return { room, player };
        }
      }
    }
    return null;
  }

  /**
   * Get public player list
   */
  getPlayerList(roomCode) {
    const room = this.getRoom(roomCode);
    if (!room) return [];
    return Array.from(room.players.values()).map(p => ({
      sessionToken: p.sessionToken,
      name: p.name,
      avatar: p.avatar,
      score: p.score,
      streak: p.streak,
      rank: p.rank,
      connected: p.connected
    }));
  }

  /**
   * Start quiz
   */
  startQuiz(roomCode) {
    const room = this.getRoom(roomCode);
    if (!room) return null;
    room.status = 'QUESTION';
    room.currentQuestionIndex = 0;
    return room;
  }

  /**
   * Setup next question state
   */
  prepareQuestion(roomCode, index = null) {
    const room = this.getRoom(roomCode);
    if (!room) return null;

    if (index !== null) {
      room.currentQuestionIndex = index;
    }

    const question = room.quiz.questions[room.currentQuestionIndex];
    if (!question) {
      room.status = 'PODIUM';
      return null;
    }

    room.status = 'QUESTION';
    const timeLimit = question.timeLimit || 20;

    // Clear previous timer if any
    if (room.timer.interval) {
      clearInterval(room.timer.interval);
    }

    room.timer = {
      interval: null,
      remainingSeconds: timeLimit,
      totalSeconds: timeLimit,
      questionStartTime: Date.now(),
      isPaused: false
    };

    if (!room.questionAnswers.has(room.currentQuestionIndex)) {
      room.questionAnswers.set(room.currentQuestionIndex, new Map());
    }

    return {
      questionIndex: room.currentQuestionIndex,
      totalQuestions: room.quiz.questions.length,
      timeLimit,
      question: {
        text: question.text,
        options: question.options,
        orderIndex: room.currentQuestionIndex,
        timeLimit
      },
      // Keep correct option secret from student clients
      correctOptionIndex: question.correctOptionIndex,
      explanation: question.explanation
    };
  }

  /**
   * Process answer submission
   */
  submitAnswer(roomCode, sessionToken, optionIndex) {
    const room = this.getRoom(roomCode);
    if (!room) return { error: 'Room not found' };
    if (room.status !== 'QUESTION') return { error: 'Answers are locked' };

    const player = room.players.get(sessionToken);
    if (!player) return { error: 'Player not found in room' };

    const currentAnswers = room.questionAnswers.get(room.currentQuestionIndex);
    // Feature: ONE ATTEMPT RESTRICTION (Strictly prevents duplicate or altered submissions)
    if (currentAnswers && currentAnswers.has(sessionToken)) {
      return {
        error: 'One attempt restriction: You have already submitted an answer for this question',
        alreadyAnswered: true
      };
    }

    const currentQuestion = room.quiz.questions[room.currentQuestionIndex];
    if (!currentQuestion) return { error: 'Question not found' };

    const now = Date.now();
    const timeTakenMs = Math.max(50, now - room.timer.questionStartTime);
    const timeLimitMs = (currentQuestion.timeLimit || 20) * 1000;

    // Feature: AUTOMATIC EVALUATION (+1 for exact correct option, 0 for wrong/unanswered)
    const isCorrect = Number(optionIndex) === Number(currentQuestion.correctOptionIndex);
    const pointsAwarded = isCorrect ? 1 : 0;

    if (isCorrect) {
      player.streak = (player.streak || 0) + 1;
    } else {
      player.streak = 0;
    }

    player.score += pointsAwarded;
    player.lastPoints = pointsAwarded;
    player.lastIsCorrect = isCorrect;

    // Feature: AUTO-SAVE ANSWER (Stored in server memory instantly)
    const answerData = {
      sessionToken,
      playerName: player.name,
      selectedOption: Number(optionIndex),
      isCorrect,
      timeTakenMs,
      pointsAwarded,
      answeredAt: now,
      isAutoSaved: true
    };

    currentAnswers.set(sessionToken, answerData);

    const totalAnswered = currentAnswers.size;
    const totalPlayers = room.players.size;

    return {
      success: true,
      answerData,
      totalAnswered,
      totalPlayers,
      allAnswered: totalAnswered >= totalPlayers
    };
  }

  /**
   * Feature: AUTO SUBMIT ON TIMEOUT
   * Automatically records timeout response (-1) for any player who didn't submit before time expired
   */
  autoSubmitTimeouts(roomCode) {
    const room = this.getRoom(roomCode);
    if (!room || room.status !== 'QUESTION') return [];

    const currentAnswers = room.questionAnswers.get(room.currentQuestionIndex);
    if (!currentAnswers) return [];

    const currentQuestion = room.quiz.questions[room.currentQuestionIndex];
    if (!currentQuestion) return [];

    const timedOutPlayers = [];
    const now = Date.now();

    for (const [sessionToken, player] of room.players.entries()) {
      if (!currentAnswers.has(sessionToken)) {
        // Player did not answer before timer expired - auto-submit timeout
        const timeoutRecord = {
          sessionToken,
          playerName: player.name,
          selectedOption: -1, // -1 denotes timeout/unanswered
          isCorrect: false,
          timeTakenMs: (currentQuestion.timeLimit || 20) * 1000,
          pointsAwarded: 0,
          answeredAt: now,
          isAutoSubmitted: true
        };

        player.streak = 0;
        player.lastPoints = 0;
        player.lastIsCorrect = false;

        currentAnswers.set(sessionToken, timeoutRecord);
        timedOutPlayers.push({ sessionToken, player, timeoutRecord });
      }
    }

    return timedOutPlayers;
  }

  /**
   * Reveal question answer & compute stats
   */
  revealAnswer(roomCode) {
    const room = this.getRoom(roomCode);
    if (!room) return null;

    if (room.timer.interval) {
      clearInterval(room.timer.interval);
      room.timer.interval = null;
    }

    room.status = 'REVEAL';

    const currentQuestion = room.quiz.questions[room.currentQuestionIndex];
    const currentAnswers = room.questionAnswers.get(room.currentQuestionIndex) || new Map();

    const optionCounts = [0, 0, 0, 0];
    let correctCount = 0;
    let totalTime = 0;

    for (const ans of currentAnswers.values()) {
      if (ans.selectedOption >= 0 && ans.selectedOption < 4) {
        optionCounts[ans.selectedOption]++;
      }
      if (ans.isCorrect) correctCount++;
      totalTime += ans.timeTakenMs;
    }

    const totalAnswers = currentAnswers.size;
    const accuracy = totalAnswers > 0 ? Math.round((correctCount / totalAnswers) * 100) : 0;
    const averageTimeMs = totalAnswers > 0 ? Math.round(totalTime / totalAnswers) : 0;

    // Recalculate ranks
    this.updateLeaderboardRanks(room);

    return {
      questionIndex: room.currentQuestionIndex,
      correctOptionIndex: currentQuestion.correctOptionIndex,
      explanation: currentQuestion.explanation,
      stats: {
        totalAnswers,
        totalPlayers: room.players.size,
        optionCounts,
        correctCount,
        accuracy,
        averageTimeMs
      }
    };
  }

  /**
   * Sort players, assign ranks, and track rank differences
   */
  updateLeaderboardRanks(room) {
    const sorted = Array.from(room.players.values()).sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.streak - a.streak;
    });

    sorted.forEach((player, idx) => {
      player.prevRank = player.rank;
      player.rank = idx + 1;
    });

    return sorted;
  }

  /**
   * Get live leaderboard data
   */
  getLeaderboard(roomCode) {
    const room = this.getRoom(roomCode);
    if (!room) return null;

    const rankedPlayers = this.updateLeaderboardRanks(room);

    const topPlayers = rankedPlayers.slice(0, 10).map(p => ({
      sessionToken: p.sessionToken,
      name: p.name,
      avatar: p.avatar,
      score: p.score,
      rank: p.rank,
      prevRank: p.prevRank,
      diff: p.prevRank - p.rank, // positive means moved up
      streak: p.streak,
      lastPoints: p.lastPoints,
      lastIsCorrect: p.lastIsCorrect
    }));

    return {
      currentQuestionIndex: room.currentQuestionIndex,
      totalQuestions: room.quiz.questions.length,
      topPlayers,
      totalPlayers: room.players.size
    };
  }

  /**
   * Live dashboard data for the teacher showing all students ranked by score descending
   * along with their real-time answering status on the current question
   */
  getLiveQuestionDashboard(roomCode) {
    const room = this.getRoom(roomCode);
    if (!room) return null;

    // Recalculate ranks based on total score descending
    const rankedPlayers = this.updateLeaderboardRanks(room);

    const currentAnswers = room.questionAnswers.get(room.currentQuestionIndex) || new Map();
    const currentQ = room.quiz.questions[room.currentQuestionIndex];

    let correctCount = 0;
    let totalTimeTaken = 0;
    let answeredTimeCount = 0;

    const students = rankedPlayers.map((player) => {
      const ans = currentAnswers.get(player.sessionToken);
      const hasAnswered = !!ans;
      if (ans && ans.isCorrect) correctCount++;
      if (ans && ans.timeTakenMs) {
        totalTimeTaken += ans.timeTakenMs;
        answeredTimeCount++;
      }

      return {
        sessionToken: player.sessionToken,
        name: player.name,
        avatar: player.avatar,
        score: player.score,
        rank: player.rank,
        prevRank: player.prevRank || player.rank,
        diff: (player.prevRank || player.rank) - player.rank,
        streak: player.streak || 0,
        isBot: !!player.isBot,
        connected: player.connected !== false,
        hasAnswered,
        isCorrect: hasAnswered ? !!ans.isCorrect : null,
        pointsAwarded: hasAnswered ? (ans.pointsAwarded || 0) : 0,
        selectedOption: hasAnswered ? ans.selectedOption : null,
        timeTakenMs: hasAnswered ? ans.timeTakenMs : null,
        isAutoSubmitted: hasAnswered ? !!ans.isAutoSubmitted : false
      };
    });

    const totalAnswered = currentAnswers.size;
    const totalPlayers = room.players.size;
    const avgTimeMs = answeredTimeCount > 0 ? Math.round(totalTimeTaken / answeredTimeCount) : 0;
    const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

    return {
      roomCode: room.roomCode,
      currentQuestionIndex: room.currentQuestionIndex,
      totalQuestions: room.quiz.questions.length,
      questionText: currentQ ? currentQ.text : '',
      timeLimit: currentQ ? (currentQ.timeLimit || 20) : 20,
      correctOptionIndex: currentQ ? currentQ.correctOptionIndex : 0,
      correctOptionText: (currentQ && currentQ.options) ? currentQ.options[currentQ.correctOptionIndex] : '',
      explanation: currentQ ? (currentQ.explanation || '') : '',
      totalPlayers,
      totalAnswered,
      allAnswered: totalPlayers > 0 && totalAnswered >= totalPlayers,
      correctCount,
      accuracy,
      averageTimeMs: avgTimeMs,
      students
    };
  }

  /**
   * Trigger prize moment mid-quiz
   * @param {string} roomCode
   * @param {'current_leader'|'most_improved'|'lucky_draw'} prizeType
   */
  triggerPrizeMoment(roomCode, prizeType = 'current_leader') {
    const room = this.getRoom(roomCode);
    if (!room) return null;

    room.status = 'PRIZE';
    const playersList = Array.from(room.players.values());
    if (playersList.length === 0) return null;

    let winner = null;
    let reason = '';

    if (prizeType === 'current_leader') {
      const sorted = [...playersList].sort((a, b) => b.score - a.score);
      winner = sorted[0];
      reason = `Leading the board with ${winner.score.toLocaleString()} points!`;
    } else if (prizeType === 'most_improved') {
      // Find player with highest rank climb or highest active streak
      const sortedByStreak = [...playersList].sort((a, b) => {
        const diffA = a.prevRank - a.rank;
        const diffB = b.prevRank - b.rank;
        if (diffB !== diffA) return diffB - diffA;
        return b.streak - a.streak;
      });
      winner = sortedByStreak[0] || playersList[0];
      reason = winner.streak > 1 
        ? `On an impressive fire streak of ${winner.streak} in a row!`
        : `Biggest leaderboard climber this round!`;
    } else {
      // 'lucky_draw': Pick randomly among players who got the current question right, or any player
      const currentAnswers = room.questionAnswers.get(room.currentQuestionIndex);
      const correctPlayers = [];
      if (currentAnswers) {
        for (const ans of currentAnswers.values()) {
          if (ans.isCorrect) {
            const p = room.players.get(ans.sessionToken);
            if (p) correctPlayers.push(p);
          }
        }
      }

      const pool = correctPlayers.length > 0 ? correctPlayers : playersList;
      winner = pool[Math.floor(Math.random() * pool.length)];
      reason = correctPlayers.length > 0 
        ? `Lucky draw selected from correct answers on this question!`
        : `Mystery random classroom prize winner!`;
    }

    const prizeRecord = {
      prizeType,
      winner: {
        name: winner.name,
        avatar: winner.avatar,
        score: winner.score,
        rank: winner.rank,
        reason
      },
      questionIndex: room.currentQuestionIndex,
      timestamp: Date.now()
    };

    room.prizeHistory.push(prizeRecord);
    return prizeRecord;
  }

  /**
   * Finalize quiz and prepare podium
   */
  async endQuiz(roomCode) {
    const room = this.getRoom(roomCode);
    if (!room) return null;

    if (room.timer.interval) {
      clearInterval(room.timer.interval);
      room.timer.interval = null;
    }

    room.status = 'PODIUM';
    const rankedPlayers = this.updateLeaderboardRanks(room);

    const podium = {
      first: rankedPlayers[0] ? { name: rankedPlayers[0].name, avatar: rankedPlayers[0].avatar, score: rankedPlayers[0].score } : null,
      second: rankedPlayers[1] ? { name: rankedPlayers[1].name, avatar: rankedPlayers[1].avatar, score: rankedPlayers[1].score } : null,
      third: rankedPlayers[2] ? { name: rankedPlayers[2].name, avatar: rankedPlayers[2].avatar, score: rankedPlayers[2].score } : null
    };

    const fullLeaderboard = rankedPlayers.map(p => ({
      rank: p.rank,
      name: p.name,
      avatar: p.avatar,
      score: p.score,
      streak: p.streak
    }));

    const questionsReview = room.quiz.questions.map((q, idx) => ({
      orderIndex: idx,
      text: q.text,
      options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
      correctOptionIndex: q.correctOptionIndex,
      explanation: q.explanation || ''
    }));

    // Generate individual student reviews
    const playerReviews = {};
    for (const player of room.players.values()) {
      let correctCount = 0;
      let incorrectCount = 0;
      let unansweredCount = 0;

      const playerAnswers = questionsReview.map((q) => {
        const answersMap = room.questionAnswers.get(q.orderIndex);
        const ans = answersMap ? answersMap.get(player.sessionToken) : null;
        if (!ans) {
          unansweredCount++;
          return {
            questionIndex: q.orderIndex,
            selectedOption: null,
            isCorrect: false,
            correctOptionIndex: q.correctOptionIndex,
            pointsAwarded: 0
          };
        }

        if (ans.isCorrect) correctCount++;
        else incorrectCount++;

        return {
          questionIndex: q.orderIndex,
          selectedOption: ans.selectedOption,
          isCorrect: ans.isCorrect,
          correctOptionIndex: q.correctOptionIndex,
          pointsAwarded: ans.pointsAwarded
        };
      });

      const totalQuestions = questionsReview.length;
      const accuracyPercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

      let masteryLevel = 'Developing';
      if (accuracyPercentage >= 90) masteryLevel = 'Mastery';
      else if (accuracyPercentage >= 70) masteryLevel = 'Proficient';

      playerReviews[player.sessionToken] = {
        name: player.name,
        avatar: player.avatar,
        score: player.score,
        totalQuestions,
        correctCount,
        incorrectCount,
        unansweredCount,
        accuracyPercentage,
        masteryLevel,
        answers: playerAnswers
      };
    }

    // Classroom-wide score analysis for host
    const totalStudents = room.players.size;
    let totalScoreSum = 0;
    rankedPlayers.forEach(p => { totalScoreSum += p.score; });
    const averageScore = totalStudents > 0 ? Number((totalScoreSum / totalStudents).toFixed(1)) : 0;
    const averageAccuracy = (totalStudents > 0 && questionsReview.length > 0)
      ? Math.round((totalScoreSum / (totalStudents * questionsReview.length)) * 100)
      : 0;

    const questionStats = questionsReview.map((q) => {
      const answersMap = room.questionAnswers.get(q.orderIndex) || new Map();
      const optionDistribution = [0, 0, 0, 0];
      let correctCount = 0;

      for (const ans of answersMap.values()) {
        if (ans.selectedOption !== null && ans.selectedOption !== undefined) {
          optionDistribution[ans.selectedOption] = (optionDistribution[ans.selectedOption] || 0) + 1;
        }
        if (ans.isCorrect) correctCount++;
      }

      const totalAnswered = answersMap.size;
      const accuracyRate = totalStudents > 0 ? Math.round((correctCount / totalStudents) * 100) : 0;

      return {
        questionIndex: q.orderIndex,
        text: q.text,
        correctOptionIndex: q.correctOptionIndex,
        totalAnswered,
        correctCount,
        accuracyRate,
        optionDistribution
      };
    });

    let hardestQuestion = null;
    let easiestQuestion = null;
    if (questionStats.length > 0) {
      const sorted = [...questionStats].sort((a, b) => a.accuracyRate - b.accuracyRate);
      hardestQuestion = sorted[0];
      easiestQuestion = sorted[sorted.length - 1];
    }

    const scoreAnalysis = {
      totalQuestions: questionsReview.length,
      totalStudents,
      averageScore,
      averageAccuracy,
      highestScore: rankedPlayers[0] ? rankedPlayers[0].score : 0,
      lowestScore: rankedPlayers[rankedPlayers.length - 1] ? rankedPlayers[rankedPlayers.length - 1].score : 0,
      hardestQuestion,
      easiestQuestion,
      questionStats
    };

    // Async persist to SQLite via Prisma in the background
    this.persistQuizSession(room).catch(err => {
      console.error('Failed to persist session to database:', err.message);
    });

    return {
      roomCode,
      quizTitle: room.quiz.title,
      totalPlayers: rankedPlayers.length,
      totalQuestions: questionsReview.length,
      podium,
      fullLeaderboard,
      questions: questionsReview,
      playerReviews,
      scoreAnalysis
    };
  }

  /**
   * Persist completed session to database
   */
  async persistQuizSession(room) {
    if (!room.quiz.id) return; // Custom in-memory only quiz

    try {
      const session = await prisma.quizSession.create({
        data: {
          roomCode: room.roomCode,
          quizId: room.quiz.id,
          status: 'ENDED',
          currentQuestionIndex: room.currentQuestionIndex,
          endedAt: new Date()
        }
      });

      for (const player of room.players.values()) {
        const playerRec = await prisma.playerSession.create({
          data: {
            sessionToken: player.sessionToken,
            userId: player.userId || null,
            name: player.name,
            avatar: player.avatar,
            quizSessionId: session.id,
            score: player.score,
            streak: player.streak,
            rank: player.rank
          }
        });

        // Persist answers
        for (const [qIdx, answersMap] of room.questionAnswers.entries()) {
          const ans = answersMap.get(player.sessionToken);
          const q = room.quiz.questions[qIdx];
          if (ans && q && q.id) {
            await prisma.answerRecord.create({
              data: {
                quizSessionId: session.id,
                questionId: q.id,
                playerSessionId: playerRec.id,
                selectedOption: ans.selectedOption,
                isCorrect: ans.isCorrect,
                timeTakenMs: ans.timeTakenMs,
                pointsAwarded: ans.pointsAwarded
              }
            });
          }
        }
      }
      console.log(`💾 Quiz session ${room.roomCode} saved to database.`);
    } catch (err) {
      console.error('Database persistence error:', err);
    }
  }

  /**
   * Generate CSV report data for host
   */
  getCSVReportData(roomCode) {
    const room = this.getRoom(roomCode);
    if (!room) return null;

    const rankedPlayers = this.updateLeaderboardRanks(room);
    const questions = room.quiz.questions;

    const records = rankedPlayers.map(p => {
      let correctCount = 0;
      let totalTime = 0;

      const questionCols = {};
      questions.forEach((q, idx) => {
        const ans = room.questionAnswers.get(idx)?.get(p.sessionToken);
        if (ans) {
          if (ans.isCorrect) correctCount++;
          totalTime += ans.timeTakenMs;
          questionCols[`Q${idx + 1}_Correct`] = ans.isCorrect ? 'YES' : 'NO';
          questionCols[`Q${idx + 1}_Time_s`] = (ans.timeTakenMs / 1000).toFixed(2);
          questionCols[`Q${idx + 1}_Points`] = ans.pointsAwarded;
        } else {
          questionCols[`Q${idx + 1}_Correct`] = 'NO_ANSWER';
          questionCols[`Q${idx + 1}_Time_s`] = '0';
          questionCols[`Q${idx + 1}_Points`] = 0;
        }
      });

      const accuracyPct = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
      const avgTimeSec = questions.length > 0 ? (totalTime / questions.length / 1000).toFixed(2) : 0;

      return {
        Rank: p.rank,
        Name: p.name,
        Final_Score: p.score,
        Max_Streak: p.streak,
        Accuracy_Pct: `${accuracyPct}%`,
        Avg_Response_Time_s: avgTimeSec,
        ...questionCols
      };
    });

    return {
      quizTitle: room.quiz.title,
      roomCode: room.roomCode,
      records
    };
  }
}

export default new RoomManager();
