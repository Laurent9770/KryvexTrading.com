const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'kryvex_trading',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'your_password',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

async function setupDatabase() {
  const pool = new Pool(dbConfig);

  try {
    console.log('🚀 Starting database setup...');

    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');

    // Read schema file
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📖 Reading schema file...');

    // Execute schema
    console.log('🔧 Executing database schema...');
    await client.query(schema);
    console.log('✅ Database schema executed successfully');

    // Verify tables were created
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('📊 Created tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Verify admin user was created
    const adminResult = await client.query(`
      SELECT email, first_name, last_name, is_admin 
      FROM users 
      WHERE email = 'admin@kryvex.com'
    `);

    if (adminResult.rows.length > 0) {
      console.log('👤 Admin user created:');
      console.log(`  - Email: ${adminResult.rows[0].email}`);
      console.log(`  - Name: ${adminResult.rows[0].first_name} ${adminResult.rows[0].last_name}`);
      console.log(`  - Admin: ${adminResult.rows[0].is_admin}`);
      console.log('🔑 Admin password: Kryvex.@123');
    }

    // Verify system settings
    const settingsResult = await client.query(`
      SELECT key, value 
      FROM system_settings 
      ORDER BY key
    `);

    console.log('⚙️ System settings:');
    settingsResult.rows.forEach(row => {
      console.log(`  - ${row.key}: ${row.value}`);
    });

    // Verify trading pairs
    const pairsResult = await client.query(`
      SELECT symbol, base_asset, quote_asset 
      FROM trading_pairs 
      ORDER BY symbol
    `);

    console.log('💱 Trading pairs:');
    pairsResult.rows.forEach(row => {
      console.log(`  - ${row.symbol} (${row.base_asset}/${row.quote_asset})`);
    });

    // Verify chat rooms
    const roomsResult = await client.query(`
      SELECT name, description, is_admin_only 
      FROM chat_rooms 
      ORDER BY name
    `);

    console.log('💬 Chat rooms:');
    roomsResult.rows.forEach(row => {
      console.log(`  - ${row.name}: ${row.description} ${row.is_admin_only ? '(Admin only)' : ''}`);
    });

    client.release();
    console.log('✅ Database setup completed successfully!');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure PostgreSQL is running and accessible');
      console.error('💡 Check your database configuration in .env file');
    }
    
    if (error.code === '3D000') {
      console.error('💡 Database does not exist. Create it first:');
      console.error('   createdb kryvex_trading');
    }

    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase }; 