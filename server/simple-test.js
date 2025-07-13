// Simple test using fetch instead of axios
const https = require('https');

async function testAuth() {
  console.log('🧪 Testing authentication on Render...\n');
  
  const options = {
    hostname: 'nevexa.onrender.com',
    port: 443,
    path: '/api/health',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('✅ Health check response:', JSON.parse(data));
        resolve(data);
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error:', error);
      reject(error);
    });

    req.end();
  });
}

testAuth().catch(console.error); 