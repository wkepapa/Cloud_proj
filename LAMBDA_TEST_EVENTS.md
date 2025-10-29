# 🧪 Lambda Function Test Events

Complete collection of test events to test every endpoint in your Lambda function.

## 📋 How to Use These Test Events

1. **Go to Lambda Console** → Your function → **Test** tab
2. **Click "Create new test event"**
3. **Copy and paste** the JSON for each test
4. **Give it a name** (e.g., "health-check")
5. **Click "Test"** to run

---

## 🏥 Test 1: Health Check

**Test Name**: `health-check`
**Purpose**: Verify Lambda function is working
**Expected**: Status 200 with system info

```json
{
  "httpMethod": "GET",
  "path": "/health",
  "headers": {
    "Content-Type": "application/json"
  },
  "queryStringParameters": null,
  "body": null,
  "requestContext": {
    "identity": {
      "sourceIp": "127.0.0.1"
    }
  }
}
```

**Expected Response**:
```json
{
  "statusCode": 200,
  "body": "{\"status\":\"healthy\",\"timestamp\":\"2024-01-15T10:30:00.000Z\",\"version\":\"1.0.0\"}"
}
```

---

## 🌱 Test 2: Initialize Sample Candidates

**Test Name**: `init-candidates`
**Purpose**: Create 3 sample candidates for testing
**Expected**: Status 200, creates candidates in DynamoDB

```json
{
  "httpMethod": "POST",
  "path": "/init",
  "headers": {
    "Content-Type": "application/json"
  },
  "queryStringParameters": null,
  "body": null,
  "requestContext": {
    "identity": {
      "sourceIp": "127.0.0.1"
    }
  }
}
```

**Expected Response**:
```json
{
  "statusCode": 200,
  "body": "{\"message\":\"Sample candidates initialization completed\",\"results\":{\"created\":3,\"skipped\":0,\"total\":3}}"
}
```

---

## 👥 Test 3: Get Candidates

**Test Name**: `get-candidates`
**Purpose**: Retrieve all approved candidates
**Expected**: Status 200 with candidates array

```json
{
  "httpMethod": "GET",
  "path": "/candidates",
  "headers": {
    "Content-Type": "application/json"
  },
  "queryStringParameters": null,
  "body": null,
  "requestContext": {
    "identity": {
      "sourceIp": "127.0.0.1"
    }
  }
}
```

**Expected Response**:
```json
{
  "statusCode": 200,
  "body": "{\"candidates\":[{\"id\":\"1\",\"name\":\"Alice Johnson\",\"status\":\"approved\"}],\"count\":3}"
}
```

---

## 📝 Test 4: Register New Candidate

**Test Name**: `register-candidate`
**Purpose**: Test candidate registration system
**Expected**: Status 201, creates pending candidate

```json
{
  "httpMethod": "POST",
  "path": "/candidates",
  "headers": {
    "Content-Type": "application/json"
  },
  "queryStringParameters": null,
  "body": "{\"name\": \"David Wilson\", \"email\": \"david@university.edu\", \"description\": \"Passionate about student rights and campus improvements. I believe in transparent governance and student-centered policies.\", \"platform\": \"My platform focuses on improving campus facilities, expanding mental health services, and creating more opportunities for student engagement in university decisions.\", \"experience\": \"2 years in debate club, volunteer coordinator for campus events\", \"studentId\": \"STU004\", \"phone\": \"+1-555-0104\"}",
  "requestContext": {
    "identity": {
      "sourceIp": "192.168.1.100"
    }
  }
}
```

**Expected Response**:
```json
{
  "statusCode": 201,
  "body": "{\"message\":\"Candidate registration submitted successfully\",\"candidateId\":\"candidate_1642248600000_abc123def\",\"status\":\"pending\"}"
}
```

---

## ✅ Test 5: Approve Candidate (Admin Function)

**Test Name**: `approve-candidate`
**Purpose**: Test admin approval system
**Expected**: Status 200, updates candidate status

```json
{
  "httpMethod": "POST",
  "path": "/candidates/approve",
  "headers": {
    "Content-Type": "application/json"
  },
  "queryStringParameters": null,
  "body": "{\"candidateId\": \"candidate_1642248600000_abc123def\", \"action\": \"approve\", \"adminId\": \"admin-user-123\"}",
  "requestContext": {
    "identity": {
      "sourceIp": "192.168.1.101"
    }
  }
}
```

**Expected Response**:
```json
{
  "statusCode": 200,
  "body": "{\"message\":\"Candidate approved successfully\",\"candidate\":{\"id\":\"candidate_1642248600000_abc123def\",\"status\":\"approved\"}}"
}
```

---

## 🗳️ Test 6: Cast Vote

