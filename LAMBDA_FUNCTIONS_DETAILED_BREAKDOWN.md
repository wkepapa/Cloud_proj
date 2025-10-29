# ⚡ Lambda Functions - Detailed Breakdown

Complete explanation of each function in your Lambda code with purpose, inputs, outputs, and logic flow.

---

## 🎯 Main Handler Function

### `handler(event)` - The Entry Point

**Purpose**: Main Lambda function that receives all requests and routes them to appropriate functions.

**Input**: AWS Lambda event object
```javascript
{
  httpMethod: "GET|POST|PUT|DELETE",
  path: "/health|/candidates|/vote|etc",
  headers: { "Content-Type": "application/json" },
  body: "JSON string or null",
  queryStringParameters: { "userId": "123" },
  requestContext: { identity: { sourceIp: "192.168.1.1" } }
}
```

**Output**: HTTP response object
```javascript
{
  statusCode: 200|400|404|500,
  headers: { "Access-Control-Allow-Origin": "*" },
  body: "JSON string"
}
```

**Logic Flow**:
1. Log incoming request for debugging
2. Handle CORS preflight (OPTIONS) requests
3. Extract path and HTTP method
4. Route to appropriate function based on path
5. Return formatted response
6. Catch and handle any errors

---

## 🏥 Health Check Function

### `healthCheck()` - System Status

**Purpose**: Verify the Lambda function is running and can access required resources.

**Input**: None

**Output**: System health information
```javascript
{
  status: "healthy",
  timestamp: "2024-01-15T10:30:00.000Z",
  version: "1.0.0",
  tables: {
    votes: "vote_table",
    candidates: "candidate_table"
  }
}
```

**Use Cases**:
- API Gateway health checks
- Monitoring system verification
- Debugging connectivity issues
- Load balancer health probes

**Logic**:
1. Create health status object
2. Include current timestamp
3. Show configured table names
4. Return 200 status with info

---

## 👥 Candidate Management Functions

### `getCandidates()` - List Approved Candidates

**Purpose**: Retrieve all candidates that are approved for voting.

**Input**: None

**Output**: List of approved candidates
```javascript
{
  candidates: [
    {
      id: "1",
      name: "Alice Johnson",
      email: "alice@university.edu",
      description: "Experienced leader...",
      platform: "Focus on student welfare...",
      status: "approved"
    }
  ],
  count: 3
}
```

**Database Operation**: 
- `dynamodb.scan()` on candidate_table
- Filter results where `status === 'approved'`

**Logic Flow**:
1. Scan entire candidate_table
2. Filter only approved candidates
3. Count results
4. Return candidates array and count
5. Handle database errors gracefully

**Security**: Only shows approved candidates to public

---

### `registerCandidate(event)` - New Candidate Registration

**Purpose**: Allow students to register as candidates for election.

**Input**: Candidate registration data
```javascript
{
  name: "David Wilson",
  email: "david@university.edu", 
  description: "Passionate about student rights",
  platform: "Improve campus facilities",
  experience: "2 years in debate club",
  studentId: "STU004",
  phone: "+1-555-0104"
}
```

**Output**: Registration confirmation
```javascript
{
  message: "Candidate registration submitted successfully",
  candidateId: "candidate_1642248600000_abc123def",
  status: "pending"
}
```

**Database Operation**:
- `dynamodb.put()` new candidate record
- Status set to "pending" (requires approval)

**Logic Flow**:
1. Parse request body JSON
2. Validate required fields (name, email, description, platform, studentId)
3. Generate unique candidate ID with timestamp
4. Create candidate object with metadata
5. Save to DynamoDB
6. Return success response with candidate ID

**Validation Rules**:
- Required: name, email, description, platform, studentId
- Optional: experience, phone
- Auto-generated: id, registrationDate, status

---

### `approveCandidate(event)` - Admin Approval System

**Purpose**: Allow administrators to approve or reject candidate applications.

**Input**: Approval decision
```javascript
{
  candidateId: "candidate_1642248600000_abc123def",
  action: "approve", // or "reject"
  adminId: "admin-user-123"
}
```

