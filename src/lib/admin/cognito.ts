// Admin-specific Cognito configuration
// This is a SEPARATE user pool for internal operations only
// Different from the main app's Cognito pool

export const adminCognitoConfig = {
  region: 'af-south-1',
  userPoolId: 'af-south-1_YIybbAW59',
  clientId: '6p7guchd6ar3dqor7glh54cq4o',
  redirectUri: 'https://d84l1y8p4kdic.cloudfront.net'
};
