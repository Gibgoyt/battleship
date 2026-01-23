import type { Component } from 'solid-js';
import { createSignal, onMount, Show, createEffect } from 'solid-js';
import { PUT as updateProfile, DELETE as deleteAccount, type UpdateProfileData } from '../../middleware/endpoints/_api/users/me';
import { useCurrency } from '../../stores/currency-store';
import { useMiddleware } from '../../middleware';

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

  // Get global currency store
  const currencyStore = useCurrency();

  // Get middleware for SolidJS client-side navigation
  const middleware = useMiddleware();

  // Editable form fields
  const [bio, setBio] = createSignal<string>('');
  const [localCurrency, setLocalCurrency] = createSignal<string>('');

  // Read-only fields
  const [walletAddress, setWalletAddress] = createSignal<string>('');

  // Sync local currency with global store on mount
  createEffect(() => {
    setLocalCurrency(currencyStore.currency());
  });

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
      setLocalCurrency(payload.currency || currencyStore.currency());

      // Set read-only fields
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
        currency: localCurrency()
      };

      const response = await updateProfile(updates);

      if (response.status === 200) {
        setSaveSuccess(true);
        setIsEditing(false);

        // Update local state with response data
        if (response.data.user) {
          const user = response.data.user;
          setBio(user.bio || '');
          setLocalCurrency(user.currency || 'USD');
          setUserEmail(user.email || userEmail());
          setDisplayName(user.display_name || displayName());
          setUsername(user.username || username());

          // Update global currency store
          currencyStore.setCurrency(user.currency || 'USD');
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
      {/* Header */}
      <div class="border-b border-zinc-800">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div class="flex items-center gap-3 sm:gap-4">
              <div class="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-xl sm:text-2xl font-bold flex-shrink-0">
                {getInitials()}
              </div>
              <div class="min-w-0">
                <h1 class="text-lg sm:text-2xl md:text-3xl font-bold text-white mb-0.5 sm:mb-1 truncate">{getUsername()}</h1>
                <p class="text-xs sm:text-sm text-zinc-500 truncate">{userEmail() || 'Loading...'}</p>
              </div>
            </div>
            <div class="flex items-center gap-2 ml-15 sm:ml-0">
              <Show
                when={emailVerified()}
                fallback={
                  <span class="inline-flex items-center gap-1 px-2 sm:px-3 py-1 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                    <span class="hidden sm:inline">Not Verified</span>
                    <span class="sm:hidden">Unverified</span>
                  </span>
                }
              >
                <span class="inline-flex items-center gap-1 px-2 sm:px-3 py-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Verified
                </span>
              </Show>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12">
        {/* Success Message */}
        <Show when={saveSuccess()}>
          <div class="mb-6 bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-center gap-3">
            <svg class="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p class="text-sm text-emerald-400 font-medium">Profile updated successfully!</p>
          </div>
        </Show>

        {/* Error Message */}
        <Show when={saveError()}>
          <div class="mb-6 bg-red-500/10 border border-red-500/20 p-4 flex items-center gap-3">
            <svg class="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p class="text-sm text-red-400 font-medium">{saveError()}</p>
          </div>
        </Show>

        {/* Edit Profile Button */}
        <Show when={!isEditing()}>
          <div class="mb-6 sm:mb-8">
            <button
              onClick={() => setIsEditing(true)}
              class="group w-full flex items-center justify-between p-4 sm:p-6 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 border border-cyan-500/20 hover:border-cyan-500/40 transition-all rounded-lg sm:rounded-none"
            >
              <div class="flex items-center gap-3 sm:gap-4">
                <div class="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                </div>
                <div class="text-left min-w-0">
                  <div class="text-base sm:text-lg font-semibold text-white mb-0.5 sm:mb-1">Edit Profile</div>
                  <div class="text-xs sm:text-sm text-zinc-400">Update your bio and preferences</div>
                </div>
              </div>
              <svg class="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 group-hover:translate-x-1 transition-transform flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
        </Show>

        {/* Profile Edit Form */}
        <Show when={isEditing()}>
          <div class="mb-6 sm:mb-8 p-4 sm:p-6 bg-zinc-800/50 border border-zinc-700 space-y-4 rounded-lg sm:rounded-none">
            <h3 class="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Edit Profile Information</h3>

            {/* Bio */}
            <div>
              <label class="block text-sm font-medium text-zinc-400 mb-2">Bio</label>
              <textarea
                value={bio()}
                onInput={(e) => setBio(e.currentTarget.value)}
                rows="3"
                class="w-full bg-zinc-900 border border-zinc-700 px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>

            {/* Currency */}
            <div>
              <label class="block text-sm font-medium text-zinc-400 mb-2">Preferred Currency</label>
              <select
                value={localCurrency()}
                onChange={(e) => setLocalCurrency(e.currentTarget.value)}
                class="w-full bg-zinc-900 border border-zinc-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
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

            {/* Wallet Address (Read-only) */}
            <Show when={walletAddress()}>
              <div>
                <label class="block text-sm font-medium text-zinc-400 mb-2">Wallet Address</label>
                <input
                  type="text"
                  value={walletAddress()}
                  disabled
                  class="w-full bg-zinc-900/50 border border-zinc-700/50 px-4 py-3 text-zinc-500 font-mono text-sm cursor-not-allowed opacity-60"
                  placeholder="No wallet connected"
                />
                <p class="text-xs text-zinc-500 mt-1">Automatically pulled from your connected Phantom wallet</p>
              </div>
            </Show>

            {/* Action Buttons */}
            <div class="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={isSaving()}
                class="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-zinc-700 disabled:to-zinc-700 text-white font-semibold py-3 px-4 sm:px-6 transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-lg sm:rounded-none text-sm sm:text-base"
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
                class="flex-1 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800 text-white font-semibold py-3 px-4 sm:px-6 transition-all disabled:cursor-not-allowed disabled:opacity-50 rounded-lg sm:rounded-none text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </Show>

        {/* Account Information */}
        <div class="mb-6 sm:mb-8">
          <h2 class="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6">Account Information</h2>
          <div class="space-y-2 sm:space-y-3">
            {/* Bio */}
            <Show when={bio()}>
              <div class="flex items-center justify-between py-4 px-6 border-l-2 border-cyan-500 bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center">
                    <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path>
                    </svg>
                  </div>
                  <div>
                    <div class="text-sm font-medium text-white">Bio</div>
                    <div class="text-xs text-zinc-500">{bio()}</div>
                  </div>
                </div>
              </div>
            </Show>

            {/* User ID */}
            <div class="flex items-center justify-between py-4 px-6 border-l-2 border-zinc-600 bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"></path>
                  </svg>
                </div>
                <div>
                  <div class="text-sm font-medium text-white">User ID</div>
                  <div class="text-xs text-zinc-500 font-mono">{userId() || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Currency */}
            <div class="flex items-center justify-between py-4 px-6 border-l-2 border-zinc-600 bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div>
                  <div class="text-sm font-medium text-white">Preferred Currency</div>
                  <div class="text-xs text-zinc-500">{localCurrency() || 'USD'}</div>
                </div>
              </div>
            </div>

            {/* Session Info */}
            <div class="flex items-center justify-between py-4 px-6 border-l-2 border-zinc-600 bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div>
                  <div class="text-sm font-medium text-white">Last Authentication</div>
                  <div class="text-xs text-zinc-500">{formatTimestamp(authTime())}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div class="mb-8">
          <h2 class="text-lg font-semibold text-white mb-6">Quick Actions</h2>
          <div class="space-y-3">
            <button
              onClick={() => middleware.navigate('/app/dashboard')}
              class="group w-full flex items-center justify-between py-4 px-6 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 transition-all text-left"
            >
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                  </svg>
                </div>
                <div>
                  <div class="text-base font-semibold text-white mb-1">Go to Dashboard</div>
                  <div class="text-sm text-zinc-400">View your portfolio and balances</div>
                </div>
              </div>
              <svg class="w-5 h-5 text-zinc-500 group-hover:text-zinc-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>

            <button
              onClick={() => {
                document.cookie = 'firebase-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                document.cookie = 'firebase-idToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                sessionStorage.clear();
                localStorage.removeItem('firebase-idToken');
                window.location.href = '/auth/sign-in';
              }}
              class="group w-full flex items-center justify-between py-4 px-6 bg-zinc-800/50 hover:bg-red-500/10 border border-zinc-700 hover:border-red-500/20 transition-all text-left"
            >
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 bg-zinc-700 group-hover:bg-red-500/20 rounded-lg flex items-center justify-center transition-colors">
                  <svg class="w-5 h-5 text-zinc-400 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                  </svg>
                </div>
                <div>
                  <div class="text-base font-semibold text-white group-hover:text-red-400 transition-colors mb-1">Sign Out</div>
                  <div class="text-sm text-zinc-400">End your current session</div>
                </div>
              </div>
              <svg class="w-5 h-5 text-zinc-500 group-hover:text-red-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>

            <button
              onClick={() => setShowDeleteModal(true)}
              class="group w-full flex items-center justify-between py-4 px-6 bg-zinc-800/50 hover:bg-red-500/10 border border-zinc-700 hover:border-red-500/20 transition-all text-left"
            >
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 bg-zinc-700 group-hover:bg-red-500/20 rounded-lg flex items-center justify-center transition-colors">
                  <svg class="w-5 h-5 text-zinc-400 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </div>
                <div>
                  <div class="text-base font-semibold text-white group-hover:text-red-400 transition-colors mb-1">Delete Account</div>
                  <div class="text-sm text-zinc-400">Permanently delete your account</div>
                </div>
              </div>
              <svg class="w-5 h-5 text-zinc-500 group-hover:text-red-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Show when={showDeleteModal()}>
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div class="bg-zinc-900 border border-red-500/20 max-w-md w-full p-6 shadow-2xl">
            {/* Modal Header */}
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              </div>
              <h3 class="text-lg font-bold text-white">Delete Account</h3>
            </div>

            {/* Modal Content */}
            <div class="space-y-4 mb-6">
              <p class="text-sm text-zinc-400">
                Are you sure you want to delete your account? This action cannot be undone.
              </p>
              <ul class="space-y-2 text-sm text-zinc-500">
                <li class="flex items-start gap-2">
                  <svg class="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                  <span>Permanently delete all your profile data</span>
                </li>
                <li class="flex items-start gap-2">
                  <svg class="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                  <span>Remove access to all your assets</span>
                </li>
                <li class="flex items-start gap-2">
                  <svg class="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                  <span>Sign you out immediately</span>
                </li>
              </ul>
            </div>

            {/* Error Message */}
            <Show when={deleteError()}>
              <div class="bg-red-500/10 border border-red-500/20 p-3 mb-4 flex items-center gap-2">
                <svg class="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                class="flex-1 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800 text-white font-semibold py-3 px-6 transition-all disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting()}
                class="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white font-semibold py-3 px-6 transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
