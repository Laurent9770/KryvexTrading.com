const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// Check if the build directory exists
const buildPath = path.join(__dirname, 'frontend/dist');
const indexPath = path.join(buildPath, 'index.html');

console.log('Checking build directory...');
console.log('Build path:', buildPath);
console.log('Index path:', indexPath);

if (!fs.existsSync(buildPath)) {
  console.error('Build directory does not exist!');
  console.log('Available directories:', fs.readdirSync(__dirname));
  
  // Try to find the build in different locations
  const possiblePaths = [
    path.join(__dirname, 'dist'),
    path.join(__dirname, 'frontend/build'),
    path.join(__dirname, 'build')
  ];
  
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      console.log('Found build at:', possiblePath);
      app.use(express.static(possiblePath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(possiblePath, 'index.html'));
      });
      break;
    }
  }
} else {
  console.log('Build directory found, serving static files...');
  // Serve static files from the React app
  app.use(express.static(buildPath));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(indexPath);
  });
}

// Add a basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    buildPath: buildPath,
    buildExists: fs.existsSync(buildPath)
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Build directory: ${buildPath}`);
  console.log(`Build exists: ${fs.existsSync(buildPath)}`);
}); 