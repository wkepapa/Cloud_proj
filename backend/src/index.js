import AWS from 'aws-sdk';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-client';

const dynamodb = new AWS.DynamoDB.DocumentClient();

const VOTES_TABLE = process.env.VOTES_TABLE;
const CANDIDATES_TABLE = process.env.CANDIDATES_TABLE;
const USER_POOL_ID = process.env.USER_POOL_ID;
const REGION = process.env.AWS_REGION || 'us-east-1';

// JWKS client for token verification
const client = jwksClient({
    jwksUri: `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}/.well-known/jwks.json`
});

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,PUT,DELETE',
    'Access-Control-Allow-Credentials': false
};

// Helper function to get signing key
function getKey(header, callback) {
    client.getSigningKey(header.kid, (err, key) => {
        const signingKey = key.publicKey || key.rsaPublicKey;
        callback(null, signingKey);
    });
}

// Verify JWT token
async function verifyToken(token) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, getKey, {
            audience: process.env.USER_POOL_CLIENT_ID,
            issuer: `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`,
            algorithms: ['RS256']
        }, (err, decoded) => {
            if (err) {
                reject(err);
            } else {
                resolve(decoded);
            }
        });
    });
}

// Extract user ID from token
async function getUserFromToken(event) {
    try {
        const authHeader = event.headers.Authorization || event.headers.authorization;
        if (!authHeader) {
            return null;
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = await verifyToken(token);
        return decoded.sub; // User ID from Cognito
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
}

// Initialize candidates data
async function initializeCandidates() {
    const candidates = [
        {
            id: '1',
            name: 'Alice Johnson',
            description: 'Experienced leader with a vision for positive change and student advocacy.',
            platform: 'Focus on student welfare, campus improvements, and academic excellence.',
            image: 'https://via.placeholder.com/150/4F46E5/FFFFFF?text=AJ'
        },
        {
            id: '2',
            name: 'Bob Smith',
            description: 'Fresh perspective with innovative ideas for modern student needs.',
            platform: 'Technology integration, sustainability initiatives, and inclusive policies.',
            image: 'https://via.placeholder.com/150/059669/FFFFFF?text=BS'
        },
        {
            id: '3',
            name: 'Charlie Davis',
            description: 'Innovation focused leader with proven track record in student organizations.',
            platform: 'Career development, mental health support, and campus diversity.',
            image: 'https://via.placeholder.com/150/DC2626/FFFFFF?text=CD'
        }
    ];

    for (const candidate of candidates) {
        try {
            await dynamodb.put({
                TableName: CANDIDATES_TABLE,
                Item: candidate,
                ConditionExpression: 'attribute_not_exists(id)'
            }).promise();
            console.log(`Initialized candidate: ${candidate.name}`);
        } catch (error) {
            if (error.code !== 'ConditionalCheckFailedException') {
                console.error(`Error initializing candidate ${candidate.name}:`, error);
            }
        }
    }
}

// API Routes
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

        // Initialize candidates on first deployment
        if (path === '/init' && method === 'POST') {
            await initializeCandidates();
            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Candidates initialized successfully' })
            };
        }

        // Get candidates (public endpoint)
        if (path === '/candidates' || path === '/api/candidates') {
            return await getCandidates();
        }

        // Get election results (public endpoint)
        if (path === '/results' || path === '/api/results') {
            return await getResults();
        }

        // Protected endpoints require authentication
        const userId = await getUserFromToken(event);

        if (path === '/vote' || path === '/api/vote') {
            if (method === 'POST') {
                if (!userId) {
                    return {
                        statusCode: 401,
                        headers: corsHeaders,
                        body: JSON.stringify({ error: 'Authentication required' })
                    };
                }
                return await castVote(event, userId);
            }
        }

        if (path === '/vote-status' || path === '/api/vote-status') {
            if (!userId) {
                return {
                    statusCode: 401,
                    headers: corsHeaders,
                    body: JSON.stringify({ error: 'Authentication required' })
                };
            }
            return await getVoteStatus(userId);
        }

        // Health check
        if (path === '/health' || path === '/api/health') {
            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    version: '1.0.0'
                })
            };
        }

        return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Not found' })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

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

// Cast a vote
async function castVote(event, userId) {
    try {
        const { candidateId } = JSON.parse(event.body);

        if (!candidateId) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Candidate ID is required' })
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
async function getVoteStatus(userId) {
    try {
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