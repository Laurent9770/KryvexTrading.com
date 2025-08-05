const https = require('https');

async function waitForDeployment() {
  console.log('⏳ Waiting for deployment to complete...\n');
  
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`🔄 Attempt ${attempts}/${maxAttempts} - Testing admin login...`);
    
    try {
      const loginResponse = await makeRequest('POST', '/api/admin/login', {
        email: 'admin@kryvex.com',
        password: 'admin123'
      });
      
      if (loginResponse.statusCode === 200) {
        console.log('🎉 SUCCESS! Admin login is now working!');
        console.log('✅ Deployment completed successfully');
        console.log('🔑 Token received:', loginResponse.data.data.token ? 'Yes' : 'No');
        
        // Test admin endpoint
        const token = loginResponse.data.data.token;
        const adminResponse = await makeRequest('GET', '/api/admin/users', null, token);
        
        if (adminResponse.statusCode === 200) {
          console.log('✅ Admin dashboard should now work properly!');
          console.log(`📊 Users found: ${adminResponse.data.data?.length || 0}`);
        }
        
        console.log('\n🎯 All systems are now operational!');
        console.log('🔗 Visit: https://www.kryvextrading.com/admin');
        console.log('🔑 Login: admin@kryvex.com / admin123');
        return;
      } else {
        console.log(`❌ Still getting ${loginResponse.statusCode} error`);
        console.log('📋 Response:', JSON.stringify(loginResponse.data, null, 2));
      }
      
    } catch (error) {
      console.log(`❌ Error on attempt ${attempts}:`, error.message);
    }
    
    if (attempts < maxAttempts) {
      console.log('⏳ Waiting 30 seconds before next attempt...\n');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
  
  console.log('❌ Deployment monitoring timed out');
  console.log('💡 Please check Render dashboard for deployment status');
  console.log('🔗 https://dashboard.render.com/web/kryvextrading-com');
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
        'User-Agent': 'Deployment-Waiter/1.0'
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

// Run the wait script
waitForDeployment().catch(console.error); 