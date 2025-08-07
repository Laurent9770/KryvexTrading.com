-- Advanced Auth Database Migration for Kryvex Trading Platform
-- This script implements anonymous users, Google OAuth, and enhanced security

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ANONYMOUS USER SUPPORT
-- ============================================================================

-- Create user preferences table for anonymous users
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'dark',
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    notifications_enabled BOOLEAN DEFAULT true,
    trading_view_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create watchlist table for anonymous users
CREATE TABLE IF NOT EXISTS watchlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, symbol)
);

-- Create saved charts table for anonymous users
CREATE TABLE IF NOT EXISTS saved_charts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    chart_config JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create auth analytics table
CREATE TABLE IF NOT EXISTS auth_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    provider VARCHAR(50),
    is_anonymous BOOLEAN DEFAULT false,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    ip_address INET,
    metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- GOOGLE OAUTH SUPPORT
-- ============================================================================

-- Create Google OAuth profiles table
CREATE TABLE IF NOT EXISTS google_oauth_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    picture_url TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_oauth_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ANONYMOUS USER POLICIES
-- ============================================================================

-- Anonymous users can view public data
CREATE POLICY "Anonymous users can view public data" ON public_data
FOR SELECT TO authenticated
USING (true);

-- Anonymous users can manage their own preferences
CREATE POLICY "Users can manage their own preferences" ON user_preferences
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Anonymous users can manage their own watchlist
CREATE POLICY "Users can manage their own watchlist" ON watchlist
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Anonymous users can manage their own saved charts
CREATE POLICY "Users can manage their own saved charts" ON saved_charts
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- TRADING RESTRICTIONS FOR ANONYMOUS USERS
-- ============================================================================

-- Restrictive policy: Only permanent users can trade
CREATE POLICY "Only permanent users can trade" ON trades
AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK ((SELECT (auth.jwt()->>'is_anonymous')::boolean) IS FALSE);

-- Anonymous users can view trades but not create them
CREATE POLICY "Anonymous users can view trades" ON trades
FOR SELECT TO authenticated
USING (true);

-- Only permanent users can deposit/withdraw
CREATE POLICY "Only permanent users can deposit" ON deposits
AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK ((SELECT (auth.jwt()->>'is_anonymous')::boolean) IS FALSE);

CREATE POLICY "Only permanent users can withdraw" ON withdrawal_requests
AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK ((SELECT (auth.jwt()->>'is_anonymous')::boolean) IS FALSE);

-- Anonymous users can view deposits/withdrawals
CREATE POLICY "Anonymous users can view deposits" ON deposits
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Anonymous users can view withdrawals" ON withdrawal_requests
FOR SELECT TO authenticated
USING (true);

-- ============================================================================
-- GOOGLE OAUTH POLICIES
-- ============================================================================

-- Users can manage their own Google OAuth profile
CREATE POLICY "Users can manage their own Google OAuth profile" ON google_oauth_profiles
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- ANALYTICS POLICIES
-- ============================================================================

-- Admin can view all analytics
CREATE POLICY "Admin can view all analytics" ON auth_analytics
FOR SELECT TO authenticated
USING (auth.role() = 'admin');

-- Users can view their own analytics
CREATE POLICY "Users can view their own analytics" ON auth_analytics
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- System can insert analytics (for tracking)
CREATE POLICY "System can insert analytics" ON auth_analytics
FOR INSERT TO authenticated
WITH CHECK (true);

-- ============================================================================
-- DATABASE FUNCTIONS
-- ============================================================================

-- Function to cleanup anonymous users
CREATE OR REPLACE FUNCTION cleanup_anonymous_users()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete anonymous users older than 30 days
  DELETE FROM auth.users
  WHERE is_anonymous IS TRUE 
    AND created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to migrate anonymous user data
