# DocForge.online - JWT Claims Structure & Validation Analysis 🔍

## 🎯 **CRITICAL AUTHENTICATION DOCUMENTATION**

**Date**: July 20, 2025  
**Status**: 🚨 **REQUIRES VERIFICATION AGAINST AWS COGNITO DASHBOARD**  
**Priority**: **HIGH** - Authentication Security Foundation

---

## 🔐 **JWT CLAIMS STRUCTURE ANALYSIS**

### **1. EXPECTED CLAIMS STRUCTURE (AS DEFINED IN CODE)**

Our authentication system expects AWS Cognito JWT tokens to contain these claims:

```typescript
// src/lib/auth/jwt-validator.ts - Interface Definition
export interface CognitoTokenPayload {
  sub: string;                    // ✅ User's unique identifier (UUID)
  email: string;                  // ✅ User's email address  
  email_verified?: boolean;       // ⚠️  Email verification status
  username?: string;              // ⚠️  Standard username field
  'cognito:groups'?: string[];    // ⚠️  User groups/roles (if assigned)
  'cognito:username'?: string;    // ⚠️  Cognito-specific username
  exp: number;                    // ✅ Token expiration timestamp
  iat: number;                    // ✅ Token issued at timestamp  
  token_use: 'id' | 'access';     // ✅ Token type identifier
}
```

**Legend:**
- ✅ **Required Claims** - Always present, system depends on these
- ⚠️ **Optional Claims** - May or may not be present depending on Cognito configuration

---

## 🏗️ **CURRENT IMPLEMENTATION ANALYSIS**

### **A. JWT Validation Logic** (`src/lib/auth/jwt-validator.ts`)

#### **Basic Validation Requirements:**
```typescript
// Lines 95-105: Required claims validation
if (!payload.sub || !payload.exp || !payload.iat) {
  return {
    isValid: false,
    isExpired: false,
    payload,
    error: 'Token missing required claims'
  };
}
```

**CRITICAL**: Our system only **requires** 3 claims to consider a token valid:
1. `sub` (user identifier)
2. `exp` (expiration time)  
3. `iat` (issued at time)

#### **User Info Extraction:**
```typescript
// Lines 112-118: Extract user information
return {
  email: payload.email,
  username: payload['cognito:username'] || payload.username,
  groups: payload['cognito:groups'] || []
};
```

**IMPORTANT FALLBACK LOGIC:**
- Username: `cognito:username` → `username` → undefined
- Groups: `cognito:groups` → empty array `[]`
- Email: Direct extraction (no fallback)

---

### **B. Middleware Claims Usage** (`src/middleware.ts`)

#### **User Object Construction:**
```typescript
// Lines 87-95: Middleware user object
locals.user = {
  sub: validation.payload.sub,
  email: validation.payload.email,
  username: validation.payload['cognito:username'] || validation.payload.username,
  emailVerified: validation.payload.email_verified || false,
  groups: validation.payload['cognito:groups'] || [],
  tokenUse: validation.payload.token_use
}
```

**MIDDLEWARE ASSUMPTIONS:**
- `email` is always present
- `email_verified` defaults to `false` if missing
- `groups` defaults to empty array if missing
- `username` has dual fallback logic

---

### **C. Authentication Checker Usage** (`src/lib/auth/auth-checker.ts`)

#### **User Profile Extraction:**
```typescript
// Lines 144-149: Auth checker user info
user = {
  email: validation.payload.email,
  username: validation.payload['cognito:username'] || validation.payload.username,  
  groups: validation.payload['cognito:groups'] || []
}
```

**CONSISTENCY CHECK**: ✅ Same extraction logic as middleware

---

## 🚨 **CRITICAL MISMATCHES & ISSUES**

### **1. TOKEN STORAGE vs MIDDLEWARE EXPECTATION**

**MAJOR ISSUE**: Storage/Cookie Inconsistency

