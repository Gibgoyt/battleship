# DocForge.online - Phase 1 Implementation Plan

## 🎯 **MISSION: Get Complete Auth & User Flow Working FAST!**

**REVISED Goal**: Complete Phase 1 in 9-13 hours with fully functional authentication, user onboarding, payment integration, and basic GitHub connectivity. This frontend connects to your C++ uWebSockets backend - NO backend processing happens in Astro!

## 🏗️ **Local Development Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                     Development Network                     │
├─────────────────────────────────────────────────────────────┤
│ Frontend (Astro + Qwik)                                     │
│ • Dev: http://192.168.0.8:3000 (already working!)          │
│ • Prod Test: npm run wrangler-dev (192.168.0.8:3001)      │
├─────────────────────────────────────────────────────────────┤
│ Backend (uWebSockets + Redis)                               │
│ • API: http://192.168.0.6:8443                             │
│ • WebSocket: ws://192.168.0.6:8443/ws                      │
└─────────────────────────────────────────────────────────────┘
```

## ⚡ **SPEED RUN CHECKLIST**

### **Task 1: Environment Setup (30 min)** 🔧
- [ ] Create `wrangler.toml` for local development
- [ ] Add missing dependencies for GitHub + WebSocket + Redis
- [ ] Configure environment variables
- [ ] Test wrangler LAN access with `--host 0.0.0.0`

### **Task 2: Svelte Login Validation & Migration (1-2 hours)** 🔐
- [ ] Test current Svelte login form thoroughly
- [ ] Create equivalent standard JS login form
- [ ] Migrate Svelte functionality to standard JS
- [ ] Ensure feature parity and styling consistency

### **Task 3: User Registration & Onboarding (3-4 hours)** 📝
- [ ] Create sign-up form with validation (`src/pages/auth/sign-up/`)
- [ ] Implement email verification with OTP system
- [ ] Build plan selection interface (Free Trial/Paid)
- [ ] Create multi-step onboarding flow with progress indicators
- [ ] Add user profile completion steps

### **Task 4: PayFast Payment Integration (2-3 hours)** 💳
- [ ] Design payment plan selection UI
- [ ] Create backend communication for PayFast UUID generation
- [ ] Implement hosted payment page redirect flow
- [ ] Add payment confirmation and status tracking
- [ ] Test complete payment flow with C++ backend

### **Task 5: GitHub Repository Connection (2-3 hours)** 📁
- [ ] Build GitHub OAuth integration (connection only)
- [ ] Create repository listing and selection interface  
- [ ] Add basic repository metadata storage
- [ ] Test repository access permissions (NO documentation generation yet)

### **Task 6: Security & Middleware Enhancement (1-2 hours)** 🔒
- [ ] Update Astro middleware with proper auth token validation
- [ ] Add client-side route protection for Qwik SPAs
- [ ] Implement token refresh logic and error handling
- [ ] Create protected route boundaries and redirects

---

## 🛠️ **DETAILED IMPLEMENTATION GUIDE**

### **Step 1: Environment Setup**

#### 1.1 Create Wrangler Configuration
```toml
# wrangler.toml
name = "docforge-frontend"
compatibility_date = "2024-01-15"

[build]
command = "npm run build"

[dev]
host = "0.0.0.0"
port = 8444
local_protocol = "http"

[[d1_databases]]
binding = "DB"
database_name = "docforge-dev"
database_id = "your-d1-database-id"

[vars]
BACKEND_API_URL = "http://192.168.0.6:8443"
BACKEND_WS_URL = "ws://192.168.0.6:8443/ws"
GITHUB_CLIENT_ID = "your-github-client-id"
```

#### 1.2 Add Dependencies
```bash
npm install @octokit/rest ws ioredis @types/ws
```

#### 1.3 Environment Variables
```bash
# .env.local
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
BACKEND_API_URL=http://192.168.0.6:8443
BACKEND_WS_URL=ws://192.168.0.6:8443/ws
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
PAYFAST_MERCHANT_ID=your_payfast_merchant_id
PAYFAST_MERCHANT_KEY=your_payfast_merchant_key
```

### **Step 2: Svelte Login Validation & Migration**

#### 2.1 Test Current Svelte Login
Navigate to `http://192.168.0.8:3000/auth/sign-in/svelte/` and thoroughly test:
- Email/password validation
- Remember me functionality  
- Error message display
- Success redirect to dashboard
- Token storage (localStorage vs sessionStorage)

