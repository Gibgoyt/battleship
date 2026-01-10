/**
 * Main Middleware Exports
 * Central export point for all middleware functionality
 */

// Export core types
export type {
  AuthState,
  TokenRefreshResult,
  AuthPollingResult,
  TokenValidationResult,
  AuthManagerConfig,
  AuthService,
  AuthStore,
  AuthStorageEvent,
  NavigationContext,
  AuthError,
  TimerManager,
} from './types';

export {
  AuthFailureReason,
  DEFAULT_AUTH_CONFIG,
  STORAGE_KEYS,
  COOKIE_NAMES,
} from './types';

// Export Firebase auth components
export {
  FirebaseAuthManager,
  createFirebaseAuthStore,
  createFirebaseAuthMiddleware,
} from './firebase';

// Export Firebase auth service
export type { FirebaseAuthService } from './firebase';