// LAMBDA FUNCTION 2: Candidate Management API
// Handles: Candidate Registration, Admin Approval, Candidate Management
// Admin-focused endpoints for managing candidates

import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();

// Environment variables
const CANDIDATES_TABLE = process.env.CANDIDATES_TABLE || 'candidate_table';
const VOTES_TABLE = process.env.VOTES_TABLE || 'vote_table';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,PUT,DELETE',
  'Access-Control-Allow-Credentials': 'false',
  'Access-Control-Max-Age': '86400'
};

// =============================================================================
// MAIN HANDLER - Candidate Management API
// =============================================================================
export const handler = async (event) => {
  console.log('Candidate Management API - Incoming request:', JSON.stringify(event, null, 2));

  // Handle CORS preflight - check multiple possible method fields
  const method = event.httpMethod || event.requestContext?.http?.method || event.requestContext?.httpMethod;

  if (method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const path = event.path || event.pathParameters?.proxy || event.rawPath || '';
    const method = event.httpMethod || event.requestContext?.http?.method || event.requestContext?.httpMethod;

    console.log('Path debugging:', {
      eventPath: event.path,
      proxy: event.pathParameters?.proxy,
      rawPath: event.rawPath,
      finalPath: path
    });

    console.log(`Candidate Management API - Processing ${method} ${path}`);

    // Normalize path (add leading slash if missing)
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    // Route requests to candidate management functions
    switch (normalizedPath) {
      case '':
      case '/':
      case '/health':
        return await healthCheck();

      case '/candidates':
        if (method === 'GET') {
          // Check if this is for elections (only approved candidates) or admin (all candidates)
          const isElectionsRequest = event.queryStringParameters?.approved === 'true';
          return isElectionsRequest ? await getApprovedCandidates() : await getAllCandidates();
        }
        if (method === 'POST') return await registerCandidate(event);
        break;

      case '/candidates/pending':
        if (method === 'GET') return await getPendingCandidates();
        break;

      case '/candidates/approve':
        if (method === 'POST') return await approveCandidate(event);
        break;

      case '/candidates/reject':
        if (method === 'POST') return await rejectCandidate(event);
        break;

      case '/admin/stats':
        if (method === 'GET') return await getAdminStats();
        break;

      // Temporary Elections API endpoints
      case '/vote':
        if (method === 'POST') return await castVote(event);
        break;

      case '/vote-status':
        if (method === 'GET') return await getVoteStatus(event);
        break;

      case '/results':
        if (method === 'GET') return await getResults();
        break;

      case '/init':
        if (method === 'POST') return await initializeCandidates();
        break;

      default:
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Endpoint not found in Candidate Management API',
            path: path,
            availableEndpoints: ['/health', '/candidates', '/candidates/pending', '/candidates/approve', '/candidates/reject', '/admin/stats']
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
    console.error('Candidate Management API - Unhandled error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        service: 'Candidate Management API'
      })
    };
  }
};

// =============================================================================
// HEALTH CHECK FUNCTION
// =============================================================================
async function healthCheck() {
  console.log('Candidate Management API - Health check requested');

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      status: 'healthy',
      service: 'Candidate Management API',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      endpoints: ['/candidates', '/candidates/pending', '/candidates/approve', '/admin/stats'],
      environment: {
        candidatesTable: CANDIDATES_TABLE
      }
    })
  };
}

// =============================================================================
// GET ALL CANDIDATES FUNCTION - Admin view (all statuses)
// =============================================================================
async function getAllCandidates() {
  console.log('Candidate Management API - Getting all candidates (admin view)');

  try {
    const result = await dynamodb.scan({
      TableName: CANDIDATES_TABLE
    }).promise();

    // Group candidates by status
    const candidatesByStatus = {
      approved: [],
      pending: [],
      rejected: []
    };

    result.Items.forEach(candidate => {
      const status = candidate.status || 'pending';
      if (candidatesByStatus[status]) {
        candidatesByStatus[status].push(candidate);
      }
    });

    console.log(`Candidate Management API - Found ${result.Items.length} total candidates`);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        candidates: result.Items,
        candidatesByStatus: candidatesByStatus,
        totalCount: result.Items.length,
        statusCounts: {
          approved: candidatesByStatus.approved.length,
          pending: candidatesByStatus.pending.length,
          rejected: candidatesByStatus.rejected.length
        },
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Candidate Management API - Error getting all candidates:', error);
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
// GET PENDING CANDIDATES FUNCTION - For admin approval queue
// =============================================================================
async function getPendingCandidates() {
  console.log('Candidate Management API - Getting pending candidates');

  try {
    const result = await dynamodb.scan({
      TableName: CANDIDATES_TABLE,
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'pending'
      }
    }).promise();

    // Sort by registration date (oldest first)
    const pendingCandidates = result.Items.sort((a, b) =>
      new Date(a.registrationDate) - new Date(b.registrationDate)
    );

    console.log(`Candidate Management API - Found ${pendingCandidates.length} pending candidates`);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        pendingCandidates: pendingCandidates,
        count: pendingCandidates.length,
        timestamp: new Date().toISOString(),
        message: pendingCandidates.length === 0 ? 'No candidates pending approval' : `${pendingCandidates.length} candidates awaiting review`
      })
    };

  } catch (error) {
    console.error('Candidate Management API - Error getting pending candidates:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Failed to retrieve pending candidates',
        message: error.message
      })
    };
  }
}

