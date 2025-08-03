import {
  User,
  Profile,
  Trade,
  Transaction,
  Wallet,
  AdminAction,
  TradeOutcomeLog,
  testConnection,
  syncDatabase,
  UserAttributes,
  ProfileAttributes,
  TradeAttributes,
  TransactionAttributes,
  WalletAttributes,
  AdminActionAttributes,
  TradeOutcomeLogAttributes
} from '../config/database';
import sequelize from '../config/database';
import { Op } from 'sequelize';

// Database initialization
export const initializeDatabase = async () => {
  await testConnection();
  await syncDatabase();
};

// User Management Services
export class UserService {
  // Create new user
  static async createUser(userData: Partial<UserAttributes>): Promise<User> {
    try {
      const user = await User.create(userData);
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Get user by ID
  static async getUserById(id: string): Promise<User | null> {
    try {
      const user = await User.findByPk(id, {
        include: [
          { model: Profile, as: 'profile' },
          { model: Wallet, as: 'wallets' }
        ]
      });
      return user;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  // Get user by email
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await User.findOne({
        where: { email },
        include: [
          { model: Profile, as: 'profile' },
          { model: Wallet, as: 'wallets' }
        ]
      });
      return user;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  // Update user
  static async updateUser(id: string, userData: Partial<UserAttributes>): Promise<User | null> {
    try {
      const user = await User.findByPk(id);
      if (user) {
        await user.update(userData);
        return user;
      }
      return null;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Get all users (for admin)
  static async getAllUsers(page: number = 1, limit: number = 20, search?: string): Promise<{ users: User[], total: number }> {
    try {
      const whereClause = search ? {
        [Op.or]: [
          { email: { [Op.iLike]: `%${search}%` } },
          { full_name: { [Op.iLike]: `%${search}%` } }
        ]
      } : {};

      const { count, rows } = await User.findAndCountAll({
        where: whereClause,
        include: [
          { model: Profile, as: 'profile' },
          { model: Wallet, as: 'wallets' }
        ],
        limit,
        offset: (page - 1) * limit,
        order: [['created_at', 'DESC']]
      });

      return { users: rows, total: count };
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  // Delete user
  static async deleteUser(id: string): Promise<boolean> {
    try {
      const user = await User.findByPk(id);
      if (user) {
        await user.destroy();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}

// Profile Management Services
export class ProfileService {
  // Create or update profile
  static async upsertProfile(profileData: Partial<ProfileAttributes>): Promise<Profile> {
    try {
      const [profile, created] = await Profile.findOrCreate({
        where: { user_id: profileData.user_id! },
        defaults: profileData
      });

      if (!created) {
        await profile.update(profileData);
      }

      return profile;
    } catch (error) {
      console.error('Error upserting profile:', error);
      throw error;
    }
  }

  // Get profile by user ID
  static async getProfileByUserId(userId: string): Promise<Profile | null> {
    try {
      const profile = await Profile.findOne({
        where: { user_id: userId },
        include: [{ model: User, as: 'user' }]
      });
      return profile;
    } catch (error) {
      console.error('Error getting profile by user ID:', error);
      throw error;
    }
  }
}

// Trading Services
export class TradingService {
  // Create new trade
  static async createTrade(tradeData: Partial<TradeAttributes>): Promise<Trade> {
    try {
      const trade = await Trade.create(tradeData);
      return trade;
    } catch (error) {
      console.error('Error creating trade:', error);
      throw error;
    }
  }

  // Get user trades
  static async getUserTrades(userId: string, page: number = 1, limit: number = 20): Promise<{ trades: Trade[], total: number }> {
    try {
      const { count, rows } = await Trade.findAndCountAll({
        where: { user_id: userId },
        include: [{ model: User, as: 'user' }],
        limit,
        offset: (page - 1) * limit,
        order: [['created_at', 'DESC']]
      });

      return { trades: rows, total: count };
    } catch (error) {
      console.error('Error getting user trades:', error);
      throw error;
    }
  }

  // Get all trades (for admin)
  static async getAllTrades(page: number = 1, limit: number = 20, filters?: any): Promise<{ trades: Trade[], total: number }> {
    try {
      const whereClause: any = {};
      
      if (filters?.status) whereClause.status = filters.status;
      if (filters?.trading_pair) whereClause.trading_pair = filters.trading_pair;
      if (filters?.user_id) whereClause.user_id = filters.user_id;

      const { count, rows } = await Trade.findAndCountAll({
        where: whereClause,
        include: [{ model: User, as: 'user' }],
        limit,
        offset: (page - 1) * limit,
        order: [['created_at', 'DESC']]
      });

      return { trades: rows, total: count };
    } catch (error) {
      console.error('Error getting all trades:', error);
      throw error;
    }
  }

  // Update trade
  static async updateTrade(id: string, tradeData: Partial<TradeAttributes>): Promise<Trade | null> {
    try {
      const trade = await Trade.findByPk(id);
      if (trade) {
        await trade.update(tradeData);
        return trade;
      }
      return null;
    } catch (error) {
      console.error('Error updating trade:', error);
      throw error;
    }
  }

  // Get trade statistics
  static async getTradeStatistics(userId?: string): Promise<any> {
    try {
      const whereClause = userId ? { user_id: userId } : {};

      const stats = await Trade.findAll({
        where: whereClause,
        attributes: [
          'status',
          'outcome',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('total_value')), 'total_value'],
          [sequelize.fn('SUM', sequelize.col('profit_loss')), 'total_profit_loss']
        ],
        group: ['status', 'outcome']
      });

      return stats;
    } catch (error) {
      console.error('Error getting trade statistics:', error);
      throw error;
    }
  }
}

// Transaction Services
export class TransactionService {
  // Create new transaction
  static async createTransaction(transactionData: Partial<TransactionAttributes>): Promise<Transaction> {
    try {
      const transaction = await Transaction.create(transactionData);
      return transaction;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  // Get user transactions
  static async getUserTransactions(userId: string, page: number = 1, limit: number = 20): Promise<{ transactions: Transaction[], total: number }> {
    try {
      const { count, rows } = await Transaction.findAndCountAll({
        where: { user_id: userId },
        include: [{ model: User, as: 'user' }],
        limit,
        offset: (page - 1) * limit,
        order: [['created_at', 'DESC']]
      });

      return { transactions: rows, total: count };
    } catch (error) {
      console.error('Error getting user transactions:', error);
      throw error;
    }
  }

  // Get all transactions (for admin)
  static async getAllTransactions(page: number = 1, limit: number = 20, filters?: any): Promise<{ transactions: Transaction[], total: number }> {
    try {
      const whereClause: any = {};
      
      if (filters?.type) whereClause.type = filters.type;
      if (filters?.status) whereClause.status = filters.status;
      if (filters?.user_id) whereClause.user_id = filters.user_id;

      const { count, rows } = await Transaction.findAndCountAll({
        where: whereClause,
        include: [{ model: User, as: 'user' }],
        limit,
        offset: (page - 1) * limit,
        order: [['created_at', 'DESC']]
      });

      return { transactions: rows, total: count };
    } catch (error) {
      console.error('Error getting all transactions:', error);
      throw error;
    }
  }
}

// Wallet Services
export class WalletService {
  // Create or update wallet
  static async upsertWallet(walletData: Partial<WalletAttributes>): Promise<Wallet> {
    try {
      const [wallet, created] = await Wallet.findOrCreate({
        where: { 
          user_id: walletData.user_id!,
          currency: walletData.currency!
        },
        defaults: walletData
      });

      if (!created) {
        await wallet.update(walletData);
      }

      return wallet;
    } catch (error) {
      console.error('Error upserting wallet:', error);
      throw error;
    }
  }

  // Get user wallets
  static async getUserWallets(userId: string): Promise<Wallet[]> {
    try {
      const wallets = await Wallet.findAll({
        where: { user_id: userId },
        include: [{ model: User, as: 'user' }]
      });
      return wallets;
    } catch (error) {
      console.error('Error getting user wallets:', error);
      throw error;
    }
  }

  // Update wallet balance
  static async updateWalletBalance(userId: string, currency: string, amount: number): Promise<Wallet | null> {
    try {
      const wallet = await Wallet.findOne({
        where: { user_id: userId, currency }
      });

      if (wallet) {
        const newBalance = parseFloat(wallet.balance.toString()) + amount;
        await wallet.update({ balance: newBalance });
        return wallet;
      }
      return null;
    } catch (error) {
      console.error('Error updating wallet balance:', error);
      throw error;
    }
  }
}

// Admin Services
export class AdminService {
  // Log admin action
  static async logAdminAction(actionData: Partial<AdminActionAttributes>): Promise<AdminAction> {
    try {
      const action = await AdminAction.create(actionData);
      return action;
    } catch (error) {
      console.error('Error logging admin action:', error);
      throw error;
    }
  }

  // Get admin actions
  static async getAdminActions(page: number = 1, limit: number = 20, filters?: any): Promise<{ actions: AdminAction[], total: number }> {
    try {
      const whereClause: any = {};
      
      if (filters?.admin_id) whereClause.admin_id = filters.admin_id;
      if (filters?.action_type) whereClause.action_type = filters.action_type;
      if (filters?.target_user_id) whereClause.target_user_id = filters.target_user_id;

      const { count, rows } = await AdminAction.findAndCountAll({
        where: whereClause,
        include: [
          { model: User, as: 'admin' },
          { model: User, as: 'targetUser' }
        ],
        limit,
        offset: (page - 1) * limit,
        order: [['created_at', 'DESC']]
      });

      return { actions: rows, total: count };
    } catch (error) {
      console.error('Error getting admin actions:', error);
      throw error;
    }
  }

  // Log trade outcome change
  static async logTradeOutcomeChange(logData: Partial<TradeOutcomeLogAttributes>): Promise<TradeOutcomeLog> {
    try {
      const log = await TradeOutcomeLog.create(logData);
      return log;
    } catch (error) {
      console.error('Error logging trade outcome change:', error);
      throw error;
    }
  }

  // Get trade outcome logs
  static async getTradeOutcomeLogs(page: number = 1, limit: number = 20, filters?: any): Promise<{ logs: TradeOutcomeLog[], total: number }> {
    try {
      const whereClause: any = {};
      
      if (filters?.admin_id) whereClause.admin_id = filters.admin_id;
      if (filters?.user_id) whereClause.user_id = filters.user_id;

      const { count, rows } = await TradeOutcomeLog.findAndCountAll({
        where: whereClause,
        include: [
          { model: User, as: 'admin' },
          { model: User, as: 'user' }
        ],
        limit,
        offset: (page - 1) * limit,
        order: [['created_at', 'DESC']]
      });

      return { logs: rows, total: count };
    } catch (error) {
      console.error('Error getting trade outcome logs:', error);
      throw error;
    }
  }
}

// Analytics Services
export class AnalyticsService {
  // Get platform statistics
  static async getPlatformStats(): Promise<any> {
    try {
      const [
        totalUsers,
        totalTrades,
        totalTransactions,
        totalVolume
      ] = await Promise.all([
        User.count(),
        Trade.count(),
        Transaction.count(),
        Trade.sum('total_value')
      ]);

      return {
        totalUsers,
        totalTrades,
        totalTransactions,
        totalVolume: totalVolume || 0
      };
    } catch (error) {
      console.error('Error getting platform stats:', error);
      throw error;
    }
  }

  // Get user statistics
  static async getUserStats(userId: string): Promise<any> {
    try {
      const [
        totalTrades,
        totalVolume,
        totalProfitLoss,
        walletBalance
      ] = await Promise.all([
        Trade.count({ where: { user_id: userId } }),
        Trade.sum('total_value', { where: { user_id: userId } }),
        Trade.sum('profit_loss', { where: { user_id: userId } }),
        Wallet.sum('balance', { where: { user_id: userId } })
      ]);

      return {
        totalTrades,
        totalVolume: totalVolume || 0,
        totalProfitLoss: totalProfitLoss || 0,
        walletBalance: walletBalance || 0
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }
}

export default {
  initializeDatabase,
  UserService,
  ProfileService,
  TradingService,
  TransactionService,
  WalletService,
  AdminService,
  AnalyticsService
}; 