# 🔥 **GitHub OAuth Integration - Backend Requirements**

## **📋 OVERVIEW**

This document specifies the **exact backend requirements** for implementing GitHub OAuth 2.0 integration with DocForge. The backend team needs to implement **2 endpoints** that handle the complete OAuth flow while maintaining security and user session management.

**Architecture**: Frontend initiates → Backend generates OAuth URL → GitHub authorization → Backend processes callback → User redirected back to frontend

---

## **🏗️ SYSTEM ARCHITECTURE**

```
┌─────────────────┐    POST /initiate     ┌─────────────────┐
│                 │ ───────────────────► │                 │
│   Frontend      │                      │   Backend       │
│   (Qwik SPA)    │ ◄─────────────────── │   (C++)         │
└─────────────────┘    OAuth URL         └─────────────────┘
         │                                         │
         │ Redirect to GitHub                      │
         ▼                                         │
┌─────────────────┐                                │
│                 │                                │
│   GitHub        │                                │
│   OAuth Server  │                                │
└─────────────────┘                                │
         │                                         │
         │ GET /callback?code=xxx&state=xxx       │
         └─────────────────────────────────────────┘
```

---

## **🔐 AUTHENTICATION & SECURITY**

### **AWS Cognito JWT Validation**
All GitHub integration endpoints **MUST** validate AWS Cognito JWT tokens:

```http
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**JWT Payload Structure:**
```json
{
  "sub": "af-south-1_HiAxSvfQU_12345",  // Cognito User ID (PRIMARY KEY)
  "email": "user@example.com",
  "cognito:username": "johndoe",
  "token_use": "access",
  "exp": 1640995200,
  "iat": 1640991600
}
```

### **State Parameter Security**
- **Purpose**: Prevent CSRF attacks and link OAuth sessions to users
- **Format**: Cryptographically secure random string (32+ characters)
- **Storage**: Redis with TTL (10 minutes maximum)
- **Validation**: Exact match required on callback

---

## **🗄️ REDIS DATA SCHEMA**

### **Temporary OAuth State Storage**
```redis
# Key Pattern: github_oauth_state:{random_state}
# TTL: 600 seconds (10 minutes)
# Value: Cognito User ID

SETEX github_oauth_state:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6 600 "af-south-1_HiAxSvfQU_12345"

# Example commands:
SETEX github_oauth_state:8f7e6d5c4b3a2918f7e6d5c4b3a29187 600 "af-south-1_HiAxSvfQU_98765"
GET github_oauth_state:8f7e6d5c4b3a2918f7e6d5c4b3a29187
# Returns: "af-south-1_HiAxSvfQU_98765"
```

### **User GitHub Integration Storage**
```redis
# Key Pattern: user_integrations:{cognito_user_id}
# Permanent storage (until user disconnects)

HSET user_integrations:af-south-1_HiAxSvfQU_12345
  github_connected "true"
  github_access_token "AES256_GCM_ENCRYPTED_TOKEN_HERE"
  github_user_id "87654321"
  github_username "johndoe"
  github_email "john@example.com"
  github_avatar_url "https://avatars.githubusercontent.com/u/87654321"
  connected_at "2025-07-24T15:30:00Z"
  last_sync "2025-07-24T15:30:00Z"
  permissions "repo,user:email,read:user"
```

---

## **🎯 ENDPOINT 1: INITIATE OAUTH FLOW**

### **Request Specification**
```http
POST /api/v1/integrations/github/initiate
Content-Type: application/json
Authorization: Bearer <cognito_jwt_token>