// =============================================================================
// REGISTER CANDIDATE FUNCTION - Student registration
// =============================================================================
async function registerCandidate(event) {
  console.log('Candidate Management API - Processing candidate registration');

  try {
    const candidateData = JSON.parse(event.body || '{}');
    console.log('Candidate Management API - Registration data received:', candidateData);

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
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      console.log('Candidate Management API - Missing required fields:', missingFields);
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

    // Check for duplicate email or student ID
    const existingCandidates = await dynamodb.scan({
      TableName: CANDIDATES_TABLE,
      FilterExpression: 'email = :email OR studentId = :studentId',
      ExpressionAttributeValues: {
        ':email': email.toLowerCase().trim(),
        ':studentId': studentId.trim()
      }
    }).promise();

    if (existingCandidates.Items.length > 0) {
      const duplicateField = existingCandidates.Items[0].email === email.toLowerCase().trim() ? 'email' : 'studentId';
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: `A candidate with this ${duplicateField} already exists`,
          duplicateField: duplicateField
        })
      };
    }

    // Generate unique candidate ID
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const candidateId = `candidate_${timestamp}_${randomId}`;

    console.log('Candidate Management API - Generated candidate ID:', candidateId);

    // Create candidate record
    const candidate = {
      id: candidateId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      description: description.trim(),
      platform: platform.trim(),
      experience: experience ? experience.trim() : '',
      studentId: studentId.trim(),
      phone: phone ? phone.trim() : '',
      status: 'pending',
      registrationDate: new Date().toISOString(),
      approvedDate: null,
      approvedBy: null,
      rejectedDate: null,
      rejectedBy: null,
      rejectionReason: null,
      votes: 0,
      metadata: {
        ipAddress: event.requestContext?.identity?.sourceIp || 'unknown',
        userAgent: event.headers?.['User-Agent'] || 'unknown',
        registrationSource: 'web'
      }
    };

    // Save to DynamoDB
    await dynamodb.put({
      TableName: CANDIDATES_TABLE,
      Item: candidate
    }).promise();

    console.log('Candidate Management API - Candidate registered successfully:', candidateId);

    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Candidate registration submitted successfully',
        candidateId: candidateId,
        status: 'pending',
        nextSteps: [
          'Your application is under review by the election committee',
          'You will be notified via email about the approval status',
          'The review process typically takes 2-3 business days',
          'You can check your application status by contacting the election committee'
        ],
        estimatedReviewTime: '2-3 business days'
      })
    };

  } catch (error) {
    console.error('Candidate Management API - Error registering candidate:', error);
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
// APPROVE CANDIDATE FUNCTION - Admin approval
// =============================================================================
async function approveCandidate(event) {
  console.log('Candidate Management API - Processing candidate approval');

  try {
    const approvalData = JSON.parse(event.body || '{}');
    const { candidateId, adminId, notes } = approvalData;

    console.log('Candidate Management API - Approval request:', { candidateId, adminId });

    // Validate required fields
    if (!candidateId || !adminId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Missing required fields',
          required: ['candidateId', 'adminId']
        })
      };
    }

    // Update candidate status
    const updateParams = {
      TableName: CANDIDATES_TABLE,
      Key: { id: candidateId },
      UpdateExpression: 'SET #status = :status, approvedDate = :date, approvedBy = :admin, approvalNotes = :notes',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'approved',
        ':date': new Date().toISOString(),
        ':admin': adminId,
        ':notes': notes || 'Approved by admin'
      },
      ReturnValues: 'ALL_NEW'
    };

    const result = await dynamodb.update(updateParams).promise();

    console.log(`Candidate Management API - Candidate ${candidateId} approved by ${adminId}`);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Candidate approved successfully',
        candidate: result.Attributes,
        timestamp: new Date().toISOString(),
        action: 'approved'
      })
    };

  } catch (error) {
    console.error('Candidate Management API - Error approving candidate:', error);

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
// REJECT CANDIDATE FUNCTION - Admin rejection
// =============================================================================
async function rejectCandidate(event) {
  console.log('Candidate Management API - Processing candidate rejection');

  try {
    const rejectionData = JSON.parse(event.body || '{}');
    const { candidateId, adminId, reason } = rejectionData;

    console.log('Candidate Management API - Rejection request:', { candidateId, adminId, reason });

    // Validate required fields
    if (!candidateId || !adminId || !reason) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Missing required fields',
          required: ['candidateId', 'adminId', 'reason']
        })
      };
    }

    // Update candidate status
    const updateParams = {
      TableName: CANDIDATES_TABLE,
      Key: { id: candidateId },
      UpdateExpression: 'SET #status = :status, rejectedDate = :date, rejectedBy = :admin, rejectionReason = :reason',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'rejected',
        ':date': new Date().toISOString(),
        ':admin': adminId,
        ':reason': reason
      },
      ReturnValues: 'ALL_NEW'
    };

    const result = await dynamodb.update(updateParams).promise();

    console.log(`Candidate Management API - Candidate ${candidateId} rejected by ${adminId}`);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Candidate rejected',
        candidate: result.Attributes,
        timestamp: new Date().toISOString(),
        action: 'rejected',
        reason: reason
      })
    };

  } catch (error) {
    console.error('Candidate Management API - Error rejecting candidate:', error);

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
        error: 'Failed to reject candidate',
        message: error.message
      })
    };
  }
}

