# Kryvex Trading Platform

A comprehensive trading platform built with React and Supabase, featuring real-time trading, KYC verification, and admin controls.

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
├── supabase/         # Supabase configuration
│   ├── schema.sql   # Database schema
│   └── ...
│
├── package.json      # Root package.json
└── README.md        # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Install all dependencies:**
   ```bash
   npm run install-deps
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```
   This will start the frontend (port 5173)

### Individual Commands

**Frontend only:**
```bash
npm run dev
```

**Build for production:**
```bash
npm run build
```

**Preview production build:**
```bash
npm run preview
```

## 📁 Directory Structure

### Frontend (`/frontend`)
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Shadcn/ui** components
- **React Router** for navigation
- **Recharts** for data visualization
- **Supabase** for backend services

### Supabase (`/supabase`)
- **Database Schema** - Complete trading platform schema
- **Row Level Security** - Automatic data protection
- **Real-time Subscriptions** - Live updates
- **Storage** - File uploads and management

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
- ✅ **KYC Verification** - Document verification system
- ✅ **Trading Control** - Override trade outcomes
- ✅ **Live Chat** - Admin-user communication
- ✅ **Room Management** - Create/manage chat rooms

### User Features
- ✅ **Real-time Dashboard** - Live portfolio updates
- ✅ **Market Analysis** - Live news and charts
- ✅ **Wallet Management** - Deposit/withdraw funds