CREATE OR REPLACE FUNCTION migrate_anonymous_data(
  anonymous_user_id UUID,
  permanent_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Migrate user preferences
  UPDATE user_preferences 
  SET user_id = permanent_user_id 
  WHERE user_id = anonymous_user_id;
  
  -- Migrate watchlist
  UPDATE watchlist 
  SET user_id = permanent_user_id 
  WHERE user_id = anonymous_user_id;
  
  -- Migrate saved charts
  UPDATE saved_charts 
  SET user_id = permanent_user_id 
  WHERE user_id = anonymous_user_id;
  
  -- Log the migration
  INSERT INTO auth_analytics (event, user_id, metadata)
  VALUES (
    'anonymous_user_converted',
    permanent_user_id,
    jsonb_build_object('anonymous_user_id', anonymous_user_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is anonymous
CREATE OR REPLACE FUNCTION is_anonymous_user(user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Use provided user_id or current user
  target_user_id := COALESCE(user_id, auth.uid());
  
  -- Check if user is anonymous
  RETURN EXISTS(
    SELECT 1 FROM auth.users 
    WHERE id = target_user_id 
      AND is_anonymous IS TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user auth analytics
CREATE OR REPLACE FUNCTION get_user_auth_analytics(
  target_user_id UUID DEFAULT NULL,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  event VARCHAR(100),
  provider VARCHAR(50),
  is_anonymous BOOLEAN,
  timestamp TIMESTAMP,
  metadata JSONB
) AS $$
DECLARE
  query_user_id UUID;
BEGIN
  -- Use provided user_id or current user
  query_user_id := COALESCE(target_user_id, auth.uid());
  
  RETURN QUERY
  SELECT 
    aa.event,
    aa.provider,
    aa.is_anonymous,
    aa.timestamp,
    aa.metadata
  FROM auth_analytics aa
  WHERE aa.user_id = query_user_id
    AND aa.timestamp >= NOW() - INTERVAL '1 day' * days_back
  ORDER BY aa.timestamp DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_charts_updated_at
  BEFORE UPDATE ON saved_charts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_oauth_profiles_updated_at
  BEFORE UPDATE ON google_oauth_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes for user_preferences
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_updated_at ON user_preferences(updated_at);

-- Indexes for watchlist
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_symbol ON watchlist(symbol);
CREATE INDEX IF NOT EXISTS idx_watchlist_user_symbol ON watchlist(user_id, symbol);

-- Indexes for saved_charts
CREATE INDEX IF NOT EXISTS idx_saved_charts_user_id ON saved_charts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_charts_updated_at ON saved_charts(updated_at);

-- Indexes for auth_analytics
CREATE INDEX IF NOT EXISTS idx_auth_analytics_user_id ON auth_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_analytics_event ON auth_analytics(event);
CREATE INDEX IF NOT EXISTS idx_auth_analytics_timestamp ON auth_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_auth_analytics_is_anonymous ON auth_analytics(is_anonymous);

-- Indexes for google_oauth_profiles
CREATE INDEX IF NOT EXISTS idx_google_oauth_profiles_user_id ON google_oauth_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_google_oauth_profiles_google_id ON google_oauth_profiles(google_id);
CREATE INDEX IF NOT EXISTS idx_google_oauth_profiles_email ON google_oauth_profiles(email);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_preferences TO authenticated;
GRANT ALL ON watchlist TO authenticated;
GRANT ALL ON saved_charts TO authenticated;
GRANT ALL ON auth_analytics TO authenticated;
GRANT ALL ON google_oauth_profiles TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION cleanup_anonymous_users() TO authenticated;
GRANT EXECUTE ON FUNCTION migrate_anonymous_data(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_anonymous_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_auth_analytics(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;

-- ============================================================================
-- SAMPLE DATA (Optional)
-- ============================================================================

-- Insert sample anonymous user preferences
INSERT INTO user_preferences (user_id, theme, language, timezone)
VALUES (
  'anonymous-user-id',
  'dark',
  'en',
  'UTC'
) ON CONFLICT DO NOTHING;

-- Insert sample watchlist for anonymous user
INSERT INTO watchlist (user_id, symbol)
VALUES 
  ('anonymous-user-id', 'BTC/USDT'),
  ('anonymous-user-id', 'ETH/USDT'),
  ('anonymous-user-id', 'ADA/USDT')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if tables were created successfully
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('user_preferences', 'watchlist', 'saved_charts', 'auth_analytics', 'google_oauth_profiles');

-- Check if policies were created successfully
-- SELECT schemaname, tablename, policyname FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('user_preferences', 'watchlist', 'saved_charts', 'auth_analytics', 'google_oauth_profiles');

-- Check if functions were created successfully
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- AND routine_name IN ('cleanup_anonymous_users', 'migrate_anonymous_data', 'is_anonymous_user', 'get_user_auth_analytics');

COMMIT;

-- Migration completed successfully!
-- Your advanced authentication system is now ready for use. 