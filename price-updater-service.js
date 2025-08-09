#!/usr/bin/env node

/**
 * KRYVEX TRADING - AUTOMATED PRICE UPDATER SERVICE
 * 
 * This service automatically fetches cryptocurrency prices from CoinGecko API
 * and updates the Supabase database every 5 minutes.
 * 
 * Usage:
 * node price-updater-service.js
 * 
 * Environment Variables Required:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_SERVICE_KEY: Your Supabase service role key (not anon key!)
 */

const https = require('https');
const fs = require('fs');

// Configuration
const CONFIG = {
  supabaseUrl: process.env.SUPABASE_URL || 'https://ftkeczodadvtnxofrwps.supabase.co',
  supabaseKey: process.env.SUPABASE_SERVICE_KEY || 'your-service-key-here',
  updateInterval: 5 * 60 * 1000, // 5 minutes in milliseconds
  coingeckoApi: 'https://api.coingecko.com/api/v3/simple/price',
  cryptoSymbols: {
    bitcoin: 'BTC/USDT',
    ethereum: 'ETH/USDT', 
    solana: 'SOL/USDT',
    cardano: 'ADA/USDT',
    binancecoin: 'BNB/USDT'
  }
};

// Logging utility
const log = {
  info: (msg) => console.log(`[${new Date().toISOString()}] INFO: ${msg}`),
  error: (msg) => console.error(`[${new Date().toISOString()}] ERROR: ${msg}`),
  warn: (msg) => console.warn(`[${new Date().toISOString()}] WARN: ${msg}`)
};

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            data: res.statusCode === 200 ? JSON.parse(data) : data,
            headers: res.headers
          });
        } catch (err) {
          reject(new Error(`JSON parse error: ${err.message}`));
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Fetch prices from CoinGecko API
async function fetchCryptoPrices() {
  try {
    log.info('Fetching prices from CoinGecko API...');
    
    const cryptoIds = Object.keys(CONFIG.cryptoSymbols).join(',');
    const apiUrl = `${CONFIG.coingeckoApi}?ids=${cryptoIds}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`;
    
    const response = await makeRequest(apiUrl);
    
    if (response.statusCode !== 200) {
      throw new Error(`CoinGecko API returned status ${response.statusCode}`);
    }
    
    log.info(`Successfully fetched data for ${Object.keys(response.data).length} cryptocurrencies`);
    return response.data;
    
  } catch (error) {
    log.error(`Failed to fetch prices: ${error.message}`);
    throw error;
  }
}

// Update prices in Supabase database
async function updatePricesInDatabase(priceData) {
  try {
    log.info('Updating prices in Supabase database...');
    
    const updates = [];
    
    for (const [coinId, priceInfo] of Object.entries(priceData)) {
      const symbol = CONFIG.cryptoSymbols[coinId];
      if (!symbol) continue;
      
      const updateData = {
        symbol: symbol,
        current_price: priceInfo.usd,
        price_change_24h: priceInfo.usd_24h_change || 0,
        volume_24h: priceInfo.usd_24h_vol || 0,
        market_cap: priceInfo.usd_market_cap || 0,
        updated_at: new Date().toISOString()
      };
      
      updates.push(updateData);
    }
    
    // Update trading_pairs table
    const supabaseUrl = `${CONFIG.supabaseUrl}/rest/v1/trading_pairs`;
    
    for (const update of updates) {
      try {
        const response = await makeRequest(supabaseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': CONFIG.supabaseKey,
            'Authorization': `Bearer ${CONFIG.supabaseKey}`,
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(update)
        });
        
        if (response.statusCode === 201 || response.statusCode === 409) {
          // Success or conflict (already exists) - both are fine
          log.info(`Updated ${update.symbol}: $${update.current_price} (${update.price_change_24h.toFixed(2)}%)`);
        } else {
          log.warn(`Unexpected response for ${update.symbol}: ${response.statusCode}`);
        }
        
      } catch (error) {
        log.error(`Failed to update ${update.symbol}: ${error.message}`);
      }
    }
    
    // Also insert into price_history for tracking
    await insertPriceHistory(updates);
    
    log.info(`Successfully updated ${updates.length} trading pairs`);
    
  } catch (error) {
    log.error(`Database update failed: ${error.message}`);
    throw error;
  }
}

// Insert price history records
async function insertPriceHistory(updates) {
  try {
    const historyUrl = `${CONFIG.supabaseUrl}/rest/v1/price_history`;
    
    for (const update of updates) {
      // First get the trading_pair_id
      const pairResponse = await makeRequest(
        `${CONFIG.supabaseUrl}/rest/v1/trading_pairs?select=id&symbol=eq.${update.symbol}`,
        {
          headers: {
            'apikey': CONFIG.supabaseKey,
            'Authorization': `Bearer ${CONFIG.supabaseKey}`
          }
        }
      );
      
      if (pairResponse.data && pairResponse.data.length > 0) {
        const tradingPairId = pairResponse.data[0].id;
        
        const historyRecord = {
          trading_pair_id: tradingPairId,
          price: update.current_price,
          volume: update.volume_24h,
          timestamp: update.updated_at
        };
        
        await makeRequest(historyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': CONFIG.supabaseKey,
            'Authorization': `Bearer ${CONFIG.supabaseKey}`
          },
          body: JSON.stringify(historyRecord)
        });
      }
    }
    
  } catch (error) {
    log.warn(`Price history update failed: ${error.message}`);
  }
}

// Main update function
async function updateCryptoPrices() {
  try {
    log.info('Starting crypto price update...');
    
    const priceData = await fetchCryptoPrices();
    await updatePricesInDatabase(priceData);
    
    log.info('Crypto price update completed successfully!');
    
  } catch (error) {
    log.error(`Price update failed: ${error.message}`);
  }
}

// Validate configuration
function validateConfig() {
  if (!CONFIG.supabaseKey || CONFIG.supabaseKey === 'your-service-key-here') {
    log.error('SUPABASE_SERVICE_KEY environment variable is required!');
    log.info('Get your service key from: Supabase Dashboard > Settings > API');
    process.exit(1);
  }
  
  if (!CONFIG.supabaseUrl.includes('supabase.co')) {
    log.error('Invalid SUPABASE_URL format!');
    process.exit(1);
  }
  
  log.info('Configuration validated successfully');
}

// Main execution
async function main() {
  log.info('🚀 Kryvex Trading - Price Updater Service Starting...');
  
  validateConfig();
  
  // Run initial update
  await updateCryptoPrices();
  
  // Schedule regular updates
  log.info(`Scheduling updates every ${CONFIG.updateInterval / 1000 / 60} minutes`);
  setInterval(updateCryptoPrices, CONFIG.updateInterval);
  
  log.info('✅ Price updater service is running! Press Ctrl+C to stop.');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the service
if (require.main === module) {
  main().catch(error => {
    log.error(`Service startup failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { updateCryptoPrices, fetchCryptoPrices, updatePricesInDatabase };
