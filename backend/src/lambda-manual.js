// Manual Lambda Function Code for AWS Console
// Copy this entire code into the Lambda function code editor

import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();

// Environment variables (set these in Lambda console)
const VOTES_TABLE = process.env.VOTES_TABLE || 'stotra-elections-votes';
const CANDIDATES_TABLE = process.env.CANDIDATES_TABLE || 'stotra-elections-candidates';
const USER_POOL_ID = process.env.USER_POOL_ID || 'us-east-1_zfMUmmI7i';
const REGION = process.env.AWS_REGION || 'us-east-1';

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
        return await getCandidates();
      
      case '/results':
        return await getResults();
      
      case '/init':
        if (method === 'POST') {
          return await initializeCandidates();
        }
        break;
      
      case '/vote':
        if (method === 'POST') {
          return await castVote(event);
        }
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

// Initialize candidates data
async function initializeCandidates() {
  const candidates = [
    {
      id: '1',
      name: 'Alice Johnson',
      description: 'Experienced leader with a vision for positive change and student advocacy.',
      platform: 'Focus on student welfare, campus improvements, and academic excellence.'
    },
    {
      id: '2',
      name: 'Bob Smith', 
      description: 'Fresh perspective with innovative ideas for modern student needs.',
      platform: 'Technology integration, sustainability initiatives, and inclusive policies.'
    },
    {
      id: '3',
      name: 'Charlie Davis',
      description: 'Innovation focused leader with proven track record in student organizations.',
      platform: 'Career development, mental health support, and campus diversity.'
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

// Get all candidates
async function getCandidates() {
  try {
    const result = await dynamodb.scan({
      TableName: CANDIDATES_TABLE
    }).promise();

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        candidates: result.Items || [],
        count: result.Items?.length || 0
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

// Cast a vote (simplified - no JWT verification for manual setup)
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

    // Verify candidate exists
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

    // Cast the vote
    await dynamodb.put({
      TableName: VOTES_TABLE,
      Item: {
        userId,
        candidateId,
        candidateName: candidate.Item.name,
        timestamp: new Date().toISOString()
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

// Check if user has voted (simplified)
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

    // Get all candidates
    const candidatesResult = await dynamodb.scan({
      TableName: CANDIDATES_TABLE
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