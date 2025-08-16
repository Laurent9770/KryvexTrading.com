#!/usr/bin/env node

// =============================================
// PRODUCTION BUILD SCRIPT
// =============================================

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting production build...');

// 1. Clean previous build
console.log('🧹 Cleaning previous build...');
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true });
}

// 2. Set production environment
process.env.NODE_ENV = 'production';
process.env.VITE_MODE = 'production';

// 3. Run build
console.log('🔨 Building application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// 4. Validate build output
console.log('🔍 Validating build output...');
const distPath = path.join(__dirname, '..', 'dist');
const indexHtmlPath = path.join(distPath, 'index.html');

if (!fs.existsSync(indexHtmlPath)) {
  console.error('❌ index.html not found in build output');
  process.exit(1);
}

// 5. Check for console.log statements in production build
console.log('🔍 Checking for console.log statements...');
const jsFiles = getAllJsFiles(distPath);
let foundConsoleLogs = false;

jsFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('console.log')) {
    console.warn(`⚠️ Found console.log in: ${path.relative(distPath, file)}`);
    foundConsoleLogs = true;
  }
});

if (foundConsoleLogs) {
  console.warn('⚠️ Console.log statements found in production build');
} else {
  console.log('✅ No console.log statements found in production build');
}

// 6. Generate build report
const buildReport = {
  timestamp: new Date().toISOString(),
  buildSize: getDirectorySize(distPath),
  files: jsFiles.length,
  hasConsoleLogs: foundConsoleLogs
};

fs.writeFileSync(
  path.join(distPath, 'build-report.json'),
  JSON.stringify(buildReport, null, 2)
);

console.log('📊 Build Report:', buildReport);
console.log('🎉 Production build completed successfully!');

// Helper functions
function getAllJsFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getAllJsFiles(fullPath));
    } else if (item.endsWith('.js') || item.endsWith('.mjs')) {
      files.push(fullPath);
    }
  });
  
  return files;
}

function getDirectorySize(dir) {
  let size = 0;
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      size += getDirectorySize(fullPath);
    } else {
      size += stat.size;
    }
  });
  
  return size;
}
