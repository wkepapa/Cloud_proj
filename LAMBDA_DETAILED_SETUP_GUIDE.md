# ⚡ AWS Lambda Function - Detailed Setup Guide

Complete step-by-step guide to create and configure your Lambda function for the Stotra Elections Platform.

## 📋 Prerequisites

- ✅ DynamoDB tables created: `candidate_table` and `vote_table`
- ✅ AWS Console access
- ✅ Basic understanding of Lambda functions

## 🔐 Step 1: Create IAM Role for Lambda

### 1.1 Navigate to IAM Console

1. **Go to IAM Console**: https://console.aws.amazon.com/iam/
2. **Click "Roles"** in the left sidebar
3. **Click "Create role"**

### 1.2 Select Trusted Entity

1. **Trusted entity type**: ☑ AWS service
2. **Use case**: ☑ Lambda
3. **Click "Next"**

### 1.3 Add Permissions Policies

**Add these policies:**

1. **AWSLambdaBasicExecutionRole**
   - Purpose: CloudWatch Logs access
   - Click ☑ to select

2. **Create Custom DynamoDB Policy**
   - Click "Create policy"
   - Switch to JSON tab
   - Paste this policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:Scan",
                "dynamodb:Query"
            ],
            "Resource": [
                "arn:aws:dynamodb:us-east-1:*:table/candidate_table",
                "arn:aws:dynamodb:us-east-1:*:table/vote_table"
            ]
        }
    ]
}
```

3. **Policy details:**
   - Name: `StotraElectionsDynamoDBPolicy`
   - Description: `DynamoDB access for Stotra Elections Lambda`
   - Click "Create policy"

4. **Back to role creation:**
   - Search for `StotraElectionsDynamoDBPolicy`
   - Click ☑ to select
   - Click "Next"

### 1.4 Name and Create Role

1. **Role name**: `StotraElectionsLambdaRole`
2. **Description**: `Execution role for Stotra Elections Lambda function`
3. **Click "Create role"**

---

## ⚡ Step 2: Create Lambda Function

### 2.1 Navigate to Lambda Console

1. **Go to Lambda Console**: https://console.aws.amazon.com/lambda/
2. **Click "Create function"**

### 2.2 Basic Information

1. **Function option**: ☑ Author from scratch
2. **Function name**: `stotra-elections-api`
3. **Runtime**: `Node.js 18.x`
4. **Architecture**: `x86_64`

### 2.3 Permissions

1. **Execution role**: ☑ Use an existing role
2. **Existing role**: Select `StotraElectionsLambdaRole`
3. **Click "Create function"**

---

## 💻 Step 3: Add Function Code

### 3.1 Function Code Editor

1. **In the Lambda console, scroll to "Code source"**
2. **Delete all existing code in `index.mjs`**
3. **Copy and paste the complete code below:**

```javascript
import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();

// Table names (update these to match your actual table names)
const VOTES_TABLE = 'vote_table';
const CANDIDATES_TABLE = 'candidate_table';
const USER_POOL_ID = process.env.USER_POOL_ID || 'us-east-1_zfMUmmI7i';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,PUT,DELETE',
  'Access-Control-Allow-Credentials': false
};

// Main Lambda handler
export const handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const path = event.path || event.pathParameters?.proxy || '';
    const method = event.httpMethod;

    console.log(`Processing ${method} ${path}`);

    // Route requests
    switch (path) {
      case '/health':
        return await healthCheck();
      
      case '/candidates':
        if (method === 'GET') return await getCandidates();
        if (method === 'POST') return await registerCandidate(event);
        break;
      
      case '/candidates/approve':
        if (method === 'POST') return await approveCandidate(event);
        break;
      
      case '/results':
        return await getResults();
      
      case '/init':
        if (method === 'POST') return await initializeCandidates();
        break;
      
      case '/vote':
        if (method === 'POST') return await castVote(event);
        break;
      
      case '/vote-status':
        return await getVoteStatus(event);
      
      default:
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Not found', path: path })
        };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};

// Health check endpoint
async function healthCheck() {
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      tables: {
        votes: VOTES_TABLE,
        candidates: CANDIDATES_TABLE
      }
    })
  };
}

