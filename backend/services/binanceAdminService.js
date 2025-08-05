const BinanceSettings = require('../models/BinanceSettings');
const User = require('../models/User');
const crypto = require('crypto');

class BinanceAdminService {
  // Get current Binance settings
  async getSettings() {
    try {
      let settings = await BinanceSettings.findOne();
      if (!settings) {
        // Create default settings if none exist
        settings = new BinanceSettings();
        await settings.save();
      }
      return settings;
    } catch (error) {
      console.error('Error getting Binance settings:', error);
      throw error;
    }
  }

  // Update Binance settings
  async updateSettings(updateData, adminUserId) {
    try {
      let settings = await BinanceSettings.findOne();
      if (!settings) {
        settings = new BinanceSettings();
      }

      // Update fields
      Object.keys(updateData).forEach(key => {
        if (settings.schema.paths[key]) {
          settings[key] = updateData[key];
        }
      });

      // Update audit trail
      settings.lastUpdated = new Date();
      settings.updatedBy = adminUserId;

      await settings.save();
      return settings;
    } catch (error) {
      console.error('Error updating Binance settings:', error);
      throw error;
    }
  }

  // Check if user can access Binance trading
  async canUserTrade(userId) {
    try {
      const settings = await this.getSettings();
      const user = await User.findById(userId);

      if (!settings.isEnabled || settings.maintenanceMode) {
        return { canTrade: false, reason: 'Binance trading is disabled or in maintenance mode' };
      }

      if (!user) {
        return { canTrade: false, reason: 'User not found' };
      }

      // Check user role permissions
      if (!settings.allowedUserRoles.includes(user.role)) {
        return { canTrade: false, reason: 'User role not allowed for Binance trading' };
      }

      return { canTrade: true };
    } catch (error) {
      console.error('Error checking user trading permissions:', error);
      return { canTrade: false, reason: 'Error checking permissions' };
    }
  }

  // Validate order against risk controls
  async validateOrder(userId, symbol, quantity, price, orderType) {
    try {
      const settings = await this.getSettings();
      
      // Check if trading is enabled
      if (!settings.isEnabled) {
        return { valid: false, reason: 'Binance trading is disabled' };
      }

      // Check if symbol is allowed
      if (!settings.allowedTradingPairs.includes(symbol)) {
        return { valid: false, reason: 'Trading pair not allowed' };
      }

      // Calculate order value
      const orderValue = parseFloat(quantity) * parseFloat(price);
      
      // Check max order size
      if (orderValue > settings.maxOrderSize) {
        return { 
          valid: false, 
          reason: `Order size exceeds maximum allowed (${settings.maxOrderSize} USD)` 
        };
      }

      // Check trading hours
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      if (currentTime < settings.tradingHours.start || currentTime > settings.tradingHours.end) {
        return { valid: false, reason: 'Trading outside allowed hours' };
      }

      return { valid: true };
    } catch (error) {
      console.error('Error validating order:', error);
      return { valid: false, reason: 'Error validating order' };
    }
  }

  // Get trading statistics
  async getTradingStats() {
    try {
      const settings = await this.getSettings();
      
      // Get user count with trading access
      const eligibleUsers = await User.countDocuments({
        role: { $in: settings.allowedUserRoles }
      });

      return {
        isEnabled: settings.isEnabled,
        maintenanceMode: settings.maintenanceMode,
        allowedUserRoles: settings.allowedUserRoles,
        allowedTradingPairs: settings.allowedTradingPairs,
        eligibleUsers,
        riskControls: {
          maxOrderSize: settings.maxOrderSize,
          maxDailyVolume: settings.maxDailyVolume,
          maxLeverage: settings.maxLeverage
        },
        tradingHours: settings.tradingHours,
        lastUpdated: settings.lastUpdated
      };
    } catch (error) {
      console.error('Error getting trading stats:', error);
      throw error;
    }
  }

  // Test API connection
  async testApiConnection() {
    try {
      const settings = await this.getSettings();
      
      if (!settings.apiKey || !settings.secretKey) {
        return { success: false, message: 'API keys not configured' };
      }

      // Test with a simple API call
      const axios = require('axios');
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = crypto
        .createHmac('sha256', settings.secretKey)
        .update(queryString)
        .digest('hex');

      const response = await axios.get('https://api.binance.com/api/v3/account', {
        params: {
          timestamp,
          signature
        },
        headers: {
          'X-MBX-APIKEY': settings.apiKey
        }
      });

      return { success: true, message: 'API connection successful' };
    } catch (error) {
      console.error('Error testing API connection:', error);
      return { 
        success: false, 
        message: error.response?.data?.msg || 'API connection failed' 
      };
    }
  }

  // Get user trading permissions
  async getUserPermissions(userId) {
    try {
      const settings = await this.getSettings();
      const user = await User.findById(userId);

      if (!user) {
        return { hasAccess: false, reason: 'User not found' };
      }

      const canTrade = await this.canUserTrade(userId);
      
      return {
        hasAccess: canTrade.canTrade,
        reason: canTrade.reason,
        userRole: user.role,
        allowedRoles: settings.allowedUserRoles,
        allowedPairs: settings.allowedTradingPairs,
        riskLimits: {
          maxOrderSize: settings.maxOrderSize,
          maxDailyVolume: settings.maxDailyVolume,
          maxLeverage: settings.maxLeverage
        }
      };
    } catch (error) {
      console.error('Error getting user permissions:', error);
      throw error;
    }
  }

  // Update API keys securely
  async updateApiKeys(apiKey, secretKey, adminUserId) {
    try {
      const settings = await this.getSettings();
      
      settings.apiKey = apiKey;
      settings.secretKey = secretKey;
      settings.lastUpdated = new Date();
      settings.updatedBy = adminUserId;

      await settings.save();
      
      return { success: true, message: 'API keys updated successfully' };
    } catch (error) {
      console.error('Error updating API keys:', error);
      throw error;
    }
  }

  // Enable/Disable Binance trading
  async toggleTrading(enabled, adminUserId) {
    try {
      const settings = await this.getSettings();
      
      settings.isEnabled = enabled;
      settings.lastUpdated = new Date();
      settings.updatedBy = adminUserId;

      await settings.save();
      
      return { 
        success: true, 
        message: `Binance trading ${enabled ? 'enabled' : 'disabled'} successfully` 
      };
    } catch (error) {
      console.error('Error toggling trading:', error);
      throw error;
    }
  }

  // Set maintenance mode
  async setMaintenanceMode(enabled, adminUserId) {
    try {
      const settings = await this.getSettings();
      
      settings.maintenanceMode = enabled;
      settings.lastUpdated = new Date();
      settings.updatedBy = adminUserId;

      await settings.save();
      
      return { 
        success: true, 
        message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}` 
      };
    } catch (error) {
      console.error('Error setting maintenance mode:', error);
      throw error;
    }
  }
}

module.exports = new BinanceAdminService(); 