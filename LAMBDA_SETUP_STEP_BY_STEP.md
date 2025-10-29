# ⚡ Lambda Function Setup - Detailed Step-by-Step Guide

Complete walkthrough to create your Lambda function in AWS Console with exact configurations.

## 📋 Prerequisites Checklist

Before starting, ensure you have:
- ✅ AWS Account with admin access
- ✅ DynamoDB tables created: `candidate_table` and `vote_table`
- ✅ AWS Console access
- ✅ Your Lambda function code ready

---

## 🔐 Step 1: Create IAM Role (5 minutes)

### 1.1 Navigate to IAM

1. **Open AWS Console**: https://console.aws.amazon.com/
2. **Search for "IAM"** in the search bar
3. **Click "IAM"** to open the service

### 1.2 Create Role

1. **Click "Roles"** in the left sidebar
2. **Click "Create role"** button
3. **Select trusted entity**:
   - ☑ **AWS service**
   - ☑ **Lambda**
   - Click **"Next"**

### 1.3 Add Permissions

**Add these 2 policies:**

1. **First Policy - Basic Lambda Execution**:
   - Search: `AWSLambdaBasicExecutionRole`
   - ☑ Check the box next to it
   - This allows CloudWatch logging

2. **Second Policy - Create Custom DynamoDB Policy**:
   - Click **"Create policy"** (opens new tab)
   - Click **"JSON"** tab
   - **Delete existing content** and paste:

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

3. **Click "Next: Tags"** (skip tags)
4. **Click "Next: Review"**
5. **Policy details**:
   - **Name**: `StotraElectionsDynamoDBPolicy`
   - **Description**: `DynamoDB access for Stotra Elections`
6. **Click "Create policy"**
7. **Go back to the role creation tab**
8. **Click refresh button** 🔄
9. **Search**: `StotraElectionsDynamoDBPolicy`
10. **☑ Check the box** next to your custom policy

### 1.4 Finalize Role

1. **Click "Next"**
2. **Role details**:
   - **Role name**: `StotraElectionsLambdaRole`
   - **Description**: `Execution role for Stotra Elections Lambda function`
3. **Click "Create role"**

✅ **IAM Role Created Successfully!**

---

## ⚡ Step 2: Create Lambda Function (10 minutes)

### 2.1 Navigate to Lambda

1. **Search for "Lambda"** in AWS Console
2. **Click "Lambda"** to open the service
3. **Make sure you're in us-east-1 region** (top right)

### 2.2 Create Function

1. **Click "Create function"** button
2. **Select "Author from scratch"**
3. **Basic information**:
   - **Function name**: `stotra-elections-api`
   - **Runtime**: `Node.js 18.x`
   - **Architecture**: `x86_64`

### 2.3 Set Permissions

1. **Execution role**: ☑ **Use an existing role**
2. **Existing role**: Select `StotraElectionsLambdaRole`
3. **Click "Create function"**

✅ **Lambda Function Created!**

---

## 💻 Step 3: Add Function Code (5 minutes)

### 3.1 Access Code Editor

1. **Scroll down to "Code source" section**
2. **You'll see a file called `index.mjs`**
3. **Click on `index.mjs` to open it**

### 3.2 Replace Code

1. **Select all existing code** (Ctrl+A)
2. **Delete it**
3. **Copy and paste this complete code**:

