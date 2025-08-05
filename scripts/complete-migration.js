const fs = require('fs');
const path = require('path');

console.log('🚀 Complete Railway Migration Script');
console.log('====================================\n');

// Check if backup file exists
const backupFile = 'kryvex_trading_backup.sql';
const backupPath = path.join(__dirname, '..', backupFile);

if (fs.existsSync(backupPath)) {
  const stats = fs.statSync(backupPath);
  console.log('✅ Database backup found!');
  console.log(`📁 File: ${backupFile}`);
  console.log(`📊 Size: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`📅 Created: ${stats.mtime.toLocaleString()}`);
} else {
  console.log('❌ Database backup not found!');
  console.log('Please run the export script first.');
  process.exit(1);
}

console.log('\n📋 Migration Steps:');
console.log('===================');
console.log('1. ✅ Database exported successfully');
console.log('2. 🔄 Create Railway PostgreSQL database');
console.log('3. 🔄 Import database to Railway');
console.log('4. 🔄 Update Render environment variables');
console.log('5. 🔄 Test connections');

console.log('\n🌐 Step 2: Create Railway PostgreSQL');
console.log('=====================================');
console.log('1. Go to https://railway.app');
console.log('2. Sign in with GitHub');
console.log('3. Click "New Project"');
console.log('4. Select "Provision PostgreSQL"');
console.log('5. Wait for database creation (1-2 minutes)');

console.log('\n🔗 Step 3: Get Railway Connection Details');
console.log('==========================================');
console.log('1. Click on your PostgreSQL service');
console.log('2. Go to "Connect" tab');
console.log('3. Copy the connection URL');
console.log('4. Format: postgresql://user:password@host:port/railway');

console.log('\n📤 Step 4: Import Database to Railway');
console.log('=======================================');
console.log('Option A: Using pgAdmin (Recommended)');
console.log('- Add Railway server in pgAdmin');
console.log('- Use connection details from step 3');
console.log('- Right-click on railway database');
console.log('- Select "Query Tool"');
console.log('- Open and run kryvex_trading_backup.sql');

console.log('\nOption B: Using Command Line');
console.log('psql "postgresql://user:password@host:port/railway" < kryvex_trading_backup.sql');

console.log('\n🔧 Step 5: Update Render Environment Variables');
console.log('==============================================');
console.log('Backend Environment Variables:');
console.log('DATABASE_URL = ${{ Postgres.DATABASE_URL }}');
console.log('CORS_ORIGIN = https://kryvex-frontend.onrender.com');
console.log('JWT_SECRET = 25f0cc55a6a97243f0ff4c846a21160f24da042657ad648eeb92fd3fc13f10f1cb9ee11860d5b509b8954e53545a72aa9b943a3cd6480fb95079b97d2dab8535');

console.log('\nFrontend Environment Variables:');
console.log('VITE_API_URL = https://kryvextrading-com.onrender.com');
console.log('VITE_WS_URL = wss://kryvextrading-com.onrender.com');

console.log('\n🧪 Step 6: Test Connections');
console.log('===========================');
console.log('1. Test Railway database connection');
console.log('2. Test Render backend deployment');
console.log('3. Test frontend deployment');
console.log('4. Test admin authentication');

console.log('\n📊 Database Content Summary:');
console.log('============================');

// Read and analyze the backup file
const backupContent = fs.readFileSync(backupPath, 'utf8');

// Count tables
const tableMatches = backupContent.match(/CREATE TABLE [^\(]+\(/g);
const tableCount = tableMatches ? tableMatches.length : 0;

// Count INSERT statements
const insertMatches = backupContent.match(/INSERT INTO/g);
const insertCount = insertMatches ? insertMatches.length : 0;

console.log(`📋 Tables found: ${tableCount}`);
console.log(`📝 Data records: ${insertCount}`);

// Extract table names
const tableNames = tableMatches ? tableMatches.map(match => {
  const tableName = match.replace('CREATE TABLE ', '').replace('(', '').trim();
  return tableName;
}) : [];

console.log('\n📋 Tables to be migrated:');
tableNames.forEach((table, index) => {
  console.log(`${index + 1}. ${table}`);
});

console.log('\n🎯 Migration Checklist:');
console.log('=======================');
console.log('□ Database exported successfully');
console.log('□ Railway PostgreSQL created');
console.log('□ Database imported to Railway');
console.log('□ Render environment variables updated');
console.log('□ Backend deployed to Render');
console.log('□ Frontend deployed to Render');
console.log('□ Admin authentication tested');
console.log('□ All connections verified');

console.log('\n⚠️  Important Notes:');
console.log('===================');
console.log('- Keep your Railway connection URL secure');
console.log('- The DATABASE_URL will be automatically injected by Railway');
console.log('- SSL is automatically handled by Railway');
console.log('- Delete the backup file after successful migration');
console.log('- Monitor Railway usage and costs');

console.log('\n🚀 Ready to proceed with Railway migration!');
console.log('Follow the steps above to complete the migration.'); 