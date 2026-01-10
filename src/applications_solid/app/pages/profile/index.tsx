import type { Component } from 'solid-js';
import { createSignal, onMount } from 'solid-js';

const ProfilePage: Component<{ isDark: boolean }> = (props) => {
  const [userEmail, setUserEmail] = createSignal<string>('');
  const [userId, setUserId] = createSignal<string>('');
  const [emailVerified, setEmailVerified] = createSignal<boolean>(false);
  const [authTime, setAuthTime] = createSignal<number>(0);
  const [issueTime, setIssueTime] = createSignal<number>(0);

  // Extract user info from JWT
  const getFirebaseUserInfo = () => {
    try {
      // Try multiple possible cookie names
      const cookieNames = ['firebase-auth-token', 'firebase-idToken', 'auth-token'];
      let token = null;

      for (const cookieName of cookieNames) {
        const cookieValue = document.cookie
          .split('; ')
          .find(row => row.startsWith(`${cookieName}=`))
          ?.split('=')[1];

        if (cookieValue) {
          token = cookieValue;
          break;
        }
      }

      if (!token) {
        console.log('No auth token found in cookies');
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

  return (
    <div class="p-6 md:p-8 max-w-screen-2xl mx-auto">
      <div class="border-b pb-4 mb-6" style={props.isDark ? 'border-color: #27272a;' : 'border-color: #e5e7eb;'}>
        <h1 class={`text-2xl md:text-3xl font-semibold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
          Account Profile
        </h1>
        <p class={`mt-2 text-sm ${props.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          View and manage your account information
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Info Section */}
        <div class={`p-6 border ${props.isDark ? 'bg-zinc-800/30 border-zinc-700' : 'bg-white border-gray-200'}`}>
          <h2 class={`text-lg font-semibold mb-4 ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
            User Information
          </h2>

          <div class="space-y-4">
            <div>
              <label class={`text-xs font-medium uppercase tracking-wider ${props.isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Email Address
              </label>
              <p class={`mt-1 ${props.isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                {userEmail() || 'Not available'}
              </p>
            </div>

            <div>
              <label class={`text-xs font-medium uppercase tracking-wider ${props.isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                User ID
              </label>
              <p class={`mt-1 font-mono text-sm ${props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {userId() || 'N/A'}
              </p>
            </div>

            <div>
              <label class={`text-xs font-medium uppercase tracking-wider ${props.isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Username
              </label>
              <p class={`mt-1 ${props.isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                {getUsername()}
              </p>
            </div>
          </div>
        </div>

        {/* Account Status Section */}
        <div class={`p-6 border ${props.isDark ? 'bg-zinc-800/30 border-zinc-700' : 'bg-white border-gray-200'}`}>
          <h2 class={`text-lg font-semibold mb-4 ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
            Account Status
          </h2>

          <div class="space-y-4">
            <div>
              <label class={`text-xs font-medium uppercase tracking-wider ${props.isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Email Verification
              </label>
              <div class="mt-1">
                <span class={`inline-block px-2 py-1 text-xs font-medium ${
                  emailVerified()
                    ? props.isDark ? 'bg-green-900/30 text-green-400 border border-green-700' : 'bg-green-100 text-green-800 border border-green-200'
                    : props.isDark ? 'bg-red-900/30 text-red-400 border border-red-700' : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {emailVerified() ? 'Verified' : 'Not Verified'}
                </span>
              </div>
            </div>

            <div>
              <label class={`text-xs font-medium uppercase tracking-wider ${props.isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Authentication Time
              </label>
              <p class={`mt-1 text-sm ${props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {formatTimestamp(authTime())}
              </p>
            </div>

            <div>
              <label class={`text-xs font-medium uppercase tracking-wider ${props.isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Token Issued
              </label>
              <p class={`mt-1 text-sm ${props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {formatTimestamp(issueTime())}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;