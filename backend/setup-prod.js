const fs = require('fs');
const path = require('path');

// Production environment configuration for Render.com
const envConfig = `# Server Configuration
NODE_ENV=production
PORT=10000
CORS_ORIGIN=https://kryvex-frontend.onrender.com

# Database Configuration - Use Render's PostgreSQL
DB_HOST=\${DB_HOST}
DB_PORT=\${DB_PORT}
DB_NAME=\${DB_NAME}
DB_USER=\${DB_USER}
DB_PASSWORD=\${DB_PASSWORD}
DATABASE_URL=\${DATABASE_URL}

# JWT Configuration
JWT_SECRET=\${JWT_SECRET}
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Admin Configuration
ADMIN_EMAIL=admin@kryvex.com
ADMIN_PASSWORD=Kryvex.@123

# WebSocket Configuration
WS_PORT=10000
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

// Create .env file for production
fs.writeFileSync('.env', envConfig);
console.log('✅ Created .env file with production configuration');

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

console.log('\n🎉 Production environment setup complete!');
console.log('\n📋 Deployment Information:');
console.log('• Backend URL: https://kryvextrading-com.onrender.com');
console.log('• Frontend URL: https://kryvex-frontend.onrender.com');
console.log('• WebSocket URL: wss://kryvextrading-com.onrender.com');
console.log('• Health Check: https://kryvextrading-com.onrender.com/api/health');
console.log('• Admin Dashboard: https://kryvex-frontend.onrender.com/admin'); 