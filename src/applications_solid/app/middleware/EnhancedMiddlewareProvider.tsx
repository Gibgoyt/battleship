/**
 * Enhanced Middleware Provider
 * Simple passthrough provider that lets child providers handle initialization
 */

import type { Component } from 'solid-js'
import { createLogger } from 'src/lib/logger'

const logger = createLogger('[EnhancedMiddlewareProvider]')

export interface EnhancedMiddlewareProviderProps {
  children: any
  firebaseToken?: string
}

export const EnhancedMiddlewareProvider: Component<EnhancedMiddlewareProviderProps> = (props) => {
  logger.debug('EnhancedMiddlewareProvider rendering - letting child providers handle initialization', {
    hasFirebaseToken: !!props.firebaseToken
  })

  // Just render children immediately - let AuthStoreProvider and others handle initialization
  return <>{props.children}</>
}

export default EnhancedMiddlewareProvider