# Request Body: EMPTY (no body required)
{}
```

### **Backend Processing Logic**
```cpp
// Pseudocode for backend implementation
async function POST_github_initiate(request) {
  // 1. Validate AWS Cognito JWT token
  CognitoUser user = validateCognitoJWT(request.headers["Authorization"]);
  if (!user.valid) {
    return HTTP_401_UNAUTHORIZED("Invalid Cognito token");
  }
  
  // 2. Check if user already has GitHub connected (optional)
  bool already_connected = redis.hexists("user_integrations:" + user.id, "github_connected");
  if (already_connected) {
    return HTTP_409_CONFLICT("GitHub already connected");
  }
  
  // 3. Generate cryptographically secure state parameter
  string oauth_state = generateSecureRandomString(32); // e.g., "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
  
  // 4. Store state -> user mapping in Redis with TTL
  redis.setex("github_oauth_state:" + oauth_state, 600, user.id);
  
  // 5. Build GitHub OAuth authorization URL
  string github_oauth_url = buildGitHubOAuthURL(oauth_state);
  
  // 6. Return OAuth URL to frontend
  return HTTP_200_OK({
    "success": true,
    "oauth_url": github_oauth_url,
    "state": oauth_state  // Optional: for debugging
  });
}
```

### **GitHub OAuth URL Construction**
```cpp
string buildGitHubOAuthURL(string state) {
  URLParams params = {
    {"client_id", GITHUB_CLIENT_ID},                    // From environment
    {"redirect_uri", GITHUB_CALLBACK_URL},              // Backend callback URL
    {"scope", "repo user:email read:user"},             // Required permissions
    {"state", state},                                   // CSRF protection
    {"response_type", "code"},                          // OAuth 2.0 flow
    {"allow_signup", "true"}                            // Allow new GitHub accounts
  };
  
  return "https://github.com/login/oauth/authorize?" + params.encode();
}
```

### **Response Format**
```json
// SUCCESS Response (HTTP 200)
{
  "success": true,
  "oauth_url": "https://github.com/login/oauth/authorize?client_id=Ov23lieqWcs9gYeHXT9y&redirect_uri=http%3A%2F%2F192.168.0.6%3A8443%2Fapi%2Fv1%2Fintegrations%2Fgithub%2Fauth%2Fcallback&scope=repo%20user%3Aemail%20read%3Auser&state=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6&response_type=code&allow_signup=true",
  "state": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}

// ERROR Response (HTTP 401)
{
  "success": false,
  "error": "unauthorized",
  "message": "Invalid or expired Cognito JWT token"
}

// ERROR Response (HTTP 409) 
{
  "success": false,
  "error": "already_connected", 
  "message": "GitHub integration already exists for this user"
}
```

---

## **🎯 ENDPOINT 2: PROCESS GITHUB CALLBACK**

### **Request Specification**
```http
GET /api/v1/integrations/github/auth/callback?code=1f3e863514586b65c745&state=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

# URL Parameters:
# - code: Authorization code from GitHub (required)
# - state: State parameter from initiate flow (required)
# - error: Error code if user denied access (optional)
# - error_description: Human-readable error description (optional)
```

### **Backend Processing Logic**
```cpp
// Pseudocode for backend implementation
async function GET_github_callback(request) {
  // 1. Extract parameters from URL
  string code = request.query_params["code"];
  string state = request.query_params["state"];
  string error = request.query_params["error"]; // Optional
  
  // 2. Handle OAuth errors (user denied access)
  if (!error.empty()) {
    return redirectToFrontend("/settings/integrations?github_error=" + error);
  }
  
  // 3. Validate required parameters
  if (code.empty() || state.empty()) {
    return redirectToFrontend("/settings/integrations?error=invalid_callback");
  }
  
  // 4. Lookup user ID from state parameter
  string cognito_user_id = redis.get("github_oauth_state:" + state);
  if (cognito_user_id.empty()) {
    return redirectToFrontend("/settings/integrations?error=invalid_state");
  }
  
  // 5. Delete used state (one-time use)
  redis.del("github_oauth_state:" + state);
  
  // 6. Exchange authorization code for access token
  GitHubTokenResponse token_response = exchangeCodeForAccessToken(code);
  if (!token_response.success) {
    return redirectToFrontend("/settings/integrations?error=token_exchange_failed");
  }
  
  // 7. Fetch GitHub user profile
  GitHubUser github_user = fetchGitHubUserProfile(token_response.access_token);
  if (!github_user.valid) {
    return redirectToFrontend("/settings/integrations?error=profile_fetch_failed");
  }
  
  // 8. Encrypt access token for secure storage
  string encrypted_token = encryptToken(token_response.access_token);
  
  // 9. Store user integration data in Redis
  storeGitHubIntegration(cognito_user_id, github_user, encrypted_token, token_response);
  
  // 10. Redirect user back to frontend with success
  return redirectToFrontend("/settings/integrations?github_connected=true");
}
```

### **GitHub Token Exchange Implementation**
```cpp
struct GitHubTokenResponse {
  bool success;
  string access_token;
  string token_type;     // Usually "bearer"
  string scope;          // Granted permissions
  string error;          // Error message if failed
};

