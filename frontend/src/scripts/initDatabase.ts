import { initializeDatabase, UserService, ProfileService, WalletService, TradingService, TransactionService, AdminService } from '../services/databaseService';
import { User, Profile, Wallet, Trade, Transaction } from '../config/database';

// Sample data for initialization
const sampleUsers = [
  {
    email: 'admin@kryvex.com',
    full_name: 'Admin User',
    is_admin: true,
    is_verified: true,
    kyc_status: 'approved' as const
  },
  {
    email: 'trader1@example.com',
    full_name: 'John Trader',
    is_admin: false,
    is_verified: true,
    kyc_status: 'approved' as const
  },
  {
    email: 'trader2@example.com',
    full_name: 'Sarah Investor',
    is_admin: false,
    is_verified: true,
    kyc_status: 'approved' as const
  },
  {
    email: 'trader3@example.com',
    full_name: 'Mike Crypto',
    is_admin: false,
    is_verified: false,
    kyc_status: 'pending' as const
  }
];

const sampleProfiles = [
  {
    full_name: 'Admin User',
    phone: '+1234567890',
    country: 'United States',
    date_of_birth: new Date('1990-01-01'),
    kyc_documents: {
      passport: 'uploaded',
      selfie: 'uploaded'
    },
    trading_preferences: {
      risk_level: 'moderate',
      preferred_pairs: ['BTC/USDT', 'ETH/USDT'],
      auto_trading: false
    },
    notification_settings: {
      email: true,
      push: true,
      sms: false
    }
  },
  {
    full_name: 'John Trader',
    phone: '+1234567891',
    country: 'Canada',
    date_of_birth: new Date('1985-05-15'),
    kyc_documents: {
      passport: 'uploaded',
      selfie: 'uploaded'
    },
    trading_preferences: {
      risk_level: 'aggressive',
      preferred_pairs: ['BTC/USDT', 'ETH/USDT', 'BNB/USDT'],
      auto_trading: true
    },
    notification_settings: {
      email: true,
      push: true,
      sms: true
    }
  },
  {
    full_name: 'Sarah Investor',
    phone: '+1234567892',
    country: 'United Kingdom',
    date_of_birth: new Date('1992-08-20'),
    kyc_documents: {
      passport: 'uploaded',
      selfie: 'uploaded'
    },
    trading_preferences: {
      risk_level: 'conservative',
      preferred_pairs: ['BTC/USDT', 'ETH/USDT'],
      auto_trading: false
    },
    notification_settings: {
      email: true,
      push: false,
      sms: false
    }
  },
  {
    full_name: 'Mike Crypto',
    phone: '+1234567893',
    country: 'Australia',
    date_of_birth: new Date('1988-12-10'),
    kyc_documents: {
      passport: 'pending',
      selfie: 'pending'
    },
    trading_preferences: {
      risk_level: 'moderate',
      preferred_pairs: ['BTC/USDT'],
      auto_trading: false
    },
    notification_settings: {
      email: true,
      push: true,
      sms: false
    }
  }
];

const sampleWallets = [
  { currency: 'USDT', balance: 50000, locked_balance: 0 },
  { currency: 'BTC', balance: 2.5, locked_balance: 0 },
  { currency: 'ETH', balance: 15.8, locked_balance: 0 },
  { currency: 'USDT', balance: 25000, locked_balance: 0 },
  { currency: 'BTC', balance: 1.2, locked_balance: 0 },
  { currency: 'ETH', balance: 8.5, locked_balance: 0 },
  { currency: 'USDT', balance: 15000, locked_balance: 0 },
  { currency: 'BTC', balance: 0.8, locked_balance: 0 },
  { currency: 'ETH', balance: 5.2, locked_balance: 0 },
  { currency: 'USDT', balance: 5000, locked_balance: 0 },
  { currency: 'BTC', balance: 0.3, locked_balance: 0 },
  { currency: 'ETH', balance: 2.1, locked_balance: 0 }
];

const sampleTrades = [
  {
    trading_pair: 'BTC/USDT',
    trade_type: 'buy' as const,
    order_type: 'market' as const,
    amount: 0.1,
    price: 45000,
    total_value: 4500,
    status: 'completed' as const,
    outcome: 'win' as const,
    profit_loss: 250
  },
  {
    trading_pair: 'ETH/USDT',
    trade_type: 'sell' as const,
    order_type: 'limit' as const,
    amount: 2.5,
    price: 3200,
    total_value: 8000,
    status: 'completed' as const,
    outcome: 'loss' as const,
    profit_loss: -150
  },
  {
    trading_pair: 'BTC/USDT',
    trade_type: 'buy' as const,
    order_type: 'market' as const,
    amount: 0.05,
    price: 46000,
    total_value: 2300,
    status: 'completed' as const,
    outcome: 'win' as const,
    profit_loss: 180
  },
  {
    trading_pair: 'ETH/USDT',
    trade_type: 'buy' as const,
    order_type: 'limit' as const,
    amount: 1.8,
    price: 3100,
    total_value: 5580,
    status: 'pending' as const
  },
  {
    trading_pair: 'BNB/USDT',
    trade_type: 'sell' as const,
    order_type: 'market' as const,
    amount: 5.0,
    price: 280,
    total_value: 1400,
    status: 'completed' as const,
    outcome: 'win' as const,
    profit_loss: 120
  }
];