```javascript
import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();

// Table names - these match your DynamoDB tables
const VOTES_TABLE = 'vote_table';
const CANDIDATES_TABLE = 'candidate_table';
const USER_POOL_ID = process.env.USER_POOL_ID || 'us-east-1_zfMUmmI7i';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,PUT,DELETE',
  'Access-Control-Allow-Credentials': false
};

// Main Lambda handler - this processes all requests
export const handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  // Handle CORS preflight requests
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

    // Route requests to appropriate functions
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

// Get all approved candidates
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

// Register new candidate
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
      phone
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
      status: 'pending', // pending, approved, rejected
      registrationDate: new Date().toISOString(),
      approvedDate: null,
      approvedBy: null,
      votes: 0
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
        status: 'pending'
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

4. **Click "Deploy"** button (important!)

✅ **Function Code Added!**

---

## ⚙️ Step 4: Configure Environment Variables (3 minutes)

### 4.1 Set Environment Variables

1. **Click "Configuration" tab**
2. **Click "Environment variables"** in left menu
3. **Click "Edit"** button
4. **Click "Add environment variable"** for each:

**Add these 4 variables:**

| Key | Value |
|-----|-------|
| `VOTES_TABLE` | `vote_table` |
| `CANDIDATES_TABLE` | `candidate_table` |
| `USER_POOL_ID` | `us-east-1_zfMUmmI7i` |
| `AWS_REGION` | `us-east-1` |

5. **Click "Save"**

### 4.2 Configure Function Settings

1. **Click "General configuration"** in left menu
2. **Click "Edit"**
3. **Set these values**:
   - **Memory**: `256 MB`
   - **Timeout**: `30 seconds`
   - **Description**: `Stotra Elections API Lambda function`
4. **Click "Save"**

✅ **Configuration Complete!**

---

## 🧪 Step 5: Test Your Function (5 minutes)

### 5.1 Test Health Check

1. **Click "Test" tab**
2. **Click "Create new test event"**
3. **Event template**: Keep default
4. **Event name**: `health-check`
5. **Replace the JSON with**:

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

6. **Click "Save"**
7. **Click "Test"**

**Expected Result**: Status 200 with health information

### 5.2 Test Initialize Candidates

1. **Create new test event**
2. **Event name**: `init-candidates`
3. **JSON**:

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

**Expected Result**: Status 200, "Candidates initialized successfully"

### 5.3 Test Get Candidates

1. **Create new test event**
2. **Event name**: `get-candidates`
3. **JSON**:

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

**Expected Result**: Status 200 with 3 candidates

---

## 🔍 Step 6: Verify in DynamoDB (2 minutes)

### 6.1 Check Candidate Data

1. **Go to DynamoDB Console**
2. **Click "Tables"**
3. **Click "candidate_table"**
4. **Click "Explore table items"**
5. **Should see 3 candidates** with status "approved"

### 6.2 Test Vote Casting

1. **Go back to Lambda**
2. **Create test event**: `cast-vote`
3. **JSON**:

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
5. **Check vote_table** in DynamoDB - should have 1 vote

---

## ✅ Success Checklist

Your Lambda function is working if:

- [ ] Health check returns status 200
- [ ] Initialize candidates creates 3 records
- [ ] Get candidates returns 3 approved candidates
- [ ] Vote casting works and stores in DynamoDB
- [ ] No errors in CloudWatch logs

---

## 🚨 Troubleshooting

### Common Issues:

**1. "Table not found"**
- Check environment variables are set correctly
- Verify table names: `candidate_table`, `vote_table`

**2. "Access denied"**
- Check IAM role has DynamoDB permissions
- Verify role is attached to Lambda function

**3. "Function timeout"**
- Check CloudWatch logs for detailed errors
- Increase timeout if needed

**4. "Syntax errors"**
- Make sure you copied the complete code
- Check for missing brackets or commas

---

## 🎯 What You've Built

Your Lambda function now handles:

- ✅ **GET /health** - Health check
- ✅ **GET /candidates** - List approved candidates  
- ✅ **POST /candidates** - Register new candidate
- ✅ **POST /candidates/approve** - Approve/reject candidates
- ✅ **POST /vote** - Cast vote
- ✅ **GET /vote-status** - Check vote status
- ✅ **GET /results** - Election results
- ✅ **POST /init** - Initialize sample data

**Next Step**: Set up API Gateway to expose these endpoints to your frontend! 🚀