#!/bin/bash

# Kryvex Trading Platform - Dependency Fix Script
# This script cleans up potential package conflicts and ensures clean dependencies

echo "🔧 Fixing Kryvex Trading Platform Dependencies..."

# Navigate to frontend directory
cd frontend

echo "📦 Checking for multiple Supabase versions..."
npm ls @supabase/supabase-js

echo "🧹 Cleaning npm cache..."
npm cache clean --force

echo "🗑️ Removing node_modules and lock files..."
rm -rf node_modules
rm -f package-lock.json
rm -f yarn.lock

echo "🔄 Reinstalling dependencies..."
npm install

echo "📋 Verifying Supabase installation..."
npm ls @supabase/supabase-js

echo "🏗️ Building project to test for issues..."
npm run build

echo "✅ Dependency cleanup complete!"
echo ""
echo "If you still see errors:"
echo "1. Check that only ONE version of @supabase/supabase-js is installed"
echo "2. Verify all environment variables are set correctly"
echo "3. Clear browser cache and hard refresh"
echo "4. Check browser console for detailed error messages"
