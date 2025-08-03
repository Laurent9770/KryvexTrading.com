import { initializeDatabase, UserService, ProfileService, WalletService, TradingService, TransactionService, AdminService } from '../services/databaseService';
import { User } from '../config/database';

const initializeSampleData = async () => {
  try {
    console.log('🚀 Initializing database with sample data...');

    // Initialize database connection
    await initializeDatabase();

    // Create admin user
    const adminUser = await UserService.createUser({
      email: 'admin@kryvex.com',
      full_name: 'Admin User',
      is_admin: true,
      is_verified: true,
      kyc_status: 'approved'
    });
    console.log(`✅ Created admin user: ${adminUser.email}`);

    // Create sample trader
    const traderUser = await UserService.createUser({
      email: 'trader1@example.com',
      full_name: 'John Trader',
      is_admin: false,
      is_verified: true,
      kyc_status: 'approved'
    });
    console.log(`✅ Created trader user: ${traderUser.email}`);

    // Create profile for trader
    await ProfileService.upsertProfile({
      user_id: traderUser.id,
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
    });
    console.log(`✅ Created profile for: ${traderUser.email}`);

    // Create wallets for trader
    const wallets = [
      { currency: 'USDT', balance: 25000, locked_balance: 0 },
      { currency: 'BTC', balance: 1.2, locked_balance: 0 },
      { currency: 'ETH', balance: 8.5, locked_balance: 0 }
    ];

    for (const walletData of wallets) {
      await WalletService.upsertWallet({
        user_id: traderUser.id,
        ...walletData
      });
    }
    console.log(`✅ Created wallets for: ${traderUser.email}`);

    // Create sample trade
    await TradingService.createTrade({
      user_id: traderUser.id,
      trading_pair: 'BTC/USDT',
      trade_type: 'buy',
      order_type: 'market',
      amount: 0.1,
      price: 45000,
      total_value: 4500,
      status: 'completed',
      outcome: 'win',
      profit_loss: 250
    });
    console.log(`✅ Created sample trade for: ${traderUser.email}`);

    // Create sample transaction
    await TransactionService.createTransaction({
      user_id: traderUser.id,
      type: 'deposit',
      amount: 10000,
      currency: 'USDT',
      status: 'completed',
      reference: 'DEP-001',
      description: 'Initial deposit'
    });
    console.log(`✅ Created sample transaction for: ${traderUser.email}`);

    // Log admin action
    await AdminService.logAdminAction({
      admin_id: adminUser.id,
      action_type: 'database_initialization',
      details: {
        message: 'Database initialized with sample data',
        users_created: 2,
        timestamp: new Date().toISOString()
      }
    });

    console.log('✅ Database initialization completed successfully!');
    console.log('\n📊 Sample Data Summary:');
    console.log(`- Users created: 2`);
    console.log(`- Profiles created: 1`);
    console.log(`- Wallets created: 3`);
    console.log(`- Trades created: 1`);
    console.log(`- Transactions created: 1`);

    console.log('\n🔑 Admin Credentials:');
    console.log(`- Email: admin@kryvex.com`);
    console.log(`- Password: (set in your authentication system)`);

    console.log('\n👥 Sample User Credentials:');
    console.log(`- Email: trader1@example.com`);

  } catch (error) {
    console.error('❌ Error initializing sample data:', error);
    throw error;
  }
};

// Run the initialization
initializeSampleData().catch(console.error); 