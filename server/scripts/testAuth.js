import http from 'http';

const BASE_URL = 'http://localhost:4000';

function makeRequest(path, method, body, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const postData = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (postData) {
      headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Auth Endpoint Test Suite...\n');

  // Test 1: Seed / Demo Login for Teacher
  console.log('👉 Test 1: Teacher Demo Login');
  const demoTeacherRes = await makeRequest('/api/auth/demo-login', 'POST', { role: 'TEACHER' });
  console.log('Status:', demoTeacherRes.status, 'Success:', demoTeacherRes.body.success, 'User:', demoTeacherRes.body.user?.name);
  if (!demoTeacherRes.body.success || demoTeacherRes.body.user.role !== 'TEACHER') {
    throw new Error('Teacher demo login failed');
  }

  // Test 2: Seed / Demo Login for Student
  console.log('\n👉 Test 2: Student Demo Login');
  const demoStudentRes = await makeRequest('/api/auth/demo-login', 'POST', { role: 'STUDENT' });
  console.log('Status:', demoStudentRes.status, 'Success:', demoStudentRes.body.success, 'User:', demoStudentRes.body.user?.name, 'Avatar:', demoStudentRes.body.user?.avatar);
  if (!demoStudentRes.body.success || demoStudentRes.body.user.role !== 'STUDENT') {
    throw new Error('Student demo login failed');
  }

  // Test 3: Register New Student
  const testStudentEmail = `test_student_${Date.now()}@example.com`;
  console.log('\n👉 Test 3: Register New Student:', testStudentEmail);
  const regStudentRes = await makeRequest('/api/auth/register', 'POST', {
    name: 'Test Student',
    email: testStudentEmail,
    password: 'securePassword123',
    role: 'STUDENT',
    avatar: '👾'
  });
  console.log('Status:', regStudentRes.status, 'Success:', regStudentRes.body.success, 'Token created:', !!regStudentRes.body.token);
  if (!regStudentRes.body.success || regStudentRes.body.user.avatar !== '👾') {
    throw new Error('Student registration failed');
  }

  // Test 4: Login with newly created student
  console.log('\n👉 Test 4: Student Login with Credentials');
  const loginRes = await makeRequest('/api/auth/login', 'POST', {
    email: testStudentEmail,
    password: 'securePassword123',
    role: 'STUDENT'
  });
  console.log('Status:', loginRes.status, 'Success:', loginRes.body.success);
  if (!loginRes.body.success || !loginRes.body.token) {
    throw new Error('Student login failed');
  }

  // Test 5: Verify /api/auth/me with token
  console.log('\n👉 Test 5: Verify /api/auth/me using token');
  const meRes = await makeRequest('/api/auth/me', 'GET', null, loginRes.body.token);
  console.log('Status:', meRes.status, 'Me User:', meRes.body.user?.name, meRes.body.user?.email);
  if (!meRes.body.success || meRes.body.user.email !== testStudentEmail) {
    throw new Error('Auth /me verification failed');
  }

  // Test 6: Incorrect Password Rejection
  console.log('\n👉 Test 6: Incorrect Password Rejection');
  const badLogin = await makeRequest('/api/auth/login', 'POST', {
    email: testStudentEmail,
    password: 'wrongPassword!'
  });
  console.log('Status:', badLogin.status, 'Error:', badLogin.body.error);
  if (badLogin.status !== 401) {
    throw new Error('Incorrect password was not rejected with 401');
  }

  // Test 7: Duplicate Email Rejection
  console.log('\n👉 Test 7: Duplicate Email Rejection');
  const dupReg = await makeRequest('/api/auth/register', 'POST', {
    name: 'Duplicate Guy',
    email: testStudentEmail,
    password: 'anyPassword'
  });
  console.log('Status:', dupReg.status, 'Error:', dupReg.body.error);
  if (dupReg.status !== 409) {
    throw new Error('Duplicate email was not rejected with 409');
  }

  console.log('\n🎉 ALL 7 AUTH TESTS PASSED PERFECTLY!');
}

runTests().catch((err) => {
  console.error('❌ Auth test suite failed:', err);
  process.exit(1);
});
