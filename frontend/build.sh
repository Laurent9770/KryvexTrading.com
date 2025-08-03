#!/bin/bash

# Custom build script for Render deployment
echo "Starting custom build process..."

# Clean install
rm -rf node_modules package-lock.json
npm install --no-optional

# Force install specific versions
npm install esbuild@0.25.0 --save-dev

# Build the project
npm run build

echo "Build completed!" 