const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const VOTES_TABLE = process.env.VOTES_TABLE;
const CANDIDATES_TABLE = process.env.CANDIDATES_TABLE;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
};

exports.handler = async (event) => {
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
    const { httpMethod, path } = event;
    const userId = event.requestContext?.authorizer?.claims?.sub;
    
    if (!userId && path !== '/candidates' && path !== '/results') {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    switch (path) {
      case '/candidates':
        return await getCandidates();
      
      case '/vote':
        if (httpMethod === 'POST') {
          return await castVote(event, userId);
        }
        break;
      
      case '/vote-status':
        return await getVoteStatus(userId);
      
      case '/results':
        return await getResults();
      
      default:
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Not found' })
        };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

async function getCandidates() {
  const candidates = [
    { id: '1', name: 'Alice', description: 'Experienced leader with a vision for change' },
    { id: '2', name: 'Bob', description: 'Fresh perspective and innovative ideas' },
    { id: '3', name: 'Charlie', description: 'Innovation focused with proven track record' }
  ];
  
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ candidates })
  };
}

async function castVote(event, userId) {
  const { candidateId } = JSON.parse(event.body);
  
  if (!candidateId) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Candidate ID is required' })
    };
  }

  // Check if user has already voted
  try {
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
  } catch (error) {
    console.error('Error checking existing vote:', error);
  }

  // Cast the vote
  try {
    await dynamodb.put({
      TableName: VOTES_TABLE,
      Item: {
        userId,
        candidateId,
        timestamp: new Date().toISOString()
      }
    }).promise();

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Vote cast successfully' })
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

async function getVoteStatus(userId) {
  try {
    const result = await dynamodb.get({
      TableName: VOTES_TABLE,
      Key: { userId }
    }).promise();

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ hasVoted: !!result.Item })
    };
  } catch (error) {
    console.error('Error getting vote status:', error);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ hasVoted: false })
    };
  }
}

async function getResults() {
  try {
    const result = await dynamodb.scan({
      TableName: VOTES_TABLE
    }).promise();

    const voteCounts = {};
    result.Items.forEach(vote => {
      voteCounts[vote.candidateId] = (voteCounts[vote.candidateId] || 0) + 1;
    });

    const candidateNames = {
      '1': 'Alice',
      '2': 'Bob',
      '3': 'Charlie'
    };

    const results = Object.entries(voteCounts).map(([candidateId, votes]) => ({
      candidate: candidateNames[candidateId] || `Candidate ${candidateId}`,
      votes
    }));

    // Add candidates with 0 votes
    Object.entries(candidateNames).forEach(([id, name]) => {
      if (!voteCounts[id]) {
        results.push({ candidate: name, votes: 0 });
      }
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ results })
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