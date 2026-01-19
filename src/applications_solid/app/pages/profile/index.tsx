import type { Component } from 'solid-js';
import { createSignal, onMount, Show } from 'solid-js';

const ProfilePage: Component<{ isDark: boolean }> = (props) => {
  const [userEmail, setUserEmail] = createSignal<string>('');
  const [userId, setUserId] = createSignal<string>('');
  const [emailVerified, setEmailVerified] = createSignal<boolean>(false);
  const [authTime, setAuthTime] = createSignal<number>(0);
  const [issueTime, setIssueTime] = createSignal<number>(0);

  // Extract user info from JWT
  const getFirebaseUserInfo = () => {
    try {
      let token = null;

      // First, try to get token from cookies
      const cookieNames = ['firebase-auth-token', 'firebase-idToken', 'auth-token'];
      for (const cookieName of cookieNames) {
        const cookieValue = document.cookie
          .split('; ')
          .find(row => row.startsWith(`${cookieName}=`))
          ?.split('=')[1];

        if (cookieValue) {
          token = cookieValue;
          console.log(`[ProfilePage] Found token in cookie: ${cookieName}`);
          break;
        }
      }

      // If no token in cookies, try browser storage (sessionStorage first, then localStorage)
      if (!token) {
        console.log('[ProfilePage] No auth token found in cookies, checking browser storage...');

        // Try sessionStorage first (where firebase-idToken is typically stored)
        token = sessionStorage.getItem('firebase-idToken');
        if (token) {
          console.log('[ProfilePage] Found token in sessionStorage');
        } else {
          // Try localStorage as fallback
          token = localStorage.getItem('firebase-idToken');
          if (token) {
            console.log('[ProfilePage] Found token in localStorage');
          }
        }
      }

      if (!token) {
        console.log('[ProfilePage] No auth token found in cookies or browser storage');
        return null;
      }

      // Decode JWT token (format: header.payload.signature)
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.log('Invalid JWT format');
        return null;
      }

      // Decode the payload (second part)
      const payload = JSON.parse(atob(parts[1]));
      console.log('[ProfilePage] JWT Payload:', payload);

      // Extract Firebase-specific claims
      setUserEmail(payload.email || '');
      setUserId(payload.user_id || payload.sub || '');
      setEmailVerified(payload.email_verified || false);
      setAuthTime(payload.auth_time || 0);
      setIssueTime(payload.iat || 0);

      return payload;
    } catch (error) {
      console.error('Error extracting user info from JWT:', error);
      return null;
    }
  };

  onMount(() => {
    getFirebaseUserInfo();
  });

  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUsername = () => {
    const email = userEmail();
    return email ? email.split('@')[0] : 'User';
  };

  const getInitials = () => {
    const username = getUsername();
    return username.charAt(0).toUpperCase();
  };

  return (
    <div class="min-h-screen bg-gradient-to-b from-zinc-900 to-black">
      {/* Hero Section */}
      <div class="relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10"></div>
        <div class="relative px-4 pt-12 pb-20 md:px-8 md:pt-20 md:pb-32">
          <div class="max-w-4xl mx-auto text-center space-y-6">
            {/* Avatar */}
            <div class="inline-flex items-center justify-center w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white text-4xl md:text-5xl font-bold shadow-lg shadow-purple-500/25">
              {getInitials()}
            </div>

            <div class="space-y-2">
              <h1 class="text-3xl md:text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-300 bg-clip-text text-transparent">
                {getUsername()}
              </h1>
              <p class="text-lg md:text-xl text-zinc-400">
                {userEmail() || 'Loading...'}
              </p>
            </div>

            {/* Verification Badge */}
            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/50 backdrop-blur-sm border border-zinc-800">
              <Show
                when={emailVerified()}
                fallback={
                  <>
                    <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                    <span class="text-sm font-medium text-amber-400">Email Not Verified</span>
                  </>
                }
              >
                <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span class="text-sm font-medium text-emerald-400">Email Verified</span>
              </Show>
            </div>
          </div>
        </div>
      </div>

      {/* Account Details */}
      <div class="px-4 md:px-8 pb-12 -mt-8">
        <div class="max-w-4xl mx-auto space-y-4">
          {/* User ID Card */}
          <div class="bg-zinc-900/50 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"></path>
                </svg>
              </div>
              <div>
                <h3 class="text-sm font-semibold text-zinc-500 uppercase tracking-wider">User ID</h3>
              </div>
            </div>
            <p class="font-mono text-sm text-zinc-400 break-all">
              {userId() || 'N/A'}
            </p>
          </div>

          {/* Session Info */}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-zinc-900/50 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </div>
                <div>
                  <h3 class="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Authentication</h3>
                </div>
              </div>
              <p class="text-sm text-zinc-400">
                {formatTimestamp(authTime())}
              </p>
            </div>

            <div class="bg-zinc-900/50 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div>
                  <h3 class="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Token Issued</h3>
                </div>
              </div>
              <p class="text-sm text-zinc-400">
                {formatTimestamp(issueTime())}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div class="px-4 md:px-8 pb-12">
        <div class="max-w-4xl mx-auto space-y-4">
          <h2 class="text-lg font-semibold text-white mb-4">Account Actions</h2>

          <a
            href="/app/dashboard"
            class="group block bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border border-purple-500/20 rounded-3xl p-6 transition-all"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                  </svg>
                </div>
                <div>
                  <h3 class="text-lg font-bold text-white">Go to Dashboard</h3>
                  <p class="text-sm text-zinc-400">View your portfolio and balances</p>
                </div>
              </div>
              <svg class="w-6 h-6 text-zinc-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </div>
          </a>

          <button
            onClick={() => {
              // Clear cookies and redirect to sign-in
              document.cookie = 'firebase-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
              document.cookie = 'firebase-idToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
              document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
              sessionStorage.clear();
              localStorage.removeItem('firebase-idToken');
              window.location.href = '/auth/sign-in';
            }}
            class="group block w-full bg-zinc-900/50 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/20 rounded-3xl p-6 transition-all text-left"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-2xl bg-zinc-800 group-hover:bg-red-500/20 flex items-center justify-center transition-colors">
                  <svg class="w-6 h-6 text-zinc-400 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                  </svg>
                </div>
                <div>
                  <h3 class="text-lg font-bold text-white group-hover:text-red-400 transition-colors">Sign Out</h3>
                  <p class="text-sm text-zinc-400">End your current session</p>
                </div>
              </div>
              <svg class="w-6 h-6 text-zinc-600 group-hover:text-red-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
