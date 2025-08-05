const { Pool } = require('pg');

// Test the exact same database connection that the backend uses
const pool = new Pool({
  connectionString: 'postgresql://postgres:LRlilbdBuMHFGRYCWJCCINPVqQQcTwhV@caboose.proxy.rlwy.net:24641/kryvex_trading'
});

async function testBackendDatabaseConnection() {
  console.log('🔍 Testing Backend Database Connection...\n');

  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing database connection...');
    const client = await pool.connect();
    console.log('✅ Database connection successful');

    // Test 2: Check if admin user exists
    console.log('\n2️⃣ Checking admin user...');
    const adminCheck = await client.query(
      'SELECT id, email, first_name, last_name, is_admin, is_active FROM users WHERE email = $1',
      ['admin@kryvex.com']
    );

    if (adminCheck.rows.length > 0) {
      const admin = adminCheck.rows[0];
      console.log('✅ Admin user found:');
      console.log(`   ID: ${admin.id}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Name: ${admin.first_name} ${admin.last_name}`);
      console.log(`   Is Admin: ${admin.is_admin}`);
      console.log(`   Is Active: ${admin.is_active}`);
    } else {
      console.log('❌ Admin user not found');
    }

    // Test 3: Check total users
    console.log('\n3️⃣ Checking total users...');
    const userCount = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`📊 Total users: ${userCount.rows[0].count}`);

    // Test 4: Check tables
    console.log('\n4️⃣ Checking tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Tables found:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // Test 5: Test password hashing (simulate login)
    console.log('\n5️⃣ Testing password verification...');
    const bcrypt = require('bcrypt');
    const testPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    const isMatch = await bcrypt.compare(testPassword, hashedPassword);
    console.log(`✅ Password hashing test: ${isMatch ? 'PASS' : 'FAIL'}`);

    client.release();
    console.log('\n🎯 Database connection test complete!');

  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

// Run the test
testBackendDatabaseConnection().catch(console.error); 