```typescript
// Login stores in localStorage/sessionStorage:
storage.setItem('accessToken', accessToken);
storage.setItem('idToken', idToken);
storage.setItem('refreshToken', refreshToken);

// But middleware looks for cookies:
const authToken = cookies.get('cognito-auth-token')
```

**IMPACT**: 🔴 **AUTHENTICATION WILL FAIL** - Middleware can't find tokens stored in browser storage!

---

### **2. TOKEN TYPE CONFUSION**

**ID Token vs Access Token Usage:**

#### **ID Token** (Recommended for user info):
```json
{
  "sub": "12345678-1234-1234-1234-123456789012",
  "email": "user@example.com", 
  "email_verified": true,
  "cognito:username": "testuser",
  "cognito:groups": ["admin", "users"],
  "token_use": "id",
  "exp": 1642723200,
  "iat": 1642636800
}
```

#### **Access Token** (For API authorization):
```json
{
  "sub": "12345678-1234-1234-1234-123456789012",
  "client_id": "6h5ph7e1ghvkiq7ao3e3r67brl",
  "scope": "aws.cognito.signin.user.admin",
  "token_use": "access", 
  "exp": 1642723200,
  "iat": 1642636800
}
```

**ISSUE**: Access tokens typically don't contain `email`, `cognito:username`, or `cognito:groups`!

---

### **3. CLAIMS VERIFICATION REQUIREMENTS**

#### **CLAIMS TO VERIFY AGAINST AWS COGNITO DASHBOARD:**

1. **User Pool Configuration** (`af-south-1_HiAxSvfQU`):
   - ✅ Email as username enabled?
   - ✅ Email verification required?
   - ✅ Username attributes configuration
   - ✅ Required vs optional attributes

2. **App Client Configuration** (`6h5ph7e1ghvkiq7ao3e3r67brl`):
   - ✅ Read/write attributes permissions
   - ✅ Token validity periods
   - ✅ OAuth 2.0 grant types enabled

3. **Groups Configuration**:
   - ✅ Are groups configured in User Pool?
   - ✅ What group names are used?
   - ✅ How are groups assigned to users?

4. **Custom Attributes**:
   - ✅ Any custom attributes configured?
   - ✅ Are they included in ID token?

---

## 🧪 **TESTING & DEBUGGING REQUIREMENTS**

### **IMMEDIATE ACTIONS NEEDED:**

#### **1. Add JWT Payload Logging** (Temporary Debug Code)

Add to `jwt-validator.ts` line 46:
```typescript
const payload = JSON.parse(atob(parts[1]));

// 🔍 TEMPORARY: Log actual token structure
console.log('🔍 [JWT DEBUG] Raw Token Payload:', JSON.stringify(payload, null, 2));
console.log('🔍 [JWT DEBUG] Token Type:', payload.token_use);
console.log('🔍 [JWT DEBUG] Available Claims:', Object.keys(payload));

return { header, payload };
```

#### **2. Test Both Token Types**

```javascript
// Test ID Token structure
const { idToken } = validation;
console.log('🆔 [ID TOKEN]:', jwtValidator.decodeToken(idToken));

// Test Access Token structure  
const { accessToken } = validation;
console.log('🔑 [ACCESS TOKEN]:', jwtValidator.decodeToken(accessToken));
```

#### **3. Verify Against Cognito Dashboard**

**CHECK THESE SETTINGS IN AWS COGNITO:**

1. **User Pool → General Settings**:
   - Attributes: Which are required/optional?
   - Username configuration: Email, phone, or custom?

2. **User Pool → App Clients**:
   - Read attributes: What's enabled?
   - Write attributes: What's enabled?  
   - OAuth 2.0 settings

3. **User Pool → Users and Groups**:
   - Groups: Are any groups created?
   - Users: What attributes are populated?

---

## 🔧 **REQUIRED FIXES**

### **1. CRITICAL: Fix Token Storage/Cookie Mismatch**

