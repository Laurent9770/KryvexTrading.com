const https = require('https');

async function debugAdminLogin() {
  console.log('🔍 Debugging Admin Login...\n');

  // Test 1: Check if backend is accessible
  console.log('1️⃣ Testing backend accessibility...');
  try {
    const healthResponse = await makeRequest('GET', '/api/health');
    console.log('✅ Backend is accessible');
  } catch (error) {
    console.log('❌ Backend is not accessible:', error.message);
    return;
  }

  // Test 2: Check admin login with detailed error
  console.log('\n2️⃣ Testing admin login with detailed error...');
  try {
    const loginResponse = await makeRequest('POST', '/api/admin/login', {
      email: 'admin@kryvex.com',
      password: 'admin123'
    });
    
    console.log('📋 Response status:', loginResponse.statusCode);
    console.log('📋 Response headers:', loginResponse.headers);
    console.log('📋 Response data:', JSON.stringify(loginResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ Admin login error:', error.message);
    if (error.response) {
      console.log('📋 Error response status:', error.response.statusCode);
      console.log('📋 Error response data:', error.response.data);
    }
  }

  // Test 3: Check if admin user exists in database
  console.log('\n3️⃣ Testing database connection...');
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: 'postgresql://postgres:LRlilbdBuMHFGRYCWJCCINPVqQQcTwhV@caboose.proxy.rlwy.net:24641/kryvex_trading'
    });

    const client = await pool.connect();
    console.log('✅ Database connected');

    const adminCheck = await client.query(
      'SELECT id, email, password_hash, is_admin, is_active FROM users WHERE email = $1',
      ['admin@kryvex.com']
    );

    if (adminCheck.rows.length > 0) {
      const admin = adminCheck.rows[0];
      console.log('✅ Admin user found in database:');
      console.log(`   ID: ${admin.id}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Is Admin: ${admin.is_admin}`);
      console.log(`   Is Active: ${admin.is_active}`);
      console.log(`   Has Password Hash: ${!!admin.password_hash}`);
    } else {
      console.log('❌ Admin user not found in database');
    }

    client.release();
    await pool.end();

  } catch (error) {
    console.log('❌ Database error:', error.message);
  }

  console.log('\n🎯 Debug complete!');
}

function makeRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'kryvextrading-com.onrender.com',
      port: 443,
      path: endpoint,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Admin-Debug/1.0'
      }
    };

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
            headers: res.headers,
            data: parsedData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
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

// Run the debug
debugAdminLogin().catch(console.error); 