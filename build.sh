#!/bin/bash

echo "🚀 Starting build process..."

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend && npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend && npm install

# Build frontend
echo "🔨 Building frontend..."
npm run build

# Verify frontend build
echo "✅ Verifying frontend build..."
if [ -f "dist/index.html" ]; then
    echo "✅ Frontend build successful!"
    echo "📁 Frontend files:"
    ls -la dist/
else
    echo "❌ Frontend build failed!"
    exit 1
fi

# Go back to root
cd ..

echo "🎉 Build process completed!" 