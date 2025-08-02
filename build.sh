#!/bin/bash

echo "🚀 Starting build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the client
echo "🏗️ Building client..."
npm run build

echo "✅ Build completed successfully!" 