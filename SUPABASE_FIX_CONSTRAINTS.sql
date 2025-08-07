-- Fix constraints and insert data safely

-- First, let's add unique constraints if they don't exist
DO $$ 
BEGIN
    -- Add unique constraint to trading_pairs.symbol if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'trading_pairs_symbol_key' 
        AND conrelid = 'trading_pairs'::regclass
    ) THEN
        ALTER TABLE trading_pairs ADD CONSTRAINT trading_pairs_symbol_key UNIQUE (symbol);
    END IF;
    
    -- Add unique constraint to staking_pools.symbol if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'staking_pools_symbol_key' 
        AND conrelid = 'staking_pools'::regclass
    ) THEN
        ALTER TABLE staking_pools ADD CONSTRAINT staking_pools_symbol_key UNIQUE (symbol);
    END IF;
END $$;

-- Now insert sample trading pairs safely
INSERT INTO trading_pairs (symbol, base_currency, quote_currency, current_price, change_24h, volume_24h) 
VALUES 
  ('BTC/USDT', 'BTC', 'USDT', 45000.00, 2.5, 1000000.00),
  ('ETH/USDT', 'ETH', 'USDT', 3000.00, -1.2, 500000.00),
  ('SOL/USDT', 'SOL', 'USDT', 100.00, 5.8, 200000.00),
  ('ADA/USDT', 'ADA', 'USDT', 0.50, -0.8, 100000.00)
ON CONFLICT (symbol) DO UPDATE SET
  base_currency = EXCLUDED.base_currency,
  quote_currency = EXCLUDED.quote_currency,
  current_price = EXCLUDED.current_price,
  change_24h = EXCLUDED.change_24h,
  volume_24h = EXCLUDED.volume_24h,
  updated_at = NOW();

-- Insert sample staking pools safely
INSERT INTO staking_pools (name, symbol, apy, min_stake) 
VALUES 
  ('Bitcoin Staking', 'BTC', 5.5, 0.001),
  ('Ethereum Staking', 'ETH', 4.2, 0.01),
  ('USDT Staking', 'USDT', 3.8, 100)
ON CONFLICT (symbol) DO UPDATE SET
  name = EXCLUDED.name,
  apy = EXCLUDED.apy,
  min_stake = EXCLUDED.min_stake;

-- Update existing trading pairs with proper data
UPDATE trading_pairs 
SET 
  base_currency = CASE 
    WHEN symbol = 'BTC/USDT' THEN 'BTC'
    WHEN symbol = 'ETH/USDT' THEN 'ETH'
    WHEN symbol = 'SOL/USDT' THEN 'SOL'
    WHEN symbol = 'ADA/USDT' THEN 'ADA'
    ELSE 'UNKNOWN'
  END,
  quote_currency = 'USDT',
  current_price = CASE 
    WHEN symbol = 'BTC/USDT' THEN 45000.00
    WHEN symbol = 'ETH/USDT' THEN 3000.00
    WHEN symbol = 'SOL/USDT' THEN 100.00
    WHEN symbol = 'ADA/USDT' THEN 0.50
    ELSE 0
  END,
  change_24h = CASE 
    WHEN symbol = 'BTC/USDT' THEN 2.5
    WHEN symbol = 'ETH/USDT' THEN -1.2
    WHEN symbol = 'SOL/USDT' THEN 5.8
    WHEN symbol = 'ADA/USDT' THEN -0.8
    ELSE 0
  END,
  volume_24h = CASE 
    WHEN symbol = 'BTC/USDT' THEN 1000000.00
    WHEN symbol = 'ETH/USDT' THEN 500000.00
    WHEN symbol = 'SOL/USDT' THEN 200000.00
    WHEN symbol = 'ADA/USDT' THEN 100000.00
    ELSE 0
  END,
  updated_at = NOW()
WHERE symbol IN ('BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ADA/USDT'); 