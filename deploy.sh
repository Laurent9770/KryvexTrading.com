#!/bin/bash

echo "🚀 Deploying Kryvex Frontend..."

# Navigate to frontend directory
cd frontend

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "📁 Build directory contents:"
    ls -la dist/
    
    echo ""
    echo "🌐 Your application is ready for deployment!"
    echo "📋 Next steps:"
    echo "1. Deploy to Render.com using the render.yaml configuration"
    echo "2. Or deploy to Vercel using: npm run deploy:vercel"
    echo "3. Or deploy to Netlify using: npm run deploy:netlify"
    echo ""
    echo "🔗 Admin dashboard will be available at: /admin"
    echo "👤 Admin credentials: admin@kryvex.com / Kryvex.@123"
else
    echo "❌ Build failed!"
    exit 1
fi 