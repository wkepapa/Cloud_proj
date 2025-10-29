# 🔧 Manual AWS Lambda + API Gateway Setup Guide

Complete step-by-step guide to manually create your backend infrastructure.

## 📋 Prerequisites

- AWS Account with admin access
- AWS Console access
- Your backend code ready

## 🗄️ Step 1: Create DynamoDB Tables

### 1.1 Create Votes Table

1. **Go to DynamoDB Console**: https://console.aws.amazon.com/dynamodb/
2. **Click "Create table"**
3. **Configure:**
   - Table name: `stotra-elections-votes`
   - Partition key: `userId` (String)
   - Sort key: Leave empty
   - Table settings: Use default settings
4. **Click "Create table"**

### 1.2 Create Candidates Table

1. **Click "Create table"** again
2. **Configure:**
   - Table name: `stotra-elections-candidates`
   - Partition key: `id` (String)
   - Sort key: Leave empty
   - Table settings: Use default settings
3. **Click "Create table"**

## 🔐 Step 2: Create IAM Role for Lambda

### 2.1 Create Execution Role

1. **Go to IAM Console**: https://console.aws.amazon.com/iam/
2. **Click "Roles" → "Create role"**
3. **Select "AWS service" → "Lambda"**
4. **Click "Next"**

### 2.2 Attach Policies

**Attach these policies:**
- `AWSLambdaBasicExecutionRole` (for CloudWatch logs)
- `AmazonDynamoDBFullAccess` (for DynamoDB access)

### 2.3 Create Custom Policy (Optional - More Secure)

Instead of `AmazonDynamoDBFullAccess`, create a custom policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:Scan",
                "dynamodb:Query"
            ],
            "Resource": [
                "arn:aws:dynamodb:us-east-1:*:table/stotra-elections-votes",
                "arn:aws:dynamodb:us-east-1:*:table/stotra-elections-candidates"
            ]
        }
    ]
}
```

### 2.4 Name and Create Role

- **Role name**: `stotra-elections-lambda-role`
- **Click "Create role"**

## ⚡ Step 3: Create Lambda Function

### 3.1 Create Function

1. **Go to Lambda Console**: https://console.aws.amazon.com/lambda/
2. **Click "Create function"**
3. **Choose "Author from scratch"**
4. **Configure:**
   - Function name: `stotra-elections-api`
   - Runtime: `Node.js 18.x`
   - Architecture: `x86_64`
   - Execution role: Use existing role → `stotra-elections-lambda-role`
5. **Click "Create function"**

### 3.2 Upload Function Code

**Option A: Inline Code Editor**
1. **In the Lambda console, scroll to "Code source"**
2. **Delete the default code**
3. **Copy and paste the entire content from `backend/src/index.js`**

**Option B: Upload ZIP File**
1. **Create a ZIP file with your code:**
   ```bash
   cd backend/src
   zip -r lambda-function.zip .
   ```
2. **In Lambda console: "Upload from" → ".zip file"**
3. **Upload your ZIP file**

### 3.3 Configure Environment Variables

1. **Go to "Configuration" tab → "Environment variables"**
2. **Click "Edit" → "Add environment variable"**
3. **Add these variables:**
   ```
   VOTES_TABLE = stotra-elections-votes
   CANDIDATES_TABLE = stotra-elections-candidates
   USER_POOL_ID = us-east-1_zfMUmmI7i
   USER_POOL_CLIENT_ID = o82kd78l2ie1chb3h0223e74k
   AWS_REGION = us-east-1
   ```

### 3.4 Configure Function Settings

1. **Go to "Configuration" tab → "General configuration"**
2. **Click "Edit"**
3. **Set:**
   - Memory: `256 MB`
   - Timeout: `30 seconds`
4. **Click "Save"**

## 🌐 Step 4: Create API Gateway

### 4.1 Create REST API

1. **Go to API Gateway Console**: https://console.aws.amazon.com/apigateway/
2. **Click "Create API"**
3. **Choose "REST API" (not private)**
4. **Click "Build"**
5. **Configure:**
   - API name: `stotra-elections-api`
   - Description: `Elections platform API`
   - Endpoint Type: `Regional`
6. **Click "Create API"**

### 4.2 Create Proxy Resource

1. **Click "Actions" → "Create Resource"**
2. **Configure:**
   - Resource Name: `proxy`
   - Resource Path: `{proxy+}`
   - ✅ Check "Enable API Gateway CORS"
   - ✅ Check "Configure as proxy resource"
3. **Click "Create Resource"**

### 4.3 Create ANY Method

1. **Select the `{proxy+}` resource**
2. **Click "Actions" → "Create Method"**
3. **Select "ANY" from dropdown**
4. **Click the checkmark**
5. **Configure:**
   - Integration type: `Lambda Function`
   - ✅ Check "Use Lambda Proxy integration"
   - Lambda Region: `us-east-1`
   - Lambda Function: `stotra-elections-api`
6. **Click "Save"**
7. **Click "OK" to give API Gateway permission**

### 4.4 Create Root Method (Optional)

1. **Select the root "/" resource**
2. **Click "Actions" → "Create Method"**
3. **Select "ANY"**
4. **Configure same as above**

### 4.5 Enable CORS

1. **Select your resource**
2. **Click "Actions" → "Enable CORS"**
3. **Configure:**
   - Access-Control-Allow-Origin: `*`
   - Access-Control-Allow-Headers: `Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token`
   - Access-Control-Allow-Methods: `GET,POST,OPTIONS,PUT,DELETE`
4. **Click "Enable CORS and replace existing CORS headers"**

## 🚀 Step 5: Deploy API

### 5.1 Create Deployment Stage

1. **Click "Actions" → "Deploy API"**
2. **Deployment stage: "[New Stage]"**
3. **Stage name**: `dev`
4. **Stage description**: `Development stage`
5. **Click "Deploy"**

### 5.2 Get API URL

After deployment, you'll see:
- **Invoke URL**: `https://abc123def4.execute-api.us-east-1.amazonaws.com/dev`

