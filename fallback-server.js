const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// Check if the build directory exists
const buildPath = path.join(__dirname, 'frontend/dist');
const indexPath = path.join(buildPath, 'index.html');

console.log('Starting fallback server...');
console.log('Build path:', buildPath);

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
  
  // Serve a simple fallback page
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Kryvex Trading - Loading...</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              background: #0f0f23; 
              color: white; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              margin: 0; 
            }
            .container { 
              text-align: center; 
              padding: 2rem; 
            }
            .spinner { 
              border: 4px solid #333; 
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
          </style>
        </head>
        <body>
          <div class="container">
            <div class="spinner"></div>
            <h1>Kryvex Trading Platform</h1>
            <p>Application is starting up...</p>
            <p>If this page persists, please check the deployment logs.</p>
            <p>Build status: ${fs.existsSync(buildPath) ? 'Found' : 'Not found'}</p>
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
          <style>
            body { 
              font-family: Arial, sans-serif; 
              background: #0f0f23; 
              color: white; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              margin: 0; 
            }
            .container { 
              text-align: center; 
              padding: 2rem; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Route Not Found</h1>
            <p>Requested route: ${req.path}</p>
            <p>Build is not available. Please check deployment logs.</p>
          </div>
        </body>
      </html>
    `);
  });
}

// Add a health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: fs.existsSync(buildPath) ? 'ok' : 'fallback', 
    timestamp: new Date().toISOString(),
    buildPath: buildPath,
    buildExists: fs.existsSync(buildPath),
    message: fs.existsSync(buildPath) ? 'React app serving' : 'Serving fallback page'
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Fallback server running on port ${port}`);
  console.log(`📁 Build path: ${buildPath}`);
  console.log(`✅ Build exists: ${fs.existsSync(buildPath)}`);
}); 