#### 2.2 Create Standard JS Login Form
```typescript
// src/components/auth/StandardLoginForm.astro
---
// No JavaScript needed in frontmatter for pure client-side form
---
<div class="login-form-container">
  <form id="loginForm" class="space-y-6">
    <!-- Same HTML structure as Svelte version -->
    <div>
      <label for="email">Email address</label>
      <input id="email" type="email" required />
    </div>
    <div>
      <label for="password">Password</label>
      <input id="password" type="password" required />
    </div>
    <div class="flex items-center justify-between">
      <input id="rememberMe" type="checkbox" />
      <label for="rememberMe">Remember me</label>
    </div>
    <button type="submit">Sign in</button>
  </form>
</div>

<script>
  // Equivalent JavaScript functionality to Svelte version
  import { cognitoConfig } from '../../lib/cognito-config.ts';
  
  document.addEventListener('DOMContentLoaded', async () => {
    // Same initialization logic as Svelte
    const cognitoModule = await import('amazon-cognito-identity-js');
    const { CognitoUserPool, CognitoUser, AuthenticationDetails } = cognitoModule;
    
    const userPool = new CognitoUserPool({
      UserPoolId: cognitoConfig.userPoolId,
      ClientId: cognitoConfig.userPoolWebClientId
    });

    document.getElementById('loginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      // Same authentication logic as Svelte version
    });
  });
</script>
</div>
```

### **Step 3: User Registration & Onboarding System**

#### 3.1 Sign-Up Form with Validation
```typescript
// src/pages/auth/sign-up/index.astro
---
import Layout from '../../../layouts/AuthLayout.astro';
---
<Layout title="Create Account - DocForge">
  <div class="sign-up-container">
    <form id="signUpForm" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label for="firstName">First Name</label>
          <input id="firstName" type="text" required />
        </div>
        <div>
          <label for="lastName">Last Name</label>
          <input id="lastName" type="text" required />
        </div>
      </div>
      
      <div>
        <label for="email">Email Address</label>
        <input id="email" type="email" required />
      </div>
      
      <div>
        <label for="password">Password</label>
        <input id="password" type="password" required />
        <div class="password-requirements">
          <p class="text-sm text-gray-600">Password must contain:</p>
          <ul class="text-xs text-gray-500">
            <li>• At least 8 characters</li>
            <li>• One uppercase letter</li>
            <li>• One lowercase letter</li>
            <li>• One number</li>
            <li>• One special character</li>
          </ul>
        </div>
      </div>
      
      <div>
        <label for="confirmPassword">Confirm Password</label>
        <input id="confirmPassword" type="password" required />
      </div>
      
      <div class="flex items-center">
        <input id="agreeTerms" type="checkbox" required />
        <label for="agreeTerms" class="ml-2">
          I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>
        </label>
      </div>
      
      <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-lg">
        Create Account
      </button>
    </form>
  </div>

  <script>
    document.getElementById('signUpForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Validate password requirements
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      
      if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
      }
      
      if (!validatePassword(password)) {
        showError('Password does not meet requirements');
        return;
      }
      
      // Create user with AWS Cognito
      try {
        const cognitoModule = await import('amazon-cognito-identity-js');
        const { CognitoUserPool } = cognitoModule;
        
        const userPool = new CognitoUserPool({
          UserPoolId: cognitoConfig.userPoolId,
          ClientId: cognitoConfig.userPoolWebClientId
        });
        
        userPool.signUp(
          email,
          password,
          [
            { Name: 'given_name', Value: firstName },
            { Name: 'family_name', Value: lastName },
            { Name: 'email', Value: email }
          ],
          null,
          (err, result) => {
            if (err) {
              showError(err.message);
              return;
            }
            
            // Redirect to email verification
            window.location.href = `/auth/verify-email?email=${encodeURIComponent(email)}`;
          }
        );
      } catch (error) {
        showError('Registration failed. Please try again.');
      }
    });
    
    function validatePassword(password) {
      const requirements = [
        /.{8,}/, // At least 8 characters
        /[A-Z]/, // Uppercase letter
        /[a-z]/, // Lowercase letter
        /\d/,    // Number
        /[^A-Za-z0-9]/ // Special character
      ];
      
      return requirements.every(req => req.test(password));
    }
  </script>
</Layout>
```

#### 3.2 Email Verification with OTP
```typescript
// src/pages/auth/verify-email/index.astro
---
import Layout from '../../../layouts/AuthLayout.astro';
---
<Layout title="Verify Email - DocForge">
  <div class="verify-email-container">
    <div class="text-center mb-8">
      <h2 class="text-2xl font-bold">Verify Your Email</h2>
      <p class="text-gray-600">
        We've sent a verification code to <span id="userEmail" class="font-medium"></span>
      </p>
    </div>
    
    <form id="verifyForm" class="space-y-6">
      <div>
        <label for="verificationCode">Verification Code</label>
        <input 
          id="verificationCode" 
          type="text" 
          maxlength="6" 
          placeholder="Enter 6-digit code"
          class="text-center text-2xl tracking-widest"
          required 
        />
      </div>
      
      <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-lg">
        Verify Email
      </button>
      
      <div class="text-center">
        <button type="button" id="resendCode" class="text-blue-600 hover:text-blue-500">
          Resend verification code
        </button>
      </div>
    </form>
  </div>

  <script>
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    document.getElementById('userEmail').textContent = email;
    
    document.getElementById('verifyForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const code = document.getElementById('verificationCode').value;
      
      try {
        const cognitoModule = await import('amazon-cognito-identity-js');
        const { CognitoUserPool, CognitoUser } = cognitoModule;
        
        const userPool = new CognitoUserPool({
          UserPoolId: cognitoConfig.userPoolId,
          ClientId: cognitoConfig.userPoolWebClientId
        });
        
        const cognitoUser = new CognitoUser({
          Username: email,
          Pool: userPool
        });
        
        cognitoUser.confirmRegistration(code, true, (err, result) => {
          if (err) {
            showError(err.message);
            return;
          }
          
          showSuccess('Email verified successfully!');
          setTimeout(() => {
            window.location.href = '/auth/onboarding/plan-selection';
          }, 1500);
        });
      } catch (error) {
        showError('Verification failed. Please try again.');
      }
    });
    
    document.getElementById('resendCode').addEventListener('click', async () => {
      // Resend verification code logic
    });
  </script>
</Layout>
```

