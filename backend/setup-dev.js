const fs = require('fs');
const path = require('path');

// Development environment configuration
const envConfig = `# Server Configuration
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:8080

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kryvex_trading
DB_USER=postgres
DB_PASSWORD=postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kryvex_trading

# JWT Configuration
JWT_SECRET=kryvex_super_secret_jwt_key_2024
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Admin Configuration
ADMIN_EMAIL=admin@kryvex.com
ADMIN_PASSWORD=Kryvex.@123

# WebSocket Configuration
WS_PORT=3002
WS_PATH=/ws

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
`;

// Create .env file
fs.writeFileSync('.env', envConfig);
console.log('✅ Created .env file with development configuration');

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
}

// Create logs directory
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('✅ Created logs directory');
}

console.log('\n🎉 Development environment setup complete!');
console.log('\n📋 Next steps:');
console.log('1. Install PostgreSQL if not already installed');
console.log('2. Create database: CREATE DATABASE kryvex_trading;');
console.log('3. Run: npm run dev');
console.log('4. Test API: http://localhost:3001/api/health'); 