# Kryvex Trading Platform - Backend API

A robust Node.js/Express backend for the Kryvex Trading Platform with real-time WebSocket support, PostgreSQL database, and comprehensive trading features.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Real-time Communication**: WebSocket support for live updates
- **Database**: PostgreSQL with comprehensive schema for trading platform
- **Security**: Rate limiting, input validation, CORS protection
- **Wallet Management**: Deposit, withdrawal, and balance tracking
- **Admin Panel**: Complete admin dashboard with user management
- **KYC System**: Multi-level identity verification
- **Trading Engine**: Support for spot, futures, and options trading

## 📋 Prerequisites

- Node.js 20.x or higher
- PostgreSQL 12+ 
- Redis (optional, for caching)

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd kryvex-forge-main/backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy the environment template and configure your settings:

```bash
cp config.env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:8080

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kryvex_trading
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Admin Configuration
ADMIN_EMAIL=admin@kryvex.com
ADMIN_PASSWORD=Kryvex.@123
```

### 4. Database Setup

#### Create PostgreSQL Database
```bash
createdb kryvex_trading
```

#### Run Database Setup Script
```bash
node scripts/setup-database.js
```

This will:
- Create all database tables
- Insert default system settings
- Create admin user
- Set up trading pairs
- Initialize chat rooms

### 5. Start the Server

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `GET /api/auth/verify` - Verify token

### Wallets
- `GET /api/wallets` - Get user wallets
- `GET /api/wallets/:asset` - Get specific wallet balance
- `GET /api/wallets/transactions` - Get user transactions
- `POST /api/wallets/deposits` - Create deposit request
- `GET /api/wallets/deposits` - Get user deposits
- `POST /api/wallets/withdrawals` - Create withdrawal request
- `GET /api/wallets/withdrawals` - Get user withdrawals

### Admin Routes
- `GET /api/wallets/admin/deposits` - Get all deposits
- `PUT /api/wallets/admin/deposits/:id/status` - Update deposit status
- `GET /api/wallets/admin/withdrawals` - Get all withdrawals
- `PUT /api/wallets/admin/withdrawals/:id/status` - Update withdrawal status
- `GET /api/wallets/admin/stats` - Get wallet statistics
- `POST /api/wallets/admin/adjust` - Adjust user wallet balance

## 🔌 WebSocket Events

### Connection
- Connect with JWT token: `ws://localhost:3001?token=<jwt_token>`

### Message Types
- `join_room` - Join a chat room
- `leave_room` - Leave a chat room
- `chat_message` - Send chat message
- `get_rooms` - Get user's rooms
- `get_room_users` - Get users in a room
- `ping` - Keep connection alive

### Event Types
- `connection_established` - Connection confirmed
- `user_joined_room` - User joined room
- `user_left_room` - User left room
- `chat_message` - New chat message
- `user_rooms` - User's room list
- `room_users` - Users in a room
- `pong` - Response to ping

## 🗄️ Database Schema

### Core Tables
- `users` - User accounts and profiles
- `user_sessions` - Active user sessions
- `wallets` - User wallet balances
- `transactions` - All financial transactions
- `deposits` - Deposit requests
- `withdrawals` - Withdrawal requests
- `trades` - Trading history
- `kyc_submissions` - KYC verification data
- `chat_rooms` - Chat room management
- `chat_messages` - Chat message history
- `admin_actions` - Admin action audit log
- `notifications` - User notifications
- `system_settings` - Platform configuration

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: API request throttling
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Cross-origin request handling
- **Helmet Security**: HTTP security headers
- **Role-based Access**: Admin and user permissions

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3001` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:8080` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `kryvex_trading` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `your_password` |
| `JWT_SECRET` | JWT signing secret | `your_super_secret_jwt_key_here` |
| `JWT_EXPIRES_IN` | JWT expiration time | `24h` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration | `7d` |

## 🚀 Deployment

### Production Setup
1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure JWT secret
4. Configure CORS for production domain
5. Set up SSL certificates
6. Configure reverse proxy (nginx)

### Docker Deployment
```bash
# Build image
docker build -t kryvex-backend .

# Run container
docker run -p 3001:3001 --env-file .env kryvex-backend
```

## 📚 API Documentation

### Authentication Flow
1. Register user: `POST /api/auth/register`
2. Login: `POST /api/auth/login`
3. Use JWT token in Authorization header: `Bearer <token>`
4. Refresh token when needed: `POST /api/auth/refresh`

### Wallet Operations
1. Get balances: `GET /api/wallets`
2. Create deposit: `POST /api/wallets/deposits`
3. Create withdrawal: `POST /api/wallets/withdrawals`
4. View transactions: `GET /api/wallets/transactions`

### Admin Operations
1. View all deposits: `GET /api/wallets/admin/deposits`
2. Approve/reject deposits: `PUT /api/wallets/admin/deposits/:id/status`
3. View all withdrawals: `GET /api/wallets/admin/withdrawals`
4. Approve/reject withdrawals: `PUT /api/wallets/admin/withdrawals/:id/status`
5. Adjust user balance: `POST /api/wallets/admin/adjust`

## 🔧 Development

### Project Structure
```
backend/
├── database/
│   ├── connection.js
│   └── schema.sql
├── middleware/
│   └── auth.js
├── routes/
│   ├── auth.js
│   ├── wallets.js
│   ├── users.js
│   ├── trading.js
│   ├── kyc.js
│   ├── admin.js
│   └── chat.js
├── services/
│   ├── authService.js
│   └── walletService.js
├── websocket/
│   └── websocketHandler.js
├── scripts/
│   └── setup-database.js
├── server.js
└── package.json
```

### Adding New Features
1. Create service in `services/` directory
2. Create routes in `routes/` directory
3. Add route to `server.js`
4. Update database schema if needed
5. Add tests for new functionality

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact: support@kryvextrading.com

---

**Kryvex Trading Platform Backend** - Built with ❤️ for secure and scalable trading 