#### **Option A: Store in Cookies (Recommended for SSR)**
```typescript
// In login success handler:
document.cookie = `cognito-auth-token=${idToken}; path=/; secure; httponly`;
```

#### **Option B: Update Middleware to Check Storage**
```typescript
// Check both cookie and storage
const authToken = cookies.get('cognito-auth-token') || 
  context.request.headers.get('authorization')?.replace('Bearer ', '');
```

### **2. Use ID Token for User Info**

```typescript
// Prioritize ID token for user profile information
const userToken = idToken || accessToken; // ID token first
const validation = jwtValidator.validateTokenBasic(userToken);
```

### **3. Add Robust Claim Validation**

```typescript
// Enhanced claim validation
function validateCognitoClaims(payload: any): boolean {
  // Required claims
  if (!payload.sub || !payload.exp || !payload.iat) return false;
  
  // ID token should have user info
  if (payload.token_use === 'id') {
    if (!payload.email) return false;
  }
  
  // Validate exp/iat are numbers
  if (typeof payload.exp !== 'number' || typeof payload.iat !== 'number') return false;
  
  return true;
}
```

---

## 📋 **VERIFICATION CHECKLIST**

### **AWS Cognito Dashboard Verification:**

- [ ] **User Pool Attributes**: Check required vs optional attributes
- [ ] **App Client Permissions**: Verify read/write attribute permissions  
- [ ] **Group Configuration**: Document any groups and their structure
- [ ] **Custom Attributes**: Check for any custom attributes in tokens
- [ ] **Token Validity**: Confirm access/ID token expiration settings
- [ ] **OAuth Settings**: Verify enabled grant types and scopes

### **Code Verification:**

- [ ] **Fix Storage Mismatch**: Cookies vs localStorage inconsistency
- [ ] **Add Debug Logging**: Temporary payload logging for verification
- [ ] **Test Both Token Types**: Verify ID vs access token structure  
- [ ] **Enhance Validation**: Add robust claim validation
- [ ] **Document Real Structure**: Update interfaces based on actual tokens

### **Testing Verification:**

- [ ] **Login Flow**: Test complete authentication with logging
- [ ] **Token Inspection**: Decode and examine actual token payloads
- [ ] **Middleware Protection**: Test protected route access
- [ ] **Claims Extraction**: Verify user info extraction works
- [ ] **Edge Cases**: Test missing optional claims scenarios

---

## 🚨 **SECURITY IMPLICATIONS**

### **Current Security Status:**
- ✅ **JWT Expiration**: Properly validated
- ✅ **Token Format**: Proper JWT structure validation
- ❌ **Token Storage**: Storage/cookie mismatch creates auth bypass
- ❌ **Signature Verification**: Not implemented (basic validation only)
- ❌ **Issuer Validation**: Not verifying AWS Cognito as issuer
- ❌ **Audience Validation**: Not verifying client ID in tokens

### **Security Recommendations:**
1. **Implement JWKS Validation**: Verify token signatures against Cognito public keys
2. **Add Issuer/Audience Checks**: Validate `iss` and `aud` claims
3. **Use HTTP-Only Cookies**: Store tokens securely server-side
4. **Implement Token Refresh**: Handle token expiration gracefully
5. **Add Rate Limiting**: Prevent auth bypass attempts

---

## 🎯 **NEXT IMMEDIATE STEPS**

1. **🔴 URGENT**: Fix storage/cookie mismatch - authentication currently broken
2. **🟡 HIGH**: Add debug logging to see actual JWT structure
3. **🟡 HIGH**: Verify against AWS Cognito dashboard settings  
4. **🟢 MEDIUM**: Enhance JWT validation with signature verification
5. **🟢 MEDIUM**: Update documentation with real claim structure

**ESTIMATED TIME**: 2-3 hours to fix critical issues and verify configuration

---

**⚠️ WARNING: Authentication system has critical storage mismatch that prevents middleware from working. This must be fixed before proceeding with any other features.**