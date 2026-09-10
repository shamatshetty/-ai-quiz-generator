import { io } from 'socket.io-client';

const SERVER_URL = 'http://localhost:4000';

async function testTeacherCustomQuiz() {
  console.log('🧪 Testing custom quiz answer fidelity...');

  // 1. Teacher creates a custom quiz via API
  const teacherQuiz = {
    title: 'Custom Chemistry Quiz by Teacher',
    subject: 'Chemistry',
    defaultTimeLimit: 15,
    questions: [
      {
        text: 'What is the chemical formula of water?',
        options: ['CO2', 'NaCl', 'H2O', 'CH4'],
        correctOptionIndex: 2, // Teacher designates H2O (Option 3 / Index 2)
        explanation: 'Water consists of 2 Hydrogen atoms and 1 Oxygen atom (H2O).'
      },
      {
        text: 'What gas do plants absorb during photosynthesis?',
        options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Helium'],
        correctOptionIndex: 1, // Teacher designates Carbon Dioxide (Option 2 / Index 1)
        explanation: 'Plants absorb CO2 and release O2.'
      }
    ]
  };

  const createRes = await fetch(`${SERVER_URL}/api/quizzes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(teacherQuiz)
  });

  const createData = await createRes.json();
  if (!createData.success) {
    throw new Error('Failed to create quiz: ' + createData.error);
  }

  const savedQuiz = createData.quiz;
  console.log(`✅ Teacher created quiz ID: ${savedQuiz.id}`);
  console.log(`   Q1 Correct Option: ${savedQuiz.questions[0].correctOptionIndex} (Expected: 2)`);
  console.log(`   Q2 Correct Option: ${savedQuiz.questions[1].correctOptionIndex} (Expected: 1)`);

  if (savedQuiz.questions[0].correctOptionIndex !== 2) throw new Error('Q1 correctOptionIndex mismatch!');
  if (savedQuiz.questions[1].correctOptionIndex !== 1) throw new Error('Q2 correctOptionIndex mismatch!');

  // 2. Launch Host room with this quiz
  const hostSocket = io(SERVER_URL);
  const studentSocket = io(SERVER_URL);

  await new Promise((resolve) => {
    hostSocket.on('connect', resolve);
  });

  let roomCode = '';
  await new Promise((resolve) => {
    hostSocket.emit('host:create-room', { quizId: savedQuiz.id }, (res) => {
      roomCode = res.roomCode;
      console.log(`✅ Teacher launched room [${roomCode}] with custom quiz`);
      resolve();
    });
  });

  // 3. Student joins
  await new Promise((resolve) => {
    studentSocket.emit('student:join-room', {
      roomCode,
      name: 'Curie',
      avatar: '🧪',
      sessionToken: 'token_curie'
    }, (res) => {
      console.log(`✅ Student Curie joined room`);
      resolve();
    });
  });

  // 4. Start quiz
  hostSocket.emit('host:start-quiz', { roomCode });

  // Await Q1
  await new Promise((resolve) => {
    studentSocket.once('question:next', (qData) => {
      console.log(`✅ Q1 Delivered: "${qData.question.text}"`);
      resolve();
    });
  });

  // Set up listener for Q2 before submitting answer for Q1
  const q2Promise = new Promise((resolve) => {
    studentSocket.once('question:next', (qData) => {
      console.log(`✅ Q2 Delivered: "${qData.question.text}"`);
      resolve(qData);
    });
  });

  // Student selects H2O (Option 2 - the teacher's correct answer!)
  console.log('👉 Student Curie selecting Option 2 (H2O)...');
  studentSocket.emit('student:submit-answer', {
    roomCode,
    sessionToken: 'token_curie',
    questionIndex: 0,
    selectedOptionIndex: 2
  });

  // Await Q2
  await q2Promise;

  // Student selects wrong answer (Option 0: Oxygen instead of Carbon Dioxide)
  console.log('👉 Student Curie selecting Option 0 (Oxygen - incorrect)...');
  studentSocket.emit('student:submit-answer', {
    roomCode,
    sessionToken: 'token_curie',
    questionIndex: 1,
    selectedOptionIndex: 0
  });

  // End quiz and check podium & review
  const podiumPromise = new Promise((resolve) => {
    hostSocket.once('winners:final-podium', (podiumData) => {
      console.log('✅ Final Review received:');
      const curieReview = podiumData.playerReviews['token_curie'];
      console.log(`   Curie Total Score: ${curieReview.score} / ${curieReview.totalQuestions}`);
      console.log(`   Curie Correct Count: ${curieReview.correctCount} (Expected: 1)`);
      console.log(`   Curie Incorrect Count: ${curieReview.incorrectCount} (Expected: 1)`);
      console.log(`   Q1 Teacher Correct Answer: Option ${podiumData.questions[0].correctOptionIndex} (${podiumData.questions[0].options[podiumData.questions[0].correctOptionIndex]})`);
      console.log(`   Q2 Teacher Correct Answer: Option ${podiumData.questions[1].correctOptionIndex} (${podiumData.questions[1].options[podiumData.questions[1].correctOptionIndex]})`);

      if (curieReview.score !== 1) throw new Error(`Curie score was ${curieReview.score}, expected 1!`);
      if (curieReview.answers[0].isCorrect !== true) throw new Error('Q1 should have been correct!');
      if (curieReview.answers[1].isCorrect !== false) throw new Error('Q2 should have been incorrect!');
      if (podiumData.questions[0].correctOptionIndex !== 2) throw new Error('Q1 correctOptionIndex mismatch!');
      if (podiumData.questions[1].correctOptionIndex !== 1) throw new Error('Q2 correctOptionIndex mismatch!');

      console.log('🎉 TEACHER DESIGNATED ANSWERS MATCH 100% PERFECTLY!');
      resolve();
    });
  });

  hostSocket.emit('host:end-quiz', { roomCode });
  await podiumPromise;

  hostSocket.disconnect();
  studentSocket.disconnect();
}

testTeacherCustomQuiz().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
