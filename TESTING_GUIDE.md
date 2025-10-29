# 🧪 Testing Guide - Step by Step

Complete guide to test your Lambda function and API endpoints before connecting to frontend.

## 🎯 Testing Strategy

**Phase 1**: Test Lambda function directly (5 min)
**Phase 2**: Test with API Gateway (10 min)  
**Phase 3**: Test with frontend (5 min)
**Phase 4**: End-to-end testing (10 min)

---

## 📋 Phase 1: Test Lambda Function Directly

### Step 1.1: Test Health Check

1. **Go to Lambda Console**: https://console.aws.amazon.com/lambda/
2. **Click your function**: `stotra-elections-api`
3. **Go to "Test" tab**
4. **Click "Create new test event"**
5. **Event name**: `health-check`
6. **Event JSON**:

```json
{
  "httpMethod": "GET",
  "path": "/health",
  "headers": {},
  "queryStringParameters": null,
  "body": null,
  "requestContext": {
    "identity": {
      "sourceIp": "127.0.0.1"
    }
  }
}
```

7. **Click "Save"**
8. **Click "Test"**

**Expected Result**:
```json
{
  "statusCode": 200,
  "headers": {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS,PUT,DELETE",
    "Access-Control-Allow-Credentials": false
  },
  "body": "{\"status\":\"healthy\",\"timestamp\":\"2024-01-15T10:30:00.000Z\",\"version\":\"1.0.0\",\"tables\":{\"votes\":\"vote_table\",\"candidates\":\"candidate_table\"}}"
}
```

### Step 1.2: Test Initialize Candidates

1. **Create new test event**
2. **Event name**: `init-candidates`
3. **Event JSON**:

```json
{
  "httpMethod": "POST",
  "path": "/init",
  "headers": {},
  "queryStringParameters": null,
  "body": null,
  "requestContext": {
    "identity": {
      "sourceIp": "127.0.0.1"
    }
  }
}
```

4. **Click "Test"**

**Expected Result**:
```json
{
  "statusCode": 200,
  "body": "{\"message\":\"Candidates initialized successfully\",\"count\":3}"
}
```

### Step 1.3: Test Get Candidates

1. **Create new test event**
2. **Event name**: `get-candidates`
3. **Event JSON**:

```json
{
  "httpMethod": "GET",
  "path": "/candidates",
  "headers": {},
  "queryStringParameters": null,
  "body": null
}
```

4. **Click "Test"**

**Expected Result**:
```json
{
  "statusCode": 200,
  "body": "{\"candidates\":[{\"id\":\"1\",\"name\":\"Alice Johnson\",\"email\":\"alice@university.edu\",\"description\":\"Experienced leader...\",\"status\":\"approved\"}],\"count\":3}"
}
```

### Step 1.4: Test Vote Casting

1. **Create new test event**
2. **Event name**: `cast-vote`
3. **Event JSON**:

```json
{
  "httpMethod": "POST",
  "path": "/vote",
  "headers": {
    "Content-Type": "application/json"
  },
  "queryStringParameters": null,
  "body": "{\"candidateId\": \"1\", \"userId\": \"test-user-123\"}",
  "requestContext": {
    "identity": {
      "sourceIp": "192.168.1.100"
    }
  }
}
```

4. **Click "Test"**

**Expected Result**:
```json
{
  "statusCode": 200,
  "body": "{\"message\":\"Vote cast successfully\",\"candidateName\":\"Alice Johnson\"}"
}
```

### Step 1.5: Test Candidate Registration

1. **Create new test event**
2. **Event name**: `register-candidate`
3. **Event JSON**:

```json
{
  "httpMethod": "POST",
  "path": "/candidates",
  "headers": {
    "Content-Type": "application/json"
  },
  "queryStringParameters": null,
  "body": "{\"name\": \"David Wilson\", \"email\": \"david@university.edu\", \"description\": \"Passionate about student rights\", \"platform\": \"Improve campus facilities and student services\", \"studentId\": \"STU004\", \"phone\": \"+1-555-0104\", \"experience\": \"2 years in debate club\"}",
  "requestContext": {
    "identity": {
      "sourceIp": "192.168.1.101"
    }
  }
}
```

4. **Click "Test"**

**Expected Result**:
```json
{
  "statusCode": 201,
  "body": "{\"message\":\"Candidate registration submitted successfully\",\"candidateId\":\"candidate_1642248600000_abc123def\",\"status\":\"pending\"}"
}
```

---

## 🌐 Phase 2: Test with API Gateway (After API Gateway Setup)

### Step 2.1: Test with curl Commands

Once you have your API Gateway URL (e.g., `https://abc123def4.execute-api.us-east-1.amazonaws.com/dev`):

```bash
# Health check
curl https://YOUR_API_URL/health

# Get candidates
curl https://YOUR_API_URL/candidates

# Initialize candidates (if needed)
curl -X POST https://YOUR_API_URL/init

# Cast vote
curl -X POST https://YOUR_API_URL/vote \
  -H "Content-Type: application/json" \
  -d '{"candidateId": "1", "userId": "test-user-456"}'

# Register candidate
curl -X POST https://YOUR_API_URL/candidates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Emma Thompson",
    "email": "emma@university.edu",
    "description": "Dedicated to improving student life",
    "platform": "Better dining options and study spaces",
    "studentId": "STU005",
    "phone": "+1-555-0105"
  }'

# Get results
curl https://YOUR_API_URL/results
```

