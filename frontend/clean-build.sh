#!/bin/bash

echo "🧹 Cleaning previous builds..."
rm -rf dist
rm -rf node_modules/.vite

echo "📦 Reinstalling dependencies..."
npm install

echo "🔨 Building project..."
npm run build

echo "✅ Build completed! Check the dist folder for the new build."
