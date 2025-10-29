# 🚀 Backend Deployment Guide

Complete guide to deploy your AWS Lambda backend for the Stotra Elections Platform.

## 📋 Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** configured: `aws configure`
3. **Node.js 18+** installed
4. **Git** repository access

## 🔧 Step 1: Deploy Backend

### Option A: Automated Deployment (Recommended)

**Windows:**
```cmd
cd backend
deploy.bat
```

**Linux/Mac:**
```bash
cd backend
chmod +x deploy.sh
./deploy.sh
```

### Option B: Manual Deployment

```bash
cd backend

# Install dependencies
npm install

# Install Serverless Framework globally
npm install -g serverless

# Deploy to development
npm run deploy:dev
```

## 📝 Step 2: Note Your API URL

After deployment, you'll see output like:
```
✅ Service deployed to stack stotra-elections-backend-dev

endpoints:
  ANY - https://abc123def4.execute-api.us-east-1.amazonaws.com/dev/{proxy+}
  ANY - https://abc123def4.execute-api.us-east-1.amazonaws.com/dev
```

**Copy your API Gateway URL**: `https://abc123def4.execute-api.us-east-1.amazonaws.com/dev`

## 🔧 Step 3: Update Frontend Configuration

### 3.1 Update API Service

Edit `frontend/src/services/api.js`:
```javascript
// Replace YOUR_API_GATEWAY_URL with your actual URL
BASE_URL: process.env.VITE_API_URL || 'https://abc123def4.execute-api.us-east-1.amazonaws.com/dev',
```

### 3.2 Add Environment Variable (Optional)

Create `frontend/.env`:
```bash
VITE_API_URL=https://abc123def4.execute-api.us-east-1.amazonaws.com/dev
```

## 🧪 Step 4: Initialize Backend Data

### 4.1 Initialize Candidates

```bash
curl -X POST https://YOUR_API_URL/init
```

### 4.2 Test API Endpoints

```bash
# Health check
curl https://YOUR_API_URL/health

# Get candidates
curl https://YOUR_API_URL/candidates

# Get results
curl https://YOUR_API_URL/results
```

## 🚀 Step 5: Deploy Frontend Updates

```bash
# Commit API configuration changes
git add .
git commit -m "🔧 Connect frontend to Lambda backend API"
git push origin main

# Amplify will auto-deploy the frontend updates
```

## 🧪 Step 6: Test Complete Flow

1. **Visit your Amplify URL**: `https://main.d3okoijvek90er.amplifyapp.com/`
2. **Sign in** with Cognito
3. **Go to Dashboard** and test voting
4. **Check Results** page for real-time data
5. **Verify** votes are stored in DynamoDB

## 📊 Step 7: Monitor & Debug

### CloudWatch Logs
```bash
# View Lambda logs
serverless logs -f api

# Tail logs in real-time
serverless logs -f api --tail
```

### API Gateway Logs
- Go to AWS Console → API Gateway → Your API → Stages → Logs

### DynamoDB Tables
- Go to AWS Console → DynamoDB → Tables
- Check `stotra-elections-backend-votes-dev`
- Check `stotra-elections-backend-candidates-dev`

## 🔧 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Verify your domain is in `serverless.yml` CORS config
   - Check browser console for specific CORS messages

2. **Authentication Errors**
   - Verify Cognito User Pool ID in `serverless.yml`
   - Check JWT token format in browser dev tools

3. **API Not Found**
   - Verify API Gateway URL is correct
   - Check if deployment completed successfully

4. **Database Errors**
   - Verify DynamoDB tables were created
   - Check IAM permissions for Lambda function

### Debug Commands

```bash
# Check deployment status
serverless info

# View stack resources
aws cloudformation describe-stacks --stack-name stotra-elections-backend-dev

# Test API directly
curl -v https://YOUR_API_URL/health
```

## 🚀 Production Deployment

When ready for production:

```bash
# Deploy to production
npm run deploy:prod

# Update frontend with production API URL
# Update Amplify environment variables
```

## 🔐 Security Checklist

- ✅ JWT token validation working
- ✅ CORS properly configured
- ✅ DynamoDB access restricted to Lambda
- ✅ API Gateway rate limiting enabled
- ✅ CloudWatch logging enabled

## 📈 Performance Optimization

- ✅ Lambda cold start optimization
- ✅ DynamoDB on-demand billing
- ✅ API Gateway caching (optional)
- ✅ CloudFront distribution (optional)

Your backend is now ready for production use! 🎉