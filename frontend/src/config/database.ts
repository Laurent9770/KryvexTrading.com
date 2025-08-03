import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'kryvex_trading',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test database connection
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
};

// Model interfaces
export interface UserAttributes {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  is_admin: boolean;
  is_verified: boolean;
  kyc_status: 'pending' | 'approved' | 'rejected';
  created_at: Date;
  updated_at: Date;
}

export interface ProfileAttributes {
  id: string;
  user_id: string;
  full_name?: string;
  phone?: string;
  country?: string;
  date_of_birth?: Date;
  kyc_documents?: any;
  trading_preferences?: any;
  notification_settings?: any;
  created_at: Date;
  updated_at: Date;
}

export interface TradeAttributes {
  id: string;
  user_id: string;
  trading_pair: string;
  trade_type: 'buy' | 'sell';
  order_type: 'market' | 'limit' | 'stop_loss' | 'take_profit';
  amount: number;
  price: number;
  total_value: number;
  status: 'pending' | 'completed' | 'cancelled' | 'failed';
  outcome?: 'win' | 'loss' | 'draw';
  profit_loss?: number;
  forced_outcome?: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TransactionAttributes {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'trade' | 'fee' | 'bonus';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  reference?: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface WalletAttributes {
  id: string;
  user_id: string;
  currency: string;
  balance: number;
  locked_balance: number;
  created_at: Date;
  updated_at: Date;
}

export interface AdminActionAttributes {
  id: string;
  admin_id: string;
  action_type: string;
  target_user_id?: string;
  details: any;
  ip_address?: string;
  created_at: Date;
}

export interface TradeOutcomeLogAttributes {
  id: string;
  admin_id: string;
  user_id: string;
  previous_mode: string;
  new_mode: string;
  applies_to: string;
  reason?: string;
  created_at: Date;
}

// User Model
export class User extends Model<UserAttributes, Optional<UserAttributes, 'id' | 'created_at' | 'updated_at'>> implements UserAttributes {
  public id!: string;
  public email!: string;
  public full_name?: string;
  public avatar_url?: string;
  public is_admin!: boolean;
  public is_verified!: boolean;
  public kyc_status!: 'pending' | 'approved' | 'rejected';
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  avatar_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  is_admin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  kyc_status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  }
}, {
  sequelize,
  tableName: 'users',
  timestamps: true,
  underscored: true
});

// Profile Model
export class Profile extends Model<ProfileAttributes, Optional<ProfileAttributes, 'id' | 'created_at' | 'updated_at'>> implements ProfileAttributes {
  public id!: string;
  public user_id!: string;
  public full_name?: string;
  public phone?: string;
  public country?: string;
  public date_of_birth?: Date;
  public kyc_documents?: any;
  public trading_preferences?: any;
  public notification_settings?: any;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Profile.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true
  },
  date_of_birth: {
    type: DataTypes.DATE,
    allowNull: true
  },
  kyc_documents: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  trading_preferences: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  notification_settings: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  sequelize,
  tableName: 'profiles',
  timestamps: true,
  underscored: true
});

// Trade Model
export class Trade extends Model<TradeAttributes, Optional<TradeAttributes, 'id' | 'created_at' | 'updated_at'>> implements TradeAttributes {
  public id!: string;
  public user_id!: string;
  public trading_pair!: string;
  public trade_type!: 'buy' | 'sell';
  public order_type!: 'market' | 'limit' | 'stop_loss' | 'take_profit';
  public amount!: number;
  public price!: number;
  public total_value!: number;
  public status!: 'pending' | 'completed' | 'cancelled' | 'failed';
  public outcome?: 'win' | 'loss' | 'draw';
  public profit_loss?: number;
  public forced_outcome?: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Trade.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  trading_pair: {
    type: DataTypes.STRING,
    allowNull: false
  },
  trade_type: {
    type: DataTypes.ENUM('buy', 'sell'),
    allowNull: false
  },
  order_type: {
    type: DataTypes.ENUM('market', 'limit', 'stop_loss', 'take_profit'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false
  },
  total_value: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'cancelled', 'failed'),
    defaultValue: 'pending'
  },
  outcome: {
    type: DataTypes.ENUM('win', 'loss', 'draw'),
    allowNull: true
  },
  profit_loss: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: true
  },
  forced_outcome: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  sequelize,
  tableName: 'trades',
  timestamps: true,
  underscored: true
});

