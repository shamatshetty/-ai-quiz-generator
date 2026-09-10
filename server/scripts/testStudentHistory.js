import http from 'http';

const SERVER_URL = 'http://localhost:4000';

function makePost(path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SERVER_URL);
    const postData = JSON.stringify(body);
    const req = http.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function makeGet(path, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SERVER_URL);
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    http.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function runTest() {
  console.log('🧪 Testing Student History Endpoint...\n');

  // 1. Log in as student
  console.log('1️⃣ Logging in as Alex Rivera (Student)...');
  const loginRes = await makePost('/api/auth/demo-login', { role: 'STUDENT' });
  if (!loginRes.success || !loginRes.token) throw new Error('Student login failed');
  console.log(`   Logged in: ${loginRes.user.name} (ID: ${loginRes.user.id})`);

  // 2. Fetch history
  console.log('\n2️⃣ Fetching student history from /api/student/history...');
  const historyRes = await makeGet('/api/student/history', loginRes.token);
  console.log('   Response Success:', historyRes.success);
  console.log('   Lifetime Stats:', historyRes.stats);
  console.log(`   Total Attended Quizzes: ${historyRes.history?.length}`);

  if (!historyRes.success || !historyRes.history || historyRes.history.length === 0) {
    throw new Error('No quiz history returned for student');
  }

  const firstQuiz = historyRes.history[0];
  console.log(`\n3️⃣ Inspecting First Attended Quiz: "${firstQuiz.quizTitle}" (Room: ${firstQuiz.roomCode})`);
  console.log(`   Score: ${firstQuiz.score} / ${firstQuiz.totalQuestions} (${firstQuiz.accuracyPercentage}%) - Rank #${firstQuiz.rank}`);
  console.log(`   Mastery Level: ${firstQuiz.masteryLevel}`);
  console.log(`   Questions with Student Answers: ${firstQuiz.questions.length}`);

  const q1 = firstQuiz.questions[0];
  console.log(`\n4️⃣ Question 1 Details:`);
  console.log(`   Text: "${q1.text}"`);
  console.log(`   Options: ${JSON.stringify(q1.options)}`);
  console.log(`   Correct Index: ${q1.correctOptionIndex} ("${q1.options[q1.correctOptionIndex]}")`);
  console.log(`   Student Selected Index: ${q1.selectedOption} ("${q1.options[q1.selectedOption]}")`);
  console.log(`   Is Correct: ${q1.isCorrect}, Points: +${q1.pointsAwarded}`);
  console.log(`   Explanation: "${q1.explanation}"`);

  if (!q1.options || q1.selectedOption === undefined || !q1.explanation) {
    throw new Error('Question detail incomplete in history');
  }

  console.log('\n🎉 STUDENT HISTORY ENDPOINT TEST PASSED 100%!');
}

runTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
