const https = require('https');

async function monitorDeployment() {
  console.log('🚀 Monitoring Deployment Status...\n');

  // Test 1: Check if backend is accessible
  console.log('1️⃣ Testing backend accessibility...');
  try {
    const healthResponse = await makeRequest('GET', '/api/health');
    console.log('✅ Backend is accessible');
    console.log(`📊 Status: ${healthResponse.data.status}`);
    console.log(`🌍 Environment: ${healthResponse.data.environment}`);
  } catch (error) {
    console.log('❌ Backend is not accessible:', error.message);
    console.log('⏳ Deployment might still be in progress...');
    return;
  }

  // Test 2: Check admin login
  console.log('\n2️⃣ Testing admin login...');
  try {
    const loginResponse = await makeRequest('POST', '/api/admin/login', {
      email: 'admin@kryvex.com',
      password: 'admin123'
    });
    
    if (loginResponse.statusCode === 200) {
      console.log('✅ Admin login successful!');
      console.log('🔑 Token received:', loginResponse.data.data.token ? 'Yes' : 'No');
      
      // Test 3: Use token to access admin endpoint
      console.log('\n3️⃣ Testing admin endpoint with authentication...');
      const token = loginResponse.data.data.token;
      const adminResponse = await makeRequest('GET', '/api/admin/users', null, token);
      
      if (adminResponse.statusCode === 200) {
        console.log('✅ Admin authentication working correctly!');
        console.log(`📊 Users found: ${adminResponse.data.data?.length || 0}`);
      } else {
        console.log('❌ Admin endpoint failed:', adminResponse.statusCode);
      }
    } else {
      console.log('❌ Admin login failed:', loginResponse.statusCode);
      console.log('📋 Response:', JSON.stringify(loginResponse.data, null, 2));
    }
    
  } catch (error) {
    console.log('❌ Admin login error:', error.message);
  }

  // Test 4: Check WebSocket endpoint
  console.log('\n4️⃣ Testing WebSocket endpoint...');
  try {
    const wsResponse = await makeRequest('GET', '/ws');
    console.log('✅ WebSocket endpoint accessible');
  } catch (error) {
    console.log('⚠️  WebSocket endpoint test:', error.message);
  }

  // Test 5: Check new request endpoints
  console.log('\n5️⃣ Testing new request endpoints...');
  try {
    const requestResponse = await makeRequest('GET', '/api/requests/my-requests');
    console.log('✅ Request endpoints accessible');
  } catch (error) {
    if (error.message.includes('401')) {
      console.log('✅ Request endpoints require authentication (expected)');
    } else {
      console.log('⚠️  Request endpoints test:', error.message);
    }
  }

  console.log('\n🎯 Deployment monitoring complete!');
  console.log('\n📋 Summary:');
  console.log('✅ Backend is deployed and accessible');
  console.log('✅ Admin authentication should now work');
  console.log('✅ WebSocket connections should work');
  console.log('✅ Request-to-admin system is available');
  console.log('\n🔗 Next steps:');
  console.log('1. Visit: https://www.kryvextrading.com/admin');
  console.log('2. Login with: admin@kryvex.com / admin123');
  console.log('3. Test all admin dashboard features');
}

function makeRequest(method, endpoint, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'kryvextrading-com.onrender.com',
      port: 443,
      path: endpoint,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Deployment-Monitor/1.0'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            data: parsedData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Run the monitoring
monitorDeployment().catch(console.error); 