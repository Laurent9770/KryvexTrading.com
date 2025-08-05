const { Pool } = require('pg');

console.log('🔗 Railway Database Import Test');
console.log('================================\n');

// Instructions for testing Railway connection
console.log('📋 How to test Railway connection:');
console.log('==================================');

console.log('\n1. 🔧 Set your Railway DATABASE_URL:');
console.log('   For Windows (PowerShell):');
console.log('   $env:DATABASE_URL="postgresql://user:password@host:port/railway"');
console.log('');
console.log('   For Windows (Command Prompt):');
console.log('   set DATABASE_URL=postgresql://user:password@host:port/railway"');
console.log('');
console.log('   For Linux/Mac:');
console.log('   export DATABASE_URL="postgresql://user:password@host:port/railway"');

console.log('\n2. 🧪 Run the connection test:');
console.log('   node scripts/test-railway-connection.js');

console.log('\n3. 📊 Expected Results:');
console.log('   - Database name: railway');
console.log('   - User: postgres');
console.log('   - Tables: 7 tables from your schema');
console.log('   - All tables should have proper structure');

console.log('\n🔍 Import Verification:');
console.log('======================');

// Test function (uncomment to run)
async function testRailwayImport() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🔍 Testing Railway database import...');
    
    const client = await pool.connect();
    console.log('✅ Connected to Railway PostgreSQL!');
    
    // Test database info
    const dbInfo = await client.query(`
      SELECT 
        current_database() as database_name,
        current_user as current_user,
        version() as postgres_version
    `);
    
    console.log('\n📊 Database Information:');
    console.log(`Database: ${dbInfo.rows[0].database_name}`);
    console.log(`User: ${dbInfo.rows[0].current_user}`);
    console.log(`Version: ${dbInfo.rows[0].postgres_version.split(' ')[0]}`);
    
    // Test table count
    const tableCount = await client.query(`
      SELECT count(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log(`\n📋 Tables found: ${tableCount.rows[0].table_count}`);
    
    // List all tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tables in database:');
    tables.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.table_name}`);
    });
    
    // Test specific tables
    const expectedTables = ['users', 'wallets', 'trades', 'transactions', 'admin_actions', 'profiles'];
    
    console.log('\n🔍 Checking expected tables:');
    for (const tableName of expectedTables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
        console.log(`✅ ${tableName}: ${result.rows[0].count} records`);
      } catch (error) {
        console.log(`❌ ${tableName}: Table not found or error`);
      }
    }
    
    client.release();
    console.log('\n✅ Railway import test completed successfully!');
    
  } catch (error) {
    console.error('❌ Railway import test failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Check your DATABASE_URL environment variable');
    console.log('2. Verify Railway PostgreSQL is running');
    console.log('3. Ensure database has been imported');
    console.log('4. Check SSL configuration');
  } finally {
    await pool.end();
  }
}

// Uncomment to run the test
// testRailwayImport();

console.log('\n🎯 Next Steps After Import:');
console.log('============================');
console.log('1. ✅ Test Railway connection');
console.log('2. 🔄 Update Render environment variables');
console.log('3. 🚀 Deploy backend to Render');
console.log('4. 🚀 Deploy frontend to Render');
console.log('5. 🧪 Test admin dashboard');
console.log('6. 🧪 Test all functionality');

console.log('\n🚀 Ready to test Railway import!');
console.log('Set your DATABASE_URL and run the test function.'); 