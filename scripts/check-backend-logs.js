const https = require('https');

console.log('🔍 Checking Backend Service Status');
console.log('==================================\n');

// Test backend endpoints
async function testBackendEndpoints() {
  const endpoints = [
    { name: 'Health Check', url: 'https://kryvextrading-com.onrender.com/api/health' },
    { name: 'Root', url: 'https://kryvextrading-com.onrender.com/' },
    { name: 'Admin Users', url: 'https://kryvextrading-com.onrender.com/api/admin/users' }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`🧪 Testing ${endpoint.name}:`);
      console.log(`   URL: ${endpoint.url}`);
      
      const response = await makeRequest(endpoint.url);
      console.log(`   Status: ${response.status}`);
      console.log(`   Content-Type: ${response.headers['content-type']}`);
      console.log(`   Success: ${response.status < 400 ? '✅' : '❌'}`);
      
      if (response.status < 400) {
        console.log(`   Response: ${response.data.substring(0, 200)}...`);
      } else {
        console.log(`   Error: ${response.data.substring(0, 500)}...`);
      }
      console.log('');
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      console.log('');
    }
  }
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Check environment variables
function checkEnvironment() {
  console.log('📋 Environment Check:');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('PORT:', process.env.PORT || 'not set');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'set' : 'not set');
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'set' : 'not set');
  console.log('');
}

// Main execution
async function main() {
  checkEnvironment();
  await testBackendEndpoints();
  
  console.log('🎯 Troubleshooting Steps:');
  console.log('1. Check Render dashboard for backend service status');
  console.log('2. Verify environment variables are set correctly');
  console.log('3. Check deployment logs for startup errors');
  console.log('4. Ensure the backend service is not suspended');
  console.log('5. Verify the start command is correct');
  console.log('');
  console.log('🔧 Common Issues:');
  console.log('- Missing environment variables');
  console.log('- Database connection issues');
  console.log('- Port conflicts');
  console.log('- Build errors');
  console.log('- Service suspension due to inactivity');
}

main(); 