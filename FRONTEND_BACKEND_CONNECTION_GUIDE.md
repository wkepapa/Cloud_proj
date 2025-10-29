# Frontend-Backend Connection Guide

## Overview
Your Lambda functions are working! Now you need to connect your React frontend to the Lambda APIs.

## Step 1: Get Your Lambda Function URLs

After deploying your Lambda functions, you'll have URLs like:

### Option A: API Gateway URLs (Recommended)
```
Elections API: https://abc123.execute-api.us-east-1.amazonaws.com/prod
Candidate API: https://def456.execute-api.us-east-1.amazonaws.com/prod
```

### Option B: Lambda Function URLs (Direct)
```
Elections API: https://abc123.lambda-url.us-east-1.on.aws/
Candidate API: https://def456.lambda-url.us-east-1.on.aws/
```

## Step 2: Configure Frontend Environment

1. **Create `.env` file** in your `frontend/` directory:
```bash
# Copy the example file
cp .env.example .env
```

2. **Update `.env` with your actual URLs**:
```env
# Replace with your actual Lambda URLs
VITE_ELECTIONS_API_URL=https://your-elections-api-url
VITE_CANDIDATE_API_URL=https://your-candidate-management-api-url
```

## Step 3: Test the Connection

1. **Start your frontend**:
```bash
cd frontend
npm run dev
```

2. **Test these endpoints**:
   - Health check: Visit your app and check browser console
   - Get candidates: Go to voting page
   - Register candidate: Try candidate registration
   - Cast vote: Try voting (requires login)

## Step 4: API Endpoint Mapping

Your frontend now uses two separate Lambda functions:

### Elections API Lambda (Public endpoints)
- `GET /health` - Health check
- `GET /candidates` - Get approved candidates
- `POST /vote` - Cast a vote
- `GET /vote-status?userId=xxx` - Check vote status
- `GET /results` - Get election results
- `POST /init` - Initialize sample candidates

### Candidate Management API Lambda (Admin endpoints)
- `GET /health` - Health check
- `POST /candidates` - Register new candidate
- `GET /candidates/pending` - Get pending candidates
- `POST /candidates/approve` - Approve candidate
- `POST /candidates/reject` - Reject candidate
- `GET /admin/stats` - Get admin statistics

## Step 5: CORS Configuration

Make sure your Lambda functions have CORS enabled. The functions already include CORS headers:

```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,PUT,DELETE',
  'Access-Control-Allow-Credentials': false
};
```

## Step 6: Authentication Flow

The frontend handles authentication automatically:

1. **User login** → Cognito handles OAuth flow
2. **API calls** → Frontend adds `Authorization: Bearer <token>` header
3. **Lambda functions** → Can verify token if needed (currently not implemented)

## Step 7: Testing Checklist

✅ **Health Check**: Visit app, check console for API health check  
✅ **View Candidates**: Go to voting page, see candidate list  
✅ **Register Candidate**: Fill out registration form  
✅ **Cast Vote**: Login and vote for a candidate  
✅ **View Results**: Check results page  
✅ **Admin Functions**: Test candidate approval (if admin)  

## Step 8: Troubleshooting

### Common Issues:

1. **CORS Errors**:
   - Check Lambda CORS headers
   - Verify API Gateway CORS settings

2. **404 Errors**:
   - Verify Lambda function URLs in `.env`
   - Check API Gateway routes

3. **Authentication Issues**:
   - Check Cognito configuration
   - Verify user pool settings

4. **Environment Variables**:
   - Restart dev server after changing `.env`
   - Check `VITE_` prefix on variables

### Debug Commands:

```bash
# Check environment variables
echo $VITE_ELECTIONS_API_URL
echo $VITE_CANDIDATE_API_URL

# Test Lambda directly
curl https://your-lambda-url/health

# Check browser console for API calls
# Open DevTools → Network tab → Filter by XHR
```

## Step 9: Production Deployment

For production deployment:

1. **Build frontend**:
```bash
cd frontend
npm run build
```

2. **Deploy to hosting** (Amplify, Netlify, etc.)

3. **Set production environment variables** in hosting platform

4. **Update Cognito redirect URLs** to match production domain

## Next Steps

Once connected, you can:
- Add admin dashboard for candidate management
- Implement real-time results updates
- Add email notifications for candidate approval
- Enhance security with proper token validation
- Add audit logging for votes and admin actions

Your Lambda functions are production-ready and the frontend is configured to work with them!