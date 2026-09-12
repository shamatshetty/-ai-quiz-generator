import express from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma.js';
import notificationManager from '../notificationManager.js';
import notificationService from '../services/notificationService.js';
import roomManager from '../roomManager.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'classroom-quiz-secret-key-2026';

/**
 * Middleware to optionally or strictly extract authenticated user
 */
const getAuthUser = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

/**
 * GET /api/student/history
 * Fetch all past quiz sessions attended by this student, with score analytics and question/answer review
 */
router.get('/history', async (req, res) => {
  try {
    const authUser = getAuthUser(req);
    const queryUserId = req.query.userId;
    const querySessionToken = req.query.sessionToken;

    const targetUserId = authUser?.id || queryUserId || null;
    const targetSessionToken = querySessionToken || null;

    if (!targetUserId && !targetSessionToken) {
      return res.status(401).json({
        success: false,
        error: 'Authentication or student identifier required to view history'
      });
    }

    // Build OR condition to find sessions by userId or sessionToken
    const whereConditions = [];
    if (targetUserId) {
      whereConditions.push({ userId: targetUserId });
    }
    if (targetSessionToken) {
      whereConditions.push({ sessionToken: targetSessionToken });
    }

    const playerSessions = await prisma.playerSession.findMany({
      where: {
        OR: whereConditions
      },
      include: {
        quizSession: {
          include: {
            quiz: {
              include: {
                questions: {
                  orderBy: { orderIndex: 'asc' }
                }
              }
            }
          }
        },
        answers: {
          include: {
            question: true
          }
        }
      },
      orderBy: {
        joinedAt: 'desc'
      }
    });

    let totalQuizzesAttended = playerSessions.length;
    let totalQuestionsAnswered = 0;
    let totalCorrectAnswers = 0;
    let totalPointsWon = 0;

    const formattedHistory = playerSessions.map((ps) => {
      const quiz = ps.quizSession?.quiz;
      const allQuestions = quiz?.questions || [];
      const answersMap = new Map();

      (ps.answers || []).forEach((ans) => {
        answersMap.set(ans.questionId, ans);
      });

      let quizCorrectCount = 0;
      let quizIncorrectCount = 0;
      let quizUnansweredCount = 0;

      const questionsReview = allQuestions.map((q, idx) => {
        const studentAns = answersMap.get(q.id);
        const optionsArr = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;

        const isAnswered = studentAns !== undefined && studentAns !== null;
        const selectedOption = isAnswered ? studentAns.selectedOption : -1;
        const isCorrect = isAnswered ? studentAns.isCorrect : false;
        const points = isAnswered ? studentAns.pointsAwarded : 0;

        if (isCorrect) {
          quizCorrectCount++;
        } else if (isAnswered && selectedOption !== -1) {
          quizIncorrectCount++;
        } else {
          quizUnansweredCount++;
        }

        return {
          questionId: q.id,
          orderIndex: idx,
          text: q.text,
          options: optionsArr,
          correctOptionIndex: q.correctOptionIndex,
          selectedOption,
          isCorrect,
          isAnswered,
          pointsAwarded: points,
          timeTakenMs: studentAns?.timeTakenMs || 0,
          explanation: q.explanation || ''
        };
      });

      const totalQuizQuestions = allQuestions.length;
      const accuracyPercentage = totalQuizQuestions > 0
        ? Math.round((quizCorrectCount / totalQuizQuestions) * 100)
        : 0;

      let masteryLevel = 'Developing';
      let performanceBadge = 'Needs Improvement';
      if (accuracyPercentage >= 80) {
        masteryLevel = 'Mastery';
        performanceBadge = 'Excellent';
      } else if (accuracyPercentage >= 60) {
        masteryLevel = 'Proficient';
        performanceBadge = 'Good';
      }

      // Calculate total time taken in seconds for this quiz
      const totalTimeMs = questionsReview.reduce((acc, q) => acc + (q.timeTakenMs || 0), 0);
      const totalSeconds = Math.max(Math.round(totalTimeMs / 1000), totalQuizQuestions * 12); // Realistic fallback if timeTakenMs wasn't recorded
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const timeTakenFormatted = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

      totalQuestionsAnswered += (quizCorrectCount + quizIncorrectCount);
      totalCorrectAnswers += quizCorrectCount;
      totalPointsWon += ps.score;

      return {
        playerSessionId: ps.id,
        quizSessionId: ps.quizSessionId,
        roomCode: ps.quizSession?.roomCode || 'UNKNOWN',
        quizTitle: quiz?.title || 'Classroom Quiz',
        subject: quiz?.subject || 'General',
        description: quiz?.description || '',
        score: ps.score,
        totalQuestions: totalQuizQuestions,
        correctCount: quizCorrectCount,
        incorrectCount: quizIncorrectCount,
        unansweredCount: quizUnansweredCount,
        accuracyPercentage,
        masteryLevel,
        performanceBadge,
        passFail: accuracyPercentage >= 60 ? 'PASS' : 'FAIL',
        timeTaken: timeTakenFormatted,
        timeTakenMs: totalTimeMs,
        rank: ps.rank || 1,
        streak: ps.streak || 1,
        attendedAt: ps.joinedAt,
        questions: questionsReview
      };
    });

    const overallAccuracy = totalQuestionsAnswered > 0
      ? Math.round((totalCorrectAnswers / totalQuestionsAnswered) * 100)
      : 0;

    res.json({
      success: true,
      stats: {
        totalQuizzesAttended,
        totalQuestionsAnswered,
        totalCorrectAnswers,
        overallAccuracy,
        totalPointsWon
      },
      history: formattedHistory
    });
  } catch (err) {
    console.error('Error fetching student history:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/student/leaderboard
 * Fetch class leaderboard with registered students who took quizzes.
 * Strictly includes only registered students with completed quizzes - no random names.
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const authUser = getAuthUser(req);
    const queryUserId = req.query.userId;
    const targetUserId = authUser?.id || queryUserId || null;

    // Fetch all registered student users from DB along with their player sessions and answers
    const studentUsers = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: {
        playerSessions: {
          include: {
            answers: {
              select: { isCorrect: true }
            }
          }
        }
      }
    });

    const leaderboardList = [];

    // Include ONLY registered students who have actually taken quizzes (sessions.length > 0)
    studentUsers.forEach((stu) => {
      const sessions = stu.playerSessions || [];
      if (sessions.length === 0) return; // Must have taken quizzes

      let totalScore = 0;
      let highestStreak = 0;
      let totalAns = 0;
      let correctAns = 0;

      sessions.forEach((ps) => {
        if (ps.streak && ps.streak > highestStreak) {
          highestStreak = ps.streak;
        }
        if (ps.answers && ps.answers.length > 0) {
          ps.answers.forEach((ans) => {
            totalAns++;
            if (ans.isCorrect) correctAns++;
          });
        } else {
          // If answers array is empty, session score represents the correct answers count (+1 mark each)
          correctAns += Number(ps.score) || 0;
          totalAns += Math.max(1, Number(ps.score) || 0);
        }
      });

      // Strict +1 mark for each correct answer
      totalScore = correctAns;

      const accuracy = totalAns > 0 ? Math.round((correctAns / totalAns) * 100) : 0;

      leaderboardList.push({
        id: stu.id,
        name: stu.name,
        avatar: stu.avatar || '🎓',
        score: totalScore,
        quizzesPlayed: sessions.length,
        accuracy,
        streak: highestStreak,
        isCurrentUser: targetUserId === stu.id
      });
    });

    // Sort descending by score, then accuracy, then quizzes played
    leaderboardList.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      return b.quizzesPlayed - a.quizzesPlayed;
    });

    // Assign ranks (1, 2, 3...) to all registered students who took quizzes
    const fullRankedLeaderboard = leaderboardList.map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));

    // Find requesting student's entry across the entire ranked student cohort
    let currentUserEntry = fullRankedLeaderboard.find((item) => item.isCurrentUser) || null;

    // If requesting user is registered but hasn't taken any quiz yet, return real user details with 0 stats and unranked
    if (!currentUserEntry && targetUserId) {
      const targetUser = studentUsers.find((u) => u.id === targetUserId) || await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, name: true, avatar: true }
      });

      if (targetUser) {
        currentUserEntry = {
          id: targetUser.id,
          name: targetUser.name || authUser?.name || 'You',
          avatar: targetUser.avatar || authUser?.avatar || '🎓',
          score: 0,
          quizzesPlayed: 0,
          accuracy: 0,
          streak: 0,
          rank: null,
          isCurrentUser: true
        };
      }
    }

    // Strictly restrict the public leaderboard to only the first 10 rank holders
    const leaderboard = fullRankedLeaderboard.slice(0, 10);

    res.json({
      success: true,
      leaderboard,
      currentUser: currentUserEntry
    });
  } catch (err) {
    console.error('Error fetching student leaderboard:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/student/notifications
 * Fetch classroom notifications for student dashboard (PostgreSQL + active room status)
 */
router.get('/notifications', async (req, res) => {
  try {
    const notifications = await notificationService.getNotifications({ roomManager });
    res.json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/student/notifications/read-all
 * Mark all notifications as read
 */
router.post('/notifications/read-all', async (req, res) => {
  try {
    const notifications = await notificationService.markAllAsRead();
    res.json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/student/notifications/clear
 * Clear all notifications
 */
router.post('/notifications/clear', async (req, res) => {
  try {
    const notifications = await notificationService.clearNotifications();
    res.json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/student/practice-session
 * Record student's completed solo / online practice quiz session into the database
 */
router.post('/practice-session', async (req, res) => {
  try {
    const authUser = getAuthUser(req);
    const {
      subject = 'General Knowledge',
      quizTitle = 'Online Practice Quiz',
      difficulty = 'medium',
      questions = [],
      answers = [],
      score = 0,
      accuracy = 0,
      userId = null,
      sessionToken = null
    } = req.body;

    const targetUserId = authUser?.id || userId || null;
    const targetSessionToken = sessionToken || (targetUserId ? `user_token_${targetUserId}` : `solo_${Date.now()}`);

    // 1. Find or create Quiz record for this subject
    let quiz = await prisma.quiz.findFirst({
      where: { title: quizTitle, subject }
    });

    if (!quiz) {
      quiz = await prisma.quiz.create({
        data: {
          title: quizTitle,
          subject,
          description: `Self-paced online practice quiz on ${subject} (${difficulty} level).`,
          defaultTimeLimit: 20,
          authorId: targetUserId,
          questions: {
            create: questions.map((q, idx) => ({
              text: q.text,
              options: JSON.stringify(q.options),
              correctOptionIndex: q.correctOptionIndex || 0,
              timeLimit: q.timeLimit || 20,
              explanation: q.explanation || '',
              orderIndex: idx
            }))
          }
        },
        include: { questions: true }
      });
    }

    // 2. Create QuizSession for this practice attempt
    const roomCode = `ONL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const quizSession = await prisma.quizSession.create({
      data: {
        roomCode,
        quizId: quiz.id,
        status: 'ENDED',
        currentQuestionIndex: questions.length,
        startedAt: new Date(Date.now() - 60000),
        endedAt: new Date()
      }
    });

    // 3. Create PlayerSession
    let playerName = authUser?.name;
    let playerAvatar = authUser?.avatar;

    if ((!playerName || !playerAvatar) && targetUserId) {
      const dbUser = await prisma.user.findUnique({ where: { id: targetUserId } });
      if (dbUser) {
        if (!playerName) playerName = dbUser.name;
        if (!playerAvatar) playerAvatar = dbUser.avatar;
      }
    }

    // Calculate total score strictly as +1 mark per correct answer
    const correctAnswersCount = answers.filter((a) => Boolean(a.isCorrect)).length;
    let maxConsecutiveStreak = 0;
    let curStreak = 0;
    answers.forEach((a) => {
      if (a.isCorrect) {
        curStreak++;
        if (curStreak > maxConsecutiveStreak) maxConsecutiveStreak = curStreak;
      } else {
        curStreak = 0;
      }
    });

    const playerSession = await prisma.playerSession.create({
      data: {
        sessionToken: targetSessionToken,
        userId: targetUserId,
        name: playerName || 'Self-Paced Learner',
        avatar: playerAvatar || '🚀',
        quizSessionId: quizSession.id,
        score: correctAnswersCount, // Strictly +1 mark per correct answer
        streak: maxConsecutiveStreak,
        rank: 1
      }
    });

    // 4. Save Answer records
    const createdQuestions = await prisma.question.findMany({
      where: { quizId: quiz.id },
      orderBy: { orderIndex: 'asc' }
    });

    for (const ans of answers) {
      const q = createdQuestions[ans.questionIndex] || createdQuestions[0];
      if (q) {
        await prisma.answerRecord.create({
          data: {
            quizSessionId: quizSession.id,
            questionId: q.id,
            playerSessionId: playerSession.id,
            selectedOption: ans.selectedOption !== undefined ? ans.selectedOption : 0,
            isCorrect: Boolean(ans.isCorrect),
            timeTakenMs: Number(ans.timeTakenMs) || 1200,
            pointsAwarded: ans.isCorrect ? 1 : 0
          }
        });
      }
    }

    res.json({
      success: true,
      message: 'Practice session recorded successfully',
      playerSessionId: playerSession.id,
      roomCode
    });
  } catch (err) {
    console.error('Error saving practice session:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

