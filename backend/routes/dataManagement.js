const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateAdmin } = require('../middleware/auth');
const dataManagementService = require('../services/dataManagementService');
const router = express.Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// Get system health and storage metrics
router.get('/health', async (req, res) => {
  try {
    const health = await dataManagementService.getSystemHealth();
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Error getting system health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system health'
    });
  }
});

// Get storage usage statistics
router.get('/storage', async (req, res) => {
  try {
    const storage = await dataManagementService.getStorageUsage();
    
    res.json({
      success: true,
      data: storage
    });
  } catch (error) {
    console.error('Error getting storage usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get storage usage'
    });
  }
});

// Get data retention configuration
router.get('/retention', async (req, res) => {
  try {
    const config = await dataManagementService.getRetentionConfig();
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error getting retention config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get retention configuration'
    });
  }
});

// Update retention configuration
router.put('/retention/:tableName', [
  body('retentionDays').isInt({ min: 1, max: 3650 }).withMessage('Retention days must be between 1 and 3650'),
  body('maxRecords').isInt({ min: 100, max: 100000 }).withMessage('Max records must be between 100 and 100000'),
  body('cleanupEnabled').isBoolean().withMessage('Cleanup enabled must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { tableName } = req.params;
    const { retentionDays, maxRecords, cleanupEnabled } = req.body;

    await dataManagementService.updateRetentionConfig(tableName, retentionDays, maxRecords, cleanupEnabled);
    
    res.json({
      success: true,
      message: 'Retention configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating retention config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update retention configuration'
    });
  }
});

// Run manual data cleanup
router.post('/cleanup', async (req, res) => {
  try {
    const summary = await dataManagementService.runDataCleanup();
    
    res.json({
      success: true,
      message: 'Data cleanup completed successfully',
      data: summary
    });
  } catch (error) {
    console.error('Error running data cleanup:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run data cleanup'
    });
  }
});

// Get cleanup summary
router.get('/cleanup/summary', async (req, res) => {
  try {
    const summary = await dataManagementService.getCleanupSummary();
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error getting cleanup summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cleanup summary'
    });
  }
});

// Get user activity statistics
router.get('/activity', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const activity = await dataManagementService.getUserActivityStats(parseInt(days));
    
    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Error getting activity stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get activity statistics'
    });
  }
});

// Archive old data
router.post('/archive/:tableName', [
  body('daysOld').optional().isInt({ min: 30, max: 3650 }).withMessage('Days old must be between 30 and 3650')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { tableName } = req.params;
    const { daysOld = 365 } = req.body;

    const result = await dataManagementService.archiveOldData(tableName, daysOld);
    
    res.json({
      success: true,
      message: 'Data archived successfully',
      data: result
    });
  } catch (error) {
    console.error('Error archiving data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to archive data'
    });
  }
});

// Get data growth trends
router.get('/trends', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const trends = await dataManagementService.getDataGrowthTrends(parseInt(days));
    
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Error getting growth trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get growth trends'
    });
  }
});

// Get storage recommendations
router.get('/recommendations', async (req, res) => {
  try {
    const storage = await dataManagementService.getStorageUsage();
    const health = await dataManagementService.getSystemHealth();
    
    const recommendations = [];
    
    // Check for tables exceeding 80% of max records
    storage.tables.forEach(table => {
      const usagePercent = (table.record_count / table.max_records) * 100;
      if (usagePercent > 80) {
        recommendations.push({
          type: 'warning',
          table: table.table_name,
          message: `${table.table_name} is at ${usagePercent.toFixed(1)}% capacity`,
          action: 'Consider increasing max_records or reducing retention_days'
        });
      }
    });
    
    // Check total storage size
    const totalSizeMB = parseFloat(storage.totals.size_mb);
    if (totalSizeMB > 1000) { // 1GB
      recommendations.push({
        type: 'warning',
        message: 'Total storage size is large',
        action: 'Consider archiving old data or adjusting retention policies'
      });
    }
    
    res.json({
      success: true,
      data: {
        recommendations,
        storage: storage.totals,
        health: health
      }
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get storage recommendations'
    });
  }
});

module.exports = router; 