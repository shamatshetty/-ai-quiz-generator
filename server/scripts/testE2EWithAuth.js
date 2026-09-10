import { io } from 'socket.io-client';
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
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function makeGet(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SERVER_URL);
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

async function runSimulation() {
  console.log('🚀 Running E2E Test with Dual-Role Authentication...\n');

  // 1. Teacher Demo Login
  console.log('1️⃣ Authenticating Teacher...');
  const teacherAuth = await makePost('/api/auth/demo-login', { role: 'TEACHER' });
  if (!teacherAuth.success || !teacherAuth.token) throw new Error('Teacher auth failed');
  console.log(`   ✅ Teacher Authenticated: ${teacherAuth.user.name} (${teacherAuth.user.email})`);

  // 2. Student Demo Login
  console.log('2️⃣ Authenticating Student...');
  const studentAuth = await makePost('/api/auth/demo-login', { role: 'STUDENT' });
  if (!studentAuth.success || !studentAuth.token) throw new Error('Student auth failed');
  console.log(`   ✅ Student Authenticated: ${studentAuth.user.name} (${studentAuth.user.avatar})`);

  // 3. Fetch Quizzes
  console.log('3️⃣ Fetching available quizzes...');
  const quizListRes = await makeGet('/api/quizzes');
  if (!quizListRes.success || quizListRes.quizzes.length === 0) throw new Error('No quizzes found');
  const targetQuiz = quizListRes.quizzes[0];
  console.log(`   ✅ Target Quiz: "${targetQuiz.title}" (ID: ${targetQuiz.id})`);

  // 4. Connect Host Socket & Create Room
  console.log('4️⃣ Host connecting via Socket.IO...');
  const hostSocket = io(SERVER_URL, { transports: ['websocket'] });

  await new Promise((resolve) => hostSocket.on('connect', resolve));
  console.log(`   ✅ Host socket connected: ${hostSocket.id}`);

  const roomRes = await new Promise((resolve) => {
    hostSocket.emit('host:create-room', { quizId: targetQuiz.id }, resolve);
  });
  if (!roomRes.success) throw new Error('Failed to create room: ' + roomRes.error);
  const roomCode = roomRes.roomCode;
  console.log(`   ✅ Room Created: PIN [${roomCode}]`);

  // 5. Connect Student Socket & Join Room with Authenticated Profile
  console.log('5️⃣ Student connecting & joining room with auth profile...');
  const studentSocket = io(SERVER_URL, { transports: ['websocket'] });
  await new Promise((resolve) => studentSocket.on('connect', resolve));

  const joinRes = await new Promise((resolve) => {
    studentSocket.emit('student:join-room', {
      roomCode,
      name: studentAuth.user.name,
      avatar: studentAuth.user.avatar,
      sessionToken: `session_${studentAuth.user.id}`
    }, resolve);
  });
  if (!joinRes.success) throw new Error('Failed to join room: ' + joinRes.error);
  console.log(`   ✅ Student Joined: ${joinRes.player.name} in Room ${roomCode}`);

  // 6. Host starts quiz
  console.log('6️⃣ Host starting the quiz...');
  const questionPromise = new Promise((resolve) => {
    studentSocket.on('question:next', resolve);
  });
  hostSocket.emit('host:start-quiz', { roomCode });

  const q1 = await questionPromise;
  console.log(`   ✅ Question 1 received: "${q1.question?.text}"`);

  // 7. Student submits an answer
  console.log('7️⃣ Student submitting answer...');
  const resultPromise = new Promise((resolve) => {
    studentSocket.on('student:answer-result', resolve);
  });
  studentSocket.emit('student:submit-answer', {
    roomCode,
    sessionToken: `session_${studentAuth.user.id}`,
    questionIndex: 0,
    selectedOptionIndex: 1
  });

  const answerResult = await resultPromise;
  console.log(`   ✅ Answer received by server: success=${answerResult.success}`);

  // 8. Host ends quiz and receives reviews
  console.log('8️⃣ Host ending quiz...');
  const podiumPromise = new Promise((resolve) => {
    hostSocket.on('winners:final-podium', resolve);
  });
  hostSocket.emit('host:end-quiz', { roomCode });

  const finalPodium = await podiumPromise;
  console.log(`   ✅ Quiz Ended: Total questions reviewed = ${finalPodium.questions?.length}`);

  hostSocket.disconnect();
  studentSocket.disconnect();

  console.log('\n🎉 FULL END-TO-END MULTIPLAYER TEST WITH AUTH PASSED 100%!');
}

runSimulation().catch((err) => {
  console.error('❌ Simulation error:', err);
  process.exit(1);
});
