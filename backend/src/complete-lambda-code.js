// Complete Lambda Function Code for Stotra Elections Platform
// This single function handles all API endpoints for the election system

import AWS from 'aws-sdk';

// Initialize DynamoDB client
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Environment variables - these will be set in Lambda configuration
const VOTES_TABLE = process.env.VOTES_TABLE || 'vote_table';
const CANDIDATES_TABLE = process.env.CANDIDATES_TABLE || 'candidate_table';
const USER_POOL_ID = process.env.USER_POOL_ID || 'us-east-1_zfMUmmI7i';

// CORS headers - allows frontend to call this API from browsers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,PUT,DELETE',
  'Access-Control-Allow-Credentials': false
};

// =============================================================================
// MAIN HANDLER FUNCTION - Entry point for all requests
// =============================================================================
export const handler = async (event) => {
  // Log the incoming request for debugging
  console.log('Incoming request:', JSON.stringify(event, null, 2));

  // Handle CORS preflight requests (browser sends OPTIONS before actual request)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    // Extract path and HTTP method from the request
    const path = event.path || event.pathParameters?.proxy || '';
    const method = event.httpMethod;

    console.log(`Processing ${method} request to ${path}`);

    // Route requests to appropriate functions based on path and method
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
        // Return 404 for unknown paths
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ 
            error: 'Endpoint not found', 
            path: path,
            availableEndpoints: ['/health', '/candidates', '/vote', '/results', '/init']
          })
        };
    }

    // Return 405 for unsupported HTTP methods
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Method not allowed',
        method: method,
        path: path
      })
    };

  } catch (error) {
    // Global error handler - catches any unhandled errors
    console.error('Unhandled error in main handler:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

// =============================================================================
// HEALTH CHECK FUNCTION - Verify system is working
// =============================================================================
async function healthCheck() {
  console.log('Health check requested');
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: {
        votesTable: VOTES_TABLE,
        candidatesTable: CANDIDATES_TABLE,
        userPoolId: USER_POOL_ID,
        region: process.env.AWS_REGION || 'us-east-1'
      },
      message: 'Stotra Elections API is running successfully'
    })
  };
}

// =============================================================================
// GET CANDIDATES FUNCTION - List all approved candidates
// =============================================================================
async function getCandidates() {
  console.log('Getting candidates from database');
  
  try {
    // Scan the entire candidates table
    const result = await dynamodb.scan({
      TableName: CANDIDATES_TABLE
    }).promise();

    console.log(`Found ${result.Items.length} total candidates in database`);

    // Filter to show only approved candidates (security measure)
    const approvedCandidates = result.Items.filter(candidate => 
      candidate.status === 'approved'
    );

    console.log(`Returning ${approvedCandidates.length} approved candidates`);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        candidates: approvedCandidates,
        count: approvedCandidates.length,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Error getting candidates:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Failed to retrieve candidates',
        message: error.message
      })
    };
  }
}

// =============================================================================
// REGISTER CANDIDATE FUNCTION - Allow students to register as candidates
// =============================================================================
async function registerCandidate(event) {
  console.log('Processing candidate registration');
  
  try {
    // Parse the request body (contains candidate information)
    const candidateData = JSON.parse(event.body || '{}');
    console.log('Candidate data received:', candidateData);
    
    // Extract required and optional fields
    const {
      name,
      email,
      description,
      platform,
      experience,
      studentId,
      phone
    } = candidateData;

    // Validate required fields
    const requiredFields = { name, email, description, platform, studentId };
    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Missing required fields',
          missingFields: missingFields,
          requiredFields: ['name', 'email', 'description', 'platform', 'studentId']
        })
      };
    }

    // Generate unique candidate ID using timestamp and random string
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const candidateId = `candidate_${timestamp}_${randomId}`;

    console.log('Generated candidate ID:', candidateId);

    // Create complete candidate record
    const candidate = {
      id: candidateId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      description: description.trim(),
      platform: platform.trim(),
      experience: experience ? experience.trim() : '',
      studentId: studentId.trim(),
      phone: phone ? phone.trim() : '',
      status: 'pending', // Requires admin approval
      registrationDate: new Date().toISOString(),
      approvedDate: null,
      approvedBy: null,
      votes: 0,
      metadata: {
        ipAddress: event.requestContext?.identity?.sourceIp || 'unknown',
        userAgent: event.headers?.['User-Agent'] || 'unknown',
        registrationSource: 'web'
      }
    };

    // Save candidate to DynamoDB
    await dynamodb.put({
      TableName: CANDIDATES_TABLE,
      Item: candidate
    }).promise();

    console.log('Candidate registered successfully:', candidateId);

    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Candidate registration submitted successfully',
        candidateId: candidateId,
        status: 'pending',
        nextSteps: [
          'Your application is under review',
          'You will be notified via email about the approval status',
          'The review process typically takes 2-3 business days'
        ]
      })
    };

  } catch (error) {
    console.error('Error registering candidate:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Failed to register candidate',
        message: error.message
      })
    };
  }
}

