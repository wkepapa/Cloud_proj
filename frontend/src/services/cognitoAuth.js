// Cognito Authentication Service - Matches Express app implementation
import COGNITO_CONFIG from '../config/cognito.js';

class CognitoAuthService {
  constructor() {
    this.userInfo = null;
    this.tokenSet = null;
    this.isAuthenticated = false;
    
    // Initialize from localStorage
    this.loadFromStorage();
  }

  // Generate random strings for security
  generateNonce() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  generateState() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Build authorization URL (like Express app)
  getAuthUrl() {
    const nonce = this.generateNonce();
    const state = this.generateState();
    
    // Store in sessionStorage for callback verification
    sessionStorage.setItem('cognito_nonce', nonce);
    sessionStorage.setItem('cognito_state', state);
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: COGNITO_CONFIG.CLIENT_ID,
      redirect_uri: COGNITO_CONFIG.getRedirectUri(),
      scope: COGNITO_CONFIG.SCOPES.join(' '),
      state: state,
      nonce: nonce
    });

    return `${COGNITO_CONFIG.OAUTH_DOMAIN}/oauth2/authorize?${params.toString()}`;
  }

  // Handle callback (like Express /callback route)
  async handleCallback(code, state) {
    try {
      const storedState = sessionStorage.getItem('cognito_state');
      
      if (state !== storedState) {
        throw new Error('Invalid state parameter');
      }

      // Exchange code for tokens
      const tokenResponse = await this.exchangeCodeForTokens(code);
      
      if (tokenResponse.access_token) {
        // Get user info
        const userInfo = await this.getUserInfo(tokenResponse.access_token);
        
        // Store authentication data
        this.tokenSet = tokenResponse;
        this.userInfo = userInfo;
        this.isAuthenticated = true;
        
        // Save to localStorage
        this.saveToStorage();
        
        // Clean up session storage
        sessionStorage.removeItem('cognito_nonce');
        sessionStorage.removeItem('cognito_state');
        
        return { success: true, userInfo };
      }
      
      throw new Error('No access token received');
    } catch (error) {
      console.error('Callback error:', error);
      return { success: false, error: error.message };
    }
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code) {
    const response = await fetch(`${COGNITO_CONFIG.OAUTH_DOMAIN}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${COGNITO_CONFIG.CLIENT_ID}:${COGNITO_CONFIG.CLIENT_SECRET}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: COGNITO_CONFIG.CLIENT_ID,
        code: code,
        redirect_uri: COGNITO_CONFIG.getRedirectUri()
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token exchange error:', errorText);
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    return await response.json();
  }

  // Get user info from Cognito
  async getUserInfo(accessToken) {
    const response = await fetch(`${COGNITO_CONFIG.OAUTH_DOMAIN}/oauth2/userInfo`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('UserInfo error:', errorText);
      throw new Error(`UserInfo request failed: ${response.statusText}`);
    }

    return await response.json();
  }

  // Login - redirect to Cognito
  login() {
    const authUrl = this.getAuthUrl();
    window.location.href = authUrl;
  }

  // Logout (like Express /logout route)
  logout() {
    // Build logout URL with id_token_hint if available
    let logoutUrl;
    
    if (this.tokenSet?.id_token) {
      const params = new URLSearchParams({
        client_id: COGNITO_CONFIG.CLIENT_ID,
        logout_uri: COGNITO_CONFIG.getLogoutUri(),
        id_token_hint: this.tokenSet.id_token
      });
      logoutUrl = `${COGNITO_CONFIG.OAUTH_DOMAIN}/logout?${params.toString()}`;
    } else {
      // Fallback logout URL
      const params = new URLSearchParams({
        client_id: COGNITO_CONFIG.CLIENT_ID,
        logout_uri: COGNITO_CONFIG.getLogoutUri()
      });
      logoutUrl = `${COGNITO_CONFIG.OAUTH_DOMAIN}/logout?${params.toString()}`;
    }

    // Clear local data
    this.clearAuth();
    
    // Redirect to Cognito logout
    window.location.href = logoutUrl;
  }

  // Clear authentication data
  clearAuth() {
    this.userInfo = null;
    this.tokenSet = null;
    this.isAuthenticated = false;
    
    // Clear storage
    localStorage.removeItem('cognito_auth');
    sessionStorage.removeItem('cognito_nonce');
    sessionStorage.removeItem('cognito_state');
  }

  // Save to localStorage
  saveToStorage() {
    const authData = {
      userInfo: this.userInfo,
      tokenSet: this.tokenSet,
      isAuthenticated: this.isAuthenticated,
      timestamp: Date.now()
    };
    localStorage.setItem('cognito_auth', JSON.stringify(authData));
  }

  // Load from localStorage
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('cognito_auth');
      if (stored) {
        const authData = JSON.parse(stored);
        
        // Check if token is still valid (24 hours)
        const isExpired = Date.now() - authData.timestamp > 24 * 60 * 60 * 1000;
        
        if (!isExpired && authData.userInfo) {
          this.userInfo = authData.userInfo;
          this.tokenSet = authData.tokenSet;
          this.isAuthenticated = authData.isAuthenticated;
        } else {
          // Clear expired data
          this.clearAuth();
        }
      }
    } catch (error) {
      console.error('Error loading auth from storage:', error);
      this.clearAuth();
    }
  }

  // Get current user info
  getCurrentUser() {
    return this.userInfo;
  }

  // Check if user is authenticated
  isUserAuthenticated() {
    return this.isAuthenticated && this.userInfo;
  }

  // Get access token
  getAccessToken() {
    return this.tokenSet?.access_token;
  }

  // Refresh token if needed
  async refreshTokenIfNeeded() {
    if (this.tokenSet?.refresh_token) {
      try {
        const response = await fetch(`${COGNITO_CONFIG.OAUTH_DOMAIN}/oauth2/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${btoa(`${COGNITO_CONFIG.CLIENT_ID}:${COGNITO_CONFIG.CLIENT_SECRET}`)}`
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: COGNITO_CONFIG.CLIENT_ID,
            refresh_token: this.tokenSet.refresh_token
          })
        });

        if (response.ok) {
          const newTokens = await response.json();
          this.tokenSet = { ...this.tokenSet, ...newTokens };
          this.saveToStorage();
          return true;
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    }
    return false;
  }
}

// Create singleton instance
const cognitoAuth = new CognitoAuthService();

export default cognitoAuth;