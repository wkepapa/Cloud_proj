// API service for backend communication
import cognitoAuth from './cognitoAuth.js';

// API Configuration for Lambda Functions
const API_CONFIG = {
  // Elections API Lambda (handles voting, results, public endpoints)
  ELECTIONS_API: import.meta.env.VITE_ELECTIONS_API_URL || 'https://r1fgh30fha.execute-api.us-east-1.amazonaws.com',
  
  // Candidate Management API Lambda (handles registration, admin functions)
  CANDIDATE_API: import.meta.env.VITE_CANDIDATE_API_URL || 'https://r1fgh30fha.execute-api.us-east-1.amazonaws.com',
  
  // Development fallback (if using single endpoint)
  DEV_URL: 'http://localhost:3000',
  
  // Endpoints mapping
  ENDPOINTS: {
    // Elections API endpoints
    HEALTH: '/health',
    CANDIDATES: '/candidates', 
    VOTE: '/vote',
    VOTE_STATUS: '/vote-status',
    RESULTS: '/results',
    INIT: '/init',
    
    // Candidate Management API endpoints
    CANDIDATES_REGISTER: '/candidates',
    CANDIDATES_PENDING: '/candidates/pending',
    CANDIDATES_APPROVE: '/candidates/approve',
    CANDIDATES_REJECT: '/candidates/reject',
    ADMIN_STATS: '/admin/stats'
  }
};

class ApiService {
  constructor() {
    this.electionsApiUrl = API_CONFIG.ELECTIONS_API;
    this.candidateApiUrl = API_CONFIG.CANDIDATE_API;
    
    // Debug: Log the loaded URLs
    console.log('🔧 API Service initialized:');
    console.log('  Elections API:', this.electionsApiUrl);
    console.log('  Candidate API:', this.candidateApiUrl);
    console.log('  Environment variables:');
    console.log('    VITE_ELECTIONS_API_URL:', import.meta.env.VITE_ELECTIONS_API_URL);
    console.log('    VITE_CANDIDATE_API_URL:', import.meta.env.VITE_CANDIDATE_API_URL);
  }

  // Get API base URL for specific service
  getApiUrl(service = 'elections') {
    // Return appropriate API URL based on service
    if (service === 'candidate') {
      return this.candidateApiUrl;
    }
    
    return this.electionsApiUrl;
  }

  // Make authenticated request
  async makeRequest(endpoint, options = {}, service = 'elections') {
    const baseUrl = this.getApiUrl(service);
    const url = `${baseUrl}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    // Add authentication header if user is logged in
    const accessToken = cognitoAuth.getAccessToken();
    if (accessToken) {
      defaultHeaders.Authorization = `Bearer ${accessToken}`;
    }

    const config = {
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ API Response:`, data);
      
      return data;
    } catch (error) {
      console.error(`❌ API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return this.makeRequest(API_CONFIG.ENDPOINTS.HEALTH);
  }

  // Get all candidates
  async getCandidates() {
    return this.makeRequest(API_CONFIG.ENDPOINTS.CANDIDATES);
  }

  // Cast a vote (requires authentication)
  async castVote(candidateId) {
    const user = cognitoAuth.getCurrentUser();
    const userId = user?.sub || user?.username;
    
    if (!userId) {
      throw new Error('User ID not found');
    }
    
    return this.makeRequest(API_CONFIG.ENDPOINTS.VOTE, {
      method: 'POST',
      body: JSON.stringify({ candidateId, userId }),
    });
  }

  // Check vote status (requires authentication)
  async getVoteStatus() {
    const user = cognitoAuth.getCurrentUser();
    const userId = user?.sub || user?.username;
    
    if (!userId) {
      throw new Error('User ID not found');
    }
    
    return this.makeRequest(`${API_CONFIG.ENDPOINTS.VOTE_STATUS}?userId=${userId}`);
  }

  // Get election results
  async getResults() {
    return this.makeRequest(API_CONFIG.ENDPOINTS.RESULTS);
  }

  // Initialize candidates (admin function)
  async initializeCandidates() {
    return this.makeRequest(API_CONFIG.ENDPOINTS.INIT, {
      method: 'POST',
    });
  }

  // Register new candidate (uses Candidate Management API)
  async registerCandidate(candidateData) {
    return this.makeRequest(API_CONFIG.ENDPOINTS.CANDIDATES_REGISTER, {
      method: 'POST',
      body: JSON.stringify(candidateData),
    }, 'candidate');
  }

  // Approve candidate (admin function - uses Candidate Management API)
  async approveCandidate(candidateId, adminId, notes = '') {
    return this.makeRequest(API_CONFIG.ENDPOINTS.CANDIDATES_APPROVE, {
      method: 'POST',
      body: JSON.stringify({ candidateId, adminId, notes }),
    }, 'candidate');
  }

  // Reject candidate (admin function - uses Candidate Management API)
  async rejectCandidate(candidateId, adminId, reason) {
    return this.makeRequest(API_CONFIG.ENDPOINTS.CANDIDATES_REJECT, {
      method: 'POST',
      body: JSON.stringify({ candidateId, adminId, reason }),
    }, 'candidate');
  }

  // Get pending candidates (admin function - uses Candidate Management API)
  async getPendingCandidates() {
    return this.makeRequest(API_CONFIG.ENDPOINTS.CANDIDATES_PENDING, {}, 'candidate');
  }

  // Get all candidates (admin function - uses Candidate Management API)
  async getAllCandidates() {
    return this.makeRequest(API_CONFIG.ENDPOINTS.CANDIDATES, {}, 'candidate');
  }

  // Get approved candidates only (for voting - uses Elections API)
  async getApprovedCandidates() {
    return this.makeRequest(API_CONFIG.ENDPOINTS.CANDIDATES + '?approved=true');
  }

  // Get admin statistics (admin function - uses Candidate Management API)
  async getAdminStats() {
    return this.makeRequest(API_CONFIG.ENDPOINTS.ADMIN_STATS, {}, 'candidate');
  }

  // Update API URLs (for after deployment)
  updateApiUrls(electionsUrl, candidateUrl) {
    if (electionsUrl) {
      this.electionsApiUrl = electionsUrl;
      console.log(`🔧 Elections API URL updated to: ${electionsUrl}`);
    }
    if (candidateUrl) {
      this.candidateApiUrl = candidateUrl;
      console.log(`🔧 Candidate API URL updated to: ${candidateUrl}`);
    }
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;