#### 3.3 Plan Selection Interface
```typescript
// src/pages/auth/onboarding/plan-selection/index.astro
---
import Layout from '../../../../layouts/AuthLayout.astro';
---
<Layout title="Choose Your Plan - DocForge">
  <div class="plan-selection-container">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-bold">Choose Your Plan</h2>
      <p class="text-gray-600 mt-4">Start with a free trial or select a paid plan</p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
      <!-- Free Trial Plan -->
      <div class="plan-card" data-plan="free-trial">
        <div class="plan-header">
          <h3 class="text-xl font-bold">Free Trial</h3>
          <div class="price">
            <span class="text-3xl font-bold">R0</span>
            <span class="text-gray-500">/month</span>
          </div>
        </div>
        <ul class="plan-features">
          <li>✓ 3 repositories</li>
          <li>✓ Basic documentation generation</li>
          <li>✓ 14-day trial period</li>
          <li>✓ Email support</li>
        </ul>
        <button class="plan-button" data-plan="free-trial">
          Start Free Trial
        </button>
      </div>
      
      <!-- Starter Plan -->
      <div class="plan-card popular" data-plan="starter">
        <div class="popular-badge">Most Popular</div>
        <div class="plan-header">
          <h3 class="text-xl font-bold">Starter</h3>
          <div class="price">
            <span class="text-3xl font-bold">R199</span>
            <span class="text-gray-500">/month</span>
          </div>
        </div>
        <ul class="plan-features">
          <li>✓ 10 repositories</li>
          <li>✓ Advanced documentation features</li>
          <li>✓ Priority support</li>
          <li>✓ Custom templates</li>
        </ul>
        <button class="plan-button" data-plan="starter">
          Choose Starter
        </button>
      </div>
      
      <!-- Pro Plan -->
      <div class="plan-card" data-plan="pro">
        <div class="plan-header">
          <h3 class="text-xl font-bold">Professional</h3>
          <div class="price">
            <span class="text-3xl font-bold">R499</span>
            <span class="text-gray-500">/month</span>
          </div>
        </div>
        <ul class="plan-features">
          <li>✓ Unlimited repositories</li>
          <li>✓ Team collaboration</li>
          <li>✓ API access</li>
          <li>✓ Phone support</li>
        </ul>
        <button class="plan-button" data-plan="pro">
          Choose Pro
        </button>
      </div>
    </div>
  </div>

  <script>
    document.querySelectorAll('.plan-button').forEach(button => {
      button.addEventListener('click', (e) => {
        const plan = e.target.dataset.plan;
        
        if (plan === 'free-trial') {
          // Set user to free trial and continue onboarding
          setUserPlan('free-trial');
          window.location.href = '/auth/onboarding/profile-setup';
        } else {
          // Redirect to payment with selected plan
          window.location.href = `/auth/onboarding/payment?plan=${plan}`;
        }
      });
    });
    
    async function setUserPlan(plan) {
      // Store plan selection temporarily or call backend
      localStorage.setItem('selectedPlan', plan);
    }
  </script>
</Layout>
```

### **Step 4: PayFast Payment Integration**

