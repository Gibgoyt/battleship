import type { Component } from 'solid-js';
import { createSignal, onMount } from 'solid-js';

const ProfilePage: Component<{ isDark: boolean }> = (props) => {
  const [userEmail, setUserEmail] = createSignal<string>('');
  const [debugInfo, setDebugInfo] = createSignal<string>('');

  // Enhanced email extraction with debugging
  const getEmailFromJWT = () => {
    try {
      console.log('All cookies:', document.cookie);

      // Try multiple possible cookie names
      const cookieNames = ['firebase-auth-token', 'firebase-idToken', 'auth-token'];
      let token = null;
      let foundCookieName = '';

      for (const cookieName of cookieNames) {
        const cookieValue = document.cookie
          .split('; ')
          .find(row => row.startsWith(`${cookieName}=`))
          ?.split('=')[1];

        if (cookieValue) {
          token = cookieValue;
          foundCookieName = cookieName;
          break;
        }
      }

      if (!token) {
        console.log('No auth token found in cookies');
        setDebugInfo('No auth token found in cookies');
        return null;
      }

      console.log('Found token in cookie:', foundCookieName);
      setDebugInfo(`Found token in cookie: ${foundCookieName}`);

      // Decode JWT token (format: header.payload.signature)
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.log('Invalid JWT format');
        setDebugInfo('Invalid JWT format');
        return null;
      }

      // Decode the payload (second part)
      const payload = JSON.parse(atob(parts[1]));
      console.log('JWT Payload:', payload);

      const email = payload.email || payload.sub || payload.user_id;
      setDebugInfo(`Extracted email: ${email || 'not found'}`);
      return email;
    } catch (error) {
      console.error('Error extracting email from JWT:', error);
      setDebugInfo(`Error: ${error.message}`);
      return null;
    }
  };

  // Mock Profile Data (Real email from JWT!)
  const mockProfile = () => ({
    email: userEmail() || "user@example.com", // Real email from JWT!
    username: "Demo User",
    userId: "demo_user_123",
    emailVerified: true,
    joinDate: "2024-01-15",
    lastLogin: "2024-12-17T10:30:00Z",
    profilePicture: null // Placeholder for future implementation
  });

  onMount(() => {
    const extractedEmail = getEmailFromJWT();
    if (extractedEmail) {
      setUserEmail(extractedEmail);
    }
  });

  const profile = mockProfile();
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div class="p-8">
      <h2 class={`text-2xl font-bold mb-6 ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
        My Profile
      </h2>

      {/* Debug Info */}
      {debugInfo() && (
        <div class={`mb-4 p-3 rounded border ${props.isDark ? 'bg-zinc-700 border-zinc-600 text-yellow-300' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
          <strong>Debug:</strong> {debugInfo()}
        </div>
      )}

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Info Card */}
        <div class={`p-6 rounded-lg border shadow-professional ${props.isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>
          <div class="flex items-center space-x-4 mb-4">
            {/* Placeholder Profilbild */}
            <div class={`w-16 h-16 rounded-full flex items-center justify-center ${props.isDark ? 'bg-zinc-700' : 'bg-gray-100'}`}>
              <span class={`text-2xl font-bold ${props.isDark ? 'text-white' : 'text-gray-600'}`}>
                {profile.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 class={`text-xl font-semibold ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
                {profile.username}
              </h3>
              <p class={`${props.isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {profile.email}
              </p>
            </div>
          </div>

          <div class="space-y-3">
            <div>
              <span class={`text-sm font-medium ${props.isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                User ID:
              </span>
              <p class={`${props.isDark ? 'text-gray-300' : 'text-gray-700'} font-mono text-sm`}>
                {profile.userId}
              </p>
            </div>

            <div>
              <span class={`text-sm font-medium ${props.isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Member since:
              </span>
              <p class={`${props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {formatDate(profile.joinDate)}
              </p>
            </div>
          </div>
        </div>

        {/* Account Status Card */}
        <div class={`p-6 rounded-lg border shadow-professional ${props.isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>
          <h3 class={`text-lg font-semibold mb-4 ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
            Account Status
          </h3>

          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class={`${props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Email verified
              </span>
              <span class={`px-2 py-1 rounded-full text-xs font-medium ${
                profile.emailVerified
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {profile.emailVerified ? 'Verified' : 'Not verified'}
              </span>
            </div>

            <div>
              <span class={`text-sm font-medium ${props.isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Last login:
              </span>
              <p class={`${props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {formatDateTime(profile.lastLogin)}
              </p>
            </div>

            <div>
              <span class={`text-sm font-medium ${props.isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Account type:
              </span>
              <p class={`${props.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Standard User
              </p>
            </div>
          </div>
        </div>

        {/* Settings Placeholder Card */}
        <div class={`lg:col-span-2 p-6 rounded-lg border shadow-professional ${props.isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>
          <h3 class={`text-lg font-semibold mb-4 ${props.isDark ? 'text-white' : 'text-gray-900'}`}>
            Settings
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button class={`p-4 rounded-lg border-2 border-dashed transition-colors ${
              props.isDark
                ? 'border-zinc-600 hover:border-zinc-500 text-gray-400 hover:text-gray-300'
                : 'border-gray-300 hover:border-gray-400 text-gray-500 hover:text-gray-600'
            }`}>
              <div class="text-center">
                <div class="text-2xl mb-2">🔧</div>
                <p class="text-sm font-medium">General Settings</p>
                <p class="text-xs opacity-75 mt-1">Coming soon</p>
              </div>
            </button>

            <button class={`p-4 rounded-lg border-2 border-dashed transition-colors ${
              props.isDark
                ? 'border-zinc-600 hover:border-zinc-500 text-gray-400 hover:text-gray-300'
                : 'border-gray-300 hover:border-gray-400 text-gray-500 hover:text-gray-600'
            }`}>
              <div class="text-center">
                <div class="text-2xl mb-2">🔐</div>
                <p class="text-sm font-medium">Security</p>
                <p class="text-xs opacity-75 mt-1">Coming soon</p>
              </div>
            </button>

            <button class={`p-4 rounded-lg border-2 border-dashed transition-colors ${
              props.isDark
                ? 'border-zinc-600 hover:border-zinc-500 text-gray-400 hover:text-gray-300'
                : 'border-gray-300 hover:border-gray-400 text-gray-500 hover:text-gray-600'
            }`}>
              <div class="text-center">
                <div class="text-2xl mb-2">📧</div>
                <p class="text-sm font-medium">Notifications</p>
                <p class="text-xs opacity-75 mt-1">Coming soon</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;