**Copy this URL** - this is your API endpoint!

## 🧪 Step 6: Test Your API

### 6.1 Test in API Gateway Console

1. **Go to "Resources" → Select ANY method**
2. **Click "TEST"**
3. **Configure test:**
   - Method: `GET`
   - Path: `/health`
4. **Click "Test"**
5. **Should return 200 with health status**

### 6.2 Test with curl

```bash
# Health check
curl https://YOUR_API_URL/health

# Get candidates (will be empty initially)
curl https://YOUR_API_URL/candidates

# Initialize candidates
curl -X POST https://YOUR_API_URL/init
```

## 🔧 Step 7: Initialize Data

### 7.1 Add Sample Candidates

**Option A: Use the /init endpoint**
```bash
curl -X POST https://YOUR_API_URL/init
```

**Option B: Add manually via DynamoDB Console**
1. **Go to DynamoDB Console**
2. **Select `stotra-elections-candidates` table**
3. **Click "Explore table items" → "Create item"**
4. **Add items:**
   ```json
   {
     "id": "1",
     "name": "Alice Johnson", 
     "description": "Experienced leader with a vision for change"
   }
   ```

## 🔍 Step 8: Monitor and Debug

### 8.1 CloudWatch Logs

1. **Go to CloudWatch Console**
2. **Click "Log groups"**
3. **Find `/aws/lambda/stotra-elections-api`**
4. **View logs for debugging**

### 8.2 API Gateway Logs (Optional)

1. **In API Gateway Console → Stages → dev**
2. **Click "Logs/Tracing" tab**
3. **Enable CloudWatch logs**

## 🔧 Step 9: Update Frontend

### 9.1 Update API Configuration

Edit `frontend/src/services/api.js`:
```javascript
BASE_URL: 'https://YOUR_ACTUAL_API_URL',
```

### 9.2 Deploy Frontend

```bash
git add .
git commit -m "🔧 Connect to manual Lambda backend"
git push origin main
```

## 🎯 Summary

**What you created manually:**
- ✅ 2 DynamoDB tables
- ✅ 1 IAM role with permissions
- ✅ 1 Lambda function with your code
- ✅ 1 API Gateway with proxy integration
- ✅ 1 deployment stage

**Your API endpoints:**
- `GET /health` - Health check
- `GET /candidates` - List candidates
- `POST /vote` - Cast vote (auth required)
- `GET /vote-status` - Check vote status (auth required)
- `GET /results` - Election results
- `POST /init` - Initialize candidates

## 🔧 Troubleshooting

**Common Issues:**

1. **CORS Errors**: Ensure CORS is enabled on API Gateway
2. **Permission Errors**: Check IAM role has DynamoDB permissions
3. **Function Errors**: Check CloudWatch logs
4. **404 Errors**: Verify proxy resource configuration

**Debug Steps:**
1. Test Lambda function directly in console
2. Check CloudWatch logs for errors
3. Test API Gateway endpoints individually
4. Verify environment variables are set

Your manual setup is complete! This gives you full control and understanding of each component. 🎉