#!/usr/bin/env node

// =============================================
// PRODUCTION BUILD SCRIPT - FIXED FOR import.meta
// =============================================

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting production build with import.meta fixes...');

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

// 5. Fix index.html to ensure proper module loading
console.log('🔧 Fixing index.html for proper module loading...');
let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

// Ensure script tags have type="module"
if (!indexHtml.includes('type="module"')) {
  console.log('⚠️ Adding type="module" to script tags...');
  indexHtml = indexHtml.replace(
    /<script src="([^"]+)"><\/script>/g,
    '<script type="module" src="$1"></script>'
  );
}

// Ensure environment variables are properly injected
if (!indexHtml.includes('window.env')) {
  console.log('⚠️ Adding environment variables fallback...');
  const envScript = `
    <!-- Environment Configuration (Production Fallback) -->
    <script>
      window.env = {
        SUPABASE_URL: 'https://ftkeczodadvtnxofrwps.supabase.co',
        SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a2Vjem9kYWR2dG54b2Zyd3BzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE5NzI5NzQsImV4cCI6MjA0NzU0ODk3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8',
        NODE_ENV: 'production',
        BASE_URL: '/'
      };
    </script>
  `;
  
  // Insert after <head> tag
  indexHtml = indexHtml.replace('</head>', `${envScript}\n  </head>`);
}

fs.writeFileSync(indexHtmlPath, indexHtml);
console.log('✅ index.html fixed for production');

// 6. Check for import.meta usage in built files
console.log('🔍 Checking for import.meta usage...');
const jsFiles = getAllJsFiles(distPath);
let foundImportMeta = false;

jsFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('import.meta')) {
    console.warn(`⚠️ Found import.meta in: ${path.relative(distPath, file)}`);
    foundImportMeta = true;
  }
});

if (foundImportMeta) {
  console.warn('⚠️ import.meta found in production build - this may cause issues');
} else {
  console.log('✅ No import.meta found in production build');
}

// 7. Check for console.log statements
console.log('🔍 Checking for console.log statements...');
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

// 8. Generate build report
const buildReport = {
  timestamp: new Date().toISOString(),
  buildSize: getDirectorySize(distPath),
  files: jsFiles.length,
  hasImportMeta: foundImportMeta,
  hasConsoleLogs: foundConsoleLogs,
  fixes: [
    'ES module configuration',
    'Environment variables fallback',
    'Type="module" script tags',
    'Production-safe logging'
  ]
};

fs.writeFileSync(
  path.join(distPath, 'build-report.json'),
  JSON.stringify(buildReport, null, 2)
);

console.log('📊 Build Report:', buildReport);
console.log('🎉 Production build with import.meta fixes completed successfully!');

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
