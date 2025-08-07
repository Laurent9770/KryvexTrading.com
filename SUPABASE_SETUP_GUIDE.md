# Supabase Setup Guide for Kryvex Trading

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login and create a new project
3. Choose a project name (e.g., "kryvex-trading")
4. Set a database password
5. Choose a region close to your users

## 2. Get Your Supabase Credentials

1. Go to your project dashboard
2. Navigate to Settings → API
3. Copy your:
   - **Project URL** (e.g., `https://your-project-id.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)

## 3. Set Up Database Schema

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  country TEXT DEFAULT 'United States',
  account_balance DECIMAL(20,8) DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  kyc_status TEXT DEFAULT 'pending',
  account_status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trading_pairs table
CREATE TABLE IF NOT EXISTS trading_pairs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol TEXT UNIQUE NOT NULL,
  base_asset TEXT NOT NULL,
  quote_asset TEXT NOT NULL,
  current_price DECIMAL(20,8) DEFAULT 0,
  change_24h DECIMAL(10,4) DEFAULT 0,
  volume_24h DECIMAL(20,8) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trades table
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trading_pair_id UUID REFERENCES trading_pairs(id),
  trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  amount DECIMAL(20,8) NOT NULL,
  price DECIMAL(20,8) NOT NULL,
  total_value DECIMAL(20,8) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  result TEXT CHECK (result IN ('win', 'loss', 'draw')),
  profit_loss DECIMAL(20,8) DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  forced_outcome BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'trade', 'bonus')),
  asset TEXT NOT NULL,
  amount DECIMAL(20,8) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  reference_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_pairs_symbol ON trading_pairs(symbol);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own trades" ON trades
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own trades" ON trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view trading pairs" ON trading_pairs
  FOR SELECT USING (true);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Insert sample trading pairs
INSERT INTO trading_pairs (symbol, base_asset, quote_asset, current_price, change_24h, volume_24h) VALUES
('BTC/USDT', 'BTC', 'USDT', 45000.00, 2.5, 1000000.00),
('ETH/USDT', 'ETH', 'USDT', 3000.00, -1.2, 500000.00),
('SOL/USDT', 'SOL', 'USDT', 100.00, 5.8, 200000.00),
('ADA/USDT', 'ADA', 'USDT', 0.50, -0.8, 100000.00);
```

## 4. Configure Authentication

1. Go to Authentication → Settings
2. Configure your site URL (e.g., `https://your-app.onrender.com`)
3. Add redirect URLs:
   - `https://your-app.onrender.com/auth/callback`
   - `https://your-app.onrender.com/dashboard`

## 5. Deploy to Render.com

1. **Push to GitHub** (if not already done):
   ```bash
   git push origin main
   ```

2. **Go to [render.com](https://render.com)** and:
   - Sign up/Login with GitHub
   - Click "New +" → "Static Site"
   - Connect your GitHub repository
   - Configure the service:
     - **Name**: `kryvex-trading-frontend`
     - **Build Command**: `cd frontend && npm install && npm run build`
     - **Publish Directory**: `frontend/dist`
     - **Environment Variables**:
       - `VITE_SUPABASE_URL`: Your Supabase project URL
       - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

3. **Deploy** - Render will automatically build and deploy your app

## 6. Test Your Deployment

1. Visit your deployed app (e.g., `https://your-app.onrender.com`)
2. Try registering a new user
3. Check that the user appears in your Supabase dashboard
4. Test login functionality

## 7. Monitor Your Application

- Check Supabase dashboard for user registrations
- Monitor database performance
- Set up alerts for errors

## Environment Variables for Production

Add these to your Render environment variables:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure your site URL is configured in Supabase Auth settings
2. **RLS Policy Errors**: Check that your RLS policies are correctly set up
3. **Database Connection**: Verify your Supabase URL and key are correct

### Debug Steps:

1. Check browser console for errors
2. Verify environment variables are set correctly
3. Test database connection in Supabase dashboard
4. Check RLS policies are enabled and configured

## Security Notes

- Never expose your service role key in the frontend
- Use RLS policies to secure your data
- Regularly rotate your API keys
- Monitor for suspicious activity 