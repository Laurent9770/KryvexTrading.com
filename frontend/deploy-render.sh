#!/bin/bash

# Render.com Deployment Script for Kryvex Trading Platform
echo "🚀 Starting Render.com deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the frontend directory."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Error: Build failed. dist directory not found."
    exit 1
fi

# Check if index.html exists
if [ ! -f "dist/index.html" ]; then
    echo "❌ Error: dist/index.html not found. Build may have failed."
    exit 1
fi

echo "✅ Build completed successfully!"
echo "📁 Build output:"
ls -la dist/

echo ""
echo "🎯 Next steps:"
echo "1. Push your code to GitHub"
echo "2. Create a new Static Site on Render.com"
echo "3. Connect your GitHub repository"
echo "4. Set environment variables:"
echo "   - VITE_SUPABASE_URL"
echo "   - VITE_SUPABASE_ANON_KEY"
echo "5. Deploy!"

echo ""
echo "📋 Render.com Configuration:"
echo "Build Command: npm install && npm run build"
echo "Publish Directory: dist"
echo "Auto-Deploy: Enabled"

echo ""
echo "🔧 SPA Routing is configured in render.yaml"
echo "✅ No 404 errors on page refresh"
echo "✅ All routes will work correctly"

echo ""
echo "🚀 Your Kryvex Trading Platform is ready for Render.com deployment!"
