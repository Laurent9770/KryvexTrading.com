const { Pool } = require('pg');

console.log('🔗 Railway Database Final Test');
console.log('===============================\n');

// Railway connection details
const RAILWAY_CONFIG = {
  connectionString: 'postgresql://postgres:vxGugwCAUNCCcUbfLSaQQiFGLtxguOur@yamabiko.proxy.rlwy.net:49285/railway',
  ssl: { rejectUnauthorized: false }
};

async function testRailwayConnection() {
  const pool = new Pool(RAILWAY_CONFIG);
  
  try {
    console.log('🔍 Testing Railway database connection...');
    
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
    
    // Test specific tables and their record counts
    const expectedTables = ['users', 'wallets', 'trades', 'transactions', 'admin_actions', 'profiles', 'trade_outcome_logs'];
    
    console.log('\n🔍 Checking table records:');
    for (const tableName of expectedTables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
        console.log(`✅ ${tableName}: ${result.rows[0].count} records`);
      } catch (error) {
        console.log(`❌ ${tableName}: Table not found or error`);
      }
    }
    
    // Test admin user creation
    console.log('\n🔐 Testing admin user creation...');
    try {
      const adminCheck = await client.query(`
        SELECT id, email, role FROM users WHERE role = 'admin' LIMIT 1
      `);
      
      if (adminCheck.rows.length > 0) {
        console.log('✅ Admin user found:', adminCheck.rows[0].email);
      } else {
        console.log('⚠️  No admin user found - will need to create one');
      }
    } catch (error) {
      console.log('❌ Error checking admin user:', error.message);
    }
    
    client.release();
    console.log('\n✅ Railway database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Railway database test failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Check Railway connection URL');
    console.log('2. Verify Railway PostgreSQL is running');
    console.log('3. Check SSL configuration');
  } finally {
    await pool.end();
  }
}

// Run the test
testRailwayConnection(); 