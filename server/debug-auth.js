// Debug script to test authentication flow
// Run this with: node debug-auth.js

const axios = require('axios');

const BASE_URL = 'https://nevexa.onrender.com';
// const BASE_URL = 'http://localhost:5000'; // Use this for local testing

async function testAuthFlow() {
  console.log('🧪 Testing authentication flow...\n');
  
  // Create axios instance with cookie jar
  const client = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Debug-Script/1.0'
    }
  });

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await client.get('/api/health');
    console.log('✅ Health check:', healthResponse.data);
    console.log('');

    // Test 2: Session test
    console.log('2️⃣ Testing session endpoint...');
    const sessionResponse = await client.get('/api/session-test');
    console.log('✅ Session test:', sessionResponse.data);
    console.log('Set-Cookie headers:', sessionResponse.headers['set-cookie']);
    console.log('');

    // Test 3: Auth test (should fail)
    console.log('3️⃣ Testing auth endpoint (should fail)...');
    try {
      const authResponse = await client.get('/api/auth-test');
      console.log('Auth test response:', authResponse.data);
    } catch (error) {
      console.log('Expected auth failure:', error.response?.data || error.message);
    }
    console.log('');

    // Test 4: Try to access /api/users/me (should fail)
    console.log('4️⃣ Testing /api/users/me (should fail)...');
    try {
      const meResponse = await client.get('/api/users/me');
      console.log('Unexpected success:', meResponse.data);
    } catch (error) {
      console.log('Expected failure:', error.response?.data || error.message);
    }
    console.log('');

    // Test 5: Try to login (you'll need to provide credentials)
    console.log('5️⃣ Testing login...');
    console.log('⚠️  You need to provide valid credentials to test login');
    console.log('⚠️  Uncomment and modify the login test below with real credentials');
    
    /*
    const loginResponse = await client.post('/api/auth/login', {
      email: 'your-email@example.com',
      password: 'your-password'
    });
    console.log('Login response:', loginResponse.data);
    console.log('Login Set-Cookie headers:', loginResponse.headers['set-cookie']);
    
    // Test 6: Try /api/users/me again after login
    console.log('6️⃣ Testing /api/users/me after login...');
    const meAfterLoginResponse = await client.get('/api/users/me');
    console.log('Me after login:', meAfterLoginResponse.data);
    */

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAuthFlow();