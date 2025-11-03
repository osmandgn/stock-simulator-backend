const { OAuth2Client } = require('google-auth-library');
const appleSignin = require('apple-signin-auth');
const fs = require('fs');

// Google OAuth Client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// OAuth Service
class OAuthService {
  // Verify Google ID Token
  async verifyGoogleToken(idToken) {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      return {
        success: true,
        provider: 'google',
        providerId: payload['sub'],
        email: payload['email'],
        emailVerified: payload['email_verified'],
        name: payload['name'],
        picture: payload['picture'],
        givenName: payload['given_name'],
        familyName: payload['family_name']
      };
    } catch (error) {
      console.error('Google token verification failed:', error.message);
      return {
        success: false,
        error: 'Invalid Google token',
        message: error.message
      };
    }
  }

  // Verify Apple ID Token
  async verifyAppleToken(idToken) {
    try {
      // Apple uses JWT tokens that need to be verified
      const appleResponse = await appleSignin.verifyIdToken(idToken, {
        audience: process.env.APPLE_CLIENT_ID,
        ignoreExpiration: false, // Don't accept expired tokens
      });

      return {
        success: true,
        provider: 'apple',
        providerId: appleResponse.sub, // Apple's unique user identifier
        email: appleResponse.email,
        emailVerified: appleResponse.email_verified === 'true',
        // Apple doesn't always provide name/picture in token
        // These come from the initial authorization request on iOS side
      };
    } catch (error) {
      console.error('Apple token verification failed:', error.message);
      return {
        success: false,
        error: 'Invalid Apple token',
        message: error.message
      };
    }
  }

  // Verify token based on provider
  async verifyOAuthToken(provider, idToken) {
    if (provider === 'google') {
      return await this.verifyGoogleToken(idToken);
    } else if (provider === 'apple') {
      return await this.verifyAppleToken(idToken);
    } else {
      return {
        success: false,
        error: 'Unsupported OAuth provider',
        message: `Provider '${provider}' is not supported`
      };
    }
  }

  // Generate username from email
  generateUsername(email, providerId) {
    // Extract username part from email
    const emailUsername = email.split('@')[0];

    // Add random suffix to ensure uniqueness
    const randomSuffix = Math.random().toString(36).substring(2, 6);

    return `${emailUsername}_${randomSuffix}`;
  }
}

module.exports = new OAuthService();