// =============================================================================
// GET ADMIN STATS FUNCTION - Dashboard statistics
// =============================================================================
async function getAdminStats() {
  console.log('Candidate Management API - Getting admin statistics');

  try {
    // Get all candidates
    const candidatesResult = await dynamodb.scan({
      TableName: CANDIDATES_TABLE
    }).promise();

    // Calculate statistics
    const stats = {
      totalCandidates: candidatesResult.Items.length,
      approved: 0,
      pending: 0,
      rejected: 0,
      recentRegistrations: 0
    };

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    candidatesResult.Items.forEach(candidate => {
      // Count by status
      switch (candidate.status) {
        case 'approved':
          stats.approved++;
          break;
        case 'pending':
          stats.pending++;
          break;
        case 'rejected':
          stats.rejected++;
          break;
      }

      // Count recent registrations (last 24 hours)
      if (candidate.registrationDate > oneDayAgo) {
        stats.recentRegistrations++;
      }
    });

    // Get recent candidates (last 5)
    const recentCandidates = candidatesResult.Items
      .sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate))
      .slice(0, 5)
      .map(candidate => ({
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        status: candidate.status,
        registrationDate: candidate.registrationDate
      }));

    console.log('Candidate Management API - Admin stats calculated:', stats);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        statistics: stats,
        recentCandidates: recentCandidates,
        timestamp: new Date().toISOString(),
        summary: {
          approvalRate: stats.totalCandidates > 0 ? ((stats.approved / stats.totalCandidates) * 100).toFixed(1) + '%' : '0%',
          pendingReview: stats.pending,
          needsAttention: stats.pending > 5 ? 'High volume of pending applications' : 'Normal processing volume'
        }
      })
    };

  } catch (error) {
    console.error('Candidate Management API - Error getting admin stats:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Failed to get admin statistics',
        message: error.message
      })
    };
  }
}

// =============================================================================
// ELECTIONS API ENDPOINTS (Temporary - should be in separate Lambda)
// =============================================================================

// Get approved candidates for voting (public endpoint)
async function getApprovedCandidates() {
  console.log('Candidate Management API - Getting approved candidates for voting');

  try {
    const result = await dynamodb.scan({
      TableName: CANDIDATES_TABLE,
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'approved'
      }
    }).promise();

    console.log(`Candidate Management API - Found ${result.Items.length} approved candidates for voting`);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        candidates: result.Items,
        count: result.Items.length,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Candidate Management API - Error getting approved candidates:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Failed to retrieve candidates for voting',
        message: error.message
      })
    };
  }
}

