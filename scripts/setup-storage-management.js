const { Pool } = require('pg');

// Railway PostgreSQL connection
const pool = new Pool({
  connectionString: 'postgresql://postgres:LRlilbdBuMHFGRYCWJCCINPVqQQcTwhV@caboose.proxy.rlwy.net:24641/kryvex_trading'
});

async function setupStorageManagement() {
  console.log('🔧 Setting up Storage Management System...\n');

  try {
    const client = await pool.connect();
    console.log('✅ Connected to database');

    // Check if data_retention_config table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'data_retention_config'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('📋 Creating data retention configuration...');
      
      // Create data retention config table
      await client.query(`
        CREATE TABLE IF NOT EXISTS data_retention_config (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          table_name VARCHAR(100) NOT NULL,
          retention_days INTEGER NOT NULL DEFAULT 365,
          max_records INTEGER DEFAULT 10000,
          cleanup_enabled BOOLEAN DEFAULT TRUE,
          last_cleanup_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(table_name)
        );
      `);

      // Insert default retention policies
      await client.query(`
        INSERT INTO data_retention_config (table_name, retention_days, max_records, cleanup_enabled) VALUES
        ('user_sessions', 30, 5000, TRUE),
        ('audit_logs', 365, 10000, TRUE),
        ('admin_requests', 90, 2000, TRUE),
        ('notifications', 180, 5000, TRUE),
        ('chat_messages', 90, 10000, TRUE),
        ('trade_history', 365, 20000, TRUE),
        ('transactions', 365, 15000, TRUE),
        ('admin_fund_actions', 365, 5000, TRUE),
        ('kyc_submissions', 365, 3000, TRUE),
        ('deposits', 365, 5000, TRUE),
        ('withdrawals', 365, 5000, TRUE);
      `);

      console.log('✅ Data retention configuration created');
    } else {
      console.log('✅ Data retention configuration already exists');
    }

    // Check if user_activity_log table exists
    const activityCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_activity_log'
      );
    `);

    if (!activityCheck.rows[0].exists) {
      console.log('📋 Creating user activity log...');
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_activity_log (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          activity_type VARCHAR(50) NOT NULL,
          activity_details JSONB,
          ip_address INET,
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create indexes
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON user_activity_log(created_at);
        CREATE INDEX IF NOT EXISTS idx_user_activity_log_type ON user_activity_log(activity_type);
      `);

      console.log('✅ User activity log created');
    } else {
      console.log('✅ User activity log already exists');
    }

    // Check if storage_usage table exists
    const storageCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'storage_usage'
      );
    `);

    if (!storageCheck.rows[0].exists) {
      console.log('📋 Creating storage usage tracking...');
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS storage_usage (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          table_name VARCHAR(100) NOT NULL,
          record_count INTEGER NOT NULL,
          estimated_size_mb DECIMAL(10,2),
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(table_name)
        );
      `);

      console.log('✅ Storage usage tracking created');
    } else {
      console.log('✅ Storage usage tracking already exists');
    }

    // Create cleanup function if it doesn't exist
    console.log('📋 Creating cleanup functions...');
    
    await client.query(`
      CREATE OR REPLACE FUNCTION cleanup_old_data()
      RETURNS void AS $$
      DECLARE
          config_record RECORD;
          deleted_count INTEGER;
          total_count INTEGER;
      BEGIN
          -- Loop through all retention configs
          FOR config_record IN 
              SELECT * FROM data_retention_config WHERE cleanup_enabled = TRUE
          LOOP
              -- Check if table exists before processing
              IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = config_record.table_name) THEN
                  -- Get total count for this table
                  EXECUTE format('SELECT COUNT(*) FROM %I', config_record.table_name) INTO total_count;
                  
                  -- If we have more records than max_records, delete oldest ones
                  IF total_count > config_record.max_records THEN
                      EXECUTE format(
                          'DELETE FROM %I WHERE created_at < CURRENT_TIMESTAMP - INTERVAL ''%s days'' 
                           AND id IN (
                               SELECT id FROM %I 
                               ORDER BY created_at ASC 
                               LIMIT %s
                           )',
                          config_record.table_name,
                          config_record.retention_days,
                          config_record.table_name,
                          total_count - config_record.max_records
                      );
                      
                      GET DIAGNOSTICS deleted_count = ROW_COUNT;
                      
                      -- Update last cleanup time
                      UPDATE data_retention_config 
                      SET last_cleanup_at = CURRENT_TIMESTAMP,
                          updated_at = CURRENT_TIMESTAMP
                      WHERE table_name = config_record.table_name;
                      
                      RAISE NOTICE 'Cleaned up % records from %', deleted_count, config_record.table_name;
                  END IF;
              ELSE
                  RAISE NOTICE 'Table % does not exist, skipping', config_record.table_name;
              END IF;
          END LOOP;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      CREATE OR REPLACE FUNCTION update_storage_usage()
      RETURNS void AS $$
      DECLARE
          table_record RECORD;
          record_count INTEGER;
          estimated_size DECIMAL(10,2);
      BEGIN
          -- Loop through all tables we want to track
          FOR table_record IN 
              SELECT table_name FROM data_retention_config
          LOOP
              -- Check if table exists before processing
              IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_record.table_name) THEN
                  -- Get record count
                  EXECUTE format('SELECT COUNT(*) FROM %I', table_record.table_name) INTO record_count;
                  
                  -- Estimate size (rough calculation: 1KB per record average)
                  estimated_size := (record_count * 1.0) / 1024.0;
                  
                  -- Insert or update storage usage
                  INSERT INTO storage_usage (table_name, record_count, estimated_size_mb, last_updated)
                  VALUES (table_record.table_name, record_count, estimated_size, CURRENT_TIMESTAMP)
                  ON CONFLICT (table_name) 
                  DO UPDATE SET 
                      record_count = EXCLUDED.record_count,
                      estimated_size_mb = EXCLUDED.estimated_size_mb,
                      last_updated = CURRENT_TIMESTAMP;
              ELSE
                  RAISE NOTICE 'Table % does not exist, skipping storage update', table_record.table_name;
              END IF;
          END LOOP;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ Cleanup functions created');

    // Run initial storage usage update
    console.log('📊 Updating initial storage usage...');
    await client.query('SELECT update_storage_usage()');
    console.log('✅ Initial storage usage updated');

    // Get current storage status
    const storageStatus = await client.query(`
      SELECT 
        su.table_name,
        su.record_count,
        su.estimated_size_mb,
        drc.retention_days,
        drc.max_records
      FROM storage_usage su
      LEFT JOIN data_retention_config drc ON su.table_name = drc.table_name
      ORDER BY su.estimated_size_mb DESC
    `);

    console.log('\n📊 Current Storage Status:');
    storageStatus.rows.forEach(row => {
      const usagePercent = (row.record_count / row.max_records) * 100;
      console.log(`   ${row.table_name}: ${row.record_count} records (${usagePercent.toFixed(1)}% of max), ${row.estimated_size_mb} MB`);
    });

    client.release();
    console.log('\n🎯 Storage management setup complete!');

  } catch (error) {
    console.error('❌ Setup error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

// Run the setup
setupStorageManagement().catch(console.error); 