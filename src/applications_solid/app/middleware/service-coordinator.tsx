/**
 * Service Coordination Layer
 * Coordinates auth services with context providers
 * Provides unified interface for service health and control
 */

import { createSignal, createEffect, onMount, onCleanup, Accessor } from 'solid-js'
import { createLogger } from 'src/lib/logger'

const logger = createLogger('[ServiceCoordinator]')

export interface ServiceCoordinatorState {
  // Service health indicators
  authServiceHealth: Accessor<boolean>
  tokenRefreshStatus: Accessor<'idle' | 'refreshing' | 'success' | 'error'>
  lastError: Accessor<string | null>

  // Service control methods
  restartServices: () => Promise<void>
  checkServiceHealth: () => Promise<void>

  // Service status getters
  getAuthStoreStatus: () => any
  getTokenRefreshServiceStatus: () => any

  // Error handling
  clearErrors: () => void
}

/**
 * Create service coordinator that works with existing singleton services
 * but provides context-friendly interface
 */
export const createServiceCoordinator = (): ServiceCoordinatorState => {
  const [authServiceHealth, setAuthServiceHealth] = createSignal(false)
  const [tokenRefreshStatus, setTokenRefreshStatus] = createSignal<'idle' | 'refreshing' | 'success' | 'error'>('idle')
  const [lastError, setLastError] = createSignal<string | null>(null)

  let healthCheckInterval: number | null = null
  let authStore: any = null
  let tokenRefreshService: any = null

  // Initialize services references
  const initializeServicesReferences = async () => {
    try {
      // Get auth store reference
      const { getGlobalAuthStore } = await import('./firebase/auth-store')
      authStore = getGlobalAuthStore()
      logger.debug('Auth store reference initialized')

      // Get token refresh service reference
      try {
        const tokenRefreshModule = await import('./firebase/token-refresh-service')
        if (tokenRefreshModule.FirebaseTokenRefreshService) {
          tokenRefreshService = tokenRefreshModule.FirebaseTokenRefreshService.getInstance()
          logger.debug('Token refresh service reference initialized')
        }
      } catch (error) {
        logger.warn('Token refresh service not available:', error)
      }
    } catch (error) {
      logger.error('Failed to initialize service references:', error)
      setLastError('Failed to initialize service references')
    }
  }

  // Check overall service health
  const checkServiceHealth = async (): Promise<void> => {
    try {
      let healthScore = 0
      let totalServices = 0

      // Check auth store health
      if (authStore) {
        totalServices++
        try {
          const isInitialized = authStore.isInitialized?.() ?? false
          const hasValidToken = authStore.hasValidToken?.() ?? false
          const isAuthenticated = authStore.isAuthenticated?.() ?? false

          if (isInitialized || hasValidToken || isAuthenticated) {
            healthScore++
          }

          logger.debug('Auth store health check', {
            isInitialized,
            hasValidToken,
            isAuthenticated,
            healthy: healthScore > 0
          })
        } catch (authError) {
          logger.warn('Auth store health check failed:', authError)
          setLastError(`Auth store health check failed: ${authError}`)
        }
      }

      // Check token refresh service health
      if (tokenRefreshService) {
        totalServices++
        try {
          const serviceStatus = tokenRefreshService.getServiceStatus?.()
          const isRunning = serviceStatus?.isRunning ?? false

          if (isRunning) {
            healthScore++
          }

          // Update token refresh status based on service state
          if (serviceStatus?.refreshAttempts > 0) {
            setTokenRefreshStatus('refreshing')
          } else if (isRunning) {
            setTokenRefreshStatus('success')
          } else {
            setTokenRefreshStatus('idle')
          }

          logger.debug('Token refresh service health check', {
            isRunning,
            serviceStatus,
            healthy: isRunning
          })
        } catch (tokenError) {
          logger.warn('Token refresh service health check failed:', tokenError)
          setTokenRefreshStatus('error')
          setLastError(`Token refresh service health check failed: ${tokenError}`)
        }
      }

      // Update overall health
      const isHealthy = totalServices > 0 && healthScore >= Math.ceil(totalServices / 2)
      setAuthServiceHealth(isHealthy)

      if (isHealthy) {
        // Clear errors on successful health check
        setLastError(null)
      }

      logger.debug('Service health check completed', {
        healthScore,
        totalServices,
        isHealthy
      })
    } catch (error) {
      logger.error('Service health check failed:', error)
      setAuthServiceHealth(false)
      setLastError(`Health check failed: ${error}`)
    }
  }

  // Restart all services
  const restartServices = async (): Promise<void> => {
    try {
      logger.info('Restarting all services')
      setLastError(null)

      // Restart auth store
      if (authStore && typeof authStore.restart === 'function') {
        await authStore.restart()
        logger.debug('Auth store restarted')
      } else if (authStore && typeof authStore.initialize === 'function') {
        await authStore.initialize()
        logger.debug('Auth store re-initialized')
      }

      // Restart token refresh service
      if (tokenRefreshService) {
        try {
          if (typeof tokenRefreshService.stopServices === 'function') {
            tokenRefreshService.stopServices()
          }
          if (typeof tokenRefreshService.startServices === 'function') {
            await tokenRefreshService.startServices()
          }
          logger.debug('Token refresh service restarted')
        } catch (tokenError) {
          logger.warn('Failed to restart token refresh service:', tokenError)
        }
      }

      // Check health after restart
      setTimeout(() => checkServiceHealth(), 1000)

      logger.info('Service restart completed')
    } catch (error) {
      logger.error('Failed to restart services:', error)
      setLastError(`Failed to restart services: ${error}`)
      setAuthServiceHealth(false)
      setTokenRefreshStatus('error')
    }
  }

  // Get auth store status
  const getAuthStoreStatus = () => {
    if (!authStore) return { available: false }

    try {
      return {
        available: true,
        isInitialized: authStore.isInitialized?.() ?? false,
        isAuthenticated: authStore.isAuthenticated?.() ?? false,
        hasValidToken: authStore.hasValidToken?.() ?? false,
        tokenStatus: authStore.tokenStatus?.() ?? 'unknown',
        sessionNotification: authStore.getSessionExpiryNotification?.() ?? null
      }
    } catch (error) {
      logger.warn('Failed to get auth store status:', error)
      return { available: true, error: error }
    }
  }

  // Get token refresh service status
  const getTokenRefreshServiceStatus = () => {
    if (!tokenRefreshService) return { available: false }

    try {
      return {
        available: true,
        ...tokenRefreshService.getServiceStatus?.() ?? {}
      }
    } catch (error) {
      logger.warn('Failed to get token refresh service status:', error)
      return { available: true, error: error }
    }
  }

  // Clear errors
  const clearErrors = () => {
    setLastError(null)
  }

  // Initialize and start health monitoring
  const startCoordination = async () => {
    await initializeServicesReferences()
    await checkServiceHealth()

    // Start periodic health checks
    healthCheckInterval = window.setInterval(checkServiceHealth, 30000) // Every 30 seconds

    logger.info('Service coordination started')
  }

  // Stop coordination
  const stopCoordination = () => {
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval)
      healthCheckInterval = null
    }

    logger.info('Service coordination stopped')
  }

  // Auto-start coordination
  startCoordination()

  return {
    // Service health indicators
    authServiceHealth,
    tokenRefreshStatus,
    lastError,

    // Service control methods
    restartServices,
    checkServiceHealth,

    // Service status getters
    getAuthStoreStatus,
    getTokenRefreshServiceStatus,

    // Error handling
    clearErrors
  }
}

/**
 * Service Coordinator Context and Provider
 */
import { createContext, useContext } from 'solid-js'
import type { Component } from 'solid-js'

const ServiceCoordinatorContext = createContext<ServiceCoordinatorState>()

export const ServiceCoordinatorProvider: Component<{ children: any }> = (props) => {
  const serviceCoordinator = createServiceCoordinator()

  // Cleanup on unmount
  onCleanup(() => {
    logger.debug('Service coordinator cleanup')
    // The coordinator handles its own cleanup internally
  })

  return (
    <ServiceCoordinatorContext.Provider value={serviceCoordinator}>
      {props.children}
    </ServiceCoordinatorContext.Provider>
  )
}

/**
 * Hook to access service coordinator
 */
export const useServiceCoordinator = (): ServiceCoordinatorState => {
  const context = useContext(ServiceCoordinatorContext)
  if (!context) {
    throw new Error('useServiceCoordinator must be used within ServiceCoordinatorProvider')
  }
  return context
}

export default {
  createServiceCoordinator,
  ServiceCoordinatorProvider,
  useServiceCoordinator
}