#### 4.1 Payment Interface
```typescript
// src/pages/auth/onboarding/payment/index.astro
---
import Layout from '../../../../layouts/AuthLayout.astro';
---
<Layout title="Payment - DocForge">
  <div class="payment-container">
    <div class="payment-summary">
      <h2 class="text-2xl font-bold mb-6">Complete Your Payment</h2>
      
      <div class="selected-plan-summary">
        <div class="plan-details">
          <h3 id="planName" class="text-xl font-semibold"></h3>
          <p id="planPrice" class="text-2xl font-bold text-blue-600"></p>
          <p class="text-gray-600">Billed monthly</p>
        </div>
      </div>
      
      <div class="payment-methods">
        <h4 class="font-semibold mb-4">Payment Method</h4>
        <div class="payment-options">
          <label class="payment-option">
            <input type="radio" name="paymentMethod" value="payfast" checked />
            <span>Credit Card / EFT (via PayFast)</span>
          </label>
        </div>
      </div>
      
      <button id="proceedPayment" class="w-full bg-blue-600 text-white py-3 rounded-lg mt-6">
        Proceed to Payment
      </button>
    </div>
  </div>

  <script>
    const urlParams = new URLSearchParams(window.location.search);
    const selectedPlan = urlParams.get('plan');
    
    const plans = {
      starter: { name: 'Starter Plan', price: 'R199' },
      pro: { name: 'Professional Plan', price: 'R499' }
    };
    
    // Display selected plan
    const plan = plans[selectedPlan];
    document.getElementById('planName').textContent = plan.name;
    document.getElementById('planPrice').textContent = plan.price;
    
    document.getElementById('proceedPayment').addEventListener('click', async () => {
      try {
        // Call backend to generate PayFast UUID
        const response = await fetch(`${BACKEND_API_URL}/api/payments/create-payfast-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`
          },
          body: JSON.stringify({
            plan: selectedPlan,
            amount: selectedPlan === 'starter' ? 199 : 499,
            currency: 'ZAR'
          })
        });
        
        const data = await response.json();
        
        if (data.success && data.payfast_uuid) {
          // Redirect to PayFast hosted payment page
          window.location.href = `https://www.payfast.co.za/eng/process?uuid=${data.payfast_uuid}`;
        } else {
          showError('Failed to initialize payment. Please try again.');
        }
      } catch (error) {
        showError('Payment initialization failed. Please try again.');
      }
    });
    
    function getAuthToken() {
      return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    }
  </script>