**Test Name**: `cast-vote`
**Purpose**: Test voting functionality
**Expected**: Status 200, creates vote record

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
      "sourceIp": "192.168.1.102"
    }
  }
}
```

**Expected Response**:
```json
{
  "statusCode": 200,
  "body": "{\"message\":\"Vote cast successfully\",\"candidateName\":\"Alice Johnson\",\"timestamp\":\"2024-01-15T14:30:00.000Z\"}"
}
```

---

## 🔍 Test 7: Check Vote Status

**Test Name**: `check-vote-status`
**Purpose**: Verify if user has voted
**Expected**: Status 200 with vote information

```json
{
  "httpMethod": "GET",
  "path": "/vote-status",
  "headers": {
    "Content-Type": "application/json"
  },
  "queryStringParameters": {
    "userId": "test-user-123"
  },
  "body": null,
  "requestContext": {
    "identity": {
      "sourceIp": "192.168.1.102"
    }
  }
}
```

**Expected Response**:
```json
{
  "statusCode": 200,
  "body": "{\"hasVoted\":true,\"vote\":{\"candidateId\":\"1\",\"candidateName\":\"Alice Johnson\",\"timestamp\":\"2024-01-15T14:30:00.000Z\"}}"
}
```

---

## 📊 Test 8: Get Election Results

**Test Name**: `get-results`
**Purpose**: Test results calculation
**Expected**: Status 200 with complete results

```json
{
  "httpMethod": "GET",
  "path": "/results",
  "headers": {
    "Content-Type": "application/json"
  },
  "queryStringParameters": null,
  "body": null,
  "requestContext": {
    "identity": {
      "sourceIp": "127.0.0.1"
    }
  }
}
```

**Expected Response**:
```json
{
  "statusCode": 200,
  "body": "{\"results\":[{\"candidateId\":\"1\",\"candidate\":\"Alice Johnson\",\"votes\":1,\"percentage\":\"100.0\"}],\"totalVotes\":1,\"timestamp\":\"2024-01-15T15:00:00.000Z\"}"
}
```

---

## 🚫 Test 9: Duplicate Vote (Should Fail)

**Test Name**: `duplicate-vote`
**Purpose**: Test duplicate vote prevention
**Expected**: Status 400 with error message

```json
{
  "httpMethod": "POST",
  "path": "/vote",
  "headers": {
    "Content-Type": "application/json"
  },
  "queryStringParameters": null,
  "body": "{\"candidateId\": \"2\", \"userId\": \"test-user-123\"}",
  "requestContext": {
    "identity": {
      "sourceIp": "192.168.1.102"
    }
  }
}
```

**Expected Response**:
```json
{
  "statusCode": 400,
  "body": "{\"error\":\"User has already voted\",\"previousVote\":{\"candidateId\":\"1\",\"candidateName\":\"Alice Johnson\"}}"
}
```

---

## ❌ Test 10: Invalid Endpoint (404 Test)

**Test Name**: `invalid-endpoint`
**Purpose**: Test 404 handling
**Expected**: Status 404 with error message

```json
{
  "httpMethod": "GET",
  "path": "/invalid-path",
  "headers": {
    "Content-Type": "application/json"
  },
  "queryStringParameters": null,
  "body": null,
  "requestContext": {
    "identity": {
      "sourceIp": "127.0.0.1"
    }
  }
}
```

**Expected Response**:
```json
{
  "statusCode": 404,
  "body": "{\"error\":\"Endpoint not found\",\"path\":\"/invalid-path\",\"availableEndpoints\":[\"/health\",\"/candidates\",\"/vote\",\"/results\",\"/init\"]}"
}
```

---

## 🔧 Test 11: CORS Preflight (OPTIONS)

**Test Name**: `cors-preflight`
**Purpose**: Test CORS handling
**Expected**: Status 200 with CORS headers

```json
{
  "httpMethod": "OPTIONS",
  "path": "/candidates",
  "headers": {
    "Origin": "http://localhost:3000",
    "Access-Control-Request-Method": "GET",
    "Access-Control-Request-Headers": "Content-Type"
  },
  "queryStringParameters": null,
  "body": null,
  "requestContext": {
    "identity": {
      "sourceIp": "127.0.0.1"
    }
  }
}
```

**Expected Response**:
```json
{
  "statusCode": 200,
  "headers": {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS,PUT,DELETE"
  },
  "body": ""
}
```

---

## 📋 Testing Sequence

**Run tests in this order for best results:**

1. **health-check** - Verify function works
2. **init-candidates** - Create sample data
3. **get-candidates** - Verify candidates created
4. **register-candidate** - Test registration
5. **approve-candidate** - Test approval (use candidateId from step 4)
6. **cast-vote** - Test voting
7. **check-vote-status** - Verify vote recorded
8. **get-results** - Check results calculation
9. **duplicate-vote** - Test security (should fail)
10. **invalid-endpoint** - Test error handling
11. **cors-preflight** - Test CORS support

---

## 🔍 Verification Steps

After each test:

1. **Check Response Status** - Should match expected
2. **Check Response Body** - Should contain expected data
3. **Check DynamoDB Tables**:
   - Go to DynamoDB Console
   - Check `candidate_table` and `vote_table`
   - Verify data was created/updated
4. **Check CloudWatch Logs**:
   - Go to CloudWatch → Log Groups
   - Find `/aws/lambda/stotra-elections-api`
   - Check for any errors

---

## 🚨 Troubleshooting

**If tests fail:**

1. **Check Environment Variables** are set correctly
2. **Verify IAM Role** has DynamoDB permissions
3. **Check Table Names** match exactly (`candidate_table`, `vote_table`)
4. **Review CloudWatch Logs** for detailed error messages
5. **Verify Code** was deployed correctly

**Common Issues:**
- Table not found → Check environment variables
- Access denied → Check IAM permissions
- Syntax errors → Check code deployment
- Timeout → Increase Lambda timeout setting

Your Lambda function should pass all these tests! 🚀