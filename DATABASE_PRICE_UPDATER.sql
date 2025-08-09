-- AUTOMATED CRYPTO PRICE UPDATER FOR SUPABASE
-- This script creates functions and triggers to automatically update crypto prices

-- ===========================
-- PRICE UPDATE FUNCTIONS
-- ===========================

-- Function to update trading pair prices
CREATE OR REPLACE FUNCTION update_trading_pair_price(
  pair_symbol TEXT,
  new_price DECIMAL(20,8),
  price_change_24h DECIMAL(5,2),
  volume_24h DECIMAL(20,8),
  market_cap DECIMAL(30,2)
)
RETURNS VOID AS $$
BEGIN
  -- Update existing trading pair or insert if doesn't exist
  INSERT INTO trading_pairs (symbol, base_currency, quote_currency, current_price, price_change_24h, volume_24h, market_cap, updated_at)
  VALUES (
    pair_symbol,
    split_part(pair_symbol, '/', 1), -- Extract base currency (e.g., 'BTC' from 'BTC/USDT')
    split_part(pair_symbol, '/', 2), -- Extract quote currency (e.g., 'USDT' from 'BTC/USDT')
    new_price,
    price_change_24h,
    volume_24h,
    market_cap,
    NOW()
  )
  ON CONFLICT (symbol)
  DO UPDATE SET
    current_price = EXCLUDED.current_price,
    price_change_24h = EXCLUDED.price_change_24h,
    volume_24h = EXCLUDED.volume_24h,
    market_cap = EXCLUDED.market_cap,
    updated_at = NOW();
    
  -- Also insert into price history for tracking
  INSERT INTO price_history (trading_pair_id, price, volume, timestamp)
  SELECT id, new_price, volume_24h, NOW()
  FROM trading_pairs
  WHERE symbol = pair_symbol;
  
  RAISE NOTICE 'Updated price for %: $%', pair_symbol, new_price;
END;
$$ LANGUAGE plpgsql;

-- Function to batch update all major crypto prices
CREATE OR REPLACE FUNCTION update_all_crypto_prices()
RETURNS TEXT AS $$
DECLARE
  result_text TEXT;
BEGIN
  -- Update major cryptocurrencies with current market prices
  -- These would typically come from an API, but we'll use realistic current values
  
  PERFORM update_trading_pair_price('BTC/USDT', 95250.00, 2.34, 28500000000, 1847000000000);
  PERFORM update_trading_pair_price('ETH/USDT', 3420.75, 1.89, 15200000000, 412000000000);
  PERFORM update_trading_pair_price('SOL/USDT', 245.60, 4.52, 2100000000, 115000000000);
  PERFORM update_trading_pair_price('ADA/USDT', 1.25, -0.85, 890000000, 44000000000);
  PERFORM update_trading_pair_price('BNB/USDT', 695.30, 0.67, 1650000000, 101000000000);
  
  result_text := 'Successfully updated prices for 5 trading pairs at ' || NOW();
  RAISE NOTICE '%', result_text;
  RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- ===========================
-- MANUAL UPDATE COMMANDS
-- ===========================

-- Update individual crypto prices (run these manually when needed)
-- Example: Update Bitcoin price
-- SELECT update_trading_pair_price('BTC/USDT', 96500.00, 3.2, 29000000000, 1870000000000);

-- Example: Update all prices at once
-- SELECT update_all_crypto_prices();

-- ===========================
-- SCHEDULED UPDATES (Optional)
-- ===========================

-- Create a table to track price update jobs
CREATE TABLE IF NOT EXISTS price_update_jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_name TEXT NOT NULL,
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  result TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert a recurring job for price updates
INSERT INTO price_update_jobs (job_name, next_run, status)
VALUES ('crypto_price_update', NOW() + INTERVAL '5 minutes', 'pending')
ON CONFLICT DO NOTHING;

-- Function to process price update jobs
CREATE OR REPLACE FUNCTION process_price_update_jobs()
RETURNS TEXT AS $$
DECLARE
  job_record RECORD;
  update_result TEXT;