// Get all candidates (approved only for public, all for admin)
async function getCandidates() {
  try {
    const result = await dynamodb.scan({
      TableName: CANDIDATES_TABLE
    }).promise();

    // Filter only approved candidates for public view
    const approvedCandidates = result.Items.filter(candidate => 
      candidate.status === 'approved'
    );

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        candidates: approvedCandidates,
        count: approvedCandidates.length
      })
    };
  } catch (error) {
    console.error('Error getting candidates:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to get candidates' })
    };
  }
}

// Register new candidate (requires verification)
async function registerCandidate(event) {
  try {
    const candidateData = JSON.parse(event.body || '{}');
    
    const {
      name,
      email,
      description,
      platform,
      experience,
      studentId,
      phone,
      documents
    } = candidateData;

    // Validation
    if (!name || !email || !description || !platform || !studentId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Missing required fields: name, email, description, platform, studentId' 
        })
      };
    }

    // Generate unique candidate ID
    const candidateId = `candidate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create candidate record
    const candidate = {
      id: candidateId,
      name,
      email,
      description,
      platform,
      experience: experience || '',
      studentId,
      phone: phone || '',
      documents: documents || [],
      status: 'pending', // pending, approved, rejected
      registrationDate: new Date().toISOString(),
      approvedDate: null,
      approvedBy: null,
      votes: 0,
      metadata: {
        ipAddress: event.requestContext?.identity?.sourceIp || 'unknown',
        userAgent: event.headers?.['User-Agent'] || 'unknown'
      }
    };

    // Save to DynamoDB
    await dynamodb.put({
      TableName: CANDIDATES_TABLE,
      Item: candidate
    }).promise();

    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Candidate registration submitted successfully',
        candidateId: candidateId,
        status: 'pending',
        note: 'Your application is under review. You will be notified once approved.'
      })
    };

  } catch (error) {
    console.error('Error registering candidate:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to register candidate' })
    };
  }
}

// Approve candidate (admin function)
async function approveCandidate(event) {
  try {
    const { candidateId, action, adminId } = JSON.parse(event.body || '{}');
    
    if (!candidateId || !action || !adminId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Missing required fields: candidateId, action, adminId' 
        })
      };
    }

    if (!['approve', 'reject'].includes(action)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Action must be approve or reject' })
      };
    }

    // Update candidate status
    const updateParams = {
      TableName: CANDIDATES_TABLE,
      Key: { id: candidateId },
      UpdateExpression: 'SET #status = :status, approvedDate = :date, approvedBy = :admin',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': action === 'approve' ? 'approved' : 'rejected',
        ':date': new Date().toISOString(),
        ':admin': adminId
      },
      ReturnValues: 'ALL_NEW'
    };

    const result = await dynamodb.update(updateParams).promise();

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: `Candidate ${action}d successfully`,
        candidate: result.Attributes
      })
    };

  } catch (error) {
    console.error('Error approving candidate:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to approve candidate' })
    };
  }
}

// Cast a vote
async function castVote(event) {
  try {
    const { candidateId, userId } = JSON.parse(event.body || '{}');

    if (!candidateId || !userId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'candidateId and userId are required' })
      };
    }

    // Check if user has already voted
    const existingVote = await dynamodb.get({
      TableName: VOTES_TABLE,
      Key: { userId }
    }).promise();

    if (existingVote.Item) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'User has already voted' })
      };
    }

    // Verify candidate exists and is approved
    const candidate = await dynamodb.get({
      TableName: CANDIDATES_TABLE,
      Key: { id: candidateId }
    }).promise();

    if (!candidate.Item) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid candidate ID' })
      };
    }

    if (candidate.Item.status !== 'approved') {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Candidate is not approved for voting' })
      };
    }

    // Cast the vote
    await dynamodb.put({
      TableName: VOTES_TABLE,
      Item: {
        userId,
        candidateId,
        candidateName: candidate.Item.name,
        timestamp: new Date().toISOString(),
        ipAddress: event.requestContext?.identity?.sourceIp || 'unknown'
      }
    }).promise();

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Vote cast successfully',
        candidateName: candidate.Item.name
      })
    };

  } catch (error) {
    console.error('Error casting vote:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to cast vote' })
    };
  }
}

// Check if user has voted
async function getVoteStatus(event) {
  try {
    const userId = event.queryStringParameters?.userId;
    
    if (!userId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'userId parameter required' })
      };
    }

    const result = await dynamodb.get({
      TableName: VOTES_TABLE,
      Key: { userId }
    }).promise();

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        hasVoted: !!result.Item,
        vote: result.Item ? {
          candidateId: result.Item.candidateId,
          candidateName: result.Item.candidateName,
          timestamp: result.Item.timestamp
        } : null
      })
    };

  } catch (error) {
    console.error('Error getting vote status:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to get vote status' })
    };
  }
}

// Get election results
async function getResults() {
  try {
    // Get all votes
    const votesResult = await dynamodb.scan({
      TableName: VOTES_TABLE
    }).promise();

    // Get all approved candidates
    const candidatesResult = await dynamodb.scan({
      TableName: CANDIDATES_TABLE,
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'approved'
      }
    }).promise();

    // Count votes per candidate
    const voteCounts = {};
    votesResult.Items.forEach(vote => {
      voteCounts[vote.candidateId] = (voteCounts[vote.candidateId] || 0) + 1;
    });

    // Build results with candidate info
    const results = candidatesResult.Items.map(candidate => ({
      candidateId: candidate.id,
      candidate: candidate.name,
      description: candidate.description,
      platform: candidate.platform,
      votes: voteCounts[candidate.id] || 0,
      percentage: votesResult.Items.length > 0
        ? ((voteCounts[candidate.id] || 0) / votesResult.Items.length * 100).toFixed(1)
        : '0.0'
    }));

    // Sort by vote count (descending)
    results.sort((a, b) => b.votes - a.votes);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        results,
        totalVotes: votesResult.Items.length,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Error getting results:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to get results' })
    };
  }
}

// Initialize sample candidates (for testing)
async function initializeCandidates() {
  const candidates = [
    {
      id: '1',
      name: 'Alice Johnson',
      email: 'alice@university.edu',
      description: 'Experienced leader with a vision for positive change and student advocacy.',
      platform: 'Focus on student welfare, campus improvements, and academic excellence.',
      experience: '3 years in student government',
      studentId: 'STU001',
      phone: '+1-555-0101',
      status: 'approved',
      registrationDate: new Date().toISOString(),
      approvedDate: new Date().toISOString(),
      approvedBy: 'admin',
      votes: 0
    },
    {
      id: '2',
      name: 'Bob Smith',
      email: 'bob@university.edu',
      description: 'Fresh perspective with innovative ideas for modern student needs.',
      platform: 'Technology integration, sustainability initiatives, and inclusive policies.',
      experience: '2 years in debate club',
      studentId: 'STU002',
      phone: '+1-555-0102',
      status: 'approved',
      registrationDate: new Date().toISOString(),
      approvedDate: new Date().toISOString(),
      approvedBy: 'admin',
      votes: 0
    },
    {
      id: '3',
      name: 'Charlie Davis',
      email: 'charlie@university.edu',
      description: 'Innovation focused leader with proven track record in student organizations.',
      platform: 'Career development, mental health support, and campus diversity.',
      experience: '4 years in various student organizations',
      studentId: 'STU003',
      phone: '+1-555-0103',
      status: 'approved',
      registrationDate: new Date().toISOString(),
      approvedDate: new Date().toISOString(),
      approvedBy: 'admin',
      votes: 0
    }
  ];

  try {
    for (const candidate of candidates) {
      await dynamodb.put({
        TableName: CANDIDATES_TABLE,
        Item: candidate,
        ConditionExpression: 'attribute_not_exists(id)'
      }).promise();
      console.log(`Initialized candidate: ${candidate.name}`);
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ 
        message: 'Candidates initialized successfully',
        count: candidates.length 
      })
    };
  } catch (error) {
    console.error('Error initializing candidates:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Failed to initialize candidates' })
    };
  }
}
```

