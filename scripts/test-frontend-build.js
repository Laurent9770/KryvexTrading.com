const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Frontend Build');
console.log('==========================\n');

const frontendPath = path.join(__dirname, '..', 'frontend');
const distPath = path.join(frontendPath, 'dist');
const indexHtmlPath = path.join(distPath, 'index.html');

console.log('📁 Checking build files:');
console.log(`Frontend path: ${frontendPath}`);
console.log(`Dist path: ${distPath}`);
console.log(`Index.html path: ${indexHtmlPath}`);

// Check if dist directory exists
const distExists = fs.existsSync(distPath);
console.log(`\n📦 Dist directory exists: ${distExists ? '✅' : '❌'}`);

if (distExists) {
  // List files in dist
  const distFiles = fs.readdirSync(distPath);
  console.log(`\n📋 Files in dist directory:`);
  distFiles.forEach(file => {
    const filePath = path.join(distPath, file);
    const stats = fs.statSync(filePath);
    console.log(`  - ${file} (${stats.isDirectory() ? 'dir' : 'file'})`);
  });
  
  // Check if index.html exists
  const indexExists = fs.existsSync(indexHtmlPath);
  console.log(`\n📄 Index.html exists: ${indexExists ? '✅' : '❌'}`);
  
  if (indexExists) {
    const indexContent = fs.readFileSync(indexHtmlPath, 'utf8');
    console.log(`\n📊 Index.html size: ${indexContent.length} bytes`);
    console.log(`📊 Contains 'admin': ${indexContent.includes('admin') ? '✅' : '❌'}`);
    console.log(`📊 Contains 'AdminDashboard': ${indexContent.includes('AdminDashboard') ? '✅' : '❌'}`);
  }
} else {
  console.log('\n❌ Dist directory not found!');
  console.log('💡 This means the frontend hasn\'t been built yet.');
  console.log('🔧 To build the frontend:');
  console.log('   cd frontend');
  console.log('   npm run build');
}

// Check package.json scripts
const packageJsonPath = path.join(frontendPath, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  console.log(`\n📋 Available scripts:`);
  Object.keys(packageJson.scripts).forEach(script => {
    console.log(`  - ${script}: ${packageJson.scripts[script]}`);
  });
}

console.log('\n🎯 Next Steps:');
console.log('===============');
if (!distExists) {
  console.log('1. Build the frontend: cd frontend && npm run build');
  console.log('2. Deploy to Render');
  console.log('3. Test the admin route');
} else {
  console.log('1. ✅ Build files exist');
  console.log('2. 🔄 Deploy to Render');
  console.log('3. 🧪 Test the admin route');
} 