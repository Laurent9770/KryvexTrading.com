# 🔄 Automated Crypto Price Updater Setup

This guide helps you set up automated cryptocurrency price updates for your Kryvex Trading Platform.

## 📋 **Quick Setup Steps**

### 1️⃣ **Database Setup (Run in Supabase SQL Editor)**

```sql
-- Copy and paste DATABASE_PRICE_UPDATER.sql content into Supabase SQL Editor
-- This creates all the functions and tables needed for price updates
```

### 2️⃣ **Manual Price Updates (Immediate)**

Run these SQL commands in Supabase to update prices manually:

```sql
-- Update all crypto prices at once
SELECT update_all_crypto_prices();

-- Update individual cryptocurrency
SELECT update_trading_pair_price('BTC/USDT', 96500.00, 3.2, 29000000000, 1870000000000);

-- View current prices
SELECT * FROM current_crypto_prices;
```

### 3️⃣ **Automated Updates (Node.js Service)**

For continuous automated updates every 5 minutes:

```bash
# Set environment variables
export SUPABASE_URL="https://ftkeczodadvtnxofrwps.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-role-key-here"

# Run the price updater service
node price-updater-service.js
```

## 🛠️ **Configuration Options**

### **Manual Updates** (Recommended for now)
- ✅ **Instant updates** via SQL commands
- ✅ **No external dependencies**
- ✅ **Full control over timing**
- ✅ **Works immediately**

### **Automated Service** (Optional)
- 🔄 **Continuous updates** every 5 minutes
- 📡 **Fetches real data** from CoinGecko API
- 🤖 **Fully automated** price tracking
- 🔑 **Requires service key setup**

## 📊 **Usage Examples**

### **1. Quick Price Update** (Copy-paste into Supabase)
```sql
-- Update Bitcoin price (August 2025 example)
SELECT update_trading_pair_price('BTC/USDT', 127500.00, 4.2, 44000000000, 2520000000000);

-- Update Ethereum price (August 2025 example)
SELECT update_trading_pair_price('ETH/USDT', 4920.75, 2.8, 23000000000, 592000000000);

-- Update all prices with current market values
SELECT update_all_crypto_prices();
```

### **2. View Price Data**
```sql
-- Current prices with changes
SELECT * FROM current_crypto_prices;

-- Price history for Bitcoin
SELECT ph.price, ph.timestamp 
FROM price_history ph
JOIN trading_pairs tp ON ph.trading_pair_id = tp.id
WHERE tp.symbol = 'BTC/USDT'
ORDER BY ph.timestamp DESC
LIMIT 10;
```

### **3. Check Update Status**
```sql
-- See when prices were last updated
SELECT 
  symbol, 
  current_price, 
  updated_at,
  EXTRACT(EPOCH FROM (NOW() - updated_at))::INTEGER as seconds_ago
FROM trading_pairs 
ORDER BY updated_at DESC;
```

## 🔧 **Service Setup (Advanced)**

### **Get Your Supabase Service Key**
1. Go to **Supabase Dashboard** → **Settings** → **API**
2. Copy the **`service_role`** key (not the `anon` key!)
3. Keep this key secure - it has admin access

### **Run the Automated Service**
```bash
# Install dependencies (if needed)
npm install

# Set environment variables (replace with your actual keys)
export SUPABASE_URL="https://ftkeczodadvtnxofrwps.supabase.co"
export SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Start the service
node price-updater-service.js
```

### **Service Features**
- 🔄 **Updates every 5 minutes**
- 📊 **Fetches from CoinGecko API**
- 📝 **Comprehensive logging**
- 🛡️ **Error handling & recovery**
- 📈 **Price history tracking**

## 📈 **Integration with Frontend**

Your frontend already uses the `trading_pairs` table for price display:

```javascript
// Frontend automatically shows updated prices from database
// No code changes needed - just run the SQL updates!
```

## 🎯 **Recommended Workflow**

### **For Development/Testing:**
1. ✅ Run `DATABASE_PRICE_UPDATER.sql` in Supabase
2. ✅ Use manual SQL commands to update prices as needed
3. ✅ View results on your frontend immediately

### **For Production:**
1. ✅ Set up the automated Node.js service
2. ✅ Run it on a server/VPS for continuous updates
3. ✅ Monitor logs for any API rate limit issues

## 🚀 **Quick Start Commands**

```sql
-- 1. Initialize the price update system
SELECT update_all_crypto_prices();

-- 2. Check that it worked
SELECT * FROM current_crypto_prices;

-- 3. Update a specific coin (example: Bitcoin pump!)
SELECT update_trading_pair_price('BTC/USDT', 100000.00, 5.2, 35000000000, 1950000000000);
```

## 🔍 **Troubleshooting**

### **Prices Not Updating in Frontend?**
- Check browser cache (hard refresh: Ctrl+Shift+R)
- Verify database was updated: `SELECT * FROM trading_pairs`
- Check console for any errors

### **SQL Function Errors?**
- Ensure `DATABASE_PRICE_UPDATER.sql` was run completely
- Check table exists: `SELECT * FROM trading_pairs LIMIT 1`
- Verify permissions in Supabase RLS policies

### **Service Not Working?**
- Check your service key has proper permissions
- Verify CoinGecko API is accessible
- Check network firewall settings

---

**🎉 Your crypto prices will now be always up-to-date!**

Start with manual updates using SQL commands, then optionally set up the automated service for hands-free operation.
