import type { Component } from 'solid-js';
import { createSignal, onMount, Show } from 'solid-js';
import { PUT as updateProfile, DELETE as deleteAccount, type UpdateProfileData } from '../../middleware/endpoints/_api/users/me';

const ProfilePage: Component<{ isDark: boolean }> = (props) => {
  const [userEmail, setUserEmail] = createSignal<string>('');
  const [userId, setUserId] = createSignal<string>('');
  const [emailVerified, setEmailVerified] = createSignal<boolean>(false);
  const [authTime, setAuthTime] = createSignal<number>(0);
  const [issueTime, setIssueTime] = createSignal<number>(0);
  const [username, setUsername] = createSignal<string>('');
  const [displayName, setDisplayName] = createSignal<string>('');

  // Edit mode state
  const [isEditing, setIsEditing] = createSignal(false);
  const [isSaving, setIsSaving] = createSignal(false);
  const [saveError, setSaveError] = createSignal<string | null>(null);
  const [saveSuccess, setSaveSuccess] = createSignal(false);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = createSignal(false);
  const [isDeleting, setIsDeleting] = createSignal(false);
  const [deleteError, setDeleteError] = createSignal<string | null>(null);

  // Editable form fields
  const [bio, setBio] = createSignal<string>('');
  const [currency, setCurrency] = createSignal<string>('');
  const [language, setLanguage] = createSignal<string>('');
  const [status, setStatus] = createSignal<string>('');
  const [walletAddress, setWalletAddress] = createSignal<string>('');

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
      setUsername(payload.username || payload.email?.split('@')[0] || '');
      setDisplayName(payload.display_name || payload.name || '');

      // Set editable profile fields
      setBio(payload.bio || '');
      setCurrency(payload.currency || 'USD');
      setLanguage(payload.language || 'en');
      setStatus(payload.status || '');
      setWalletAddress(payload.wallet_address || '');

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
    return username() || displayName() || userEmail().split('@')[0] || 'User';
  };

  const getInitials = () => {
    const name = getUsername();
    return name.charAt(0).toUpperCase();
  };

  // Save profile changes
  const handleSave = async () => {
    setSaveError(null);
    setSaveSuccess(false);
    setIsSaving(true);

    try {
      const updates: UpdateProfileData = {
        bio: bio(),
        currency: currency(),
        language: language(),
        status: status(),
        email: userEmail(),
        wallet_address: walletAddress()
      };

      const response = await updateProfile(updates);

      if (response.status === 200) {
        setSaveSuccess(true);
        setIsEditing(false);

        // Update local state with response data
        if (response.data.user) {
          const user = response.data.user;
          setBio(user.bio || '');
          setCurrency(user.currency || 'USD');
          setLanguage(user.language || 'en');
          setStatus(user.status || '');
          setUserEmail(user.email || userEmail());
          setDisplayName(user.display_name || displayName());
          setUsername(user.username || username());
        }

        // Clear success message after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError(response.data?.message || response.data?.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Save error:', error);
      setSaveError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    // Reset form fields to original values from JWT
    getFirebaseUserInfo();
    setIsEditing(false);
    setSaveError(null);
  };

  // Delete account handler
  const handleDeleteAccount = async () => {
    setDeleteError(null);
    setIsDeleting(true);

    try {
      const response = await deleteAccount();

      if (response.status === 204) {
        // Account deleted successfully - clear auth and redirect
        document.cookie = 'firebase-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'firebase-idToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        sessionStorage.clear();
        localStorage.removeItem('firebase-idToken');

        // Redirect to home page
        window.location.href = '/';
      } else {
        setDeleteError(response.data?.message || response.data?.error || 'Failed to delete account');
        setIsDeleting(false);
      }
    } catch (error) {
      console.error('Delete error:', error);
      setDeleteError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setIsDeleting(false);
    }
  };

  return (
    <div class="min-h-screen bg-zinc-900">
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
          {/* Success Message */}
          <Show when={saveSuccess()}>
            <div class="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
              <svg class="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p class="text-sm text-emerald-400 font-medium">Profile updated successfully!</p>
            </div>
          </Show>

          {/* Error Message */}
          <Show when={saveError()}>
            <div class="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
              <svg class="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p class="text-sm text-red-400 font-medium">{saveError()}</p>
            </div>
          </Show>

          {/* Edit Profile Button */}
          <Show when={!isEditing()}>
            <button
              onClick={() => setIsEditing(true)}
              class="w-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border border-purple-500/20 rounded-2xl p-4 transition-all flex items-center justify-center gap-2"
            >
              <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
              <span class="text-white font-medium">Edit Profile</span>
            </button>
          </Show>

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

          {/* Profile Edit Form */}
          <Show when={isEditing()}>
            <div class="bg-zinc-900/50 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800 space-y-4">
              <h3 class="text-lg font-semibold text-white mb-4">Edit Profile Information</h3>

              {/* Bio */}
              <div>
                <label class="block text-sm font-medium text-zinc-400 mb-2">Bio</label>
                <textarea
                  value={bio()}
                  onInput={(e) => setBio(e.currentTarget.value)}
                  rows="3"
                  class="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>

              {/* Currency */}
              <div>
                <label class="block text-sm font-medium text-zinc-400 mb-2">Preferred Currency</label>
                <select
                  value={currency()}
                  onChange={(e) => setCurrency(e.currentTarget.value)}
                  class="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="CHF">CHF - Swiss Franc</option>
                  <option value="CNY">CNY - Chinese Yuan</option>
                </select>
              </div>

              {/* Language */}
              <div>
                <label class="block text-sm font-medium text-zinc-400 mb-2">Language</label>
                <select
                  value={language()}
                  onChange={(e) => setLanguage(e.currentTarget.value)}
                  class="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="pt">Portuguese</option>
                  <option value="ja">Japanese</option>
                  <option value="zh">Chinese</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label class="block text-sm font-medium text-zinc-400 mb-2">Status</label>
                <input
                  type="text"
                  value={status()}
                  onInput={(e) => setStatus(e.currentTarget.value)}
                  class="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                  placeholder="Your current status..."
                />
              </div>

              {/* Wallet Address */}
              <div>
                <label class="block text-sm font-medium text-zinc-400 mb-2">Wallet Address</label>
                <input
                  type="text"
                  value={walletAddress()}
                  onInput={(e) => setWalletAddress(e.currentTarget.value)}
                  class="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                  placeholder="0x..."
                />
              </div>

              {/* Email (display only with note) */}
              <div>
                <label class="block text-sm font-medium text-zinc-400 mb-2">Email</label>
                <input
                  type="email"
                  value={userEmail()}
                  onInput={(e) => setUserEmail(e.currentTarget.value)}
                  class="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                />
                <p class="text-xs text-zinc-500 mt-1">Note: Username and display name cannot be changed</p>
              </div>

              {/* Action Buttons */}
              <div class="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={isSaving()}
                  class="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:from-zinc-700 disabled:to-zinc-700 text-white font-semibold py-3 px-6 rounded-xl transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Show
                    when={!isSaving()}
                    fallback={
                      <>
                        <svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Saving...</span>
                      </>
                    }
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Save Changes</span>
                  </Show>
                </button>

                <button
                  onClick={handleCancel}
                  disabled={isSaving()}
                  class="flex-1 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800 text-white font-semibold py-3 px-6 rounded-xl transition-all disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Show>
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

          {/* Delete Account Button */}
          <button
            onClick={() => setShowDeleteModal(true)}
            class="group block w-full bg-zinc-900/50 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/20 rounded-3xl p-6 transition-all text-left"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-2xl bg-zinc-800 group-hover:bg-red-500/20 flex items-center justify-center transition-colors">
                  <svg class="w-6 h-6 text-zinc-400 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </div>
                <div>
                  <h3 class="text-lg font-bold text-white group-hover:text-red-400 transition-colors">Delete Account</h3>
                  <p class="text-sm text-zinc-400">Permanently delete your account and all data</p>
                </div>
              </div>
              <svg class="w-6 h-6 text-zinc-600 group-hover:text-red-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </div>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Show when={showDeleteModal()}>
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div class="bg-zinc-900 rounded-3xl border border-red-500/20 max-w-md w-full p-6 shadow-2xl">
            {/* Modal Header */}
            <div class="flex items-center gap-3 mb-4">
              <div class="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center">
                <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-white">Delete Account</h3>
            </div>

            {/* Modal Content */}
            <div class="space-y-4 mb-6">
              <p class="text-zinc-400">
                Are you sure you want to delete your account? This action cannot be undone and will:
              </p>
              <ul class="space-y-2 text-sm text-zinc-400">
                <li class="flex items-start gap-2">
                  <svg class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                  <span>Permanently delete all your profile data</span>
                </li>
                <li class="flex items-start gap-2">
                  <svg class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                  <span>Remove access to all your assets and balances</span>
                </li>
                <li class="flex items-start gap-2">
                  <svg class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                  <span>Sign you out of all sessions immediately</span>
                </li>
              </ul>
            </div>

            {/* Error Message */}
            <Show when={deleteError()}>
              <div class="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p class="text-sm text-red-400">{deleteError()}</p>
              </div>
            </Show>

            {/* Modal Actions */}
            <div class="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError(null);
                }}
                disabled={isDeleting()}
                class="flex-1 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800 text-white font-semibold py-3 px-6 rounded-xl transition-all disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting()}
                class="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white font-semibold py-3 px-6 rounded-xl transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Show
                  when={!isDeleting()}
                  fallback={
                    <>
                      <svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Deleting...</span>
                    </>
                  }
                >
                  Delete Account
                </Show>
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default ProfilePage;
