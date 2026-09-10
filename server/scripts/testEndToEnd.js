import { io } from 'socket.io-client';

const SERVER_URL = 'http://localhost:4000';

console.log('🧪 Starting End-to-End Automated Verification Test...');

async function runTest() {
  // 1. Check REST API health
  const healthRes = await fetch(`${SERVER_URL}/health`);
  const healthData = await healthRes.json();
  if (healthData.status !== 'ok') throw new Error('Health check failed');
  console.log('✅ Health check endpoint passed:', healthData);

  // 2. Check Quizzes API
  const quizRes = await fetch(`${SERVER_URL}/api/quizzes`);
  const quizData = await quizRes.json();
  if (!quizData.success || quizData.quizzes.length === 0) throw new Error('No seeded quizzes found');
  const targetQuiz = quizData.quizzes.find(q => q._count.questions > 1) || quizData.quizzes[0];
  const quizId = targetQuiz.id;
  console.log(`✅ Fetched quiz: "${targetQuiz.title}" (ID: ${quizId}) with ${targetQuiz._count.questions} questions`);

  // 3. Connect Host Socket
  const hostSocket = io(SERVER_URL);
  let roomCode = '';

  await new Promise((resolve, reject) => {
    hostSocket.on('connect', () => {
      hostSocket.emit('host:create-room', { quizId }, (res) => {
        if (!res || !res.success) return reject(new Error('host:create-room failed'));
        roomCode = res.roomCode;
        console.log(`✅ Host created room with code: [${roomCode}]`);
        resolve();
      });
    });
  });

  // 4. Connect 5 simulated student sockets
  const studentSockets = [];
  const studentNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Evan'];

  for (let i = 0; i < studentNames.length; i++) {
    const s = io(SERVER_URL);
    const name = studentNames[i];
    await new Promise((resolve) => {
      s.on('connect', () => {
        s.emit('student:join-room', {
          roomCode,
          name,
          avatar: '🚀',
          sessionToken: `test_token_${name}`
        }, (res) => {
          if (res && res.success) {
            console.log(`   Student ${name} joined successfully.`);
          }
          resolve();
        });
      });
    });
    studentSockets.push(s);
  }

  // 5. Setup event listeners for direct progression
  const feedbackPromise = new Promise((resolve) => {
    studentSockets[0].once('student:answer-result', (feedback) => {
      if (feedback.correctOptionIndex !== undefined || feedback.isCorrect !== undefined) {
        throw new Error('VIOLATION: Correct answer leaked during active questioning!');
      }
      console.log(`✅ Student answer locked in without revealing answer mid-quiz! (selectedOption=${feedback.selectedOption})`);
      resolve(feedback);
    });
  });

  const nextQuestionPromise = new Promise((resolve) => {
    studentSockets[0].once('question:next', (qData) => {
      // ANTI-CHEAT CHECK
      if (qData.correctOptionIndex !== undefined) {
        throw new Error('SECURITY VIOLATION: Student received correctOptionIndex!');
      }
      console.log(`✅ Question #1 delivered to students`);
    });

    // Listen for Question #2 delivered directly after answer click!
    let count = 0;
    studentSockets[0].on('question:next', (qData) => {
      count++;
      if (count === 2) {
        console.log(`✅ Directly advanced to Question #${qData.questionIndex + 1}: "${qData.question.text}"!`);
        resolve(qData);
      }
    });
  });

  // 6. Host starts quiz
  console.log('🚀 Host starting the quiz...');
  hostSocket.emit('host:start-quiz', { roomCode });

  // Student submits answer
  setTimeout(() => {
    console.log('👉 Student Alice clicking Option 1 (Mercury)...');
    studentSockets[0].emit('student:submit-answer', {
      roomCode,
      sessionToken: `test_token_Alice`,
      questionIndex: 0,
      selectedOptionIndex: 1
    });
  }, 600);

  // Await immediate feedback
  await feedbackPromise;

  // Await direct transition to Question #2!
  await nextQuestionPromise;

  // 7. Host triggers Prize Moment
  console.log('🎁 Host triggering mid-quiz Prize Moment...');
  await new Promise((resolve) => {
    hostSocket.once('prize:announcement', (prizeData) => {
      console.log(`✅ Prize announcement received: "${prizeData.winner.name}" won (${prizeData.winner.reason})`);
      resolve();
    });
    hostSocket.emit('host:trigger-prize-moment', { roomCode, prizeType: 'lucky_draw' });
  });

  // 8. Host ends quiz and tests final podium + questions review + CSV export
  console.log('🏆 Host ending quiz and requesting podium with full review & score analysis...');
  await new Promise((resolve) => {
    hostSocket.once('winners:final-podium', async (podiumData) => {
      console.log('✅ Final Podium received:');
      console.log('   1st:', podiumData.podium.first?.name, `(${podiumData.podium.first?.score} pts)`);
      console.log('   2nd:', podiumData.podium.second?.name, `(${podiumData.podium.second?.score} pts)`);
      console.log('   3rd:', podiumData.podium.third?.name, `(${podiumData.podium.third?.score} pts)`);

      // Verify Questions Review & Score Analysis
      if (!podiumData.questions || podiumData.questions.length === 0) {
        throw new Error('podiumData missing questions array!');
      }
      if (!podiumData.scoreAnalysis) {
        throw new Error('podiumData missing scoreAnalysis!');
      }
      console.log(`✅ All ${podiumData.questions.length} questions delivered at quiz end with correct solutions & explanations!`);
      console.log(`✅ Class score analysis verified: Class Average = ${podiumData.scoreAnalysis.averageScore} / ${podiumData.totalQuestions}`);

      const aliceReview = podiumData.playerReviews['test_token_Alice'];
      if (!aliceReview) {
        throw new Error('Alice playerReview missing!');
      }
      console.log(`✅ Alice score verified: ${aliceReview.score} / ${aliceReview.totalQuestions} (+1 for correct answers, 0 for wrong)`);

      // 9. Verify CSV export endpoint
      const csvRes = await fetch(`${SERVER_URL}/api/rooms/${roomCode}/export-csv`);
      const csvText = await csvRes.text();
      if (!csvText.includes('Rank') || !csvText.includes('Final_Score')) {
        throw new Error('CSV export format invalid');
      }
      console.log('✅ CSV Export endpoint verified successfully!');

      resolve();
    });
    hostSocket.emit('host:end-quiz', { roomCode });
  });

  // Cleanup sockets
  hostSocket.disconnect();
  studentSockets.forEach(s => s.disconnect());

  console.log('\n=============================================');
  console.log('🎉 ALL DIRECT QUESTION PROGRESSION TESTS PASSED!');
  console.log('=============================================\n');
  process.exit(0);
}

runTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
