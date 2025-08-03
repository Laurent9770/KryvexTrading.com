#!/bin/bash

# Custom build script for Render deployment
echo "Starting custom build process..."

# Clean everything
echo "Cleaning node_modules and cache..."
rm -rf node_modules package-lock.json
npm cache clean --force

# Install dependencies
echo "Installing dependencies..."
npm install --no-optional

# Force install correct esbuild version
echo "Forcing esbuild 0.25.0..."
npm install esbuild@0.25.0 --save-dev --force

# Verify esbuild version
echo "Verifying esbuild version..."
npm list esbuild

# Build the project
echo "Building project..."
npm run build

echo "Build completed!" 