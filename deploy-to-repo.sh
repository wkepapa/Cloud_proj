#!/bin/bash

echo "🚀 Deploying React + Vite Migration to Repository"
echo ""

echo "📦 Adding all new files..."
git add .

echo "📝 Committing migration..."
git commit -m "🔄 Migrate from Express to React + Vite + AWS Amplify

✨ Features:
- React + Vite frontend with Tailwind CSS
- Custom Cognito authentication (preserves existing setup)
- AWS Amplify backend architecture
- Responsive design with modern UI
- Session management and logout flow

🗂️ Structure:
- frontend/ - New React application
- amplify/ - AWS backend configuration  
- legacy-express/ - Original Express app (preserved)

🔧 Cognito Config Preserved:
- User Pool: us-east-1_zfMUmmI7i
- Client ID: o82kd78l2ie1chb3h0223e74k
- OAuth flow identical to Express implementation

🚀 Quick Start:
cd frontend && npm install && npm run dev

📋 See MIGRATION.md for complete details"

echo "🌐 Pushing to remote repository..."
git push origin main

echo "✅ Migration deployed successfully!"
echo "🔗 Check your repository for the updated code"