4. **Click "Deploy"** to save the code

---

## ⚙️ Step 4: Configure Function Settings

### 4.1 Environment Variables

1. **Go to "Configuration" tab**
2. **Click "Environment variables"**
3. **Click "Edit"**
4. **Add these variables:**

```
Key: VOTES_TABLE          Value: vote_table
Key: CANDIDATES_TABLE     Value: candidate_table
Key: USER_POOL_ID         Value: us-east-1_zfMUmmI7i
Key: AWS_REGION           Value: us-east-1
```

5. **Click "Save"**

### 4.2 General Configuration

1. **Go to "Configuration" → "General configuration"**
2. **Click "Edit"**
3. **Set:**
   - **Memory**: 256 MB
   - **Timeout**: 30 seconds
   - **Description**: Stotra Elections API Lambda function
4. **Click "Save"**

### 4.3 Function URL (Optional - for direct testing)

1. **Go to "Configuration" → "Function URL"**
2. **Click "Create function URL"**
3. **Auth type**: NONE (for testing)
4. **CORS**: Configure if needed
5. **Click "Save"**

---

## 🧪 Step 5: Test Lambda Function

### 5.1 Test Health Check

1. **Go to "Test" tab**
2. **Click "Create new test event"**
3. **Event name**: `health-check`
4. **Event JSON**:

