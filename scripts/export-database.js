const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Database configuration
const DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'your_local_password', // Update this with your local PostgreSQL password
  database: 'kryvex_trading'
};

// Export filename
const EXPORT_FILE = 'kryvex_trading_backup.sql';
const EXPORT_PATH = path.join(__dirname, EXPORT_FILE);

console.log('🗄️  Database Export Script');
console.log('==========================\n');

// Build pg_dump command
const pgDumpCommand = `pg_dump -h ${DB_CONFIG.host} -p ${DB_CONFIG.port} -U ${DB_CONFIG.user} -d ${DB_CONFIG.database} --no-password > "${EXPORT_PATH}"`;

console.log('📋 Export Configuration:');
console.log(`Host: ${DB_CONFIG.host}`);
console.log(`Port: ${DB_CONFIG.port}`);
console.log(`Database: ${DB_CONFIG.database}`);
console.log(`Export File: ${EXPORT_PATH}`);
console.log('\n⚠️  IMPORTANT: Update the password in this script before running!');
console.log('\n🔧 Manual Export Commands:');
console.log('==========================');

// Alternative manual commands
console.log('\n1. Using pg_dump (recommended):');
console.log(`pg_dump -h ${DB_CONFIG.host} -p ${DB_CONFIG.port} -U ${DB_CONFIG.user} -d ${DB_CONFIG.database} > ${EXPORT_FILE}`);

console.log('\n2. Using pgAdmin:');
console.log('- Right-click on kryvex_trading database');
console.log('- Select "Backup..."');
console.log('- Format: Plain');
console.log('- Filename: kryvex_trading_backup.sql');
console.log('- Click "Backup"');

console.log('\n3. Using psql (if you have direct access):');
console.log(`psql -h ${DB_CONFIG.host} -U ${DB_CONFIG.user} -d ${DB_CONFIG.database} -c "\\copy (SELECT * FROM users) TO 'users_export.csv' CSV HEADER"`);

console.log('\n📁 Export File Location:');
console.log(`Full path: ${EXPORT_PATH}`);
console.log(`Relative path: scripts/${EXPORT_FILE}`);

console.log('\n🎯 Next Steps:');
console.log('==============');
console.log('1. Update the password in this script');
console.log('2. Run: node scripts/export-database.js');
console.log('3. Upload the SQL file to Railway');
console.log('4. Update Render environment variables');

// Function to execute the export (commented out for safety)
function executeExport() {
  console.log('\n🚀 Executing database export...');
  
  exec(pgDumpCommand, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Export failed:', error.message);
      console.log('\n💡 Try running manually:');
      console.log(pgDumpCommand);
      return;
    }
    
    if (stderr) {
      console.log('⚠️  Warnings:', stderr);
    }
    
    console.log('✅ Database exported successfully!');
    console.log(`📁 File saved to: ${EXPORT_PATH}`);
    
    // Check file size
    const stats = fs.statSync(EXPORT_PATH);
    console.log(`📊 File size: ${(stats.size / 1024).toFixed(2)} KB`);
    
    console.log('\n🎯 Ready for Railway upload!');
  });
}

// Uncomment the line below to enable automatic export
// executeExport();

console.log('\n🔒 Security Note:');
console.log('==================');
console.log('- The exported SQL file contains sensitive data');
console.log('- Keep it secure and delete after Railway import');
console.log('- Never commit this file to version control'); 