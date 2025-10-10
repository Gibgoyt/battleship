#!/usr/bin/env node
/**
 * Cognito JWT Token Analyzer
 *
 * Decodes and analyzes AWS Cognito JWT tokens
 * Usage: Replace the TOKEN constant with your JWT and run with: ./test_scripts/admin_app/cognito.ts
 */

// Paste your JWT token here
const TOKEN = 'eyJraWQiOiJJZHB3SkVZWExiVCt6SmxaN0NvaDBWUHQxUUdmd1wvQzh6ZHJ3YjZ4dzlXbz0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI4MTRjZTJmOC0yMDAxLTcwMTEtMGJjNi1jOWZkYmFhNjlmYjUiLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuYWYtc291dGgtMS5hbWF6b25hd3MuY29tXC9hZi1zb3V0aC0xX1lJeWJiQVc1OSIsImNvZ25pdG86dXNlcm5hbWUiOiI4MTRjZTJmOC0yMDAxLTcwMTEtMGJjNi1jOWZkYmFhNjlmYjUiLCJvcmlnaW5fanRpIjoiN2Y4OTVmYjMtZWQ2Yi00NzAyLWIxZjItNmVjZGJjNTkwMTFjIiwiYXVkIjoiNnA3Z3VjaGQ2YXIzZHFvcjdnbGg1NGNxNG8iLCJldmVudF9pZCI6Ijc4NzAyZWNjLWM1MzctNGZlNC04NjNiLTQzYTM2YWQwOTY1ZiIsInRva2VuX3VzZSI6ImlkIiwiYXV0aF90aW1lIjoxNzYwMDg2NDQ1LCJleHAiOjE3NjAwOTAwNDUsImlhdCI6MTc2MDA4NjQ0NSwianRpIjoiM2Y0YjM3OGQtZDU4ZS00Y2MzLTlkYjMtY2QwYjA2NTU5ZmE3IiwiZW1haWwiOiJhaG1lZG1vdGk3NjdAZ21haWwuY29tIn0.kO4NCdXrr3f6unpO1R-buqQ3B8fc17DFOjZtXpSzG_4SZYQCK9AjnlE4F5D4FS9Qu_HJ3aAww0Eofhb5KeG8rkbyQUD9hftvUpe_XZeUMSnwmfE37t-0xLoyhQtw_sVCgNNgRjhl7Ix_R3uqy4ZiAm4fOXMi_8M2n800E8zkhxsoGELvLzmS4-dv-4q7MD99uHG-VjDFn7gkac4nm1xBeYrINNPW2V4vea05DPRY1FnDbi1HZEB4pEWiexct1Fc_RDmNN2d5w-B0gXDgn8sUGgUj8_aJjMC4r7v986OP3KpWOfVsr-4q-zdmQvNwU_HvdUvkS72VsqgOnxNMKrEVuw';

interface JWTHeader {
  kid: string;
  alg: string;
}

interface CognitoPayload {
  sub: string;
  iss: string;
  'cognito:username': string;
  origin_jti: string;
  aud: string;
  event_id: string;
  token_use: string;
  auth_time: number;
  exp: number;
  iat: number;
  jti: string;
  email: string;
  email_verified?: boolean;
  'cognito:groups'?: string[];
}

interface DecodedJWT {
  header: JWTHeader;
  payload: CognitoPayload;
  signature: string;
  raw: {
    header: string;
    payload: string;
    signature: string;
  };
}

function decodeBase64Url(base64url: string): string {
  // Convert base64url to base64
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  return Buffer.from(base64 + padding, 'base64').toString('utf-8');
}

