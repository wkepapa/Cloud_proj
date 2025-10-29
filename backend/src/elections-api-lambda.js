// LAMBDA FUNCTION 1: Elections API
// Handles: Voting, Results, Vote Status
// Public-facing endpoints for the election process

import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();

// Environment variables
const VOTES_TABLE = process.env.VOTES_TABLE || 'vote_table';
const CANDIDATES_TABLE = process.env.CANDIDATES_TABLE || 'candidate_table';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,PUT,DELETE',
  'Access-Control-Allow-Credentials': false
};

// =============================================================================
// MAIN HANDLER - Elections API
// =============================================================================
export const handler = async (event) => {
  console.log('Elections API - Incoming request:', JSON.stringify(event, null, 2));

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

    console.log(`Elections API - Processing ${method} ${path}`);

    // Route requests to election-related functions
    switch (path) {
      case '/health':
        return await healthCheck();
      
      case '/candidates':
        if (method === 'GET') return await getCandidates();
        break;
      
      case '/vote':
        if (method === 'POST') return await castVote(event);
        break;
      
      case '/vote-status':
        return await getVoteStatus(event);
      
      case '/results':
        return await getResults();
      
      case '/init':
        if (method === 'POST') return await initializeCandidates();
        break;
      
      default:
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ 
            error: 'Endpoint not found in Elections API', 
            path: path,
            availableEndpoints: ['/health', '/candidates', '/vote', '/vote-status', '/results', '/init']
          })
        };
    }

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
    console.error('Elections API - Unhandled error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        service: 'Elections API'
      })
    };
  }
};

// =============================================================================
// HEALTH CHECK FUNCTION
// =============================================================================
async function healthCheck() {
  console.log('Elections API - Health check requested');
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      status: 'healthy',
      service: 'Elections API',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      endpoints: ['/candidates', '/vote', '/vote-status', '/results'],
      environment: {
        votesTable: VOTES_TABLE,
        candidatesTable: CANDIDATES_TABLE
      }
    })
  };
}