</Layout>
```

#### 4.2 Payment Confirmation Handler
```typescript
// src/pages/auth/onboarding/payment/confirmation/index.astro
---
import Layout from '../../../../../layouts/AuthLayout.astro';
---
<Layout title="Payment Confirmation - DocForge">
  <div class="payment-confirmation-container">
    <div id="loadingState" class="text-center">
      <div class="spinner"></div>
      <h2 class="text-xl font-semibold mt-4">Confirming your payment...</h2>
      <p class="text-gray-600">Please wait while we verify your transaction.</p>
    </div>
    
    <div id="successState" class="text-center hidden">
      <div class="success-icon">✓</div>
      <h2 class="text-2xl font-bold text-green-600 mt-4">Payment Successful!</h2>
      <p class="text-gray-600 mt-2">Your account has been activated.</p>
      <button id="continueOnboarding" class="bg-blue-600 text-white px-6 py-3 rounded-lg mt-6">
        Continue Setup
      </button>
    </div>
    
    <div id="errorState" class="text-center hidden">
      <div class="error-icon">✗</div>
      <h2 class="text-2xl font-bold text-red-600 mt-4">Payment Failed</h2>
      <p class="text-gray-600 mt-2" id="errorMessage"></p>
      <button id="retryPayment" class="bg-blue-600 text-white px-6 py-3 rounded-lg mt-6">
        Try Again
      </button>
    </div>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentId = urlParams.get('payment_id');
      const status = urlParams.get('status');
      
      if (!paymentId) {
        showError('Invalid payment confirmation link.');
        return;
      }
      
      try {
        // Verify payment status with backend
        const response = await fetch(`${BACKEND_API_URL}/api/payments/verify/${paymentId}`, {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`
          }
        });
        
        const data = await response.json();
        
        if (data.success && data.payment_verified) {
          showSuccess();
        } else {
          showError(data.error || 'Payment verification failed.');
        }
      } catch (error) {
        showError('Failed to verify payment. Please contact support.');
      }
    });
    
    function showSuccess() {
      document.getElementById('loadingState').classList.add('hidden');
      document.getElementById('successState').classList.remove('hidden');
    }
    
    function showError(message) {
      document.getElementById('loadingState').classList.add('hidden');
      document.getElementById('errorState').classList.remove('hidden');
      document.getElementById('errorMessage').textContent = message;
    }
    
    document.getElementById('continueOnboarding').addEventListener('click', () => {
      window.location.href = '/auth/onboarding/profile-setup';
    });
    
    document.getElementById('retryPayment').addEventListener('click', () => {
      window.location.href = '/auth/onboarding/plan-selection';
    });
  </script>
</Layout>
```

### **Step 5: GitHub Repository Connection**

#### 5.1 GitHub OAuth Integration
```typescript
// src/lib/auth/github-oauth.ts
export class GitHubOAuthService {
  private clientId: string;
  private redirectUri: string;

  constructor() {
    this.clientId = import.meta.env.GITHUB_CLIENT_ID;
    this.redirectUri = `${window.location.origin}/auth/github/callback`;
  }

  initiateOAuth(): void {
    const scope = 'repo read:user user:email';
    const state = this.generateState();
    
    // Store state for verification
    sessionStorage.setItem('github_oauth_state', state);
    
    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', this.clientId);
    authUrl.searchParams.set('redirect_uri', this.redirectUri);
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('state', state);
    
    window.location.href = authUrl.toString();
  }

  async handleCallback(code: string, state: string): Promise<{
    success: boolean;
    user?: any;
    repositories?: any[];
    error?: string;
  }> {
    // Verify state
    const storedState = sessionStorage.getItem('github_oauth_state');
    if (state !== storedState) {
      return { success: false, error: 'Invalid state parameter' };
    }

    try {
      // Exchange code for access token via backend
      const response = await fetch(`${BACKEND_API_URL}/api/github/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ code, state })
      });

      const data = await response.json();

      if (data.success) {
        // Store GitHub access token
        localStorage.setItem('github_access_token', data.github_token);
        
        return {
          success: true,
          user: data.user,
          repositories: data.repositories
        };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Failed to authenticate with GitHub' };
    }
  }

  private generateState(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private getAuthToken(): string {
    return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  }
}
```

#### 5.2 Repository Selection Interface
```typescript
// src/pages/auth/onboarding/github-connection/index.astro
---
import Layout from '../../../../layouts/AuthLayout.astro';
---
<Layout title="Connect GitHub - DocForge">
  <div class="github-connection-container">
    <div class="text-center mb-8">
      <h2 class="text-3xl font-bold">Connect Your GitHub Account</h2>
      <p class="text-gray-600 mt-4">
        Connect your GitHub account to access your repositories for documentation generation.
      </p>
    </div>
    
    <div id="connectionStep" class="connection-step">
      <div class="github-connect-card">
        <div class="github-icon">
          <svg class="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </div>
        <h3 class="text-xl font-semibold mt-4">Connect GitHub Account</h3>
        <p class="text-gray-600 mt-2">
          We'll access your repositories to generate documentation. You can disconnect at any time.
        </p>
        <button id="connectGitHub" class="bg-gray-900 text-white px-6 py-3 rounded-lg mt-6">
          Connect GitHub
        </button>
      </div>
    </div>
    
    <div id="repositoryStep" class="repository-step hidden">
      <h3 class="text-xl font-semibold mb-6">Select Repositories</h3>
      <div class="repository-list" id="repositoryList">
        <!-- Repositories will be loaded here -->
      </div>
      <button id="continueSetup" class="bg-blue-600 text-white px-6 py-3 rounded-lg mt-6">
        Continue Setup
      </button>
    </div>
  </div>

  <script>
    import { GitHubOAuthService } from '../../../../lib/auth/github-oauth.ts';
    
    const githubOAuth = new GitHubOAuthService();
    let selectedRepositories = [];
    
    document.getElementById('connectGitHub').addEventListener('click', () => {
      githubOAuth.initiateOAuth();
    });
    
    // Handle OAuth callback
    if (window.location.pathname === '/auth/github/callback') {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      
      if (code && state) {
        handleGitHubCallback(code, state);
      }
    }
    
    async function handleGitHubCallback(code, state) {
      try {
        const result = await githubOAuth.handleCallback(code, state);
        
        if (result.success) {
          showRepositorySelection(result.repositories);
        } else {
          showError(result.error);
        }
      } catch (error) {
        showError('Failed to connect GitHub account');
      }
    }
    
    function showRepositorySelection(repositories) {
      document.getElementById('connectionStep').classList.add('hidden');
      document.getElementById('repositoryStep').classList.remove('hidden');
      
      const repositoryList = document.getElementById('repositoryList');
      repositoryList.innerHTML = repositories.map(repo => `
        <div class="repository-item">
          <input type="checkbox" id="repo-${repo.id}" value="${repo.id}" 
                 data-repo='${JSON.stringify(repo)}' />
          <label for="repo-${repo.id}">
            <div class="repo-info">
              <h4 class="font-semibold">${repo.full_name}</h4>
              <p class="text-gray-600">${repo.description || 'No description'}</p>
              <div class="repo-meta">
                <span class="language">${repo.language || 'Unknown'}</span>
                <span class="updated">Updated ${new Date(repo.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          </label>
        </div>
      `).join('');
      
      // Add event listeners for repository selection
      repositoryList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectedRepositories);
      });
    }
    
    function updateSelectedRepositories() {
      const checkboxes = document.querySelectorAll('#repositoryList input[type="checkbox"]:checked');
      selectedRepositories = Array.from(checkboxes).map(cb => JSON.parse(cb.dataset.repo));
    }
    
    document.getElementById('continueSetup').addEventListener('click', async () => {
      if (selectedRepositories.length === 0) {
        showError('Please select at least one repository');
        return;
      }
      
      try {
        // Save selected repositories to backend
        const response = await fetch(`${BACKEND_API_URL}/api/repositories/save-selected`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`
          },
          body: JSON.stringify({
            repositories: selectedRepositories
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Complete onboarding
          window.location.href = '/app/dashboard';
        } else {
          showError(data.error || 'Failed to save repositories');
        }
      } catch (error) {
        showError('Failed to save repository selection');
      }
    });
  </script>
</Layout>
```

### **Step 6: Security & Middleware Enhancement**

#### 6.1 Enhanced Astro Middleware with Token Validation
```typescript
// src/middleware.ts (Updated)
import { defineMiddleware } from 'astro:middleware';
import { verifyJWT } from './lib/auth/jwt-utils';

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies } = context;
  const { pathname } = url;

  console.log(`[MIDDLEWARE] Checking path: ${pathname}`);

  // Define public paths that don't require authentication
  const publicPaths = [
    '/',
    '/about',
    '/pricing',
    '/features',
    '/auth/sign-in',
    '/auth/sign-up',
    '/auth/verify-email',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/terms',
    '/privacy'
  ];

  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  );

  if (isPublicPath) {
    return next();
  }

  // Check for authentication token
  const authToken = getTokenFromRequest(context);
  
  if (!authToken) {
    console.log(`[MIDDLEWARE] No auth token found, redirecting to sign-in`);
    return Response.redirect(new URL('/auth/sign-in', url), 302);
  }

  // Verify token validity
  try {
    const isValid = await verifyJWT(authToken);
    
    if (!isValid) {
      console.log(`[MIDDLEWARE] Invalid token, redirecting to sign-in`);
      return Response.redirect(new URL('/auth/sign-in', url), 302);
    }

    // Token is valid, allow request to proceed
    console.log(`[MIDDLEWARE] Token valid, allowing access to ${pathname}`);
    return next();

  } catch (error) {
    console.error(`[MIDDLEWARE] Token verification failed:`, error);
    return Response.redirect(new URL('/auth/sign-in', url), 302);
  }
});

function getTokenFromRequest(context) {
  // Try to get token from various sources
  
  // 1. Authorization header
  const authHeader = context.request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 2. Cookie
  const tokenCookie = context.cookies.get('accessToken');
  if (tokenCookie) {
    return tokenCookie.value;
  }

  // 3. Check if we can access localStorage/sessionStorage (client-side only)
  // This will be handled by client-side code

  return null;
}
```

#### 6.2 Client-Side Route Protection for Qwik SPAs
```typescript
// src/lib/auth/route-guard.ts
export class RouteGuard {
  private static instance: RouteGuard;
  
  static getInstance(): RouteGuard {
    if (!RouteGuard.instance) {
      RouteGuard.instance = new RouteGuard();
    }
    return RouteGuard.instance;
  }

  async checkAuthentication(): Promise<boolean> {
    const token = this.getStoredToken();
    
    if (!token) {
      return false;
    }

    try {
      // Verify token with backend
      const response = await fetch(`${BACKEND_API_URL}/api/auth/verify-token`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.valid === true;
      }

      return false;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  }

  async refreshToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${BACKEND_API_URL}/api/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.access_token) {
          this.storeToken(data.access_token);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  private getStoredToken(): string | null {
    return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
  }

  private storeToken(token: string): void {
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('accessToken', token);
  }

  clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('rememberMe');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
  }

  redirectToLogin(): void {
    this.clearTokens();
    window.location.href = '/auth/sign-in';
  }
}
```

#### 6.3 Enhanced Qwik App with Route Protection
```tsx
// src/applications-qwik/app/App.tsx (Updated)
import { component$, useSignal, useTask$, $ } from '@builder.io/qwik';
import { RouteGuard } from '../../lib/auth/route-guard';

export const App = component$<{
  initialRoute: string;
  initialTheme: 'light' | 'dark';
  initialSidebarOpen: boolean;
  initialIsMobile: boolean;
}>(({ initialRoute, initialTheme, initialSidebarOpen, initialIsMobile }) => {
  const isAuthenticated = useSignal(false);
  const isLoading = useSignal(true);
  const currentRoute = useSignal(initialRoute);

  const routeGuard = RouteGuard.getInstance();

  // Check authentication on app load
  useTask$(async () => {
    try {
      const authResult = await routeGuard.checkAuthentication();
      
      if (!authResult) {
        // Try to refresh token
        const refreshResult = await routeGuard.refreshToken();
        isAuthenticated.value = refreshResult;
        
        if (!refreshResult) {
          // Redirect to login if both checks fail
          routeGuard.redirectToLogin();
          return;
        }
      } else {
        isAuthenticated.value = true;
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      routeGuard.redirectToLogin();
    } finally {
      isLoading.value = false;
    }
  });

  // Protect route changes
  const navigateToRoute = $(async (route: string) => {
    const isAuth = await routeGuard.checkAuthentication();
    
    if (!isAuth) {
      routeGuard.redirectToLogin();
      return;
    }
    
    currentRoute.value = route;
  });

  if (isLoading.value) {
    return (
      <div class="flex items-center justify-center h-screen">
        <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        <p class="ml-4 text-lg">Verifying authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated.value) {
    return (
      <div class="flex items-center justify-center h-screen">
        <div class="text-center">
          <h2 class="text-2xl font-bold text-red-600">Access Denied</h2>
          <p class="text-gray-600 mt-2">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Render the authenticated app
  return (
    <div class="app-container">
      {/* Your existing app content with route protection */}
      {/* ... */}
    </div>
  );
});
```

#### 2.1 GitHub OAuth Service
```typescript
// src/lib/auth/github-oauth.ts
import { Octokit } from '@octokit/rest';

export class GitHubAuthService {
  private octokit: Octokit;

  constructor(accessToken?: string) {
    this.octokit = new Octokit({
      auth: accessToken,
    });
  }

  async getRepositories() {
    const { data } = await this.octokit.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100,
    });
    return data;
  }

  async getRepository(owner: string, repo: string) {
    const { data } = await this.octokit.rest.repos.get({
      owner,
      repo,
    });
    return data;
  }
}
```

#### 2.2 Repository Picker Component
```tsx
// src/components-qwik/RepositoryPicker.tsx
import { component$, useSignal, $ } from '@builder.io/qwik';

export const RepositoryPicker = component$(() => {
  const repositories = useSignal([]);
  const selectedRepo = useSignal(null);

  const loadRepositories = $(async () => {
    // Fetch from GitHub API
    const response = await fetch('/api/github/repositories');
    repositories.value = await response.json();
  });

  const selectRepository = $((repo: any) => {
    selectedRepo.value = repo;
    // Trigger documentation generation
  });

  return (
    <div class="repository-picker">
      <h2>Select Repository</h2>
      <button onClick$={loadRepositories}>Load My Repositories</button>
      
      <div class="repo-list">
        {repositories.value.map((repo: any) => (
          <div 
            key={repo.id}
            class="repo-item cursor-pointer p-4 border rounded hover:bg-gray-100"
            onClick$={() => selectRepository(repo)}
          >
            <h3>{repo.full_name}</h3>
            <p>{repo.description}</p>
            <span>Updated: {repo.updated_at}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
```

### **Step 3: Repository Service**

#### 3.1 Repository Management Service
```typescript
// src/lib/services/repository.ts
export interface Repository {
  id: string;
  github_id: number;
  name: string;
  full_name: string;
  clone_url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  last_documented_at?: Date;
  user_id: string;
}

export class RepositoryService {
  async saveRepository(repo: any, userId: string): Promise<Repository> {
    const repository: Repository = {
      id: crypto.randomUUID(),
      github_id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      clone_url: repo.clone_url,
      status: 'pending',
      user_id: userId,
    };

    // Save to D1 database
    await this.insertToDatabase(repository);
    return repository;
  }

  async getRepositories(userId: string): Promise<Repository[]> {
    // Fetch from D1 database
    return await this.fetchFromDatabase(userId);
  }

  async updateStatus(repoId: string, status: Repository['status']) {
    // Update status in database
    await this.updateInDatabase(repoId, { status });
  }

  private async insertToDatabase(repo: Repository) {
    // D1 insert logic
  }

  private async fetchFromDatabase(userId: string): Promise<Repository[]> {
    // D1 fetch logic
    return [];
  }

  private async updateInDatabase(repoId: string, updates: Partial<Repository>) {
    // D1 update logic
  }
}
```

#### 3.2 Database Schema
```sql
-- src/lib/db/schema.sql
CREATE TABLE IF NOT EXISTS repositories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  github_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  clone_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  last_documented_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documentation_jobs (
  id TEXT PRIMARY KEY,
  repository_id TEXT REFERENCES repositories(id),
  status TEXT DEFAULT 'queued',
  progress INTEGER DEFAULT 0,
  started_at DATETIME,
  completed_at DATETIME,
  error_message TEXT,
  result_data TEXT
);
```

### **Step 4: Backend Communication**

#### 4.1 Backend API Client
```typescript
// src/lib/api/backend-client.ts
export class BackendClient {
  private baseUrl: string;
  private wsUrl: string;
  private ws: WebSocket | null = null;

  constructor() {
    this.baseUrl = import.meta.env.BACKEND_API_URL || 'http://192.168.0.6:8443';
    this.wsUrl = import.meta.env.BACKEND_WS_URL || 'ws://192.168.0.6:8443/ws';
  }

  async submitDocumentationJob(repositoryId: string, cloneUrl: string) {
    const response = await fetch(`${this.baseUrl}/api/documentation/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        repositoryId,
        cloneUrl,
      }),
    });
    return await response.json();
  }

  connectWebSocket(onProgress: (data: any) => void) {
    this.ws = new WebSocket(this.wsUrl);
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onProgress(data);
    };

    this.ws.onopen = () => {
      console.log('WebSocket connected to backend');
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  subscribeToJob(jobId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        jobId,
      }));
    }
  }
}
```

### **Step 5: Documentation Generation Interface**

#### 5.1 Documentation Generation Component
```tsx
// src/applications-qwik/generate/DocumentationGenerator.tsx
import { component$, useSignal, $ } from '@builder.io/qwik';
import { BackendClient } from '../../lib/api/backend-client';