function decodeJWT(token: string): DecodedJWT {
  const parts = token.split('.');

  if (parts.length !== 3) {
    throw new Error('Invalid JWT: must have 3 parts (header.payload.signature)');
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  try {
    const header = JSON.parse(decodeBase64Url(headerB64)) as JWTHeader;
    const payload = JSON.parse(decodeBase64Url(payloadB64)) as CognitoPayload;

    return {
      header,
      payload,
      signature: signatureB64,
      raw: {
        header: headerB64,
        payload: payloadB64,
        signature: signatureB64,
      },
    };
  } catch (error) {
    throw new Error(`Failed to decode JWT: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function formatTimestamp(unixTimestamp: number): string {
  const date = new Date(unixTimestamp * 1000);
  return date.toISOString();
}

function getTimeRemaining(expirationTime: number): string {
  const now = Math.floor(Date.now() / 1000);
  const remaining = expirationTime - now;

  if (remaining < 0) {
    const expired = Math.abs(remaining);
    const hours = Math.floor(expired / 3600);
    const minutes = Math.floor((expired % 3600) / 60);
    const seconds = expired % 60;
    return `⚠️  EXPIRED ${hours}h ${minutes}m ${seconds}s ago`;
  }

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;
  return `✅ ${hours}h ${minutes}m ${seconds}s remaining`;
}

function getTokenAge(issuedAt: number): string {
  const now = Math.floor(Date.now() / 1000);
  const age = now - issuedAt;

  const hours = Math.floor(age / 3600);
  const minutes = Math.floor((age % 3600) / 60);
  const seconds = age % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}

function analyzeToken(token: string): void {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('           🔐 COGNITO JWT TOKEN ANALYZER 🔐');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    const decoded = decodeJWT(token);

    // Header
    console.log('📋 HEADER');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`  Algorithm:  ${decoded.header.alg}`);
    console.log(`  Key ID:     ${decoded.header.kid}`);
    console.log('');

    // Payload - User Info
    console.log('👤 USER INFORMATION');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`  User ID (sub):        ${decoded.payload.sub}`);
    console.log(`  Username:             ${decoded.payload['cognito:username']}`);
    console.log(`  Email:                ${decoded.payload.email}`);
    if (decoded.payload.email_verified !== undefined) {
      console.log(`  Email Verified:       ${decoded.payload.email_verified ? '✅ Yes' : '❌ No'}`);
    }
    if (decoded.payload['cognito:groups'] && decoded.payload['cognito:groups'].length > 0) {
      console.log(`  Groups:               ${decoded.payload['cognito:groups'].join(', ')}`);
    }
    console.log('');

    // Payload - Token Info
    console.log('🎫 TOKEN INFORMATION');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`  Token Use:            ${decoded.payload.token_use}`);
    console.log(`  Audience (Client ID): ${decoded.payload.aud}`);
    console.log(`  Issuer:               ${decoded.payload.iss}`);
    console.log(`  JTI (Token ID):       ${decoded.payload.jti}`);
    console.log(`  Origin JTI:           ${decoded.payload.origin_jti}`);
    console.log(`  Event ID:             ${decoded.payload.event_id}`);
    console.log('');

    // Timestamps
    const now = Math.floor(Date.now() / 1000);
    const isExpired = decoded.payload.exp < now;

    console.log('⏰ TIMESTAMPS');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`  Issued At (iat):      ${formatTimestamp(decoded.payload.iat)}`);
    console.log(`  Token Age:            ${getTokenAge(decoded.payload.iat)}`);
    console.log('');
    console.log(`  Auth Time:            ${formatTimestamp(decoded.payload.auth_time)}`);
    console.log('');
    console.log(`  Expires At (exp):     ${formatTimestamp(decoded.payload.exp)}`);
    console.log(`  Status:               ${getTimeRemaining(decoded.payload.exp)}`);
    console.log('');

    // Validity
    console.log('✓ TOKEN VALIDITY');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`  Structure:            ✅ Valid (3 parts)`);
    console.log(`  Header Decoded:       ✅ Success`);
    console.log(`  Payload Decoded:      ✅ Success`);
    console.log(`  Expiration:           ${isExpired ? '❌ EXPIRED' : '✅ Valid'}`);
    console.log('');

    // Signature
    console.log('🔏 SIGNATURE');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`  Signature (Base64):   ${decoded.signature.substring(0, 60)}...`);
    console.log(`  Length:               ${decoded.signature.length} characters`);
    console.log('');

    // Raw Token
    console.log('📝 RAW TOKEN PARTS');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`  Full Token Length:    ${token.length} characters`);
    console.log(`  Header:               ${decoded.raw.header.substring(0, 40)}...`);
    console.log(`  Payload:              ${decoded.raw.payload.substring(0, 40)}...`);
    console.log(`  Signature:            ${decoded.raw.signature.substring(0, 40)}...`);
    console.log('');

    // Full JSON
    console.log('📄 FULL PAYLOAD (JSON)');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(JSON.stringify(decoded.payload, null, 2));
    console.log('');

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    ✅ ANALYSIS COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ ERROR:', error instanceof Error ? error.message : 'Unknown error');
  }
}

// Run the analysis
analyzeToken(TOKEN);