// Cast vote function - Real voting implementation
async function castVote(event) {
  console.log('Candidate Management API - Processing vote');

  try {
    const voteData = JSON.parse(event.body || '{}');
    const { candidateId, userId } = voteData;

    console.log('Vote request:', { candidateId, userId });

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

    // Check if user has already voted
    console.log('Checking for duplicate vote...');
    const existingVote = await dynamodb.get({
      TableName: VOTES_TABLE,
      Key: { userId }
    }).promise();

    if (existingVote.Item) {
      console.log('Duplicate vote attempt:', userId);
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

    // Verify candidate exists and is approved
    console.log('Verifying candidate...');
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
      console.log('Candidate not approved:', candidateId, candidate.Item.status);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Candidate is not approved for voting',
          candidateStatus: candidate.Item.status
        })
      };
    }

    // Cast the vote
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
        voteId: `${userId}_${candidateId}`
      })
    };

  } catch (error) {
    console.error('Candidate Management API - Error casting vote:', error);
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

// Get vote status (temporary)
async function getVoteStatus(event) {
  console.log('Candidate Management API - Getting vote status');

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

    console.log('Checking vote status for user:', userId);

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
    console.error('Candidate Management API - Error getting vote status:', error);
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

// Get results - Real implementation
async function getResults() {
  console.log('Candidate Management API - Calculating election results');

  try {
    // Get all votes
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

    console.log('Results calculated:', results.map(r => ({ name: r.candidate, votes: r.votes })));

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
    console.error('Candidate Management API - Error getting results:', error);
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
// INITIALIZE CANDIDATES FUNCTION - Setup sample candidates
// =============================================================================
async function initializeCandidates() {
  console.log('Candidate Management API - Initializing sample candidates');

  const sampleCandidates = [
    {
      id: 'candidate_1730217600000_sample1',
      name: 'Manas Mungya',
      email: 'manas.mungya@ves.ac.in',
      description: 'Experienced leader with a vision for positive change and student advocacy.',
      platform: 'Focus on student welfare, campus improvements, and academic excellence. Will work to improve library facilities, organize more cultural events, and establish better communication between students and administration.',
      experience: '3 years in student government, Former class representative',
      studentId: 'STU001',
      phone: '+91-9876543210',
      status: 'pending',
      registrationDate: new Date().toISOString(),
      approvedDate: null,
      approvedBy: null,
      rejectedDate: null,
      rejectedBy: null,
      rejectionReason: null,
      votes: 0,
      metadata: {
        ipAddress: 'system',
        userAgent: 'InitializationScript',
        registrationSource: 'initialization'
      }
    },
    {
      id: 'candidate_1730217600001_sample2',
      name: 'Shivam Chaugule',
      email: '2023.shivam.chaugule@ves.ac.in',
      description: 'Fresh perspective with innovative ideas for modern student needs and technology integration.',
      platform: 'Technology integration, sustainability initiatives, and inclusive policies. Will focus on digital student services, eco-friendly campus initiatives, and ensuring equal opportunities for all students.',
      experience: '2 years in debate club, Active in coding competitions',
      studentId: 'STU002',
      phone: '+91-9876543211',
      status: 'pending',
      registrationDate: new Date().toISOString(),
      approvedDate: null,
      approvedBy: null,
      rejectedDate: null,
      rejectedBy: null,
      rejectionReason: null,
      votes: 0,
      metadata: {
        ipAddress: 'system',
        userAgent: 'InitializationScript',
        registrationSource: 'initialization'
      }
    },
    {
      id: 'candidate_1730217600002_sample3',
      name: 'Dhruv Bajaj',
      email: 'dhruv.bajaj@ves.ac.in',
      description: 'Innovation focused leader with proven track record in student organizations and community service.',
      platform: 'Career development, mental health support, and campus diversity. Will establish career counseling programs, mental health awareness campaigns, and promote cultural diversity on campus.',
      experience: '4 years in various student organizations, Volunteer coordinator',
      studentId: 'STU003',
      phone: '+91-9876543212',
      status: 'pending',
      registrationDate: new Date().toISOString(),
      approvedDate: null,
      approvedBy: null,
      rejectedDate: null,
      rejectedBy: null,
      rejectionReason: null,
      votes: 0,
      metadata: {
        ipAddress: 'system',
        userAgent: 'InitializationScript',
        registrationSource: 'initialization'
      }
    }
  ];

  try {
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const candidate of sampleCandidates) {
      try {
        // Check if candidate already exists
        const existingCandidate = await dynamodb.get({
          TableName: CANDIDATES_TABLE,
          Key: { id: candidate.id }
        }).promise();

        if (existingCandidate.Item) {
          console.log(`⏭️  Candidate already exists: ${candidate.name}`);
          skipCount++;
          continue;
        }

        // Create the candidate
        await dynamodb.put({
          TableName: CANDIDATES_TABLE,
          Item: candidate
        }).promise();

        console.log(`✅ Initialized candidate: ${candidate.name}`);
        successCount++;

      } catch (error) {
        console.error(`❌ Error initializing candidate ${candidate.name}:`, error);
        errorCount++;
      }
    }

    console.log(`Initialization complete: ${successCount} created, ${skipCount} skipped, ${errorCount} errors`);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Sample candidates initialization completed',
        results: {
          created: successCount,
          skipped: skipCount,
          errors: errorCount,
          total: sampleCandidates.length
        },
        candidates: sampleCandidates.map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          status: c.status
        })),
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Candidate Management API - Error initializing candidates:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Failed to initialize sample candidates',
        message: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
}