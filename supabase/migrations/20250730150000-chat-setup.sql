-- Chat Rooms Table
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('support', 'general', 'admin', 'private')),
  is_public BOOLEAN DEFAULT false,
  participants UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  message TEXT NOT NULL,
  room UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'user' CHECK (type IN ('user', 'admin', 'system')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_type ON chat_rooms(type);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_participants ON chat_rooms USING GIN(participants);

-- Insert default rooms
INSERT INTO chat_rooms (id, name, type, is_public, participants) VALUES
  ('general', 'General Support', 'general', true, '{}'),
  ('admin', 'Admin Channel', 'admin', false, '{}')
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for chat_rooms
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

-- Users can view public rooms or rooms they're participants in
CREATE POLICY "Users can view accessible chat rooms" ON chat_rooms
  FOR SELECT USING (
    is_public = true OR 
    auth.uid() = ANY(participants) OR
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can create, update, or delete rooms
CREATE POLICY "Only admins can manage chat rooms" ON chat_rooms
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages in rooms they have access to
CREATE POLICY "Users can view messages in accessible rooms" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_rooms 
      WHERE id = chat_messages.room AND (
        is_public = true OR 
        auth.uid() = ANY(participants) OR
        EXISTS (
          SELECT 1 FROM user_roles 
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      )
    )
  );

-- Users can insert messages in rooms they have access to
CREATE POLICY "Users can send messages in accessible rooms" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_rooms 
      WHERE id = chat_messages.room AND (
        is_public = true OR 
        auth.uid() = ANY(participants) OR
        EXISTS (
          SELECT 1 FROM user_roles 
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      )
    ) AND
    auth.uid() = user_id
  );

-- Only admins can update or delete messages
CREATE POLICY "Only admins can manage messages" ON chat_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete messages" ON chat_messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_chat_rooms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_chat_rooms_updated_at
  BEFORE UPDATE ON chat_rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_rooms_updated_at();

-- Function to log chat activity
CREATE OR REPLACE FUNCTION log_chat_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_actions (
    admin_id,
    action_type,
    target_user_id,
    details
  ) VALUES (
    NEW.user_id,
    'chat_message',
    NULL,
    jsonb_build_object(
      'room_id', NEW.room,
      'message_length', length(NEW.message),
      'message_type', NEW.type
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to log chat activity for admins
CREATE TRIGGER log_chat_activity_trigger
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  WHEN (EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = NEW.user_id AND role = 'admin'
  ))
  EXECUTE FUNCTION log_chat_activity(); 