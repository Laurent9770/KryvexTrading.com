const { Pool } = require('pg');

class DataManagementService {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  // Run data cleanup
  async runDataCleanup() {
    const client = await this.pool.connect();
    
    try {
      console.log('🧹 Starting data cleanup...');
      
      // Check if cleanup function exists
      const functionExists = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.routines 
          WHERE routine_name = 'cleanup_old_data' 
          AND routine_schema = 'public'
        );
      `);
      
      if (functionExists.rows[0].exists) {
        // Call the cleanup function
        await client.query('SELECT cleanup_old_data()');
        console.log('✅ Cleanup function executed');
      } else {
        console.log('⚠️ Cleanup function not found, skipping cleanup');
      }
      
      // Check if storage usage function exists
      const storageFunctionExists = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.routines 
          WHERE routine_name = 'update_storage_usage' 
          AND routine_schema = 'public'
        );
      `);
      
      if (storageFunctionExists.rows[0].exists) {
        // Update storage usage
        await client.query('SELECT update_storage_usage()');
        console.log('✅ Storage usage updated');
      } else {
        console.log('⚠️ Storage usage function not found, skipping update');
      }
      
      console.log('✅ Data cleanup completed');
      
      // Get cleanup summary
      const summary = await this.getCleanupSummary();
      return summary;
      
    } catch (error) {
      console.error('❌ Data cleanup error:', error.message);
      // Return empty summary on error
      return [];
    } finally {
      client.release();
    }
  }

  // Get cleanup summary
  async getCleanupSummary() {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT 
          table_name,
          retention_days,
          max_records,
          last_cleanup_at,
          (SELECT COUNT(*) FROM information_schema.tables t WHERE t.table_name = drc.table_name) as current_count
        FROM data_retention_config drc
        WHERE cleanup_enabled = TRUE
        ORDER BY table_name
      `;
      
      const result = await client.query(query);
      return result.rows;
      
    } finally {
      client.release();
    }
  }

  // Get storage usage statistics
  async getStorageUsage() {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT 
          table_name,
          record_count,
          estimated_size_mb,
          last_updated,
          (SELECT retention_days FROM data_retention_config WHERE table_name = su.table_name) as retention_days,
          (SELECT max_records FROM data_retention_config WHERE table_name = su.table_name) as max_records
        FROM storage_usage su
        ORDER BY estimated_size_mb DESC
      `;
      
      const result = await client.query(query);
      
      // Calculate totals
      const totalRecords = result.rows.reduce((sum, row) => sum + parseInt(row.record_count), 0);
      const totalSize = result.rows.reduce((sum, row) => sum + parseFloat(row.estimated_size_mb || 0), 0);
      
      return {
        tables: result.rows,
        totals: {
          records: totalRecords,
          size_mb: totalSize.toFixed(2)
        }
      };
      
    } finally {
      client.release();
    }
  }

  // Get user activity statistics
  async getUserActivityStats(days = 30) {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT 
          activity_type,
          COUNT(*) as activity_count,
          COUNT(DISTINCT user_id) as unique_users,
          MIN(created_at) as first_activity,
          MAX(created_at) as last_activity
        FROM user_activity_log
        WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '${days} days'
        GROUP BY activity_type
        ORDER BY activity_count DESC
      `;
      
      const result = await client.query(query);
      return result.rows;
      
    } finally {
      client.release();
    }
  }

  // Log user activity
  async logUserActivity(userId, activityType, activityDetails = {}, ipAddress = null, userAgent = null) {
    const client = await this.pool.connect();
    
    try {
      const query = `
        INSERT INTO user_activity_log (user_id, activity_type, activity_details, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5)
      `;
      
      await client.query(query, [
        userId,
        activityType,
        JSON.stringify(activityDetails),
        ipAddress,
        userAgent
      ]);
      
    } finally {
      client.release();
    }
  }

  // Get data retention configuration
  async getRetentionConfig() {
    const client = await this.pool.connect();
    
    try {
      const query = 'SELECT * FROM data_retention_config ORDER BY table_name';
      const result = await client.query(query);
      return result.rows;
      
    } finally {
      client.release();
    }
  }

  // Update retention configuration
  async updateRetentionConfig(tableName, retentionDays, maxRecords, cleanupEnabled) {
    const client = await this.pool.connect();
    
    try {
      const query = `
        UPDATE data_retention_config 
        SET retention_days = $1, max_records = $2, cleanup_enabled = $3, updated_at = CURRENT_TIMESTAMP
        WHERE table_name = $4
      `;
      
      await client.query(query, [retentionDays, maxRecords, cleanupEnabled, tableName]);
      
    } finally {
      client.release();
    }
  }

  // Get system health metrics
  async getSystemHealth() {
    const client = await this.pool.connect();
    
    try {
      // Get user count
      const userCount = await client.query('SELECT COUNT(*) as count FROM users');
      
      // Get active sessions
      const activeSessions = await client.query(`
        SELECT COUNT(*) as count FROM user_sessions 
        WHERE is_active = TRUE AND last_activity > CURRENT_TIMESTAMP - INTERVAL '24 hours'
      `);
      
      // Get storage usage
      const storageUsage = await this.getStorageUsage();
      
      // Get recent activity
      const recentActivity = await client.query(`
        SELECT COUNT(*) as count FROM user_activity_log 
        WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
      `);
      
      return {
        users: {
          total: parseInt(userCount.rows[0].count),
          active_sessions: parseInt(activeSessions.rows[0].count)
        },
        storage: storageUsage.totals,
        activity: {
          last_24h: parseInt(recentActivity.rows[0].count)
        },
        health_status: 'healthy'
      };
      
    } finally {
      client.release();
    }
  }

  // Archive old data (move to archive tables)
  async archiveOldData(tableName, daysOld = 365) {
    const client = await this.pool.connect();
    
    try {
      // Create archive table if it doesn't exist
      const archiveTableName = `${tableName}_archive`;
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${archiveTableName} AS 
        SELECT * FROM ${tableName} WHERE 1=0
      `);
      
      // Move old data to archive
      const moveQuery = `
        INSERT INTO ${archiveTableName}
        SELECT * FROM ${tableName}
        WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '${daysOld} days'
      `;
      
      await client.query(moveQuery);
      
      // Delete moved data from original table
      const deleteQuery = `
        DELETE FROM ${tableName}
        WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '${daysOld} days'
      `;
      
      const result = await client.query(deleteQuery);
      
      return {
        archived_records: result.rowCount,
        archive_table: archiveTableName
      };
      
    } finally {
      client.release();
    }
  }

  // Get data growth trends
  async getDataGrowthTrends(days = 30) {
    const client = await this.pool.connect();
    
    try {
      const query = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as new_records
        FROM user_activity_log
        WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '${days} days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `;
      
      const result = await client.query(query);
      return result.rows;
      
    } finally {
      client.release();
    }
  }
}

module.exports = new DataManagementService(); 