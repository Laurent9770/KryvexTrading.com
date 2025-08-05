-- Admin Migration Script for Kryvex Trading Platform
-- This script adds the necessary tables and columns for admin functionality

-- Add force_mode column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'force_mode'
    ) THEN
        ALTER TABLE users ADD COLUMN force_mode VARCHAR(10) DEFAULT NULL;
        COMMENT ON COLUMN users.force_mode IS 'win, lose, or NULL for normal trading';
    END IF;
END $$;

-- Create admin_fund_actions table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_fund_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES users(id),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    asset VARCHAR(10) NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    action_type VARCHAR(20) NOT NULL, -- 'add', 'remove'
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL, -- 'fund_add', 'fund_remove', 'kyc_approve', 'kyc_reject', 'deposit_approve', 'deposit_reject', 'withdrawal_approve', 'withdrawal_reject', 'trade_override', 'notification_send'
    target_user_id UUID REFERENCES users(id),
    details JSONB,
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_force_mode ON users(force_mode);
CREATE INDEX IF NOT EXISTS idx_admin_fund_actions_user ON admin_fund_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_fund_actions_admin ON admin_fund_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user ON audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);

-- Update notifications table to include 'admin' type if not exists
DO $$ 
BEGIN
    -- Check if the notifications table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        -- Update the comment to include 'admin' type
        COMMENT ON COLUMN notifications.type IS 'trade, deposit, withdrawal, kyc, system, admin';
    END IF;
END $$;

-- Insert default admin user if not exists
INSERT INTO users (email, password_hash, first_name, last_name, is_admin, is_verified, is_active)
SELECT 'admin@kryvex.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'Kryvex', true, true, true
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'admin@kryvex.com'
);

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
    INSERT INTO audit_logs (admin_id, action_type, target_user_id, details, ip_address)
    VALUES (p_admin_id, p_action_type, p_target_user_id, p_details, p_ip_address);
END;
$$ LANGUAGE plpgsql;

-- Create function to get admin statistics
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_users', (SELECT COUNT(*) FROM users WHERE is_admin = false),
        'verified_users', (SELECT COUNT(*) FROM users WHERE is_admin = false AND is_verified = true),
        'pending_kyc', (SELECT COUNT(*) FROM kyc_submissions WHERE status = 'pending'),
        'pending_deposits', (SELECT COUNT(*) FROM deposits WHERE status = 'pending'),
        'pending_withdrawals', (SELECT COUNT(*) FROM withdrawals WHERE status = 'pending'),
        'pending_trades', (SELECT COUNT(*) FROM trades WHERE status = 'pending'),
        'total_usdt_balance', (SELECT COALESCE(SUM(balance), 0) FROM wallets WHERE asset = 'USDT'),
        'total_btc_balance', (SELECT COALESCE(SUM(balance), 0) FROM wallets WHERE asset = 'BTC'),
        'total_eth_balance', (SELECT COALESCE(SUM(balance), 0) FROM wallets WHERE asset = 'ETH')
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user details with balances
CREATE OR REPLACE FUNCTION get_user_details_with_balances(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'user', row_to_json(u),
        'balances', (
            SELECT json_object_agg(w.asset, w.balance)
            FROM wallets w
            WHERE w.user_id = p_user_id
        ),
        'kyc_status', k.status,
        'kyc_level', k.level
    )
    FROM users u
    LEFT JOIN kyc_submissions k ON u.id = k.user_id AND k.level = 1
    WHERE u.id = p_user_id AND u.is_admin = false
    INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION log_admin_action(UUID, VARCHAR, UUID, JSONB, INET) TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_admin_stats() TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_user_details_with_balances(UUID) TO PUBLIC;

-- Create view for admin dashboard
CREATE OR REPLACE VIEW admin_dashboard_view AS
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.is_verified,
    u.is_active,
    u.force_mode,
    u.created_at,
    u.updated_at,
    COALESCE(SUM(CASE WHEN w.asset = 'USDT' THEN w.balance ELSE 0 END), 0) as usdt_balance,
    COALESCE(SUM(CASE WHEN w.asset = 'BTC' THEN w.balance ELSE 0 END), 0) as btc_balance,
    COALESCE(SUM(CASE WHEN w.asset = 'ETH' THEN w.balance ELSE 0 END), 0) as eth_balance,
    k.status as kyc_status,
    k.level as kyc_level
FROM users u
LEFT JOIN wallets w ON u.id = w.user_id
LEFT JOIN kyc_submissions k ON u.id = k.user_id AND k.level = 1
WHERE u.is_admin = false
GROUP BY u.id, k.status, k.level;

-- Create view for audit logs with user details
CREATE OR REPLACE VIEW audit_logs_view AS
SELECT 
    al.*,
    admin.email as admin_email,
    admin.first_name as admin_first_name,
    admin.last_name as admin_last_name,
    target.email as target_email,
    target.first_name as target_first_name,
    target.last_name as target_last_name
FROM audit_logs al
LEFT JOIN users admin ON al.admin_id = admin.id
LEFT JOIN users target ON al.target_user_id = target.id;

-- Grant permissions on views
GRANT SELECT ON admin_dashboard_view TO PUBLIC;
GRANT SELECT ON audit_logs_view TO PUBLIC;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_admin_dashboard_created_at ON admin_dashboard_view(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_dashboard_kyc_status ON admin_dashboard_view(kyc_status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_view_created_at ON audit_logs_view(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_view_action_type ON audit_logs_view(action_type);

-- Add comments for documentation
COMMENT ON TABLE admin_fund_actions IS 'Tracks manual fund changes made by admins';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail of all admin actions';
COMMENT ON VIEW admin_dashboard_view IS 'View for admin dashboard with user balances and KYC status';
COMMENT ON VIEW audit_logs_view IS 'View for audit logs with admin and target user details';

-- Migration completed message
DO $$
BEGIN
    RAISE NOTICE 'Admin migration completed successfully!';
    RAISE NOTICE 'New tables created: admin_fund_actions, audit_logs';
    RAISE NOTICE 'New column added: users.force_mode';
    RAISE NOTICE 'New functions created: log_admin_action, get_admin_stats, get_user_details_with_balances';
    RAISE NOTICE 'New views created: admin_dashboard_view, audit_logs_view';
    RAISE NOTICE 'Admin user created: admin@kryvex.com (password: Kryvex.@123)';
END $$; 