// Simple test script to check authentication on Render
const axios = require('axios');

const BASE_URL = 'https://nevexa.onrender.com';

async function testAuth() {
  console.log('🧪 Testing authentication on Render...\n');
  
  const client = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
  });

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...');
    const health = await client.get('/api/health');
    console.log('✅ Health check:', health.data);
    
    // Test 2: Session test
    console.log('\n2️⃣ Testing session endpoint...');
    const session = await client.get('/api/session-test');
    console.log('✅ Session test:', session.data);
    
    // Test 3: Try /api/users/me (should fail without login)
    console.log('\n3️⃣ Testing /api/users/me (should fail)...');
    try {
      const me = await client.get('/api/users/me');
      console.log('❌ Unexpected success:', me.data);
    } catch (error) {
      console.log('✅ Expected 401 error:', error.response?.status, error.response?.data);
    }
    
    console.log('\n✅ All tests completed. If you see 401 for /api/users/me, that\'s expected when not logged in.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testAuth(); 