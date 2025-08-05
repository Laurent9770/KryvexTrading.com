const { Pool } = require('pg');

// Railway PostgreSQL connection
const pool = new Pool({
  connectionString: 'postgresql://postgres:LRlilbdBuMHFGRYCWJCCINPVqQQcTwhV@caboose.proxy.rlwy.net:24641/kryvex_trading'
});

async function checkAndCreateAdminUser() {
  console.log('🔍 Checking Admin User in Database...\n');

  try {
    // Test database connection
    console.log('1️⃣ Testing database connection...');
    const client = await pool.connect();
    console.log('✅ Database connected successfully');

    // Check if admin user exists
    console.log('\n2️⃣ Checking if admin user exists...');
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
      
      if (!admin.is_admin) {
        console.log('\n⚠️  User exists but is not an admin. Updating...');
        await client.query(
          'UPDATE users SET is_admin = true WHERE email = $1',
          ['admin@kryvex.com']
        );
        console.log('✅ Updated user to admin role');
      }
    } else {
      console.log('❌ Admin user not found. Creating...');
      
      // Create admin user
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const insertResult = await client.query(
        `INSERT INTO users (
          email, 
          password, 
          first_name, 
          last_name, 
          is_admin, 
          is_active, 
          is_verified,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING id`,
        [
          'admin@kryvex.com',
          hashedPassword,
          'Admin',
          'User',
          true,
          true,
          true
        ]
      );
      
      console.log('✅ Admin user created successfully');
      console.log(`   ID: ${insertResult.rows[0].id}`);
      
      // Create default wallets for admin
      console.log('\n3️⃣ Creating default wallets for admin...');
      const adminId = insertResult.rows[0].id;
      
      const wallets = [
        { asset: 'USDT', balance: 0 },
        { asset: 'BTC', balance: 0 },
        { asset: 'ETH', balance: 0 }
      ];
      
      for (const wallet of wallets) {
        await client.query(
          `INSERT INTO wallets (user_id, asset, balance, created_at, updated_at) 
           VALUES ($1, $2, $3, NOW(), NOW())`,
          [adminId, wallet.asset, wallet.balance]
        );
      }
      
      console.log('✅ Default wallets created for admin');
    }

    // Check total users
    console.log('\n4️⃣ Checking total users in database...');
    const userCount = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`📊 Total users: ${userCount.rows[0].count}`);

    // Check admin users
    const adminCount = await client.query('SELECT COUNT(*) as count FROM users WHERE is_admin = true');
    console.log(`👑 Admin users: ${adminCount.rows[0].count}`);

    client.release();
    console.log('\n🎯 Database check complete!');

  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

// Run the check
checkAndCreateAdminUser().catch(console.error); 