**Output**: Approval result
```javascript
{
  message: "Candidate approved successfully",
  candidate: {
    id: "candidate_1642248600000_abc123def",
    name: "David Wilson",
    status: "approved",
    approvedDate: "2024-01-15T14:30:00.000Z",
    approvedBy: "admin-user-123"
  }
}
```

**Database Operation**:
- `dynamodb.update()` candidate record
- Update status, approvedDate, approvedBy fields

**Logic Flow**:
1. Parse request body
2. Validate required fields (candidateId, action, adminId)
3. Validate action is "approve" or "reject"
4. Update candidate record in DynamoDB
5. Return updated candidate data

**Security**: Should be restricted to admin users only

---

## 🗳️ Voting Functions

### `castVote(event)` - Cast a Vote

**Purpose**: Allow authenticated users to vote for approved candidates.

**Input**: Vote data
```javascript
{
  candidateId: "1",
  userId: "cognito-user-id-123"
}
```

**Output**: Vote confirmation
```javascript
{
  message: "Vote cast successfully",
  candidateName: "Alice Johnson"
}
```

**Database Operations**:
1. `dynamodb.get()` - Check if user already voted
2. `dynamodb.get()` - Verify candidate exists and is approved
3. `dynamodb.put()` - Store the vote

**Logic Flow**:
1. Parse vote data from request
2. Validate candidateId and userId are provided
3. **Check duplicate voting**: Query vote_table by userId
4. **Validate candidate**: 
   - Candidate exists in candidate_table
   - Candidate status is "approved"
5. **Store vote**: Create vote record with timestamp and IP
6. Return success with candidate name

**Security Features**:
- One vote per user (userId as primary key)
- Only approved candidates can receive votes
- IP address logging for audit trail
- Timestamp for vote tracking

**Vote Record Structure**:
```javascript
{
  userId: "cognito-user-id-123",      // Primary key
  candidateId: "1",
  candidateName: "Alice Johnson",
  timestamp: "2024-01-15T14:30:00.000Z",
  ipAddress: "192.168.1.100"
}
```

---

### `getVoteStatus(event)` - Check Vote Status

**Purpose**: Check if a specific user has already voted.

**Input**: User ID via query parameter
```
GET /vote-status?userId=cognito-user-id-123
```

**Output**: Vote status information
```javascript
{
  hasVoted: true,
  vote: {
    candidateId: "1",
    candidateName: "Alice Johnson", 
    timestamp: "2024-01-15T14:30:00.000Z"
  }
}
```

**Database Operation**:
- `dynamodb.get()` by userId from vote_table

**Logic Flow**:
1. Extract userId from query parameters
2. Validate userId is provided
3. Query vote_table for user's vote record
4. Return vote status and details (if voted)

**Use Cases**:
- Prevent duplicate voting in UI
- Show user their previous vote
- Voting confirmation display

---

## 📊 Results Function

### `getResults()` - Election Results

**Purpose**: Calculate and return real-time election results.

**Input**: None

**Output**: Complete election results
```javascript
{
  results: [
    {
      candidateId: "1",
      candidate: "Alice Johnson",
      description: "Experienced leader...",
      platform: "Focus on student welfare...",
      votes: 45,
      percentage: "45.0"
    },
    {
      candidateId: "2", 
      candidate: "Bob Smith",
      votes: 32,
      percentage: "32.0"
    }
  ],
  totalVotes: 100,
  timestamp: "2024-01-15T15:00:00.000Z"
}
```

**Database Operations**:
1. `dynamodb.scan()` - Get all votes from vote_table
2. `dynamodb.scan()` - Get all approved candidates

**Logic Flow**:
1. **Get all votes**: Scan vote_table completely
2. **Get approved candidates**: Scan candidate_table with status filter
3. **Count votes per candidate**: 
   ```javascript
   const voteCounts = {};
   votes.forEach(vote => {
     voteCounts[vote.candidateId] = (voteCounts[vote.candidateId] || 0) + 1;
   });
   ```
4. **Build results array**: Combine candidate info with vote counts
5. **Calculate percentages**: `(votes / totalVotes) * 100`
6. **Sort by votes**: Descending order (winner first)
7. Return complete results with timestamp

**Real-time Features**:
- Always current data (no caching)
- Includes candidates with 0 votes
- Sorted by vote count
- Percentage calculations

---

## 🌱 Initialization Function

### `initializeCandidates()` - Sample Data Setup