// =============================================================================
// APPROVE CANDIDATE FUNCTION - Admin function to approve/reject candidates
// =============================================================================
async function approveCandidate(event) {
  console.log('Processing candidate approval/rejection');
  
  try {
    // Parse approval request
    const approvalData = JSON.parse(event.body || '{}');
    const { candidateId, action, adminId } = approvalData;

    console.log('Approval request:', { candidateId, action, adminId });

    // Validate required fields
    if (!candidateId || !action || !adminId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Missing required fields',
          required: ['candidateId', 'action', 'adminId']
        })
      };
    }

    // Validate action value
    if (!['approve', 'reject'].includes(action)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Invalid action',
          validActions: ['approve', 'reject']
        })
      };
    }

    // Update candidate status in database
    const updateParams = {
      TableName: CANDIDATES_TABLE,
      Key: { id: candidateId },
      UpdateExpression: 'SET #status = :status, approvedDate = :date, approvedBy = :admin',
      ExpressionAttributeNames: {
        '#status': 'status' // 'status' is a reserved word in DynamoDB
      },
      ExpressionAttributeValues: {
        ':status': action === 'approve' ? 'approved' : 'rejected',
        ':date': new Date().toISOString(),
        ':admin': adminId
      },
      ReturnValues: 'ALL_NEW' // Return the updated item
    };

    const result = await dynamodb.update(updateParams).promise();

    console.log(`Candidate ${candidateId} ${action}d by ${adminId}`);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: `Candidate ${action}d successfully`,
        candidate: result.Attributes,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Error approving candidate:', error);
    
    // Handle specific DynamoDB errors
    if (error.code === 'ResourceNotFoundException') {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Candidate not found',
          candidateId: JSON.parse(event.body || '{}').candidateId
        })
      };
    }

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Failed to approve candidate',
        message: error.message
      })
    };
  }
}

// =============================================================================
// CAST VOTE FUNCTION - Allow users to vote for candidates
// =============================================================================
async function castVote(event) {
  console.log('Processing vote casting');
  
  try {
    // Parse vote data
    const voteData = JSON.parse(event.body || '{}');
    const { candidateId, userId } = voteData;

    console.log('Vote request:', { candidateId, userId });

    // Validate required fields
    if (!candidateId || !userId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Missing required fields',
          required: ['candidateId', 'userId']
        })
      };
    }

    // SECURITY CHECK 1: Check if user has already voted
    console.log('Checking if user has already voted...');
    const existingVote = await dynamodb.get({
      TableName: VOTES_TABLE,
      Key: { userId }
    }).promise();

    if (existingVote.Item) {
      console.log('User has already voted:', userId);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'User has already voted',
          previousVote: {
            candidateId: existingVote.Item.candidateId,
            candidateName: existingVote.Item.candidateName,
            timestamp: existingVote.Item.timestamp
          }
        })
      };
    }

    // SECURITY CHECK 2: Verify candidate exists and is approved
    console.log('Verifying candidate exists and is approved...');
    const candidate = await dynamodb.get({
      TableName: CANDIDATES_TABLE,
      Key: { id: candidateId }
    }).promise();

    if (!candidate.Item) {
      console.log('Candidate not found:', candidateId);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Candidate not found',
          candidateId: candidateId
        })
      };
    }

    if (candidate.Item.status !== 'approved') {
      console.log('Candidate not approved for voting:', candidateId, candidate.Item.status);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Candidate is not approved for voting',
          candidateStatus: candidate.Item.status
        })
      };
    }

    // CAST THE VOTE: Store vote record in database
    const voteRecord = {
      userId: userId,
      candidateId: candidateId,
      candidateName: candidate.Item.name,
      timestamp: new Date().toISOString(),
      ipAddress: event.requestContext?.identity?.sourceIp || 'unknown',
      metadata: {
        userAgent: event.headers?.['User-Agent'] || 'unknown',
        voteSource: 'web'
      }
    };

    await dynamodb.put({
      TableName: VOTES_TABLE,
      Item: voteRecord
    }).promise();

    console.log('Vote cast successfully:', { userId, candidateId, candidateName: candidate.Item.name });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Vote cast successfully',
        candidateName: candidate.Item.name,
        timestamp: voteRecord.timestamp,
        voteId: `${userId}_${candidateId}` // For reference
      })
    };

  } catch (error) {
    console.error('Error casting vote:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Failed to cast vote',
        message: error.message
      })
    };
  }
}

