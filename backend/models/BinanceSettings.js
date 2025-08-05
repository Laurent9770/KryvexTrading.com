const mongoose = require('mongoose');

const binanceSettingsSchema = new mongoose.Schema({
  // Global settings
  isEnabled: {
    type: Boolean,
    default: false,
    required: true
  },
  
  // API Configuration
  apiKey: {
    type: String,
    default: null
  },
  secretKey: {
    type: String,
    default: null
  },
  
  // Trading permissions
  allowSpotTrading: {
    type: Boolean,
    default: false
  },
  allowFuturesTrading: {
    type: Boolean,
    default: false
  },
  
  // Risk controls
  maxOrderSize: {
    type: Number,
    default: 1000 // USD
  },
  maxDailyVolume: {
    type: Number,
    default: 10000 // USD
  },
  maxLeverage: {
    type: Number,
    default: 10
  },
  
  // User access controls
  allowedUserRoles: [{
    type: String,
    enum: ['admin', 'premium', 'standard', 'basic'],
    default: ['admin']
  }],
  
  // Trading pairs restrictions
  allowedTradingPairs: [{
    type: String,
    default: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT']
  }],
  
  // Maintenance mode
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  
  // Notifications
  sendOrderNotifications: {
    type: Boolean,
    default: true
  },
  
  // Audit trail
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Trading hours (optional)
  tradingHours: {
    start: {
      type: String,
      default: '00:00'
    },
    end: {
      type: String,
      default: '23:59'
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  }
}, {
  timestamps: true
});

// Index for quick queries
binanceSettingsSchema.index({ isEnabled: 1 });

module.exports = mongoose.model('BinanceSettings', binanceSettingsSchema); 