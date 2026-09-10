import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with sample classroom users and quizzes...');

  // Delete existing demo data
  await prisma.answerRecord.deleteMany({});
  await prisma.playerSession.deleteMany({});
  await prisma.quizSession.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.quiz.deleteMany({});
  await prisma.user.deleteMany({});

  const defaultPassword = await bcrypt.hash('quizpass123', 10);

  // 1. Seed Demo Teacher
  const demoTeacher = await prisma.user.create({
    data: {
      name: 'Prof. Alan Davis',
      email: 'teacher@classroom.edu',
      password: defaultPassword,
      role: 'TEACHER',
      avatar: '👨‍🏫',
      subject: 'Computer Science & STEM'
    }
  });

  // 2. Seed Demo Student
  const demoStudent = await prisma.user.create({
    data: {
      name: 'Alex Rivera',
      email: 'student@classroom.edu',
      password: defaultPassword,
      role: 'STUDENT',
      avatar: '🚀'
    }
  });

  console.log(`👨‍🏫 Seeded demo teacher: ${demoTeacher.name} (${demoTeacher.email})`);
  console.log(`🎒 Seeded demo student: ${demoStudent.name} (${demoStudent.email})`);

  // 3. General Science & Tech Quiz (10 questions)
  const scienceQuiz = await prisma.quiz.create({
    data: {
      title: 'Science & Digital Tech Blitz',
      subject: 'Science & Computing',
      description: 'An interactive 10-question challenge on space, elements, AI, and computer science fundamentals!',
      defaultTimeLimit: 20,
      authorId: demoTeacher.id,
      questions: {
        create: [
          {
            text: 'What is the closest planet to the Sun in our Solar System?',
            options: JSON.stringify(['Venus', 'Mercury', 'Mars', 'Jupiter']),
            correctOptionIndex: 1, // Mercury
            timeLimit: 20,
            explanation: 'Mercury is the smallest planet and closest to the Sun, orbiting it in just 88 Earth days.',
            orderIndex: 0
          },
          {
            text: 'Which chemical element has the atomic symbol "Au"?',
            options: JSON.stringify(['Silver', 'Argon', 'Gold', 'Aluminum']),
            correctOptionIndex: 2, // Gold
            timeLimit: 20,
            explanation: '"Au" comes from the Latin word "Aurum", which means shining dawn or gold.',
            orderIndex: 1
          },
          {
            text: 'What does "HTTP" stand for in web browsing?',
            options: JSON.stringify([
              'HyperText Transfer Protocol',
              'High Tech Transmission Process',
              'Hyperlink Text Traffic Provider',
              'Home Terminal Tracking Packet'
            ]),
            correctOptionIndex: 0, // HyperText Transfer Protocol
            timeLimit: 20,
            explanation: 'HTTP is the foundational protocol used by the World Wide Web to transfer hypertext requests and files.',
            orderIndex: 2
          },
          {
            text: 'How many bits are in a single byte?',
            options: JSON.stringify(['4', '8', '16', '32']),
            correctOptionIndex: 1, // 8
            timeLimit: 15,
            explanation: 'A byte is composed of 8 bits, capable of representing 256 distinct values.',
            orderIndex: 3
          },
          {
            text: 'Which organelle is known as the "powerhouse" of the eukaryotic cell?',
            options: JSON.stringify(['Ribosome', 'Nucleus', 'Mitochondria', 'Golgi apparatus']),
            correctOptionIndex: 2, // Mitochondria
            timeLimit: 20,
            explanation: 'Mitochondria generate most of the chemical energy needed to power the cell’s biochemical reactions (ATP).',
            orderIndex: 4
          },
          {
            text: 'Who is widely recognized as the first computer programmer for writing an algorithm for the Analytical Engine?',
            options: JSON.stringify(['Ada Lovelace', 'Alan Turing', 'Grace Hopper', 'Charles Babbage']),
            correctOptionIndex: 0, // Ada Lovelace
            timeLimit: 20,
            explanation: 'Ada Lovelace published the first algorithm intended to be carried out by Charles Babbage’s mechanical computer in 1843.',
            orderIndex: 5
          },
          {
            text: 'What is the most abundant gas in Earth’s atmosphere?',
            options: JSON.stringify(['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Argon']),
            correctOptionIndex: 2, // Nitrogen
            timeLimit: 15,
            explanation: 'Nitrogen makes up roughly 78% of Earth’s atmosphere, with oxygen making up about 21%.',
            orderIndex: 6
          },
          {
            text: 'What data structure follows the "Last-In, First-Out" (LIFO) principle?',
            options: JSON.stringify(['Queue', 'Stack', 'Linked List', 'Binary Tree']),
            correctOptionIndex: 1, // Stack
            timeLimit: 20,
            explanation: 'A stack operates on LIFO (like a stack of plates where the last plate placed is the first removed).',
            orderIndex: 7
          },
          {
            text: 'What is the speed of light in a vacuum (approximate)?',
            options: JSON.stringify(['300,000 km/s', '150,000 km/s', '3,000 km/s', '1,000,000 km/s']),
            correctOptionIndex: 0, // 300,000 km/s
            timeLimit: 20,
            explanation: 'Light travels at approximately 299,792 kilometers per second in a vacuum.',
            orderIndex: 8
          },
          {
            text: 'Which protocol is used for full-duplex, real-time bidirectional communication in this web app?',
            options: JSON.stringify(['HTTP Long Polling', 'WebSockets / Socket.IO', 'FTP', 'SMTP']),
            correctOptionIndex: 1, // WebSockets / Socket.IO
            timeLimit: 20,
            explanation: 'WebSockets provide a persistent connection between client and server for instant real-time synchronization!',
            orderIndex: 9
          }
        ]
      }
    }
  });

  console.log(`✅ Seeded sample quiz: "${scienceQuiz.title}" (ID: ${scienceQuiz.id}) with 10 questions.`);

  // 4. Seed past attended quiz session for Demo Student Alex Rivera
  const pastSession = await prisma.quizSession.create({
    data: {
      roomCode: 'SCI101',
      quizId: scienceQuiz.id,
      status: 'ENDED',
      currentQuestionIndex: 9,
      startedAt: new Date(Date.now() - 86400000), // yesterday
      endedAt: new Date(Date.now() - 86400000 + 1200000)
    }
  });

  const studentPlayerSession = await prisma.playerSession.create({
    data: {
      sessionToken: 'demo_student_token_alex',
      userId: demoStudent.id,
      name: demoStudent.name,
      avatar: demoStudent.avatar || '🚀',
      quizSessionId: pastSession.id,
      score: 8,
      streak: 5,
      rank: 1
    }
  });

  // Seed answer records for the 10 questions
  const quizQuestions = await prisma.question.findMany({
    where: { quizId: scienceQuiz.id },
    orderBy: { orderIndex: 'asc' }
  });

  for (let i = 0; i < quizQuestions.length; i++) {
    const q = quizQuestions[i];
    // 8 correct, 2 wrong (e.g. question index 1 and 6 wrong)
    const isCorrect = i !== 1 && i !== 6;
    const selectedOption = isCorrect ? q.correctOptionIndex : (q.correctOptionIndex + 1) % 4;
    await prisma.answerRecord.create({
      data: {
        quizSessionId: pastSession.id,
        questionId: q.id,
        playerSessionId: studentPlayerSession.id,
        selectedOption,
        isCorrect,
        timeTakenMs: Math.floor(Math.random() * 8000) + 3000,
        pointsAwarded: isCorrect ? 1 : 0
      }
    });
  }

  console.log(`📊 Seeded past quiz session [SCI101] with 10 questions & answers for student: ${demoStudent.name}`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
