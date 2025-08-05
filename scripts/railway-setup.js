const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚂 Railway PostgreSQL Setup');
console.log('===========================\n');

// Railway connection template
const RAILWAY_CONFIG = {
  // These will be provided by Railway
  host: 'your_railway_host',
  port: 5432,
  user: 'postgres',
  password: 'your_railway_password',
  database: 'railway'
};

console.log('📋 Railway Setup Instructions:');
console.log('==============================\n');

console.log('1. 🌐 Create Railway PostgreSQL Database:');
console.log('   - Go to https://railway.app');
console.log('   - Sign in with GitHub');
console.log('   - Click "New Project"');
console.log('   - Select "Provision PostgreSQL"');
console.log('   - Wait for database to be created');

console.log('\n2. 🔗 Get Connection Details:');
console.log('   - Click on your PostgreSQL service');
console.log('   - Go to "Connect" tab');
console.log('   - Copy the connection URL');
console.log('   - Format: postgresql://user:password@host:port/railway');

console.log('\n3. 📤 Import Your Database:');
console.log('   - Use pgAdmin or psql to connect');
console.log('   - Import the kryvex_trading_backup.sql file');

console.log('\n4. 🔧 Update Render Environment Variables:');
console.log('   - Go to your Render backend service');
console.log('   - Add environment variable:');
console.log('     DATABASE_URL = ${{ Postgres.DATABASE_URL }}');

console.log('\n🔧 Manual Import Commands:');
console.log('==========================');

// Import commands
console.log('\n1. Using psql (if you have the connection string):');
console.log('psql "postgresql://user:password@host:port/railway" < kryvex_trading_backup.sql');

console.log('\n2. Using pgAdmin:');
console.log('- Create new server connection to Railway');
console.log('- Use Railway connection details');
console.log('- Right-click on railway database');
console.log('- Select "Query Tool"');
console.log('- Open and run kryvex_trading_backup.sql');

console.log('\n3. Using Railway CLI:');
console.log('railway login');
console.log('railway link');
console.log('railway up');

console.log('\n📋 Environment Variables for Render:');
console.log('=====================================');

console.log('\nBackend (.env):');
console.log('DATABASE_URL=${{ Postgres.DATABASE_URL }}');
console.log('DB_HOST=your_railway_host');
console.log('DB_PORT=5432');
console.log('DB_USER=postgres');
console.log('DB_PASSWORD=your_railway_password');
console.log('DB_NAME=railway');

console.log('\nFrontend (.env):');
console.log('VITE_API_URL=https://kryvextrading-com.onrender.com');
console.log('VITE_WS_URL=wss://kryvextrading-com.onrender.com');

console.log('\n🔍 Test Connection Script:');
console.log('==========================');

// Test connection function
function testRailwayConnection() {
  const testQuery = `
    SELECT 
      current_database() as database_name,
      current_user as current_user,
      version() as postgres_version,
      (SELECT count(*) FROM information_schema.tables) as table_count
  `;
  
  console.log('\n📊 Railway Connection Test:');
  console.log('============================');
  console.log('Run this query in Railway to test:');
  console.log(testQuery);
  
  console.log('\nExpected Results:');
  console.log('- database_name: railway');
  console.log('- current_user: postgres');
  console.log('- table_count: should show your imported tables');
}

testRailwayConnection();

console.log('\n🎯 Migration Checklist:');
console.log('=======================');
console.log('□ Export local database');
console.log('□ Create Railway PostgreSQL');
console.log('□ Import SQL file to Railway');
console.log('□ Update Render environment variables');
console.log('□ Test database connection');
console.log('□ Deploy backend to Render');
console.log('□ Test frontend connection');

console.log('\n⚠️  Important Notes:');
console.log('===================');
console.log('- Keep your Railway connection URL secure');
console.log('- The DATABASE_URL will be automatically injected by Railway');
console.log('- Your backend code should use process.env.DATABASE_URL');
console.log('- SSL is automatically handled by Railway');
console.log('- Backup your local database before migration');

console.log('\n🚀 Ready to migrate to Railway!'); 