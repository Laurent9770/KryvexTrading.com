const { Pool } = require('pg');

console.log('🔍 Testing Backend Configuration');
console.log('==================================\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('PORT:', process.env.PORT || 'not set');
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN || 'not set');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'set' : 'not set');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'set' : 'not set');

// Test database connection
async function testDatabaseConnection() {
  console.log('\n🗄️ Testing Database Connection:');
  
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL not set');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Test a simple query
    const result = await client.query('SELECT COUNT(*) as user_count FROM users');
    console.log('📊 Users in database:', result.rows[0].user_count);
    
    // Check for admin user
    const adminResult = await client.query("SELECT id, email, is_admin FROM users WHERE is_admin = true");
    console.log('👑 Admin users found:', adminResult.rows.length);
    
    if (adminResult.rows.length > 0) {
      console.log('Admin details:', adminResult.rows[0]);
    }
    
    client.release();
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
  } finally {
    await pool.end();
  }
}

// Test backend health endpoint
async function testBackendHealth() {
  console.log('\n🏥 Testing Backend Health:');
  
  try {
    const response = await fetch('https://kryvextrading-com.onrender.com/api/health');
    console.log('Status:', response.status);
    console.log('OK:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response:', data);
    } else {
      console.log('Response text:', await response.text());
    }
  } catch (error) {
    console.log('❌ Backend health check failed:', error.message);
  }
}

// Run tests
async function runTests() {
  await testDatabaseConnection();
  await testBackendHealth();
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Check Render dashboard for backend service');
  console.log('2. Verify environment variables are set');
  console.log('3. Check deployment logs for errors');
  console.log('4. Ensure database is accessible');
}

runTests(); 