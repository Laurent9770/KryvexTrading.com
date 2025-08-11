@echo off
echo 🧹 Cleaning previous builds...
if exist dist rmdir /s /q dist
if exist node_modules\.vite rmdir /s /q node_modules\.vite

echo 📦 Reinstalling dependencies...
npm install

echo 🔨 Building project...
npm run build

echo ✅ Build completed! Check the dist folder for the new build.
pause
