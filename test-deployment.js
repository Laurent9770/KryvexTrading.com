const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Kryvex Trading Platform Deployment Structure...');

// Test 1: Check if frontend build exists
const frontendBuildPath = path.join(__dirname, 'frontend', 'dist');
const indexHtmlPath = path.join(frontendBuildPath, 'index.html');

console.log('\n📁 Checking frontend build...');
console.log('Frontend build path:', frontendBuildPath);
console.log('Index.html path:', indexHtmlPath);

if (fs.existsSync(frontendBuildPath)) {
  console.log('✅ Frontend build directory exists');
  
  if (fs.existsSync(indexHtmlPath)) {
    console.log('✅ index.html exists');
    
    // Check build contents
    const buildFiles = fs.readdirSync(frontendBuildPath);
    console.log('📋 Build files:', buildFiles);
    
    // Check for essential files
    const essentialFiles = ['index.html', 'assets'];
    const missingFiles = essentialFiles.filter(file => !buildFiles.includes(file));
    
    if (missingFiles.length === 0) {
      console.log('✅ All essential build files present');
    } else {
      console.log('❌ Missing essential files:', missingFiles);
    }
  } else {
    console.log('❌ index.html not found');
  }
} else {
  console.log('❌ Frontend build directory not found');
  console.log('💡 Run: cd frontend && npm run build');
}

// Test 2: Check backend structure
const backendPath = path.join(__dirname, 'backend');
const serverJsPath = path.join(backendPath, 'server.js');
const packageJsonPath = path.join(backendPath, 'package.json');

console.log('\n📁 Checking backend structure...');
console.log('Backend path:', backendPath);
console.log('Server.js path:', serverJsPath);

if (fs.existsSync(backendPath)) {
  console.log('✅ Backend directory exists');
  
  if (fs.existsSync(serverJsPath)) {
    console.log('✅ server.js exists');
  } else {
    console.log('❌ server.js not found');
  }
  
  if (fs.existsSync(packageJsonPath)) {
    console.log('✅ package.json exists');
    
    // Check start script
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (packageJson.scripts && packageJson.scripts.start) {
      console.log('✅ Start script exists:', packageJson.scripts.start);
    } else {
      console.log('❌ Start script not found in package.json');
    }
  } else {
    console.log('❌ package.json not found');
  }
} else {
  console.log('❌ Backend directory not found');
}

// Test 3: Check render.yaml
const renderYamlPath = path.join(__dirname, 'render.yaml');

console.log('\n📁 Checking render.yaml...');
console.log('Render.yaml path:', renderYamlPath);

if (fs.existsSync(renderYamlPath)) {
  console.log('✅ render.yaml exists');
  
  const renderYaml = fs.readFileSync(renderYamlPath, 'utf8');
  if (renderYaml.includes('buildCommand') && renderYaml.includes('startCommand')) {
    console.log('✅ render.yaml has build and start commands');
  } else {
    console.log('❌ render.yaml missing build or start commands');
  }
} else {
  console.log('❌ render.yaml not found');
}

// Test 4: Check environment variables
console.log('\n🔧 Checking environment variables...');
const envVars = [
  'NODE_ENV',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'CORS_ORIGIN'
];

envVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar}: Set`);
  } else {
    console.log(`❌ ${envVar}: Not set`);
  }
});

console.log('\n🎯 Deployment Test Summary:');
console.log('If all tests pass ✅, your deployment should work correctly.');
console.log('If any tests fail ❌, fix the issues before deploying.');

// Test 5: Simulate the path resolution that the server will use
console.log('\n🔍 Testing server path resolution...');

const testProductionPath = path.join(__dirname, 'backend', '..', '..', 'frontend', 'dist', 'index.html');
const testDevelopmentPath = path.join(__dirname, 'backend', '..', 'frontend', 'dist', 'index.html');

console.log('Production path (Render.com):', testProductionPath);
console.log('Development path (local):', testDevelopmentPath);

console.log('Production path exists:', fs.existsSync(testProductionPath));
console.log('Development path exists:', fs.existsSync(testDevelopmentPath));

console.log('\n✅ Deployment test completed!');
