const { Pool } = require('pg');

console.log('🔗 Railway Database Connection Test');
console.log('===================================\n');

// This script will be used after Railway is set up
// Replace with your actual Railway connection details
const RAILWAY_CONFIG = {
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@host:port/railway',
  ssl: {
    rejectUnauthorized: false
  }
};

async function testRailwayConnection() {
  const pool = new Pool(RAILWAY_CONFIG);
  
  try {
    console.log('🔍 Testing Railway database connection...');
    
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Connected to Railway PostgreSQL successfully!');
    
    // Test database info
    const dbInfo = await client.query(`
      SELECT 
        current_database() as database_name,
        current_user as current_user,
        version() as postgres_version
    `);
    
    console.log('\n📊 Database Information:');
    console.log('========================');
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
    
    // Test specific tables from your schema
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
    
    // Test admin user
    try {
      const adminUser = await client.query(`
        SELECT id, email, admin, created_at 
        FROM users 
        WHERE admin = true 
        LIMIT 1
      `);
      
      if (adminUser.rows.length > 0) {
        console.log('\n👤 Admin user found:');
        console.log(`Email: ${adminUser.rows[0].email}`);
        console.log(`Admin: ${adminUser.rows[0].admin}`);
        console.log(`Created: ${adminUser.rows[0].created_at}`);
      } else {
        console.log('\n⚠️  No admin user found');
      }
    } catch (error) {
      console.log('\n❌ Error checking admin user:', error.message);
    }
    
    client.release();
    console.log('\n✅ Railway connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Railway connection failed:', error.message);
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Check your DATABASE_URL environment variable');
    console.log('2. Verify Railway PostgreSQL is running');
    console.log('3. Ensure SSL is properly configured');
    console.log('4. Check if the database has been imported');
  } finally {
    await pool.end();
  }
}

// Instructions for using this script
console.log('📋 How to use this script:');
console.log('==========================');
console.log('1. Set your Railway DATABASE_URL environment variable');
console.log('2. Run: node scripts/test-railway-connection.js');
console.log('3. Or set DATABASE_URL in your shell:');
console.log('   export DATABASE_URL="postgresql://user:password@host:port/railway"');

console.log('\n🔧 Environment Variable Setup:');
console.log('==============================');
console.log('For Windows (PowerShell):');
console.log('$env:DATABASE_URL="postgresql://user:password@host:port/railway"');
console.log('');
console.log('For Windows (Command Prompt):');
console.log('set DATABASE_URL=postgresql://user:password@host:port/railway');
console.log('');
console.log('For Linux/Mac:');
console.log('export DATABASE_URL="postgresql://user:password@host:port/railway"');

console.log('\n🎯 Expected Results:');
console.log('===================');
console.log('- Database name: railway');
console.log('- User: postgres');
console.log('- Tables: 7+ tables from your schema');
console.log('- Admin user: Should be present');
console.log('- All tables: Should have proper structure');

// Uncomment to run the test
// testRailwayConnection();

console.log('\n🚀 Ready to test Railway connection!');
console.log('Set your DATABASE_URL and run the test function.'); 