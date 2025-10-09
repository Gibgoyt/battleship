/**
 * Admin API Client Helper
 *
 * Automatically injects Cognito JWT token from cookies into API requests
 * for all /api/admin/* endpoints.
 */

/**
 * Get the admin Cognito token from cookies
 */
function getAdminToken(): string | null {
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'cognito-admin-auth-token' && value) {
        return decodeURIComponent(value);
      }
    }
    return null;
  } catch (error) {
    console.error('[AdminAPIClient] Failed to get token from cookies:', error);
    return null;
  }
}

/**
 * Fetch wrapper that automatically injects Authorization header
 *
 * @param url - API endpoint URL (e.g., '/api/admin' or '/api/admin/product-issues')
 * @param options - Standard fetch options
 * @returns Promise<Response>
 *
 * @example
 * // GET request
 * const response = await adminApiFetch('/api/admin');
 * const data = await response.json();
 *
 * @example
 * // POST request
 * await adminApiFetch('/api/admin/product-issues', {
 *   method: 'POST',
 *   body: JSON.stringify({ title: 'Bug', roadmap_stage_id: 1, created_by: 1 })
 * });
 *
 * @example
 * // PUT request
 * await adminApiFetch('/api/admin/product-issues/5', {
 *   method: 'PUT',
 *   body: JSON.stringify({ status: 'closed' })
 * });
 */
export async function adminApiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAdminToken();

  if (!token) {
    console.warn('[AdminAPIClient] No auth token found in cookies. Request may fail.');
  }

  const headers = new Headers(options.headers || {});

  // Inject Authorization header
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Set Content-Type for JSON requests
  if (!headers.has('Content-Type') && (options.method === 'POST' || options.method === 'PUT')) {
    headers.set('Content-Type', 'application/json');
  }

  const enhancedOptions: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, enhancedOptions);

    // Log errors for debugging
    if (!response.ok) {
      console.error('[AdminAPIClient] Request failed:', {
        url,
        status: response.status,
        statusText: response.statusText,
      });
    }

    return response;
  } catch (error) {
    console.error('[AdminAPIClient] Network error:', error);
    throw error;
  }
}

/**
 * Helper function to sync current user with TeamMembers table
 * Should be called on app mount
 *
 * @param email - User email from Cognito token
 * @param cognito_sub - User sub (unique ID) from Cognito token
 * @param name - Optional display name
 * @returns TeamMember object with id
 */
export async function syncCurrentUser(
  email: string,
  cognito_sub: string,
  name?: string
): Promise<{ id: number; email: string; name: string } | null> {
  try {
    const response = await adminApiFetch('/api/admin/team-members/sync', {
      method: 'POST',
      body: JSON.stringify({
        email,
        cognito_sub,
        name: name || email.split('@')[0], // Use email prefix as fallback name
      }),
    });

    if (!response.ok) {
      console.error('[AdminAPIClient] User sync failed:', response.status);
      return null;
    }

    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error('[AdminAPIClient] User sync error:', error);
    return null;
  }
}

/**
 * Load all initial data for the admin app
 * Should be called after user sync
 */
export async function loadInitialData() {
  try {
    const response = await adminApiFetch('/api/admin');

    if (!response.ok) {
      console.error('[AdminAPIClient] Failed to load initial data:', response.status);
      return null;
    }

    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error('[AdminAPIClient] Error loading initial data:', error);
    return null;
  }
}

// Make functions available globally for use in WASM app
if (typeof window !== 'undefined') {
  (window as any).adminApiFetch = adminApiFetch;
  (window as any).syncCurrentUser = syncCurrentUser;
  (window as any).loadInitialData = loadInitialData;
}
