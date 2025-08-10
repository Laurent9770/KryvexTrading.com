import supabase from '@/lib/supabaseClient';
import { httpDb } from '@/integrations/supabase/httpClient';

export interface AdminUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  username?: string;
  kycLevel: number;
  kycStatus: 'pending' | 'verified' | 'rejected';
  accountStatus: 'active' | 'suspended' | 'banned';
  walletBalance: number;
  tradingBalance: number;
  totalTrades: number;
  winRate: number;
  totalProfit: number;
  lastLogin?: string;
  createdAt: string;
  isVerified: boolean;
  country?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  suspendedUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  totalBalance: number;
  totalTrades: number;
  averageWinRate: number;
}

class AdminUserService {
  async getAllUsers(): Promise<{ success: boolean; users?: AdminUser[]; error?: string }> {
    try {
      console.log('🔍 Fetching all users from database...');
      
      // Get users from profiles table (which should have all users due to trigger)
      const { data: profiles, error: profileError } = await httpDb.select('profiles', `
        user_id,
        email,
        full_name,
        phone,
        country,
        account_balance,
        is_verified,
        kyc_status,
        account_status,
        created_at,
        updated_at
      `);

      if (profileError) {
        console.error('❌ Error fetching profiles:', profileError);
        return { success: false, error: profileError.message };
      }

      if (!profiles || profiles.length === 0) {
        console.log('ℹ️ No users found in profiles table');
        return { success: true, users: [] };
      }

      console.log('✅ Found', profiles.length, 'users in profiles table');

      // Transform profiles to AdminUser format
      const users: AdminUser[] = profiles.map((profile: any) => ({
        id: profile.user_id,
        email: profile.email || '',
        firstName: profile.full_name ? profile.full_name.split(' ')[0] : '',
        lastName: profile.full_name ? profile.full_name.split(' ').slice(1).join(' ') : '',
        phone: profile.phone || '',
        username: profile.full_name || profile.email?.split('@')[0] || '',
        kycLevel: profile.kyc_status === 'approved' ? 2 : profile.kyc_status === 'pending' ? 1 : 0,
        kycStatus: profile.kyc_status || 'pending',
        accountStatus: profile.account_status || 'active',
        walletBalance: parseFloat(profile.account_balance?.toString() || '0'),
        tradingBalance: parseFloat(profile.account_balance?.toString() || '0') * 0.8,
        totalTrades: 0, // Will be calculated from trades table
        winRate: 0, // Will be calculated from trades table
        totalProfit: 0, // Will be calculated from trades table
        lastLogin: profile.updated_at || profile.created_at,
        createdAt: profile.created_at,
        isVerified: profile.is_verified || false,
        country: profile.country || '',
        emailVerified: profile.is_verified || false,
        phoneVerified: false
      }));

      

      // Try to get trading data if trades table exists
      try {
        const { data: trades, error: tradesError } = await httpDb.select('trades', `
          user_id,
          amount,
          profit_loss,
          status,
          created_at
        `);

        if (!tradesError && trades) {
          console.log('✅ Found', trades.length, 'trades');
          
          // Calculate trading stats for each user
          const userTrades: { [userId: string]: any[] } = {};
          trades.forEach((trade: any) => {
            if (!userTrades[trade.user_id]) {
              userTrades[trade.user_id] = [];
            }
            userTrades[trade.user_id].push(trade);
          });

          users.forEach((user, index) => {
            const userTradeList = userTrades[user.id] || [];
            const completedTrades = userTradeList.filter((t: any) => t.status === 'closed');
            const wins = completedTrades.filter((t: any) => (t.profit_loss || 0) > 0);
            
            users[index] = {
              ...user,
              totalTrades: completedTrades.length,
              winRate: completedTrades.length > 0 ? (wins.length / completedTrades.length) * 100 : 0,
              totalProfit: completedTrades.reduce((sum: number, t: any) => sum + (t.profit_loss || 0), 0)
            };
          });
        }
      } catch (tradesError) {
        console.warn('⚠️ Trades table not accessible:', tradesError);
      }

      console.log('✅ Successfully loaded', users.length, 'users with complete data');
      return { success: true, users };

    } catch (error: any) {
      console.error('❌ Error in getAllUsers:', error);
      return { success: false, error: error.message || 'Failed to fetch users' };
    }
  }