const sampleTransactions = [
  {
    type: 'deposit' as const,
    amount: 10000,
    currency: 'USDT',
    status: 'completed' as const,
    reference: 'DEP-001',
    description: 'Initial deposit'
  },
  {
    type: 'trade' as const,
    amount: 4500,
    currency: 'USDT',
    status: 'completed' as const,
    reference: 'TRADE-001',
    description: 'BTC/USDT trade'
  },
  {
    type: 'withdrawal' as const,
    amount: 2000,
    currency: 'USDT',
    status: 'completed' as const,
    reference: 'WITHDRAW-001',
    description: 'Withdrawal to bank account'
  },
  {
    type: 'bonus' as const,
    amount: 500,
    currency: 'USDT',
    status: 'completed' as const,
    reference: 'BONUS-001',
    description: 'Welcome bonus'
  },
  {
    type: 'fee' as const,
    amount: 25,
    currency: 'USDT',
    status: 'completed' as const,
    reference: 'FEE-001',
    description: 'Trading fee'
  }
];

// Initialize database with sample data
export const initializeSampleData = async () => {
  try {
    console.log('🚀 Initializing database with sample data...');

    // Create users
    const createdUsers = [];
    for (let i = 0; i < sampleUsers.length; i++) {
      const user = await UserService.createUser(sampleUsers[i]);
      createdUsers.push(user);
      console.log(`✅ Created user: ${user.email}`);
    }

    // Create profiles
    for (let i = 0; i < createdUsers.length; i++) {
      await ProfileService.upsertProfile({
        user_id: createdUsers[i].id,
        ...sampleProfiles[i]
      });
      console.log(`✅ Created profile for: ${createdUsers[i].email}`);
    }

    // Create wallets
    for (let i = 0; i < createdUsers.length; i++) {
      const userWallets = sampleWallets.slice(i * 3, (i + 1) * 3);
      for (const walletData of userWallets) {
        await WalletService.upsertWallet({
          user_id: createdUsers[i].id,
          ...walletData
        });
      }
      console.log(`✅ Created wallets for: ${createdUsers[i].email}`);
    }

    // Create trades
    for (let i = 1; i < createdUsers.length; i++) { // Skip admin user
      const userTrades = sampleTrades.slice(i - 1, i);
      for (const tradeData of userTrades) {
        await TradingService.createTrade({
          user_id: createdUsers[i].id,
          ...tradeData
        });
      }
      console.log(`✅ Created trades for: ${createdUsers[i].email}`);
    }

    // Create transactions
    for (let i = 1; i < createdUsers.length; i++) { // Skip admin user
      const userTransactions = sampleTransactions.slice(i - 1, i);
      for (const transactionData of userTransactions) {
        await TransactionService.createTransaction({
          user_id: createdUsers[i].id,
          ...transactionData
        });
      }
      console.log(`✅ Created transactions for: ${createdUsers[i].email}`);
    }

    // Log admin actions
    await AdminService.logAdminAction({
      admin_id: createdUsers[0].id,
      action_type: 'database_initialization',
      details: {
        message: 'Database initialized with sample data',
        users_created: createdUsers.length,
        timestamp: new Date().toISOString()
      }
    });

    console.log('✅ Database initialization completed successfully!');
    console.log('\n📊 Sample Data Summary:');
    console.log(`- Users created: ${createdUsers.length}`);
    console.log(`- Profiles created: ${createdUsers.length}`);
    console.log(`- Wallets created: ${createdUsers.length * 3}`);
    console.log(`- Trades created: ${createdUsers.length - 1}`);
    console.log(`- Transactions created: ${createdUsers.length - 1}`);

    console.log('\n🔑 Admin Credentials:');
    console.log(`- Email: admin@kryvex.com`);
    console.log(`- Password: (set in your authentication system)`);

    console.log('\n👥 Sample User Credentials:');
    console.log(`- Email: trader1@example.com`);
    console.log(`- Email: trader2@example.com`);
    console.log(`- Email: trader3@example.com`);

  } catch (error) {
    console.error('❌ Error initializing sample data:', error);
    throw error;
  }
};

// Main initialization function
export const initializeKryvexDatabase = async () => {
  try {
    console.log('🔧 Initializing Kryvex Trading Platform Database...');
    
    // Initialize database connection and sync
    await initializeDatabase();
    
    // Check if sample data already exists
    const existingUsers = await User.count();
    
    if (existingUsers === 0) {
      console.log('📝 No existing data found. Creating sample data...');
      await initializeSampleData();
    } else {
      console.log(`📊 Database already contains ${existingUsers} users. Skipping sample data creation.`);
    }
    
    console.log('🎉 Kryvex Trading Platform Database initialization completed!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

// Run initialization if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeKryvexDatabase();
} 