GitHubTokenResponse exchangeCodeForAccessToken(string code) {
  // GitHub token exchange endpoint
  string url = "https://github.com/login/oauth/access_token";
  
  // Request payload
  json payload = {
    {"client_id", GITHUB_CLIENT_ID},
    {"client_secret", GITHUB_CLIENT_SECRET},    // SECRET - never expose to frontend!
    {"code", code},
    {"redirect_uri", GITHUB_CALLBACK_URL}
  };
  
  // HTTP headers
  HTTPHeaders headers = {
    {"Accept", "application/json"},
    {"Content-Type", "application/json"},
    {"User-Agent", "DocForge/1.0"}
  };
  
  // Make POST request to GitHub
  HTTPResponse response = http_post(url, payload.dump(), headers);
  
  if (response.status_code != 200) {
    return {false, "", "", "", "HTTP " + to_string(response.status_code)};
  }
  
  // Parse JSON response
  json response_data = json::parse(response.body);
  
  // GitHub returns error in response body (not HTTP status)
  if (response_data.contains("error")) {
    return {false, "", "", "", response_data["error"]};
  }
  
  return {
    true,
    response_data["access_token"],
    response_data["token_type"], 
    response_data["scope"],
    ""
  };
}
```

### **GitHub User Profile Fetching**
```cpp
struct GitHubUser {
  bool valid;
  int64_t id;
  string login;
  string name;
  string email;
  string avatar_url;
  string error;
};

