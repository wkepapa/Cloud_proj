// Cognito Configuration based on your AWS Console setup
export const COGNITO_CONFIG = {
  // From your screenshots
  CLIENT_ID: "o82kd78l2ie1chb3h0223e74k",
  CLIENT_SECRET: "bbsjmpmsn4h68q216gui13cff21lnnl9oatr7j6bun14n77h6pk",
  USER_POOL_ID: "us-east-1_zfMUmmI7i",

  // OAuth domain from your managed login pages
  OAUTH_DOMAIN: "https://us-east-1zfmummi7i.auth.us-east-1.amazoncognito.com",

  // Cognito IDP domain for token signing
  IDP_DOMAIN: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_zfMUmmI7i",

  // Scopes from your configuration
  SCOPES: ['openid', 'email', 'profile'],

  // URLs based on environment
  getRedirectUri: () => {
    const origin = window.location.origin;
    // Handle both development and production
    if (origin.includes('localhost')) {
      return `${origin}/callback`;
    }
    // For CloudFront or production deployment
    return `${origin}/callback`;
  },

  getLogoutUri: () => {
    const origin = window.location.origin;
    return origin;
  },

  // Production domains (updated with actual deployment URLs)
  PRODUCTION_DOMAINS: [
    'https://main.d3okoijvek90er.amplifyapp.com', // Your Amplify domain
    'https://d84lty8p4kdlc.cloudfront.net'        // Your existing CloudFront domain
  ],

  // Session configuration matching your app client settings
  SESSION: {
    DURATION: 3 * 60, // 3 minutes as per your config
    REFRESH_TOKEN_EXPIRY: 5 * 24 * 60 * 60, // 5 days
    ACCESS_TOKEN_EXPIRY: 60 * 60, // 60 minutes
    ID_TOKEN_EXPIRY: 60 * 60 // 60 minutes
  }
};

export default COGNITO_CONFIG;