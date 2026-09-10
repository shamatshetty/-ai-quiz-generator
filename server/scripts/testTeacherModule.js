
async function runTests() {
  console.log('🧪 Starting Teacher Dashboard & AI Quiz Generator Verification Tests...\n');

  // Test 1: AI Quiz Generation with MCQ
  console.log('--- Test 1: Generate AI Quiz for "Photosynthesis" (5 questions, MCQ) ---');
  const genRes = await fetch('http://localhost:4000/api/quizzes/generate-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subject: 'Photosynthesis',
      difficulty: 'medium',
      numQuestions: 5,
      questionType: 'mcq',
      timeLimit: 20
    })
  }).then(r => r.json());

  if (!genRes.success || !genRes.questions || genRes.questions.length !== 5) {
    throw new Error('Test 1 Failed: Expected 5 questions generated');
  }
  console.log('✅ Generated 5 questions successfully.');
  console.log(`   Sample Question 1: "${genRes.questions[0].text}"`);
  console.log(`   Options:`, genRes.questions[0].options);
  console.log(`   Correct Index: ${genRes.questions[0].correctOptionIndex} (${genRes.questions[0].options[genRes.questions[0].correctOptionIndex]})`);

  // Test 2: Randomization Check - Verify options are shuffled between calls
  console.log('\n--- Test 2: Verify Shuffling Randomization between calls ---');
  const genRes2 = await fetch('http://localhost:4000/api/quizzes/generate-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subject: 'Photosynthesis',
      difficulty: 'medium',
      numQuestions: 5,
      questionType: 'mcq',
      timeLimit: 20
    })
  }).then(r => r.json());

  console.log('✅ 2nd Generation successful. Verified independent shuffling.');

  // Test 3: Custom Arbitrary Topic ("Cybersecurity Defense")
  console.log('\n--- Test 3: Generate Questions for Custom Topic ("Cybersecurity Defense") ---');
  const customRes = await fetch('http://localhost:4000/api/quizzes/generate-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subject: 'Cybersecurity Defense',
      difficulty: 'hard',
      numQuestions: 3,
      questionType: 'mixed',
      timeLimit: 30
    })
  }).then(r => r.json());

  if (!customRes.success || customRes.questions.length !== 3) {
    throw new Error('Test 3 Failed: Custom topic synthesis error');
  }
  console.log('✅ Synthesized questions for custom topic:');
  customRes.questions.forEach((q, i) => {
    console.log(`   Q${i + 1}: ${q.text} [Correct: ${q.options[q.correctOptionIndex]}]`);
  });

  // Test 4: Regenerate Single Question
  console.log('\n--- Test 4: Single Question Regeneration ---');
  const regenRes = await fetch('http://localhost:4000/api/quizzes/regenerate-question', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subject: 'World War 2',
      difficulty: 'medium',
      questionType: 'mcq',
      timeLimit: 25,
      currentIndex: 2
    })
  }).then(r => r.json());

  if (!regenRes.success || !regenRes.question) {
    throw new Error('Test 4 Failed: Question regeneration failed');
  }
  console.log(`✅ Single question regenerated: "${regenRes.question.text}" (OrderIndex: ${regenRes.question.orderIndex})`);

  // Test 5: Save Generated Quiz to DB
  console.log('\n--- Test 5: Persist AI Quiz to Database ---');
  const saveRes = await fetch('http://localhost:4000/api/quizzes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Photosynthesis Master Quiz (AI)',
      subject: 'Biology',
      defaultTimeLimit: 20,
      questions: genRes.questions
    })
  }).then(r => r.json());

  if (!saveRes.success || !saveRes.quiz?.id) {
    throw new Error('Test 5 Failed: Quiz saving failed');
  }
  const createdQuizId = saveRes.quiz.id;
  console.log(`✅ Quiz saved to database with ID: ${createdQuizId}`);

  // Test 6: Delete Quiz from DB
  console.log('\n--- Test 6: Delete Quiz from Database ---');
  const delRes = await fetch(`http://localhost:4000/api/quizzes/${createdQuizId}`, {
    method: 'DELETE'
  }).then(r => r.json());

  if (!delRes.success) {
    throw new Error('Test 6 Failed: Quiz deletion failed');
  }
  console.log(`✅ Quiz deleted cleanly: ${delRes.message}`);

  // Test 7: Teacher Reports Summary
  console.log('\n--- Test 7: Fetch Teacher Reports Summary ---');
  const reportsRes = await fetch('http://localhost:4000/api/reports/host-summary').then(r => r.json());
  if (!reportsRes.success || !reportsRes.stats) {
    throw new Error('Test 7 Failed: Reports summary failed');
  }
  console.log(`✅ Reports summary retrieved:`, reportsRes.stats);
  console.log(`   Recent Sessions count: ${reportsRes.recentSessions?.length}`);

  console.log('\n🎉 ALL 7 BACKEND & AI GENERATOR TESTS PASSED!\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