GitHubUser fetchGitHubUserProfile(string access_token) {
  string url = "https://api.github.com/user";
  
  HTTPHeaders headers = {
    {"Authorization", "Bearer " + access_token},
    {"Accept", "application/vnd.github+json"},
    {"X-GitHub-Api-Version", "2022-11-28"},
    {"User-Agent", "DocForge/1.0"}
  };
  
  HTTPResponse response = http_get(url, headers);
  
  if (response.status_code != 200) {
    return {false, 0, "", "", "", "", "Profile fetch failed"};
  }
  
  json user_data = json::parse(response.body);
  
  return {
    true,
    user_data["id"],
    user_data["login"],
    user_data.value("name", ""),
    user_data.value("email", ""),
    user_data["avatar_url"],
    ""
  };
}
```

### **Token Encryption Implementation**
```cpp
// AES-256-GCM encryption for secure token storage
string encryptToken(string plaintext_token) {
  // Use environment variable for encryption key
  string encryption_key = getenv("TOKEN_ENCRYPTION_KEY"); // 64-char hex string
  
  // Generate random IV (12 bytes for GCM)
  unsigned char iv[12];
  RAND_bytes(iv, 12);
  
  // Encryption context
  EVP_CIPHER_CTX* ctx = EVP_CIPHER_CTX_new();
  EVP_EncryptInit_ex(ctx, EVP_aes_256_gcm(), NULL, NULL, NULL);
  EVP_EncryptInit_ex(ctx, NULL, NULL, hex_decode(encryption_key).data(), iv);
  
  // Encrypt the token
  unsigned char ciphertext[plaintext_token.length() + 16];
  int len, ciphertext_len;
  EVP_EncryptUpdate(ctx, ciphertext, &len, 
                   (unsigned char*)plaintext_token.c_str(), plaintext_token.length());
  ciphertext_len = len;
  
  EVP_EncryptFinal_ex(ctx, ciphertext + len, &len);
  ciphertext_len += len;
  
  // Get authentication tag
  unsigned char tag[16];
  EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_GET_TAG, 16, tag);
  
  EVP_CIPHER_CTX_free(ctx);
  
  // Format: base64(iv):base64(tag):base64(ciphertext)
  return base64_encode(iv, 12) + ":" + 
         base64_encode(tag, 16) + ":" + 
         base64_encode(ciphertext, ciphertext_len);
}
```

### **Redis Integration Storage**
```cpp
void storeGitHubIntegration(string cognito_user_id, GitHubUser github_user, 
                           string encrypted_token, GitHubTokenResponse token_response) {
  string redis_key = "user_integrations:" + cognito_user_id;
  string current_time = getCurrentISOTimestamp(); // e.g., "2025-07-24T15:30:00Z"
  
  // Store all GitHub integration data in Redis HSET
  redis.hset(redis_key, {
    {"github_connected", "true"},
    {"github_access_token", encrypted_token},
    {"github_user_id", to_string(github_user.id)},
    {"github_username", github_user.login},
    {"github_email", github_user.email},
    {"github_avatar_url", github_user.avatar_url},
    {"github_name", github_user.name},
    {"connected_at", current_time},
    {"last_sync", current_time},
    {"permissions", token_response.scope},
    {"token_type", token_response.token_type}
  });
  
  // Optional: Set expiration for the entire integration (e.g., 1 year)
  redis.expire(redis_key, 31536000); // 365 days
}
```

### **Frontend Redirect Logic**
```cpp
HTTPResponse redirectToFrontend(string path_with_params) {
  string frontend_base_url = "http://192.168.0.8:3000"; // Frontend URL
  string redirect_url = frontend_base_url + path_with_params;
  
  HTTPResponse response;
  response.status_code = 302; // HTTP Redirect
  response.headers["Location"] = redirect_url;
  response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
  
  return response;
}

// Usage examples:
redirectToFrontend("/settings/integrations?github_connected=true");           // Success
redirectToFrontend("/settings/integrations?error=invalid_state");             // Error
redirectToFrontend("/settings/integrations?github_error=access_denied");      // User denied
```

---

## **🔧 ENVIRONMENT VARIABLES REQUIRED**

```bash
# GitHub OAuth Configuration
GITHUB_CLIENT_ID=Ov23lieqWcs9gYeHXT9y
GITHUB_CLIENT_SECRET=your_github_client_secret_here  # NEVER expose to frontend!
GITHUB_CALLBACK_URL=http://192.168.0.6:8443/api/v1/integrations/github/auth/callback

# Token Encryption (Generate with: openssl rand -hex 32)
TOKEN_ENCRYPTION_KEY=abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890

# Frontend URL for redirects
FRONTEND_BASE_URL=http://192.168.0.8:3000

# AWS Cognito Configuration (for JWT validation)
COGNITO_REGION=af-south-1
COGNITO_USER_POOL_ID=af-south-1_HiAxSvfQU
COGNITO_CLIENT_ID=6h5ph7e1ghvkiq7ao3e3r67brl

# Redis Configuration
REDIS_HOST=192.168.0.6
REDIS_PORT=6379
REDIS_DATABASE=0
```

---

## **📊 EXPECTED RESPONSE FORMATS**

### **Callback Success Scenarios**
```http
# User successfully connected GitHub
HTTP/1.1 302 Found
Location: http://192.168.0.8:3000/settings/integrations?github_connected=true

# User denied GitHub access
HTTP/1.1 302 Found  
Location: http://192.168.0.8:3000/settings/integrations?github_error=access_denied

# Invalid or expired state parameter
HTTP/1.1 302 Found
Location: http://192.168.0.8:3000/settings/integrations?error=invalid_state

