-- Create user_activities table
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('spot', 'futures', 'options', 'binary', 'quant', 'bot', 'staking', 'wallet', 'profile', 'notification', 'admin', 'reset')),
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  amount TEXT,
  symbol TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('success', 'error', 'running', 'pending', 'completed')),
  meta JSONB,
  icon TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(type);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_activities_updated_at 
  BEFORE UPDATE ON user_activities 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own activities
CREATE POLICY "Users can view own activities" ON user_activities
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own activities
CREATE POLICY "Users can insert own activities" ON user_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own activities
CREATE POLICY "Users can update own activities" ON user_activities
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only delete their own activities
CREATE POLICY "Users can delete own activities" ON user_activities
  FOR DELETE USING (auth.uid() = user_id);

-- Function to get user activities with pagination
CREATE OR REPLACE FUNCTION get_user_activities(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  type TEXT,
  action TEXT,
  description TEXT,
  amount TEXT,
  symbol TEXT,
  status TEXT,
  meta JSONB,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  time_ago TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ua.id,
    ua.user_id,
    ua.type,
    ua.action,
    ua.description,
    ua.amount,
    ua.symbol,
    ua.status,
    ua.meta,
    ua.icon,
    ua.created_at,
    CASE 
      WHEN EXTRACT(EPOCH FROM (NOW() - ua.created_at)) < 60 THEN 'Just now'
      WHEN EXTRACT(EPOCH FROM (NOW() - ua.created_at)) < 3600 THEN 
        FLOOR(EXTRACT(EPOCH FROM (NOW() - ua.created_at)) / 60)::TEXT || 'm ago'
      WHEN EXTRACT(EPOCH FROM (NOW() - ua.created_at)) < 86400 THEN 
        FLOOR(EXTRACT(EPOCH FROM (NOW() - ua.created_at)) / 3600)::TEXT || 'h ago'
      ELSE 
        FLOOR(EXTRACT(EPOCH FROM (NOW() - ua.created_at)) / 86400)::TEXT || 'd ago'
    END as time_ago
  FROM user_activities ua
  WHERE ua.user_id = p_user_id
  ORDER BY ua.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_activities TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_activities TO authenticated; 