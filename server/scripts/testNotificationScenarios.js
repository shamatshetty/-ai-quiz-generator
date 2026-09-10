async function runTests() {
  const serverUrl = 'http://localhost:4000';
  console.log('--- TESTING NOTIFICATION SCENARIOS ---');

  // 1. Clear any notifications
  const clearRes = await fetch(`${serverUrl}/api/student/notifications/clear`, { method: 'POST' });
  const clearData = await clearRes.json();
  console.log('1. Clear notifications response:', clearData);

  // 2. Fetch notifications: should be 0
  const fetch1 = await fetch(`${serverUrl}/api/student/notifications`);
  const notifs1 = await fetch1.json();
  console.log('2. Notifications count initially:', notifs1.notifications.length);
  if (notifs1.notifications.length !== 0) {
    throw new Error(`Expected 0 notifications initially, found ${notifs1.notifications.length}`);
  }

  // 3. Create a Random / Non-Teacher Quiz
  console.log('3. Creating random non-teacher quiz...');
  const randomQuizRes = await fetch(`${serverUrl}/api/quizzes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Random General Trivia',
      subject: 'Trivia',
      defaultTimeLimit: 15,
      isTeacher: false,
      questions: [
        {
          text: 'What is the capital of France?',
          options: ['Paris', 'London', 'Berlin', 'Madrid'],
          correctOptionIndex: 0,
          timeLimit: 15
        }
      ]
    })
  });
  const randomQuizData = await randomQuizRes.json();
  console.log('   Random quiz created:', randomQuizData.success, randomQuizData.quiz?.id);

  // 4. Fetch notifications: should STILL be 0
  const fetch2 = await fetch(`${serverUrl}/api/student/notifications`);
  const notifs2 = await fetch2.json();
  console.log('4. Notifications count after random quiz:', notifs2.notifications.length);
  if (notifs2.notifications.length !== 0) {
    throw new Error(`Expected 0 notifications after random quiz, found ${notifs2.notifications.length}`);
  }
  console.log('   ✅ PASS: Non-teacher quiz did NOT trigger student notification!');

  // 5. Create a Teacher Quiz
  console.log('5. Creating Teacher quiz...');
  const teacherQuizRes = await fetch(`${serverUrl}/api/quizzes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'AP Biology: Cellular Respiration',
      subject: 'Biology',
      defaultTimeLimit: 25,
      isTeacher: true,
      teacherName: 'Dr. Sarah Henderson',
      questions: [
        {
          text: 'Where does glycolysis take place in the cell?',
          options: ['Cytoplasm', 'Mitochondrial matrix', 'Nucleus', 'Endoplasmic reticulum'],
          correctOptionIndex: 0,
          timeLimit: 25
        }
      ]
    })
  });
  const teacherQuizData = await teacherQuizRes.json();
  console.log('   Teacher quiz created:', teacherQuizData.success, teacherQuizData.quiz?.id);

  // 6. Fetch notifications: should now be 1
  const fetch3 = await fetch(`${serverUrl}/api/student/notifications`);
  const notifs3 = await fetch3.json();
  console.log('6. Notifications count after teacher quiz:', notifs3.notifications.length);
  if (notifs3.notifications.length !== 1) {
    throw new Error(`Expected 1 notification after teacher quiz, found ${notifs3.notifications.length}`);
  }
  const teacherNotif = notifs3.notifications[0];
  console.log('   Notification title:', teacherNotif.title);
  console.log('   Host name:', teacherNotif.hostName);
  console.log('   Subject:', teacherNotif.subject);
  if (teacherNotif.hostName !== 'Dr. Sarah Henderson') {
    throw new Error(`Expected hostName to be Dr. Sarah Henderson, got ${teacherNotif.hostName}`);
  }
  console.log('   ✅ PASS: Teacher quiz successfully triggered student notification with correct attribution!');

  // 7. Test Mark All Read
  const readRes = await fetch(`${serverUrl}/api/student/notifications/read-all`, { method: 'POST' });
  const readData = await readRes.json();
  console.log('7. Mark all read success:', readData.success, 'Read count:', readData.notifications.filter(n => n.read).length);
  console.log('   ✅ ALL TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
