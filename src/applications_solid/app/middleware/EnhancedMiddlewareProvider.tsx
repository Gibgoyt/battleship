/**
 * Enhanced Middleware Provider
 * Unified middleware provider that coordinates auth, data, and navigation services
 * Integrates with the context-based architecture
 */

import { Component, ParentComponent, onMount, onCleanup, createSignal } from 'solid-js'
import { createLogger } from 'src/lib/logger'

const logger = createLogger('[EnhancedMiddlewareProvider]')

export interface EnhancedMiddlewareProviderProps {
  children: any
  firebaseToken?: string
}

export const EnhancedMiddlewareProvider: ParentComponent<EnhancedMiddlewareProviderProps> = (props) => {
  const [isInitialized, setIsInitialized] = createSignal(false)
  const [initError, setInitError] = createSignal<string | null>(null)

  // Initialize middleware services within context
  onMount(async () => {
    logger.debug('Initializing enhanced middleware services', {
      hasFirebaseToken: !!props.firebaseToken
    })

    try {
      // Initialize Firebase Auth Manager
      logger.debug('Initializing Firebase Auth Manager')
      const { getGlobalAuthStore } = await import('./firebase/auth-store')
      const authStore = getGlobalAuthStore()

      if (props.firebaseToken) {
        logger.debug('Initializing auth store with provided token')
        await authStore.initialize(props.firebaseToken)
      } else {
        logger.debug('No initial token provided, auth store will initialize from storage')
      }

      // Initialize token refresh service
      logger.debug('Initializing Token Refresh Service')
      try {
        // First check if there's a getInstance method
        const tokenRefreshModule = await import('./firebase/token-refresh-service')

        if (tokenRefreshModule.FirebaseTokenRefreshService) {
          const tokenRefreshService = tokenRefreshModule.FirebaseTokenRefreshService.getInstance()
          await tokenRefreshService.startServices()
          logger.debug('Token refresh service started successfully')
        } else {
          // Fallback to getGlobalTokenRefreshService if available
          const { getGlobalTokenRefreshService } = tokenRefreshModule as any
          if (getGlobalTokenRefreshService) {
            const tokenRefreshService = getGlobalTokenRefreshService()
            await tokenRefreshService.startServices()
            logger.debug('Token refresh service started via fallback method')
          } else {
            logger.warn('Token refresh service not available - skipping')
          }
        }
      } catch (tokenServiceError) {
        logger.warn('Failed to initialize token refresh service:', tokenServiceError)
        // Don't fail the entire initialization for token service issues
      }

      // Mark as initialized
      setIsInitialized(true)
      logger.info('Enhanced middleware services initialized successfully')

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error'
      logger.error('Failed to initialize enhanced middleware services:', error)
      setInitError(errorMessage)
    }
  })

  // Cleanup on unmount
  onCleanup(() => {
    logger.debug('Cleaning up enhanced middleware services')

    // Stop token refresh service if it was started
    try {
      import('./firebase/token-refresh-service').then(tokenRefreshModule => {
        if (tokenRefreshModule.FirebaseTokenRefreshService) {
          const tokenRefreshService = tokenRefreshModule.FirebaseTokenRefreshService.getInstance()
          tokenRefreshService.stopServices()
          logger.debug('Token refresh service stopped')
        }
      }).catch(error => {
        logger.warn('Error stopping token refresh service during cleanup:', error)
      })
    } catch (error) {
      logger.warn('Error during middleware cleanup:', error)
    }
  })

  // Error boundary for middleware initialization
  if (initError()) {
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
        <h3>Middleware Initialization Error</h3>
        <p>Failed to initialize authentication services: {initError()}</p>
        <button
          onClick={() => window.location.reload()}
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
  }

  // Loading state while initializing
  if (!isInitialized()) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{
          width: '24px',
          height: '24px',
          border: '2px solid #e2e8f0',
          borderTop: '2px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: '#64748b', margin: 0 }}>Initializing services...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  // Render children once initialized
  return <>{props.children}</>
}

export default EnhancedMiddlewareProvider