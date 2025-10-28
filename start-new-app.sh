#!/bin/bash

echo "🚀 Starting Stotra Elections Platform (React + Vite)"
echo ""

# Check if we're in the right directory
if [ ! -d "frontend" ]; then
    echo "❌ frontend/ directory not found. Make sure you're in the project root."
    exit 1
fi

# Navigate to frontend
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🎯 Starting development server..."
echo "🌐 App will be available at: http://localhost:3000"
echo ""

# Start the dev server
npm run dev