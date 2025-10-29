#!/bin/bash

echo "🚀 Deploying Stotra Elections Backend to AWS Lambda"
echo ""

# Check if serverless is installed
if ! command -v serverless &> /dev/null; then
    echo "📦 Installing Serverless Framework..."
    npm install -g serverless
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Deploy to development
echo "🔧 Deploying to development environment..."
npm run deploy:dev

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Development deployment successful!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Note the API Gateway URL from the output above"
    echo "2. Update your frontend config with the new API URL"
    echo "3. Initialize candidates: POST /init"
    echo "4. Test the API endpoints"
    echo ""
    echo "🧪 Test Commands:"
    echo "curl https://YOUR_API_URL/health"
    echo "curl https://YOUR_API_URL/candidates"
    echo ""
    echo "🚀 For production deployment:"
    echo "npm run deploy:prod"
else
    echo "❌ Deployment failed! Check the errors above."
    exit 1
fi