const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// Middleware for parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Check if the build directory exists
const buildPath = path.join(__dirname, 'frontend/dist');
const indexPath = path.join(buildPath, 'index.html');

console.log('🚀 Starting Kryvex Trading Platform Server...');
console.log('📁 Build path:', buildPath);
console.log('📄 Index path:', indexPath);
console.log('🔍 Build exists:', fs.existsSync(buildPath));
console.log('📄 Index exists:', fs.existsSync(indexPath));

// API Routes (if any backend functionality is needed)
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Kryvex Trading Platform API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    buildPath: buildPath,
    buildExists: fs.existsSync(buildPath),
    indexExists: fs.existsSync(indexPath),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Check if build exists and serve React app
if (fs.existsSync(buildPath) && fs.existsSync(indexPath)) {
  console.log('✅ Build found, serving React app...');
  
  // Serve static files from the React app
  app.use(express.static(buildPath));
  
  // Handle React routing - return all requests to React app
  // This is crucial for client-side routing to work
  app.get('*', (req, res) => {
    console.log(`📄 Serving index.html for route: ${req.path}`);
    res.sendFile(indexPath);
  });
} else {
  console.log('❌ Build not found, serving fallback page...');
  
  // Serve a comprehensive fallback page with more information
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Kryvex Trading Platform - Loading...</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%);
              color: white; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              margin: 0; 
              line-height: 1.6;
            }
            .container { 
              text-align: center; 
              padding: 2rem; 
              max-width: 600px;
              background: rgba(255, 255, 255, 0.05);
              border-radius: 12px;
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .spinner { 
              border: 4px solid rgba(255, 255, 255, 0.1); 
              border-top: 4px solid #3498db; 
              border-radius: 50%; 
              width: 50px; 
              height: 50px; 
              animation: spin 1s linear infinite; 
              margin: 0 auto 1rem; 
            }
            @keyframes spin { 
              0% { transform: rotate(0deg); } 
              100% { transform: rotate(360deg); } 
            }
            .status {
              background: rgba(255, 255, 255, 0.1);
              padding: 1rem;
              border-radius: 8px;
              margin: 1rem 0;
              font-family: monospace;
              font-size: 0.9rem;
            }
            .error {
              color: #ff6b6b;
            }
            .success {
              color: #51cf66;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="spinner"></div>
            <h1>🚀 Kryvex Trading Platform</h1>
            <p>Application is starting up...</p>
            
            <div class="status">
              <div>📁 Build Path: ${buildPath}</div>
              <div class="${fs.existsSync(buildPath) ? 'success' : 'error'}">
                📦 Build Directory: ${fs.existsSync(buildPath) ? '✅ Found' : '❌ Not Found'}
              </div>
              <div class="${fs.existsSync(indexPath) ? 'success' : 'error'}">
                📄 Index File: ${fs.existsSync(indexPath) ? '✅ Found' : '❌ Not Found'}
              </div>
              <div>🌍 Environment: ${process.env.NODE_ENV || 'development'}</div>
              <div>⏰ Timestamp: ${new Date().toISOString()}</div>
            </div>
            
            <p>If this page persists, please check the deployment logs.</p>
            <p>You can also check the <a href="/api/health" style="color: #3498db;">health endpoint</a> for more details.</p>
          </div>
        </body>
      </html>
    `);
  });
  
  // Handle all other routes in fallback mode
  app.get('*', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Kryvex Trading - Route Not Found</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%);
              color: white; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              margin: 0; 
              line-height: 1.6;
            }
            .container { 
              text-align: center; 
              padding: 2rem; 
              max-width: 600px;
              background: rgba(255, 255, 255, 0.05);
              border-radius: 12px;
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .error {
              color: #ff6b6b;
            }
            .status {
              background: rgba(255, 255, 255, 0.1);
              padding: 1rem;
              border-radius: 8px;
              margin: 1rem 0;
              font-family: monospace;
              font-size: 0.9rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Route Not Found</h1>
            <p>Requested route: <code>${req.path}</code></p>
            
            <div class="status">
              <div>📁 Build Path: ${buildPath}</div>
              <div class="${fs.existsSync(buildPath) ? 'success' : 'error'}">
                📦 Build Directory: ${fs.existsSync(buildPath) ? '✅ Found' : '❌ Not Found'}
              </div>
              <div class="${fs.existsSync(indexPath) ? 'success' : 'error'}">
                📄 Index File: ${fs.existsSync(indexPath) ? '✅ Found' : '❌ Not Found'}
              </div>
            </div>
            
            <p>Build is not available. Please check deployment logs.</p>
            <p>You can check the <a href="/api/health" style="color: #3498db;">health endpoint</a> for more details.</p>
          </div>
        </body>
      </html>
    `);
  });
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Kryvex Trading Platform server running on port ${port}`);
  console.log(`📁 Build path: ${buildPath}`);
  console.log(`✅ Build exists: ${fs.existsSync(buildPath)}`);
  console.log(`📄 Index exists: ${fs.existsSync(indexPath)}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${port}/api/health`);
}); 