// Transaction Model
export class Transaction extends Model<TransactionAttributes, Optional<TransactionAttributes, 'id' | 'created_at' | 'updated_at'>> implements TransactionAttributes {
  public id!: string;
  public user_id!: string;
  public type!: 'deposit' | 'withdrawal' | 'trade' | 'fee' | 'bonus';
  public amount!: number;
  public currency!: string;
  public status!: 'pending' | 'completed' | 'failed' | 'cancelled';
  public reference?: string;
  public description?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Transaction.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('deposit', 'withdrawal', 'trade', 'fee', 'bonus'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(20, 8),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
    defaultValue: 'pending'
  },
  reference: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  sequelize,
  tableName: 'transactions',
  timestamps: true,
  underscored: true
});

// Wallet Model
export class Wallet extends Model<WalletAttributes, Optional<WalletAttributes, 'id' | 'created_at' | 'updated_at'>> implements WalletAttributes {
  public id!: string;
  public user_id!: string;
  public currency!: string;
  public balance!: number;
  public locked_balance!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Wallet.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: false
  },
  balance: {
    type: DataTypes.DECIMAL(20, 8),
    defaultValue: 0
  },
  locked_balance: {
    type: DataTypes.DECIMAL(20, 8),
    defaultValue: 0
  }
}, {
  sequelize,
  tableName: 'wallets',
  timestamps: true,
  underscored: true
});

// Admin Action Model
export class AdminAction extends Model<AdminActionAttributes, Optional<AdminActionAttributes, 'id' | 'created_at'>> implements AdminActionAttributes {
  public id!: string;
  public admin_id!: string;
  public action_type!: string;
  public target_user_id?: string;
  public details!: any;
  public ip_address?: string;
  public readonly created_at!: Date;
}

AdminAction.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  admin_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  action_type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  target_user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    }
  },
  details: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  ip_address: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  sequelize,
  tableName: 'admin_actions',
  timestamps: false,
  underscored: true
});

// Trade Outcome Log Model
export class TradeOutcomeLog extends Model<TradeOutcomeLogAttributes, Optional<TradeOutcomeLogAttributes, 'id' | 'created_at'>> implements TradeOutcomeLogAttributes {
  public id!: string;
  public admin_id!: string;
  public user_id!: string;
  public previous_mode!: string;
  public new_mode!: string;
  public applies_to!: string;
  public reason?: string;
  public readonly created_at!: Date;
}

TradeOutcomeLog.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  admin_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  previous_mode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  new_mode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  applies_to: {
    type: DataTypes.STRING,
    allowNull: false
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  sequelize,
  tableName: 'trade_outcome_logs',
  timestamps: false,
  underscored: true
});

// Define associations
User.hasOne(Profile, { foreignKey: 'user_id', as: 'profile' });
Profile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Trade, { foreignKey: 'user_id', as: 'trades' });
Trade.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Transaction, { foreignKey: 'user_id', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Wallet, { foreignKey: 'user_id', as: 'wallets' });
Wallet.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(AdminAction, { foreignKey: 'admin_id', as: 'adminActions' });
AdminAction.belongsTo(User, { foreignKey: 'admin_id', as: 'admin' });

User.hasMany(TradeOutcomeLog, { foreignKey: 'admin_id', as: 'tradeOutcomeLogs' });
TradeOutcomeLog.belongsTo(User, { foreignKey: 'admin_id', as: 'admin' });

// Sync database
export const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized successfully.');
  } catch (error) {
    console.error('❌ Error synchronizing database:', error);
  }
};

export default sequelize; 