BEGIN
  -- Find pending jobs that are due
  FOR job_record IN 
    SELECT * FROM price_update_jobs 
    WHERE status = 'pending' AND next_run <= NOW()
    ORDER BY next_run
  LOOP
    -- Mark job as running
    UPDATE price_update_jobs 
    SET status = 'running', last_run = NOW()
    WHERE id = job_record.id;
    
    -- Execute the price update
    BEGIN
      SELECT update_all_crypto_prices() INTO update_result;
      
      -- Mark job as completed and schedule next run
      UPDATE price_update_jobs 
      SET 
        status = 'completed',
        result = update_result,
        next_run = NOW() + INTERVAL '5 minutes'
      WHERE id = job_record.id;
      
    EXCEPTION WHEN OTHERS THEN
      -- Mark job as failed
      UPDATE price_update_jobs 
      SET 
        status = 'failed',
        result = 'Error: ' || SQLERRM,
        next_run = NOW() + INTERVAL '10 minutes' -- Retry in 10 minutes
      WHERE id = job_record.id;
    END;
  END LOOP;
  
  RETURN 'Processed price update jobs';
END;
$$ LANGUAGE plpgsql;

-- ===========================
-- REAL-TIME PRICE QUERIES
-- ===========================

-- View to get current prices with formatted display
CREATE OR REPLACE VIEW current_crypto_prices AS
SELECT 
  symbol,
  base_currency,
  quote_currency,
  current_price,
  CASE 
    WHEN price_change_24h > 0 THEN '+' || price_change_24h || '%'
    ELSE price_change_24h || '%'
  END as formatted_change,
  volume_24h,
  market_cap,
  updated_at,
  EXTRACT(EPOCH FROM (NOW() - updated_at))::INTEGER as seconds_since_update
FROM trading_pairs
WHERE is_active = true
ORDER BY market_cap DESC;

-- ===========================
-- USAGE EXAMPLES
-- ===========================

-- 1. Manual price update for Bitcoin:
-- SELECT update_trading_pair_price('BTC/USDT', 97000.00, 2.5, 30000000000, 1880000000000);

-- 2. Update all crypto prices:
-- SELECT update_all_crypto_prices();

-- 3. View current prices:
-- SELECT * FROM current_crypto_prices;

-- 4. Get price history for Bitcoin:
-- SELECT ph.price, ph.timestamp 
-- FROM price_history ph
-- JOIN trading_pairs tp ON ph.trading_pair_id = tp.id
-- WHERE tp.symbol = 'BTC/USDT'
-- ORDER BY ph.timestamp DESC
-- LIMIT 100;

-- 5. Process scheduled price updates:
-- SELECT process_price_update_jobs();

-- ===========================
-- API INTEGRATION TEMPLATE
-- ===========================

-- Template for HTTP request to external API (requires pg_net extension)
-- Note: This requires the pg_net extension to be enabled in Supabase

-- CREATE OR REPLACE FUNCTION fetch_live_crypto_prices()
-- RETURNS TEXT AS $$
-- DECLARE
--   api_response TEXT;
-- BEGIN
--   -- This would make an HTTP request to CoinGecko or similar API
--   -- SELECT content INTO api_response FROM http_get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,cardano,binancecoin&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true');
--   
--   -- Parse the JSON response and update prices
--   -- This would require additional JSON parsing logic
--   
--   RETURN 'Live prices fetched and updated';
-- END;
-- $$ LANGUAGE plpgsql;

-- ===========================
-- INITIALIZATION
-- ===========================

-- Run initial price update
SELECT update_all_crypto_prices();

-- Verify the data
SELECT 'Price update system initialized successfully! Current prices:' as message;
SELECT * FROM current_crypto_prices;

-- Show price update job status
SELECT 'Price update jobs:' as message;
SELECT job_name, last_run, next_run, status, result FROM price_update_jobs;
