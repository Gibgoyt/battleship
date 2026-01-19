/**
 * Auth Error Boundary Component
 * Catches authentication errors globally and triggers proper logout flow
 */

import { ErrorBoundary } from 'solid-js'
import type { Component } from 'solid-js'

interface AuthErrorBoundaryProps {
  children: any
}

export const AuthErrorBoundary: Component<AuthErrorBoundaryProps> = (props) => (
  <ErrorBoundary
    fallback={async (err, reset) => {
      // Check if auth-related error
      if (
        err.message.includes('auth') ||
        err.message.includes('401') ||
        err.message.includes('403') ||
        err.message.includes('token') ||
        err.message.includes('usePersistentData must be used within PersistentDataProvider')
      ) {
        console.warn('[AuthErrorBoundary] Authentication error detected:', err.message)

        try {
          // Import auth store dynamically to avoid circular dependencies
          const { getGlobalAuthStore } = await import('../middleware/firebase/auth-store')
          const authStore = getGlobalAuthStore()

          // Trigger session expiry notification
          if (authStore && typeof authStore.triggerSessionExpiryNotification === 'function') {
            authStore.triggerSessionExpiryNotification()
          }

          return (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: '#ef4444',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              margin: '20px'
            }}>
              <h3>Session Error</h3>
              <p>Your session has expired. Redirecting to login...</p>
              <button
                onClick={reset}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                Retry
              </button>
            </div>
          )
        } catch (importError) {
          console.error('[AuthErrorBoundary] Failed to import auth store:', importError)
          return (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: '#ef4444',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              margin: '20px'
            }}>
              <h3>Authentication Error</h3>
              <p>Please refresh the page or log in again.</p>
              <button
                onClick={() => window.location.href = '/auth/sign-in'}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                Go to Login
              </button>
            </div>
          )
        }
      }

      // Re-throw non-auth errors to be handled elsewhere
      throw err
    }}
  >
    {props.children}
  </ErrorBoundary>
)

export default AuthErrorBoundary