// =============================================================================
// GET CANDIDATES FUNCTION - Public endpoint
// =============================================================================
async function getCandidates() {
  console.log('Elections API - Getting approved candidates');
  
  try {
    const result = await dynamodb.scan({
      TableName: CANDIDATES_TABLE
    }).promise();

    // Filter only approved candidates for public voting
    const approvedCandidates = result.Items.filter(candidate => 
      candidate.status === 'approved'
    );

    console.log(`Elections API - Returning ${approvedCandidates.length} approved candidates`);

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
    console.error('Elections API - Error getting candidates:', error);
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
// CAST VOTE FUNCTION - Core voting functionality
// =============================================================================
async function castVote(event) {
  console.log('Elections API - Processing vote casting');
  
  try {
    const voteData = JSON.parse(event.body || '{}');
    const { candidateId, userId } = voteData;

    console.log('Elections API - Vote request:', { candidateId, userId });

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
    console.log('Elections API - Checking for duplicate vote...');
    const existingVote = await dynamodb.get({
      TableName: VOTES_TABLE,
      Key: { userId }
    }).promise();

    if (existingVote.Item) {
      console.log('Elections API - Duplicate vote attempt:', userId);
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
    console.log('Elections API - Verifying candidate...');
    const candidate = await dynamodb.get({
      TableName: CANDIDATES_TABLE,
      Key: { id: candidateId }
    }).promise();

    if (!candidate.Item) {
      console.log('Elections API - Candidate not found:', candidateId);
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
      console.log('Elections API - Candidate not approved:', candidateId, candidate.Item.status);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Candidate is not approved for voting',
          candidateStatus: candidate.Item.status
        })
      };
    }

    // CAST THE VOTE
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

    console.log('Elections API - Vote cast successfully:', { userId, candidateId, candidateName: candidate.Item.name });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Vote cast successfully',
        candidateName: candidate.Item.name,
        timestamp: voteRecord.timestamp,
        voteId: `${userId}_${candidateId}`
      })
    };

  } catch (error) {
    console.error('Elections API - Error casting vote:', error);
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
// GET VOTE STATUS FUNCTION
// =============================================================================
async function getVoteStatus(event) {
  console.log('Elections API - Checking vote status');
  
  try {
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

    console.log('Elections API - Checking vote status for user:', userId);

    const result = await dynamodb.get({
      TableName: VOTES_TABLE,
      Key: { userId }
    }).promise();

    const hasVoted = !!result.Item;
    console.log('Elections API - User vote status:', { userId, hasVoted });

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
    console.error('Elections API - Error getting vote status:', error);
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
// GET RESULTS FUNCTION - Real-time election results
// =============================================================================
async function getResults() {
  console.log('Elections API - Calculating election results');
  
  try {
    // Get all votes
    console.log('Elections API - Fetching all votes...');
    const votesResult = await dynamodb.scan({
      TableName: VOTES_TABLE
    }).promise();

    // Get all approved candidates
    console.log('Elections API - Fetching approved candidates...');
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

    console.log(`Elections API - Found ${votesResult.Items.length} votes and ${candidatesResult.Items.length} approved candidates`);

    // Count votes per candidate
    const voteCounts = {};
    votesResult.Items.forEach(vote => {
      const candidateId = vote.candidateId;
      voteCounts[candidateId] = (voteCounts[candidateId] || 0) + 1;
    });

    // Build results array
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

    // Sort by vote count (winner first)
    results.sort((a, b) => b.votes - a.votes);

    console.log('Elections API - Results calculated:', results.map(r => ({ name: r.candidate, votes: r.votes })));

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
          leaderVotes: results[0] ? results[0].votes : 0
        }
      })
    };

  } catch (error) {
    console.error('Elections API - Error getting results:', error);
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
// INITIALIZE CANDIDATES FUNCTION - For testing/setup
// =============================================================================
async function initializeCandidates() {
  console.log('Elections API - Initializing sample candidates');
  
  const sampleCandidates = [
    {
      id: '1',
      name: 'Manas Mungya',
      email: 'alice@university.edu',
      description: 'Experienced leader with a vision for positive change and student advocacy.',
      platform: 'Focus on student welfare, campus improvements, and academic excellence.',
      experience: '3 years in student government',
      studentId: 'STU001',
      phone: '+1-555-0101',
      status: 'approved',
      registrationDate: new Date().toISOString(),
      approvedDate: new Date().toISOString(),
      approvedBy: 'system-admin',
      votes: 0
    },
    {
      id: '2',
      name: 'Shivam Chaugule',
      email: 'bob@university.edu',
      description: 'Fresh perspective with innovative ideas for modern student needs.',
      platform: 'Technology integration, sustainability initiatives, and inclusive policies.',
      experience: '2 years in debate club',
      studentId: 'STU002',
      phone: '+1-555-0102',
      status: 'approved',
      registrationDate: new Date().toISOString(),
      approvedDate: new Date().toISOString(),
      approvedBy: 'system-admin',
      votes: 0
    },
    {
      id: '3',
      name: 'dhruv bajaj',
      email: 'charlie@university.edu',
      description: 'Innovation focused leader with proven track record in student organizations.',
      platform: 'Career development, mental health support, and campus diversity.',
      experience: '4 years in various student organizations',
      studentId: 'STU003',
      phone: '+1-555-0103',
      status: 'approved',
      registrationDate: new Date().toISOString(),
      approvedDate: new Date().toISOString(),
      approvedBy: 'system-admin',
      votes: 0
    }
  ];

  try {
    let successCount = 0;
    let skipCount = 0;

    for (const candidate of sampleCandidates) {
      try {
        await dynamodb.put({
          TableName: CANDIDATES_TABLE,
          Item: candidate,
          ConditionExpression: 'attribute_not_exists(id)'
        }).promise();
        
        console.log(`Elections API - ✅ Initialized candidate: ${candidate.name}`);
        successCount++;
        
      } catch (error) {
        if (error.code === 'ConditionalCheckFailedException') {
          console.log(`Elections API - ⏭️  Candidate already exists: ${candidate.name}`);
          skipCount++;
        } else {
          throw error;
        }
      }
    }

    console.log(`Elections API - Initialization complete: ${successCount} created, ${skipCount} skipped`);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ 
        message: 'Sample candidates initialization completed',
        results: {
          created: successCount,
          skipped: skipCount,
          total: sampleCandidates.length
        }
      })
    };

  } catch (error) {
    console.error('Elections API - Error initializing candidates:', error);
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