export const DocumentationGenerator = component$(() => {
  const progress = useSignal(0);
  const status = useSignal('idle');
  const result = useSignal(null);
  const backendClient = new BackendClient();

  const generateDocumentation = $(async (repository: any) => {
    status.value = 'connecting';
    
    // Connect WebSocket for real-time updates
    backendClient.connectWebSocket((data) => {
      progress.value = data.progress || 0;
      status.value = data.status || 'processing';
      
      if (data.status === 'completed') {
        result.value = data.result;
      }
    });

    // Submit job to backend
    const job = await backendClient.submitDocumentationJob(
      repository.id,
      repository.clone_url
    );

    // Subscribe to job updates
    backendClient.subscribeToJob(job.id);
  });

  return (
    <div class="documentation-generator">
      <h2>Generate Documentation</h2>
      
      {status.value === 'idle' && (
        <button 
          onClick$={() => generateDocumentation(selectedRepository)}
          class="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Start Generation
        </button>
      )}

      {status.value === 'processing' && (
        <div class="progress-container">
          <div class="progress-bar">
            <div 
              class="progress-fill bg-green-500 h-4 rounded"
              style={{ width: `${progress.value}%` }}
            ></div>
          </div>
          <p>Progress: {progress.value}%</p>
          <p>Status: {status.value}</p>
        </div>
      )}

      {status.value === 'completed' && result.value && (
        <div class="documentation-result">
          <h3>Documentation Generated!</h3>
          <pre class="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(result.value, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
});
```

#### 5.2 Main Dashboard Integration
```tsx
// src/applications-qwik/app/pages/dashboard/index.tsx
import { component$ } from '@builder.io/qwik';
import { RepositoryPicker } from '../../../../components-qwik/RepositoryPicker';
import { DocumentationGenerator } from '../../../generate/DocumentationGenerator';

export default component$(() => {
  return (
    <div class="dashboard p-6">
      <h1 class="text-3xl font-bold mb-6">DocForge Dashboard</h1>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="repository-section">
          <RepositoryPicker />
        </div>
        
        <div class="generation-section">
          <DocumentationGenerator />
        </div>
      </div>
    </div>
  );
});
```

---

## 🚀 **EXECUTION SEQUENCE**

### **Start Here** (Execute in Order):

1. **Test Current Setup**
   ```bash
   npm run dev  # Verify 192.168.0.8:3000 works
   ```

2. **Add Dependencies**
   ```bash
   npm install @octokit/rest @aws-sdk/client-cognito-identity-provider
   ```

3. **Create Wrangler Config**
   ```bash
   # Create wrangler.toml with LAN configuration
   ```

4. **Test Production Build**
   ```bash
   rm -rf ./dist && npm run build && npm run wrangler-dev
   ```

5. **Test Svelte Login**
   ```bash
   # Navigate to /auth/sign-in/svelte/ and test thoroughly
   ```

6. **Create User Registration**
   ```bash
   # Build sign-up forms and onboarding flow
   ```

7. **Implement PayFast Integration**
   ```bash
   # Create payment flow and backend communication
   ```

8. **Add GitHub Connection**
   ```bash
   # Build GitHub OAuth and repository selection
   ```

9. **Secure Routes with Middleware**
   ```bash
   # Update middleware and add client-side protection
   ```

10. **End-to-End Test**
   ```bash
   # Test complete flow: Sign up → Pay → Connect GitHub
   ```

## 🎯 **SUCCESS CRITERIA**

- [ ] Can access wrangler dev server from LAN (`192.168.0.8:3001`)
- [ ] Svelte login form works perfectly and migrates to standard JS
- [ ] User registration with email verification (OTP) is functional
- [ ] Plan selection and PayFast payment flow works end-to-end
- [ ] GitHub OAuth connects and lists repositories (no documentation yet)
- [ ] Middleware properly protects all authenticated routes
- [ ] Client-side route protection works in Qwik SPAs
- [ ] Complete flow works: Sign up → Verify → Pay → Connect GitHub → Dashboard

## ⚠️ **Quick Debug Tips**

- **Wrangler LAN Access**: Ensure `--host 0.0.0.0` flag is used
- **Backend Connection**: Test API endpoints with curl first
- **WebSocket Issues**: Check CORS and connection logs
- **GitHub OAuth**: Verify redirect URLs match your development setup

## 🏁 **FINISH LINE**

When you can:
1. Select a GitHub repository from the UI
2. See real-time progress as your uWebSockets backend processes it
3. View the generated documentation in the browser

**You've successfully completed Phase 1!** 🎉

---

**Estimated Time**: 9-13 hours for complete Phase 1 implementation
**Next Phase**: AI documentation generation, advanced features, and production optimizations

---

## 🎉 **PHASE 1 COMPLETION GOALS**

When you complete Phase 1, you will have:

### ✅ **Complete Authentication System**
- Working login/logout with AWS Cognito
- User registration with email verification
- Password requirements and validation
- Token management and refresh logic

### ✅ **Full User Onboarding Flow**
- Multi-step registration process
- Email verification with OTP codes
- Plan selection (Free Trial, Starter, Pro)
- PayFast payment integration
- GitHub account connection
- Repository selection and metadata storage

### ✅ **Secure Application Access**
- Middleware protecting all authenticated routes
- Client-side route guards for Qwik SPAs
- Proper token validation and refresh
- Secure redirects and access control

### ✅ **Payment Processing**
- PayFast integration via C++ backend
- UUID generation and hosted payment pages
- Payment confirmation and verification
- Plan activation and user account updates

### ✅ **Basic GitHub Integration**
- GitHub OAuth authentication
- Repository listing and selection
- Repository metadata storage
- Access token management

**🚀 Ready for Phase 2**: AI-powered documentation generation, advanced repository management, and production deployment!