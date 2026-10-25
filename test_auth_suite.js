const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('================ AUTHENTICATION & REGRESSION TEST SUITE ================');

  // Test 1: Username & Password Registration
  const testUser = `testuser_${Date.now().toString().slice(-4)}`;
  console.log(`\n[Test 1] Registering user '${testUser}' without email...`);
  const regRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    username: testUser,
    password: 'ValidPassword123!',
    confirmPassword: 'ValidPassword123!'
  });

  console.log(`Response status: ${regRes.status}`);
  console.log(`Response body:`, regRes.data);
  if (regRes.status === 201 && regRes.data.success && !regRes.data.token) {
    console.log('✅ PASS: Registered successfully with username and password only. NO token generated.');
  } else {
    console.error('❌ FAIL: Registration failed or returned token unexpectedly.');
  }

  // Test 2: Duplicate username rejection
  console.log(`\n[Test 2] Attempting to re-register duplicate username '${testUser}'...`);
  const dupRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    username: testUser,
    password: 'ValidPassword123!',
    confirmPassword: 'ValidPassword123!'
  });
  console.log(`Response status: ${dupRes.status}`);
  if (dupRes.status === 409) {
    console.log('✅ PASS: Duplicate username correctly rejected with 409 Conflict.');
  } else {
    console.error('❌ FAIL: Duplicate username was not rejected with 409.');
  }

  // Test 3: Manual login with newly registered user
  console.log(`\n[Test 3] Manually signing in with new credentials...`);
  const newLoginRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    username: testUser,
    password: 'ValidPassword123!'
  });
  console.log(`Response status: ${newLoginRes.status}`);
  if (newLoginRes.status === 200 && newLoginRes.data.token && newLoginRes.data.user.role === 'student') {
    console.log('✅ PASS: Manual login succeeded. Valid JWT and safe user profile issued.');
  } else {
    console.error('❌ FAIL: Manual login with new user failed.');
  }

  // Test 4: Existing admin login
  console.log(`\n[Test 4] Logging in with existing admin credentials (admin / admin123)...`);
  const adminRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    username: 'admin',
    password: 'admin123'
  });
  console.log(`Response status: ${adminRes.status}, Role: ${adminRes.data?.user?.role}`);
  if (adminRes.status === 200 && adminRes.data?.user?.role === 'admin') {
    console.log('✅ PASS: Admin account works perfectly with admin role.');
  } else {
    console.error('❌ FAIL: Admin login failed.');
  }

  // Test 5: Existing student login
  console.log(`\n[Test 5] Logging in with existing student credentials (student / student123)...`);
  const studentRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    username: 'student',
    password: 'student123'
  });
  console.log(`Response status: ${studentRes.status}, Role: ${studentRes.data?.user?.role}`);
  if (studentRes.status === 200 && studentRes.data?.user?.role === 'student') {
    console.log('✅ PASS: Existing student account works perfectly.');
  } else {
    console.error('❌ FAIL: Student login failed.');
  }

  // Test 6: Incorrect password failure
  console.log(`\n[Test 6] Testing wrong password rejection...`);
  const wrongPassRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    username: 'admin',
    password: 'IncorrectPassword999'
  });
  console.log(`Response status: ${wrongPassRes.status}`);
  if (wrongPassRes.status === 401) {
    console.log('✅ PASS: Incorrect password safely rejected with 401.');
  } else {
    console.error('❌ FAIL: Incorrect password was not rejected with 401.');
  }

  // Test 7: Google Sign-In endpoint validation
  console.log(`\n[Test 7] Testing Google Sign-In endpoint without credentials...`);
  const emptyGoogleRes = await request({
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/google',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {});
  console.log(`Response status: ${emptyGoogleRes.status}, Message: ${emptyGoogleRes.data?.message}`);
  if (emptyGoogleRes.status === 400 || emptyGoogleRes.status === 503) {
    console.log('✅ PASS: Google endpoint rejected empty request appropriately.');
  } else {
    console.error('❌ FAIL: Google endpoint did not handle empty request properly.');
  }

  // Test 8: Non-Auth Transit Endpoints (Stops, Buses, Routes) with JWT
  console.log(`\n[Test 8] Checking protected Stops, Buses, and Routes APIs with JWT...`);
  const token = adminRes.data?.token;
  const authHeaders = { 'Authorization': `Bearer ${token}` };
  const stopsRes = await request({ hostname: '127.0.0.1', port: 5000, path: '/api/stops', method: 'GET', headers: authHeaders });
  const busesRes = await request({ hostname: '127.0.0.1', port: 5000, path: '/api/buses', method: 'GET', headers: authHeaders });
  const routesRes = await request({ hostname: '127.0.0.1', port: 5000, path: '/api/routes', method: 'GET', headers: authHeaders });
  const stopsList = stopsRes.data?.stops || [];
  const busesList = busesRes.data?.buses || [];
  const routesList = routesRes.data?.routes || [];
  console.log(`Stops: ${stopsList.length}, Buses: ${busesList.length}, Routes: ${routesList.length}`);
  if (stopsRes.status === 200 && busesRes.status === 200 && routesRes.status === 200 && stopsList.length > 0) {
    console.log('✅ PASS: All protected transit data endpoints returned full datasets.');
  } else {
    console.error('❌ FAIL: Transit data endpoints returned errors.');
  }

  console.log('\n================ ALL TESTS EXECUTED ================');
}

runTests().catch(console.error);
