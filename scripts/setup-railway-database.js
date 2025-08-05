const { Pool } = require('pg');

// First connect to the default postgres database
const defaultPool = new Pool({
  connectionString: 'postgresql://postgres:LRlilbdBuMHFGRYCWJCCINPVqQQcTwhV@caboose.proxy.rlwy.net:24641/postgres'
});

async function setupRailwayDatabase() {
  console.log('🔧 Setting up Railway Database...\n');

  try {
    // Step 1: Connect to default postgres database
    console.log('1️⃣ Connecting to Railway PostgreSQL...');
    const client = await defaultPool.connect();
    console.log('✅ Connected to Railway PostgreSQL');

    // Step 2: Create our database if it doesn't exist
    console.log('\n2️⃣ Creating kryvex_trading database...');
    try {
      await client.query('CREATE DATABASE kryvex_trading');
      console.log('✅ Database kryvex_trading created successfully');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Database kryvex_trading already exists');
      } else {
        throw error;
      }
    }

    client.release();
    await defaultPool.end();

    // Step 3: Connect to our new database
    console.log('\n3️⃣ Connecting to kryvex_trading database...');
    const kryvexPool = new Pool({
      connectionString: 'postgresql://postgres:LRlilbdBuMHFGRYCWJCCINPVqQQcTwhV@caboose.proxy.rlwy.net:24641/kryvex_trading'
    });

    const kryvexClient = await kryvexPool.connect();
    console.log('✅ Connected to kryvex_trading database');

    // Step 4: Check if tables exist
    console.log('\n4️⃣ Checking existing tables...');
    const tablesResult = await kryvexClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const existingTables = tablesResult.rows.map(row => row.table_name);
    console.log('📋 Existing tables:', existingTables);

    if (existingTables.length === 0) {
      console.log('\n5️⃣ No tables found. Creating schema...');
      
      // Read and execute the schema file
      const fs = require('fs');
      const path = require('path');
      const schemaPath = path.join(__dirname, '../backend/database/schema.sql');
      
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = schema.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
          if (statement.trim()) {
            try {
              await kryvexClient.query(statement);
              console.log('✅ Executed schema statement');
            } catch (error) {
              console.log('⚠️  Schema statement error (continuing):', error.message);
            }
          }
        }
        
        console.log('✅ Schema created successfully');
      } else {
        console.log('❌ Schema file not found at:', schemaPath);
      }
    } else {
      console.log('✅ Tables already exist');
    }

    // Step 5: Create admin user
    console.log('\n6️⃣ Creating admin user...');
    const adminCheck = await kryvexClient.query(
      'SELECT id, email, is_admin FROM users WHERE email = $1',
      ['admin@kryvex.com']
    );

    if (adminCheck.rows.length === 0) {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const insertResult = await kryvexClient.query(
        `INSERT INTO users (
          email, password_hash, first_name, last_name, is_admin, is_active, is_verified, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING id`,
        ['admin@kryvex.com', hashedPassword, 'Admin', 'User', true, true, true]
      );
      
      console.log('✅ Admin user created');
      
      // Create wallets for admin
      const adminId = insertResult.rows[0].id;
      const wallets = ['USDT', 'BTC', 'ETH'];
      
      for (const asset of wallets) {
        await kryvexClient.query(
          `INSERT INTO wallets (user_id, asset, balance, created_at, updated_at) 
           VALUES ($1, $2, $3, NOW(), NOW())`,
          [adminId, asset, 0]
        );
      }
      
      console.log('✅ Admin wallets created');
    } else {
      console.log('✅ Admin user already exists');
    }

    // Step 6: Final check
    console.log('\n7️⃣ Final database check...');
    const userCount = await kryvexClient.query('SELECT COUNT(*) as count FROM users');
    const tableCount = await kryvexClient.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log(`📊 Total users: ${userCount.rows[0].count}`);
    console.log(`📋 Total tables: ${tableCount.rows[0].count}`);

    kryvexClient.release();
    await kryvexPool.end();

    console.log('\n🎯 Railway database setup complete!');
    console.log('🔑 Admin credentials: admin@kryvex.com / admin123');

  } catch (error) {
    console.error('❌ Setup error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the setup
setupRailwayDatabase().catch(console.error); 