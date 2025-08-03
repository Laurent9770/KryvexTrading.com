# Kryvex Trading Platform

A comprehensive trading platform with real-time WebSocket communication, multiple trading modes, and admin controls.

## 🏗️ Project Structure

```
project-root/
│
├── frontend/         # React (Vite) Frontend
│   ├── src/         # React components and pages
│   ├── public/      # Static assets
│   ├── package.json # Frontend dependencies
│   └── ...
│
├── backend/          # Node.js with WebSocket
│   ├── server/      # WebSocket server
│   ├── package.json # Backend dependencies
│   └── ...
│
├── package.json      # Root package.json for managing both
└── README.md        # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Start development servers:**
   ```bash
   npm run dev
   ```
   This will start both frontend (port 8080) and backend (port 3001)

### Individual Commands

**Frontend only:**
```bash
npm run dev:frontend
```

**Backend only:**
```bash
npm run dev:backend
```

**Build for production:**
```bash
npm run build
```

## 📁 Directory Structure

### Frontend (`/frontend`)
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Shadcn/ui** components
- **React Router** for navigation
- **Recharts** for data visualization

### Backend (`/backend`)
- **Node.js** with Express
- **WebSocket** for real-time communication
- **CORS** enabled for cross-origin requests
- **REST API** endpoints

## 🔧 Features

### Trading Modes
- ✅ **Spot Trading** - Real-time price updates
- ✅ **Futures Trading** - Leveraged positions
- ✅ **Options Trading** - Advanced strategies
- ✅ **Binary Options** - Quick trades
- ✅ **Quant Trading** - Algorithmic trading
- ✅ **Trading Bots** - Automated strategies
- ✅ **Staking** - Yield generation

### Admin Features
- ✅ **User Management** - View all registered users
- ✅ **Wallet Controls** - Fund user wallets
- ✅ **Withdrawal Management** - Approve/reject withdrawals
- ✅ **KYC Verification** - 3-level verification system
- ✅ **Trading Control** - Override trade outcomes
- ✅ **Live Chat** - Admin-user communication
- ✅ **Room Management** - Create/manage chat rooms

### User Features
- ✅ **Real-time Dashboard** - Live portfolio updates
- ✅ **Market Analysis** - Live news and charts
- ✅ **Wallet Management** - Deposit/withdraw funds
- ✅ **KYC Verification** - Complete verification process
- ✅ **Trade History** - Detailed trade logs
- ✅ **Analytics** - Performance insights

## 🌐 Deployment

### Frontend Deployment
```bash
# Vercel
npm run deploy:vercel

# Netlify
npm run deploy:netlify
```

### Backend Deployment
```bash
# Railway
cd backend
railway deploy

# Heroku
cd backend
heroku create
git push heroku main
```

## 🔌 Environment Variables

### Frontend (`.env`)
```env
VITE_WS_URL=wss://your-backend-domain.com
VITE_API_URL=https://your-backend-domain.com
```

### Backend (`.env`)
```env
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-frontend-domain.com
```

## 📊 API Endpoints

### WebSocket Events
- `user_registered` - New user registration
- `kyc_level_updated` - KYC status changes
- `wallet_updated` - Balance updates
- `trade_completed` - Trade execution
- `chat_message` - Real-time messaging

### REST API
- `GET /api/users` - Get all users
- `GET /api/portfolio/:userId` - User portfolio
- `GET /api/trades/recent/:userId` - Recent trades
- `GET /api/analytics/:userId` - Trading analytics
- `GET /api/withdrawal-requests` - Withdrawal requests
- `GET /api/kyc-submissions` - KYC submissions

## 🛠️ Development

### Adding New Features
1. **Frontend**: Add components in `/frontend/src/`
2. **Backend**: Add routes in `/backend/server/`
3. **WebSocket**: Add event handlers in server

### Code Style
- **Frontend**: TypeScript, ESLint, Prettier
- **Backend**: ES6 modules, consistent naming

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support, email support@kryvex.com or create an issue in this repository.