  async getUserStats(users: AdminUser[]): Promise<UserStats> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats: UserStats = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.accountStatus === 'active').length,
      verifiedUsers: users.filter(u => u.isVerified).length,
      suspendedUsers: users.filter(u => u.accountStatus === 'suspended' || u.accountStatus === 'banned').length,
      newUsersToday: users.filter(u => new Date(u.createdAt) >= today).length,
      newUsersThisWeek: users.filter(u => new Date(u.createdAt) >= weekAgo).length,
      newUsersThisMonth: users.filter(u => new Date(u.createdAt) >= monthAgo).length,
      totalBalance: users.reduce((sum, u) => sum + u.walletBalance, 0),
      totalTrades: users.reduce((sum, u) => sum + u.totalTrades, 0),
      averageWinRate: users.length > 0 ? users.reduce((sum, u) => sum + u.winRate, 0) / users.length : 0
    };

    return stats;
  }

  async updateUserStatus(userId: string, status: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔧 Updating user status:', userId, status);
      
      // Update in profiles table if it exists
      try {
        const { error } = await httpDb.update('profiles', 
          { account_status: status, updated_at: new Date().toISOString() },
          { user_id: userId }
        );
        
        if (error) {
          console.warn('⚠️ Could not update profiles table:', error);
        }
      } catch (profileError) {
        console.warn('⚠️ Profiles table not accessible for status update');
      }

      // Log the admin action
      try {
        await httpDb.insert('admin_actions', {
          admin_id: 'system',
          user_id: userId,
          action_type: 'status_update',
          details: JSON.stringify({ status, reason }),
          created_at: new Date().toISOString()
        });
      } catch (logError) {
        console.warn('⚠️ Could not log admin action:', logError);
      }

      return { success: true };
    } catch (error: any) {
      console.error('❌ Error updating user status:', error);
      return { success: false, error: error.message };
    }
  }

  async adjustUserBalance(userId: string, amount: number, type: 'add' | 'subtract', reason: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('💰 Adjusting user balance:', userId, type, amount);
      
      // Update in profiles table if it exists
      try {
        const { data: currentProfile, error: fetchError } = await httpDb.select('profiles', 'account_balance', { user_id: userId });
        
        if (!fetchError && currentProfile && currentProfile.length > 0) {
          const currentBalance = parseFloat(currentProfile[0].account_balance?.toString() || '0');
          const newBalance = type === 'add' ? currentBalance + amount : currentBalance - amount;
          
          const { error: updateError } = await httpDb.update('profiles',
            { 
              account_balance: newBalance,
              updated_at: new Date().toISOString()
            },
            { user_id: userId }
          );
          
          if (updateError) {
            console.warn('⚠️ Could not update profiles table:', updateError);
          }
        }
      } catch (profileError) {
        console.warn('⚠️ Profiles table not accessible for balance update');
      }

      // Log the wallet adjustment
      try {
        await httpDb.insert('wallet_adjustments', {
          user_id: userId,
          admin_id: 'system',
          amount: type === 'add' ? amount : -amount,
          reason,
          created_at: new Date().toISOString()
        });
      } catch (logError) {
        console.warn('⚠️ Could not log wallet adjustment:', logError);
      }

      return { success: true };
    } catch (error: any) {
      console.error('❌ Error adjusting user balance:', error);
      return { success: false, error: error.message };
    }
  }

  async sendMessageToUser(userId: string, message: string, subject: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('💬 Sending message to user:', userId);
      
      // Create a support ticket for the message
      try {
        await httpDb.insert('support_tickets', {
          user_id: userId,
          subject,
          status: 'open',
          priority: 'medium',
          created_at: new Date().toISOString()
        });
      } catch (ticketError) {
        console.warn('⚠️ Could not create support ticket:', ticketError);
      }

      // Log the admin message
      try {
        await httpDb.insert('admin_actions', {
          admin_id: 'system',
          user_id: userId,
          action_type: 'message_sent',
          details: JSON.stringify({ subject, message }),
          created_at: new Date().toISOString()
        });
      } catch (logError) {
        console.warn('⚠️ Could not log admin message:', logError);
      }

      return { success: true };
    } catch (error: any) {
      console.error('❌ Error sending message to user:', error);
      return { success: false, error: error.message };
    }
  }

  async forceTradeOutcome(userId: string, tradeId: string, outcome: 'win' | 'loss', reason: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🎯 Forcing trade outcome:', tradeId, outcome);
      
      // Update trade in trades table if it exists
      try {
        const { error } = await httpDb.update('trades',
          { 
            outcome,
            status: 'closed',
            updated_at: new Date().toISOString()
          },
          { id: tradeId, user_id: userId }
        );
        
        if (error) {
          console.warn('⚠️ Could not update trade:', error);
        }
      } catch (tradeError) {
        console.warn('⚠️ Trades table not accessible for outcome update');
      }

      // Log the forced outcome
      try {
        await httpDb.insert('trade_outcome_logs', {
          trade_id: tradeId,
          user_id: userId,
          admin_id: 'system',
          original_outcome: 'pending',
          forced_outcome: outcome,
          reason,
          created_at: new Date().toISOString()
        });
      } catch (logError) {
        console.warn('⚠️ Could not log trade outcome:', logError);
      }

      return { success: true };
    } catch (error: any) {
      console.error('❌ Error forcing trade outcome:', error);
      return { success: false, error: error.message };
    }
  }
}

const adminUserService = new AdminUserService();
export default adminUserService;
