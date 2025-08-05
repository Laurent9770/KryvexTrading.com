const https = require('https');

// Test admin authentication status
async function testAdminAuth() {
  console.log('🔍 Testing Admin Authentication Status...\n');

  // Test 1: Check if backend is accessible
  console.log('1️⃣ Testing backend accessibility...');
  try {
    const healthResponse = await makeRequest('GET', '/api/health');
    console.log('✅ Backend is accessible');
  } catch (error) {
    console.log('❌ Backend is not accessible:', error.message);
    return;
  }

  // Test 2: Check admin endpoint without auth
  console.log('\n2️⃣ Testing admin endpoint without authentication...');
  try {
    const adminResponse = await makeRequest('GET', '/api/admin/users');
    console.log('❌ Admin endpoint should require auth but returned:', adminResponse.statusCode);
  } catch (error) {
    if (error.message.includes('401')) {
      console.log('✅ Admin endpoint correctly requires authentication (401)');
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }

  // Test 3: Check admin login endpoint
  console.log('\n3️⃣ Testing admin login endpoint...');
  try {
    const loginResponse = await makeRequest('POST', '/api/admin/login', {
      email: 'admin@kryvex.com',
      password: 'admin123'
    });
    
    if (loginResponse.statusCode === 200) {
      console.log('✅ Admin login successful');
      console.log('📋 Response:', JSON.stringify(loginResponse.data, null, 2));
      
      // Test 4: Use the token to access admin endpoint
      console.log('\n4️⃣ Testing admin endpoint with authentication...');
      const token = loginResponse.data.data.token;
      const authResponse = await makeRequest('GET', '/api/admin/users', null, token);
      
      if (authResponse.statusCode === 200) {
        console.log('✅ Admin authentication working correctly');
        console.log('📋 Users found:', authResponse.data.data?.length || 0);
      } else {
        console.log('❌ Admin authentication failed:', authResponse.statusCode);
      }
    } else {
      console.log('❌ Admin login failed:', loginResponse.statusCode);
      console.log('📋 Response:', JSON.stringify(loginResponse.data, null, 2));
    }
  } catch (error) {
    console.log('❌ Admin login error:', error.message);
  }

  console.log('\n🎯 Diagnosis Complete!');
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
        'User-Agent': 'Admin-Auth-Test/1.0'
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

// Run the test
testAdminAuth().catch(console.error); 