-- Admin System Migration Script
-- Run this script to add admin functionality to your database

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add force_mode column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS force_mode VARCHAR(10) DEFAULT NULL;

-- Create admin_fund_actions table
CREATE TABLE IF NOT EXISTS admin_fund_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES profiles(id),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    asset VARCHAR(10) NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('add', 'remove')),
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES profiles(id),
    action_type VARCHAR(50) NOT NULL,
    target_user_id UUID REFERENCES profiles(id),
    details JSONB,
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create notifications table if not exists
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'admin',
    is_read BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_fund_actions_user_id ON admin_fund_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_fund_actions_admin_id ON admin_fund_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_fund_actions_created_at ON admin_fund_actions(created_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user_id ON audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Add RLS policies for admin tables
ALTER TABLE admin_fund_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Admin can read all fund actions
CREATE POLICY "Admin can read all fund actions" ON admin_fund_actions
    FOR SELECT USING (auth.role() = 'admin');

-- Admin can insert fund actions
CREATE POLICY "Admin can insert fund actions" ON admin_fund_actions
    FOR INSERT WITH CHECK (auth.role() = 'admin');

-- Admin can read all audit logs
CREATE POLICY "Admin can read all audit logs" ON audit_logs
    FOR SELECT USING (auth.role() = 'admin');

-- Admin can insert audit logs
CREATE POLICY "Admin can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (auth.role() = 'admin');

-- Users can read their own notifications
CREATE POLICY "Users can read their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Admin can read all notifications
CREATE POLICY "Admin can read all notifications" ON notifications
    FOR SELECT USING (auth.role() = 'admin');

-- Admin can insert notifications
CREATE POLICY "Admin can insert notifications" ON notifications
    FOR INSERT WITH CHECK (auth.role() = 'admin');

-- Admin can update notifications
CREATE POLICY "Admin can update notifications" ON notifications
    FOR UPDATE USING (auth.role() = 'admin');

-- Create function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
    p_admin_id UUID,
    p_action_type VARCHAR(50),
    p_target_user_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO audit_logs (
        admin_id,
        action_type,
        target_user_id,
        details,
        ip_address
    ) VALUES (
        p_admin_id,
        p_action_type,
        p_target_user_id,
        p_details,
        p_ip_address
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get admin statistics
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_users', (SELECT COUNT(*) FROM profiles),
        'verified_users', (SELECT COUNT(*) FROM profiles WHERE is_verified = true),
        'pending_kyc', (SELECT COUNT(*) FROM kyc_submissions WHERE status = 'pending'),
        'pending_deposits', (SELECT COUNT(*) FROM deposits WHERE status = 'pending'),
        'pending_withdrawals', (SELECT COUNT(*) FROM withdrawal_requests WHERE status = 'pending'),
        'pending_trades', (SELECT COUNT(*) FROM trades WHERE status = 'pending'),
        'total_usdt_balance', (SELECT COALESCE(SUM(CAST(account_balance AS DECIMAL)), 0) FROM profiles),
        'total_btc_balance', '2.5',
        'total_eth_balance', '25.0'
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON admin_fund_actions TO authenticated;
GRANT ALL ON audit_logs TO authenticated;
GRANT ALL ON notifications TO authenticated;
GRANT EXECUTE ON FUNCTION log_admin_action TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_stats TO authenticated;

-- Insert sample admin user if not exists
INSERT INTO profiles (id, email, full_name, is_verified, account_status, kyc_status)
VALUES (
    'admin-user-id',
    'admin@kryvex.com',
    'Admin Kryvex',
    true,
    'active',
    'approved'
) ON CONFLICT (id) DO NOTHING;

-- Insert sample admin role if user_roles table exists
INSERT INTO user_roles (user_id, role)
VALUES ('admin-user-id', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

COMMIT; 