// =============================================================================
// GET VOTE STATUS FUNCTION - Check if user has voted
// =============================================================================
async function getVoteStatus(event) {
  console.log('Checking vote status');
  
  try {
    // Get userId from query parameters
    const userId = event.queryStringParameters?.userId;
    
    if (!userId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'userId parameter is required',
          example: '/vote-status?userId=your-user-id'
        })
      };
    }

    console.log('Checking vote status for user:', userId);

    // Query vote table for this user
    const result = await dynamodb.get({
      TableName: VOTES_TABLE,
      Key: { userId }
    }).promise();

    const hasVoted = !!result.Item;
    console.log('User vote status:', { userId, hasVoted });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        hasVoted: hasVoted,
        vote: result.Item ? {
          candidateId: result.Item.candidateId,
          candidateName: result.Item.candidateName,
          timestamp: result.Item.timestamp
        } : null,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Error getting vote status:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Failed to get vote status',
        message: error.message
      })
    };
  }
}

// =============================================================================
// GET RESULTS FUNCTION - Calculate and return election results
// =============================================================================
async function getResults() {
  console.log('Calculating election results');
  
  try {
    // Get all votes from the database
    console.log('Fetching all votes...');
    const votesResult = await dynamodb.scan({
      TableName: VOTES_TABLE
    }).promise();

    // Get all approved candidates
    console.log('Fetching approved candidates...');
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

    console.log(`Found ${votesResult.Items.length} votes and ${candidatesResult.Items.length} approved candidates`);

    // Count votes per candidate
    const voteCounts = {};
    votesResult.Items.forEach(vote => {
      const candidateId = vote.candidateId;
      voteCounts[candidateId] = (voteCounts[candidateId] || 0) + 1;
    });

    console.log('Vote counts:', voteCounts);

    // Build results array with candidate information
    const results = candidatesResult.Items.map(candidate => {
      const votes = voteCounts[candidate.id] || 0;
      const percentage = votesResult.Items.length > 0
        ? ((votes / votesResult.Items.length) * 100).toFixed(1)
        : '0.0';

      return {
        candidateId: candidate.id,
        candidate: candidate.name,
        description: candidate.description,
        platform: candidate.platform,
        votes: votes,
        percentage: percentage
      };
    });

    // Sort results by vote count (descending - winner first)
    results.sort((a, b) => b.votes - a.votes);

    console.log('Final results calculated:', results.map(r => ({ name: r.candidate, votes: r.votes })));

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        results: results,
        totalVotes: votesResult.Items.length,
        totalCandidates: candidatesResult.Items.length,
        timestamp: new Date().toISOString(),
        summary: {
          leader: results[0] ? results[0].candidate : 'No votes yet',
          leaderVotes: results[0] ? results[0].votes : 0,
          participationRate: `${results.length} candidates, ${votesResult.Items.length} votes`
        }
      })
    };

  } catch (error) {
    console.error('Error getting results:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Failed to get election results',
        message: error.message
      })
    };
  }
}