**Purpose**: Create sample candidates for testing and development.

**Input**: None

**Output**: Initialization confirmation
```javascript
{
  message: "Candidates initialized successfully",
  count: 3
}
```

**Sample Candidates Created**:
```javascript
[
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice@university.edu",
    description: "Experienced leader with a vision for positive change and student advocacy.",
    platform: "Focus on student welfare, campus improvements, and academic excellence.",
    experience: "3 years in student government",
    studentId: "STU001",
    phone: "+1-555-0101",
    status: "approved",
    registrationDate: "2024-01-15T10:00:00.000Z",
    approvedDate: "2024-01-15T10:00:00.000Z",
    approvedBy: "admin"
  },
  // ... 2 more candidates
]
```

**Database Operation**:
- `dynamodb.put()` with `ConditionExpression: 'attribute_not_exists(id)'`
- Prevents duplicate initialization

**Logic Flow**:
1. Define array of sample candidates
2. Loop through each candidate
3. Try to insert with condition (only if doesn't exist)
4. Handle duplicate errors gracefully
5. Count successful insertions
6. Return success message

**Use Cases**:
- Initial system setup
- Development testing
- Demo data creation
- System reset functionality

---

## 🔧 Utility Functions & Features

### CORS Headers
```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,PUT,DELETE',
  'Access-Control-Allow-Credentials': false
};
```

**Purpose**: Enable frontend applications to call the API from browsers.

### Error Handling Pattern
```javascript
try {
  // Function logic
  return successResponse;
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
```

**Features**:
- Consistent error response format
- Error logging to CloudWatch
- User-friendly error messages
- Proper HTTP status codes

### Input Validation Pattern
```javascript
if (!requiredField) {
  return {
    statusCode: 400,
    headers: corsHeaders,
    body: JSON.stringify({ error: 'Missing required field' })
  };
}
```

**Validation Types**:
- Required field checks
- Data type validation
- Business rule validation
- Security checks

---

## 🔄 Request/Response Flow Example

### Complete Vote Casting Flow:

1. **Frontend Request**:
   ```javascript
   POST /vote
   {
     "candidateId": "1",
     "userId": "cognito-user-123"
   }
   ```

2. **Lambda Processing**:
   ```javascript
   handler(event) → castVote(event) → {
     // Check if user already voted
     const existingVote = await dynamodb.get({
       TableName: 'vote_table',
       Key: { userId: 'cognito-user-123' }
     });
     
     // Verify candidate is approved
     const candidate = await dynamodb.get({
       TableName: 'candidate_table', 
       Key: { id: '1' }
     });
     
     // Store the vote
     await dynamodb.put({
       TableName: 'vote_table',
       Item: {
         userId: 'cognito-user-123',
         candidateId: '1',
         candidateName: 'Alice Johnson',
         timestamp: '2024-01-15T14:30:00.000Z'
       }
     });
   }
   ```

3. **Response**:
   ```javascript
   {
     statusCode: 200,
     body: {
       message: "Vote cast successfully",
       candidateName: "Alice Johnson"
     }
   }
   ```

---

## 📊 Database Schema Summary

### vote_table
- **Primary Key**: userId (String)
- **Attributes**: candidateId, candidateName, timestamp, ipAddress
- **Purpose**: Store individual votes, enforce one-vote-per-user

### candidate_table  
- **Primary Key**: id (String)
- **Attributes**: name, email, description, platform, status, registrationDate
- **Purpose**: Store candidate information and approval status

---

## 🎯 Function Summary

| Function | Purpose | Input | Database Operations |
|----------|---------|-------|-------------------|
| `handler` | Route requests | HTTP event | None |
| `healthCheck` | System status | None | None |
| `getCandidates` | List approved candidates | None | Scan candidates |
| `registerCandidate` | New registration | Candidate data | Put candidate |
| `approveCandidate` | Admin approval | Approval data | Update candidate |
| `castVote` | Vote for candidate | Vote data | Get vote, Get candidate, Put vote |
| `getVoteStatus` | Check if voted | User ID | Get vote |
| `getResults` | Election results | None | Scan votes, Scan candidates |
| `initializeCandidates` | Sample data | None | Put candidates |

Your Lambda function is a complete election system in one file! 🚀