# GitHub API error during token exchange
HTTP/1.1 302 Found
Location: http://192.168.0.8:3000/settings/integrations?error=token_exchange_failed
```

---

## **🛡️ SECURITY CONSIDERATIONS**

### **Critical Security Requirements**
1. **JWT Validation**: Every request MUST validate Cognito JWT tokens
2. **State Validation**: OAuth state parameters MUST be validated and single-use
3. **Token Encryption**: GitHub access tokens MUST be encrypted before Redis storage  
4. **HTTPS Only**: All OAuth redirects MUST use HTTPS in production
5. **Secret Management**: `GITHUB_CLIENT_SECRET` MUST never be exposed to frontend
6. **TTL Management**: OAuth states MUST expire (max 10 minutes)

### **Rate Limiting Recommendations**
```cpp
// Suggested rate limits
- OAuth initiate: 10 requests/minute per user
- OAuth callback: 5 requests/minute per IP
- Token refresh: 20 requests/hour per user
```

### **Error Handling Best Practices**
- **Log all OAuth attempts** (successful and failed)
- **Never expose sensitive data** in API responses
- **Provide clear error messages** for frontend UX
- **Implement retry logic** for GitHub API failures

---

## **🧪 TESTING REQUIREMENTS**

### **Unit Tests Required**
```cpp
// JWT validation tests
test_validate_cognito_jwt_valid_token()
test_validate_cognito_jwt_expired_token()
test_validate_cognito_jwt_invalid_signature()

// State management tests  
test_generate_secure_state()
test_state_redis_storage_and_retrieval()
test_state_expiration_handling()

// Token encryption tests
test_encrypt_decrypt_token_roundtrip()
test_invalid_encryption_key_handling()

// GitHub API integration tests
test_token_exchange_success()
test_token_exchange_failure()
test_user_profile_fetch()
```

### **Integration Test Scenarios**
1. **Full OAuth Flow**: Initiate → GitHub auth → Callback → Redis storage
2. **Error Scenarios**: Invalid state, expired state, user denial, API failures
3. **Security Tests**: JWT tampering, state manipulation, CSRF attempts
4. **Performance Tests**: Redis operations, GitHub API latency

---

## **📈 MONITORING & OBSERVABILITY** 

### **Metrics to Track**
- OAuth initiation success/failure rates
- GitHub callback processing times
- Token encryption/decryption performance
- Redis operation latencies
- GitHub API response times

### **Logging Requirements**
```cpp
// Example log entries
[INFO] GitHub OAuth initiated for user: af-south-1_HiAxSvfQU_12345
[INFO] GitHub callback processed successfully, user: af-south-1_HiAxSvfQU_12345  
[ERROR] GitHub token exchange failed, code: invalid_client, user: af-south-1_HiAxSvfQU_12345
[WARN] OAuth state expired, state: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

---

## **🚀 DEPLOYMENT CHECKLIST**

- [ ] Environment variables configured and validated
- [ ] Redis connection tested and operational
- [ ] GitHub OAuth App configured with correct callback URL
- [ ] Cognito JWT validation working
- [ ] Token encryption/decryption tested
- [ ] Frontend redirect URLs confirmed
- [ ] Error handling and logging implemented
- [ ] Rate limiting configured
- [ ] Security headers added
- [ ] Load balancer health checks configured
- [ ] Monitoring and alerting setup

---

## **📞 SUPPORT & INTEGRATION**

**Frontend Integration Point**: The frontend will call the initiate endpoint and handle the redirect URLs returned by the callback endpoint.

**Redis Schema Compatibility**: This implementation uses standard Redis HSET operations compatible with existing DocForge data patterns.

**Error Handling**: All errors are communicated via HTTP status codes and redirect URLs with query parameters for frontend processing.

**Questions or clarifications needed?** Contact the frontend team or create an issue in this repository.

---

**Implementation Timeline**: These endpoints should be implemented as the **highest priority** for Phase 2 GitHub integration. All other GitHub features depend on this OAuth foundation.