// =============================================================================
// INITIALIZE CANDIDATES FUNCTION - Create sample data for testing
// =============================================================================
async function initializeCandidates() {
  console.log('Initializing sample candidates');
  
  // Define sample candidates with complete information
  const sampleCandidates = [
    {
      id: '1',
      name: 'Alice Johnson',
      email: 'alice@university.edu',
      description: 'Experienced leader with a vision for positive change and student advocacy. Alice has been actively involved in student government for three years and has a proven track record of implementing meaningful reforms.',
      platform: 'Focus on student welfare, campus improvements, and academic excellence. Key initiatives include expanding mental health services, improving campus dining options, and creating more study spaces.',
      experience: '3 years in student government, President of Debate Society, Volunteer coordinator for campus events',
      studentId: 'STU001',
      phone: '+1-555-0101',
      status: 'approved',
      registrationDate: new Date().toISOString(),
      approvedDate: new Date().toISOString(),
      approvedBy: 'system-admin',
      votes: 0,
      metadata: {
        ipAddress: '127.0.0.1',
        userAgent: 'System Initialization',
        registrationSource: 'system'
      }
    },
    {
      id: '2',
      name: 'Bob Smith',
      email: 'bob@university.edu',
      description: 'Fresh perspective with innovative ideas for modern student needs. Bob brings a tech-savvy approach to student governance and focuses on digital solutions for campus challenges.',
      platform: 'Technology integration, sustainability initiatives, and inclusive policies. Plans to digitize student services, implement green campus initiatives, and ensure equal representation for all student groups.',
      experience: '2 years in debate club, Tech committee member, Environmental club founder',
      studentId: 'STU002',
      phone: '+1-555-0102',
      status: 'approved',
      registrationDate: new Date().toISOString(),
      approvedDate: new Date().toISOString(),
      approvedBy: 'system-admin',
      votes: 0,
      metadata: {
        ipAddress: '127.0.0.1',
        userAgent: 'System Initialization',
        registrationSource: 'system'
      }
    },
    {
      id: '3',
      name: 'Charlie Davis',
      email: 'charlie@university.edu',
      description: 'Innovation focused leader with proven track record in student organizations. Charlie has successfully led multiple campus initiatives and has strong connections across different student communities.',
      platform: 'Career development, mental health support, and campus diversity. Committed to establishing career counseling programs, expanding mental health resources, and promoting cultural diversity on campus.',
      experience: '4 years in various student organizations, Former student body treasurer, Peer counselor, Cultural events coordinator',
      studentId: 'STU003',
      phone: '+1-555-0103',
      status: 'approved',
      registrationDate: new Date().toISOString(),
      approvedDate: new Date().toISOString(),
      approvedBy: 'system-admin',
      votes: 0,
      metadata: {
        ipAddress: '127.0.0.1',
        userAgent: 'System Initialization',
        registrationSource: 'system'
      }
    }
  ];

  try {
    let successCount = 0;
    let skipCount = 0;

    // Insert each candidate, but skip if already exists
    for (const candidate of sampleCandidates) {
      try {
        await dynamodb.put({
          TableName: CANDIDATES_TABLE,
          Item: candidate,
          ConditionExpression: 'attribute_not_exists(id)' // Only insert if doesn't exist
        }).promise();
        
        console.log(`✅ Initialized candidate: ${candidate.name}`);
        successCount++;
        
      } catch (error) {
        if (error.code === 'ConditionalCheckFailedException') {
          console.log(`⏭️  Candidate already exists: ${candidate.name}`);
          skipCount++;
        } else {
          throw error; // Re-throw unexpected errors
        }
      }
    }

    console.log(`Initialization complete: ${successCount} created, ${skipCount} skipped`);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ 
        message: 'Sample candidates initialization completed',
        results: {
          created: successCount,
          skipped: skipCount,
          total: sampleCandidates.length
        },
        candidates: sampleCandidates.map(c => ({ id: c.id, name: c.name, status: c.status }))
      })
    };

  } catch (error) {
    console.error('Error initializing candidates:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Failed to initialize sample candidates',
        message: error.message
      })
    };
  }
}

// =============================================================================
// EXPORT HANDLER FOR AWS LAMBDA
// =============================================================================
// The handler function is the entry point that AWS Lambda calls
// All other functions are internal helper functions