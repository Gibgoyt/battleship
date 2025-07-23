// Validate required environment variables
const requiredEnvVars = {
  region: import.meta.env.PUBLIC_COGNITO_REGION,
  userPoolId: import.meta.env.PUBLIC_COGNITO_USER_POOL_ID,
  userPoolWebClientId: import.meta.env.PUBLIC_COGNITO_CLIENT_ID,
};

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => `PUBLIC_COGNITO_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingVars.join(', ')}. ` +
    'Please check your .env file or environment configuration.'
  );
}

export const cognitoConfig = {
  region: requiredEnvVars.region,
  userPoolId: requiredEnvVars.userPoolId,
  userPoolWebClientId: requiredEnvVars.userPoolWebClientId,
};
