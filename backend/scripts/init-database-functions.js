const { Pool } = require('pg');

async function initDatabaseFunctions() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔧 Initializing database functions...');
    
    const client = await pool.connect();
    
    // Create cleanup function
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
          END LOOP;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    // Create storage usage function
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
          END LOOP;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ Database functions initialized successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize database functions:', error);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  initDatabaseFunctions();
}

module.exports = { initDatabaseFunctions }; 