### Step 2.2: Test with Postman (Optional)

1. **Download Postman**: https://www.postman.com/downloads/
2. **Create new collection**: "Stotra Elections API"
3. **Add requests for each endpoint**
4. **Test all endpoints systematically**

---

## 🖥️ Phase 3: Test with Frontend

### Step 3.1: Update API Configuration

1. **Edit `frontend/src/services/api.js`**
2. **Update BASE_URL**:

```javascript
BASE_URL: 'https://YOUR_ACTUAL_API_GATEWAY_URL',
```

### Step 3.2: Test Frontend Locally

```bash
cd frontend
npm run dev
```

### Step 3.3: Test Each Feature

1. **Visit**: `http://localhost:3000`
2. **Test authentication**: Sign in with Cognito
3. **Test candidate registration**: Go to "Run for Office"
4. **Test voting**: Go to Dashboard
5. **Test results**: Check Results page

---

## 🔍 Phase 4: Verify Database

### Step 4.1: Check DynamoDB Tables

1. **Go to DynamoDB Console**
2. **Check `candidate_table`**:
   - Should have initialized candidates
   - Should have new registrations with "pending" status

3. **Check `vote_table`**:
   - Should have test votes
   - Each vote should have userId, candidateId, timestamp

### Step 4.2: Sample Data Verification

**candidate_table should contain**:
```json
{
  "id": "1",
  "name": "Alice Johnson",
  "status": "approved",
  "registrationDate": "2024-01-15T10:00:00Z"
}
```

**vote_table should contain**:
```json
{
  "userId": "test-user-123",
  "candidateId": "1",
  "candidateName": "Alice Johnson",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 🚨 Troubleshooting Common Issues

### Issue 1: Lambda Function Errors

**Symptoms**: 500 Internal Server Error
**Check**:
1. CloudWatch Logs: `/aws/lambda/stotra-elections-api`
2. Environment variables are set correctly
3. IAM role has DynamoDB permissions

**Fix**:
```bash
# Check logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/stotra-elections-api"
```

### Issue 2: DynamoDB Access Denied

**Symptoms**: "User is not authorized to perform: dynamodb:Scan"
**Fix**:
1. Go to IAM → Roles → `StotraElectionsLambdaRole`
2. Verify DynamoDB policy is attached
3. Check table names match exactly

### Issue 3: CORS Errors

**Symptoms**: "Access to fetch blocked by CORS policy"
**Fix**:
1. Verify CORS headers in Lambda response
2. Check API Gateway CORS configuration
3. Ensure OPTIONS method is handled

### Issue 4: Table Not Found

**Symptoms**: "Requested resource not found"
**Fix**:
1. Verify table names: `candidate_table`, `vote_table`
2. Check tables exist in correct region (us-east-1)
3. Update environment variables if needed

---

## ✅ Testing Checklist

### Lambda Function Tests
- [ ] Health check returns 200
- [ ] Initialize candidates works
- [ ] Get candidates returns data
- [ ] Vote casting works
- [ ] Candidate registration works
- [ ] All tests pass without errors

### API Gateway Tests (After Setup)
- [ ] All curl commands work
- [ ] CORS headers present
- [ ] Error responses formatted correctly
- [ ] Rate limiting works (if configured)

### Frontend Tests
- [ ] API calls work from React app
- [ ] Authentication flow works
- [ ] Candidate registration form works
- [ ] Voting works
- [ ] Results display correctly

### Database Verification
- [ ] candidate_table has sample data
- [ ] vote_table records votes correctly
- [ ] New registrations have "pending" status
- [ ] Data integrity maintained

---

## 🎯 Quick Test Script

Create this file to test all endpoints quickly:

```bash
#!/bin/bash
# test-api.sh

API_URL="https://YOUR_API_GATEWAY_URL"

echo "🧪 Testing Stotra Elections API"
echo "================================"

echo "1. Health Check:"
curl -s $API_URL/health | jq .

echo -e "\n2. Initialize Candidates:"
curl -s -X POST $API_URL/init | jq .

echo -e "\n3. Get Candidates:"
curl -s $API_URL/candidates | jq .

echo -e "\n4. Cast Vote:"
curl -s -X POST $API_URL/vote \
  -H "Content-Type: application/json" \
  -d '{"candidateId": "1", "userId": "test-user-789"}' | jq .

echo -e "\n5. Get Results:"
curl -s $API_URL/results | jq .

echo -e "\n✅ All tests completed!"
```

**Usage**:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## 🚀 Ready to Test?

**Start with Phase 1** - Test your Lambda function directly in the AWS console. This is the fastest way to verify your code works before setting up API Gateway.

Once Phase 1 passes, you'll know your Lambda function is working correctly! 🎯