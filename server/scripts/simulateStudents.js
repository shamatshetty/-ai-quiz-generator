import { io } from 'socket.io-client';

/**
 * Headless Student Simulation Tool
 * Usage:
 *   node server/scripts/simulateStudents.js --room ABCDEF --count 20 --server http://localhost:4000
 */

// Parse CLI flags
const args = process.argv.slice(2);
let roomCode = '';
let count = 20;
let serverUrl = 'http://localhost:4000';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--room' && args[i + 1]) roomCode = args[i + 1].toUpperCase();
  if (args[i] === '--count' && args[i + 1]) count = parseInt(args[i + 1], 10);
  if (args[i] === '--server' && args[i + 1]) serverUrl = args[i + 1];
}

if (!roomCode) {
  console.error('❌ Error: Room code is required.');
  console.log('Usage: node scripts/simulateStudents.js --room <ROOM_CODE> [--count 20] [--server http://localhost:4000]');
  process.exit(1);
}

const AVATARS = ['🚀', '🦊', '⚡', '🦉', '🎯', '🦁', '🌟', '🦄', '🐯', '🐼', '🔥', '👾', '🌈', '💎', '🏆'];
const FIRST_NAMES = ['Aiden', 'Bella', 'Charlie', 'Daisy', 'Ethan', 'Fiona', 'George', 'Hannah', 'Ian', 'Julia', 'Kevin', 'Luna', 'Max', 'Nora', 'Oscar', 'Piper', 'Quinn', 'Ruby', 'Sam', 'Tara', 'Umar', 'Violet', 'Will', 'Xena', 'Yusuf', 'Zara'];

console.log(`🤖 Launching ${count} simulated students for Room [${roomCode}] connecting to ${serverUrl}...`);

const students = [];

for (let i = 0; i < count; i++) {
  const name = `${FIRST_NAMES[i % FIRST_NAMES.length]}_${Math.floor(Math.random() * 900 + 100)}`;
  const avatar = AVATARS[i % AVATARS.length];
  const sessionToken = `sim_token_${i}_${Date.now()}`;

  const socket = io(serverUrl, {
    transports: ['websocket', 'polling'],
    forceNew: true
  });

  const student = { id: i + 1, name, avatar, sessionToken, socket, score: 0 };

  socket.on('connect', () => {
    socket.emit('student:join-room', {
      roomCode,
      name,
      avatar,
      sessionToken
    }, (res) => {
      if (res && res.success) {
        // Connected successfully
      } else {
        console.error(`Student ${name} join failed:`, res?.error);
      }
    });
  });

  socket.on('question:next', (data) => {
    const { questionIndex, timeLimit } = data;
    // Answer with randomized delay
    const delay = Math.floor(Math.random() * ((timeLimit || 20) - 4) * 1000) + 1200;

    setTimeout(() => {
      // Pick random option 0-3
      const optionIndex = Math.floor(Math.random() * 4);
      socket.emit('student:submit-answer', {
        roomCode,
        questionIndex,
        selectedOptionIndex: optionIndex
      });
    }, delay);
  });

  socket.on('student:answer-result', (result) => {
    student.score = result.totalScore;
  });

  students.push(student);
}

console.log(`✅ ${count} simulated student connections spawned.`);
console.log(`Press Ctrl+C to disconnect all simulated students.`);

process.on('SIGINT', () => {
  console.log('\nDisconnecting simulated students...');
  students.forEach(s => s.socket.disconnect());
  process.exit(0);
});
