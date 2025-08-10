const crypto = require('crypto');
const { getUserByEmail, createUser, generateToken, updateLastLogin } = require('./auth');

// OAuth Provider configurations
const OAUTH_PROVIDERS = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || `${process.env.BACKEND_URL || 'http://localhost:5000'}/auth/social/google/callback`,
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scope: 'email profile'
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    redirectUri: process.env.GITHUB_REDIRECT_URI || `${process.env.BACKEND_URL || 'http://localhost:5000'}/auth/social/github/callback`,
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    scope: 'user:email'
  },
  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    redirectUri: process.env.LINKEDIN_REDIRECT_URI || `${process.env.BACKEND_URL || 'http://localhost:5000'}/auth/social/linkedin/callback`,
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    userInfoUrl: 'https://api.linkedin.com/v2/people/~:(id,firstName,lastName,emailAddress)',
    scope: 'r_liteprofile r_emailaddress'
  }
};

// Generate OAuth authorization URL
const generateAuthUrl = (provider, state, mode = 'login') => {
  const config = OAUTH_PROVIDERS[provider];
  if (!config) {
    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scope,
    response_type: 'code',
    state: `${state}:${mode}`, // Include mode in state
    access_type: 'offline',
    prompt: 'consent'
  });

  return `${config.authUrl}?${params.toString()}`;
};

// Exchange authorization code for access token
const exchangeCodeForToken = async (provider, code) => {
  const config = OAUTH_PROVIDERS[provider];
  if (!config) {
    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }

  const tokenData = {
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code: code,
    grant_type: 'authorization_code',
    redirect_uri: config.redirectUri
  };

  try {
    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams(tokenData)
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(`Token exchange error: ${result.error_description || result.error}`);
    }

    return result.access_token;
  } catch (error) {
    console.error(`Token exchange error for ${provider}:`, error);
    throw error;
  }
};

// Get user information from OAuth provider
const getUserInfo = async (provider, accessToken) => {
  const config = OAUTH_PROVIDERS[provider];
  if (!config) {
    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }

  try {
    const response = await fetch(config.userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`User info fetch failed: ${response.statusText}`);
    }

    const userInfo = await response.json();
    return normalizeUserInfo(provider, userInfo);
  } catch (error) {
    console.error(`User info fetch error for ${provider}:`, error);
    throw error;
  }
};

// Normalize user information across different providers
const normalizeUserInfo = (provider, userInfo) => {
  switch (provider) {
    case 'google':
      return {
        providerId: userInfo.id,
        email: userInfo.email,
        firstName: userInfo.given_name || '',
        lastName: userInfo.family_name || '',
        name: userInfo.name,
        picture: userInfo.picture,
        verified: userInfo.verified_email || false
      };
      
    case 'github':
      const nameParts = (userInfo.name || '').split(' ');
      return {
        providerId: userInfo.id.toString(),
        email: userInfo.email,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        name: userInfo.name || userInfo.login,
        picture: userInfo.avatar_url,
        verified: true // GitHub emails are verified
      };
      
    case 'linkedin':
      return {
        providerId: userInfo.id,
        email: userInfo.emailAddress,
        firstName: userInfo.firstName?.localized?.en_US || '',
        lastName: userInfo.lastName?.localized?.en_US || '',
        name: `${userInfo.firstName?.localized?.en_US || ''} ${userInfo.lastName?.localized?.en_US || ''}`.trim(),
        picture: userInfo.profilePicture?.displayImage || null,
        verified: true // LinkedIn emails are verified
      };
      
    default:
      throw new Error(`Unsupported provider for normalization: ${provider}`);
  }
};

// Handle social authentication
const handleSocialAuth = async (provider, userInfo, mode = 'login') => {
  try {
    // Check if user exists
    let user = await getUserByEmail(userInfo.email);
    
    if (mode === 'login' && !user) {
      throw new Error('No account found with this email. Please sign up first.');
    }
    
    if (mode === 'register' && user) {
      // User exists, just log them in
      await updateLastLogin(user.id);
      const token = generateToken(user);
      return { user, token, isNewUser: false };
    }
    
    if (!user) {
      // Create new user for registration
      const userData = {
        email: userInfo.email,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        password: crypto.randomBytes(32).toString('hex'), // Random password for social users
        role: 'user',
        isVerified: userInfo.verified,
        socialProvider: provider,
        socialProviderId: userInfo.providerId,
        gdprConsent: true, // Implied consent for social login
        gdprConsentDate: new Date().toISOString()
      };
      
      user = await createUser(userData);
      const token = generateToken(user);
      return { user, token, isNewUser: true };
    } else {
      // Update last login for existing user
      await updateLastLogin(user.id);
      const token = generateToken(user);
      return { user, token, isNewUser: false };
    }
  } catch (error) {
    console.error('Social auth error:', error);
    throw error;
  }
};

// Validate OAuth provider configuration
const validateProviderConfig = (provider) => {
  const config = OAUTH_PROVIDERS[provider];
  if (!config) {
    return { valid: false, error: `Unsupported provider: ${provider}` };
  }
  
  if (!config.clientId) {
    return { valid: false, error: `Missing client ID for ${provider}` };
  }
  
  if (!config.clientSecret) {
    return { valid: false, error: `Missing client secret for ${provider}` };
  }
  
  return { valid: true };
};

// Generate a secure state parameter for OAuth
const generateState = () => {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = {
  OAUTH_PROVIDERS,
  generateAuthUrl,
  exchangeCodeForToken,
  getUserInfo,
  handleSocialAuth,
  validateProviderConfig,
  generateState
};