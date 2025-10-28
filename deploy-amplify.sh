#!/bin/bash

echo "🚀 Deploying Stotra Elections to AWS Amplify"
echo ""

echo "📦 Building production version..."
cd frontend
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix errors and try again."
    exit 1
fi

echo "✅ Build successful!"
echo ""
echo "📋 Next Steps:"
echo "1. Go to AWS Amplify Console: https://console.aws.amazon.com/amplify/"
echo "2. Click 'New app' → 'Host web app'"
echo "3. Connect your GitHub repository"
echo "4. Use the amplify.yml build configuration"
echo "5. Deploy and get your Amplify URL"
echo "6. Update Cognito callback URLs with your new domain"
echo ""
echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions"
echo ""