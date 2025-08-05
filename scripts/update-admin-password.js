const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Railway PostgreSQL connection
const pool = new Pool({
  connectionString: 'postgresql://postgres:LRlilbdBuMHFGRYCWJCCINPVqQQcTwhV@caboose.proxy.rlwy.net:24641/kryvex_trading'
});

async function updateAdminPassword() {
  console.log('🔧 Updating Admin Password...\n');

  try {
    const client = await pool.connect();
    console.log('✅ Connected to database');

    // Check if admin user exists
    const adminCheck = await client.query(
      'SELECT id, email, password_hash FROM users WHERE email = $1',
      ['admin@kryvex.com']
    );

    if (adminCheck.rows.length > 0) {
      const admin = adminCheck.rows[0];
      console.log('✅ Admin user found:', admin.email);
      
      // Hash new password
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // Update password
      await client.query(
        'UPDATE users SET password_hash = $1 WHERE email = $2',
        [hashedPassword, 'admin@kryvex.com']
      );
      
      console.log('✅ Admin password updated successfully');
      console.log('🔑 New credentials: admin@kryvex.com / admin123');
    } else {
      console.log('❌ Admin user not found');
    }

    client.release();
    console.log('\n🎯 Password update complete!');

  } catch (error) {
    console.error('❌ Error updating password:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the update
updateAdminPassword().catch(console.error); 