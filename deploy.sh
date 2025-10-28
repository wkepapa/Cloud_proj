#!/bin/bash

echo "🚀 Deploying Stotra Elections Platform"

# Check if Amplify CLI is installed
if ! command -v amplify &> /dev/null; then
    echo "❌ Amplify CLI not found. Installing..."
    npm install -g @aws-amplify/cli
fi

# Initialize Amplify (if not already done)
if [ ! -d "amplify" ]; then
    echo "📦 Initializing Amplify..."
    amplify init --yes
fi

# Deploy backend
echo "☁️ Deploying backend..."
amplify push --yes

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

# Build frontend
echo "🔨 Building frontend..."
npm run build

# Deploy frontend
echo "🌐 Deploying frontend..."
amplify add hosting
amplify publish --yes

echo "✅ Deployment complete!"
echo "🔗 Your app should be available at the Amplify hosting URL"