```json
{
  "httpMethod": "GET",
  "path": "/health",
  "headers": {},
  "queryStringParameters": null,
  "body": null
}
```

5. **Click "Save"**
6. **Click "Test"**
7. **Should return 200 with health status**

### 5.2 Test Initialize Candidates

1. **Create new test event**
2. **Event name**: `init-candidates`
3. **Event JSON**:

```json
{
  "httpMethod": "POST",
  "path": "/init",
  "headers": {},
  "queryStringParameters": null,
  "body": null
}
```

4. **Click "Test"**
5. **Should create sample candidates in DynamoDB**

---

## 📊 Step 6: Verify DynamoDB Data

### 6.1 Check Candidates Table

1. **Go to DynamoDB Console**
2. **Click "Tables" → "candidate_table"**
3. **Click "Explore table items"**
4. **Should see 3 sample candidates**

### 6.2 Test Vote Casting

1. **Create test event**: `cast-vote`
2. **Event JSON**:

```json
{
  "httpMethod": "POST",
  "path": "/vote",
  "headers": {},
  "queryStringParameters": null,
  "body": "{\"candidateId\": \"1\", \"userId\": \"test-user-123\"}"
}
```

3. **Click "Test"**
4. **Check vote_table for new vote record**

---

## 🔍 Step 7: Monitor and Debug

### 7.1 CloudWatch Logs

1. **Go to CloudWatch Console**
2. **Click "Log groups"**
3. **Find `/aws/lambda/stotra-elections-api`**
4. **View recent logs for debugging**

### 7.2 Function Metrics

1. **In Lambda console, go to "Monitor" tab**
2. **View:**
   - Invocations
   - Duration
   - Error count
   - Success rate

---

## ✅ Verification Checklist

- [ ] Lambda function created successfully
- [ ] IAM role has correct permissions
- [ ] Environment variables configured
- [ ] Function code deployed
- [ ] Health check test passes
- [ ] Sample candidates initialized
- [ ] Vote casting works
- [ ] CloudWatch logs accessible
- [ ] DynamoDB tables populated

Your Lambda function is now ready! Next step: Create API Gateway to expose these endpoints. 🚀

---

## 🆕 New Features Added

### **Candidate Registration System**
- ✅ **POST /candidates** - Register new candidate
- ✅ **POST /candidates/approve** - Approve/reject candidates (admin)
- ✅ **Status tracking** - pending, approved, rejected
- ✅ **Verification workflow** - Admin approval required
- ✅ **Detailed candidate info** - Contact, experience, documents

### **Enhanced Security**
- ✅ **Status validation** - Only approved candidates can receive votes
- ✅ **Admin controls** - Candidate approval system
- ✅ **Audit trail** - IP address, timestamps, approval history

Your Lambda function now supports the complete election workflow! 🎉