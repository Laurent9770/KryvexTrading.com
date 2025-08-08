#!/bin/bash

echo "🚀 Starting Kryvex Trading Platform Deployment..."

# Check if we're in the right directory
if [ ! -f "render.yaml" ]; then
    echo "❌ Error: render.yaml not found. Please run this script from the project root."
    exit 1
fi

echo "📁 Current directory: $(pwd)"
echo "🔧 Node version: $(node --version)"
echo "📦 NPM version: $(npm --version)"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf frontend/dist
rm -rf backend/node_modules
rm -rf frontend/node_modules

# Install and build frontend
echo "🔧 Installing frontend dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Frontend dependency installation failed"
    exit 1
fi

echo "🏗️ Building frontend..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi

# Check if build was successful
if [ ! -f "dist/index.html" ]; then
    echo "❌ Frontend build failed - index.html not found"
    exit 1
fi

echo "✅ Frontend build completed successfully"

# Install backend dependencies
echo "🔧 Installing backend dependencies..."
cd ../backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Backend dependency installation failed"
    exit 1
fi

echo "✅ Backend dependencies installed successfully"

# Go back to root
cd ..

echo "🎉 Deployment preparation completed successfully!"
echo "📁 Frontend build location: frontend/dist/"
echo "📁 Backend location: backend/"
echo "🚀 Ready for deployment to Render.com"

# List the built files
echo "📋 Built files:"
ls -la frontend/dist/ 