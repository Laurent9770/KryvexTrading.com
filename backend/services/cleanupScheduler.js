const dataManagementService = require('./dataManagementService');

class CleanupScheduler {
  constructor() {
    this.isRunning = false;
    this.cleanupInterval = null;
  }

  // Start the cleanup scheduler
  start() {
    if (this.isRunning) {
      console.log('⚠️ Cleanup scheduler is already running');
      return;
    }

    console.log('🚀 Starting automated cleanup scheduler...');
    this.isRunning = true;

    // Run cleanup every 24 hours
    this.cleanupInterval = setInterval(async () => {
      await this.runScheduledCleanup();
    }, 24 * 60 * 60 * 1000); // 24 hours

    // Run initial cleanup after 1 minute
    setTimeout(async () => {
      await this.runScheduledCleanup();
    }, 60 * 1000);

    console.log('✅ Cleanup scheduler started (runs every 24 hours)');
  }

  // Stop the cleanup scheduler
  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.isRunning = false;
    console.log('⏹️ Cleanup scheduler stopped');
  }

  // Run scheduled cleanup
  async runScheduledCleanup() {
    try {
      console.log('🧹 Running scheduled data cleanup...');
      
      const startTime = Date.now();
      const summary = await dataManagementService.runDataCleanup();
      const duration = Date.now() - startTime;
      
      console.log(`✅ Scheduled cleanup completed in ${duration}ms`);
      console.log(`📊 Cleanup summary:`, summary);
      
      // Log cleanup activity
      await this.logCleanupActivity(summary);
      
    } catch (error) {
      console.error('❌ Scheduled cleanup failed:', error);
    }
  }

  // Log cleanup activity
  async logCleanupActivity(summary) {
    try {
      const activityDetails = {
        type: 'scheduled_cleanup',
        summary: summary,
        timestamp: new Date().toISOString()
      };

      // Log as system activity (no specific user)
      await dataManagementService.logUserActivity(
        null, // No specific user for system activities
        'system_cleanup',
        activityDetails
      );
    } catch (error) {
      console.error('❌ Failed to log cleanup activity:', error);
    }
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextRun: this.isRunning ? 'Every 24 hours' : 'Not scheduled',
      lastRun: new Date().toISOString()
    };
  }

  // Run manual cleanup
  async runManualCleanup() {
    try {
      console.log('🧹 Running manual data cleanup...');
      
      const startTime = Date.now();
      const summary = await dataManagementService.runDataCleanup();
      const duration = Date.now() - startTime;
      
      console.log(`✅ Manual cleanup completed in ${duration}ms`);
      
      return {
        success: true,
        duration,
        summary
      };
      
    } catch (error) {
      console.error('❌ Manual cleanup failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new CleanupScheduler(); 