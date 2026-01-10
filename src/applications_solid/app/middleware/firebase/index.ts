/**
 * Firebase Middleware Exports
 * Central export point for Firebase authentication components
 */

// Export the main Firebase Auth Manager
export { FirebaseAuthManager } from './auth-manager';

// Export the Token Refresh Service
export { FirebaseTokenRefreshService } from './token-refresh-service';

// Export SolidJS auth store
export { createFirebaseAuthStore } from './auth-store';

// Export auth middleware
export { createFirebaseAuthMiddleware } from './auth-middleware';

// Re-export types from parent
export type {
  AuthService,
  AuthStore,
  TokenRefreshResult,
  AuthPollingResult,
  AuthManagerConfig,
} from '../types';

// Define Firebase-specific service interface
export interface FirebaseAuthService {
  authManager: FirebaseAuthManager;
  tokenRefreshService: FirebaseTokenRefreshService;
  authStore: ReturnType<typeof createFirebaseAuthStore>;
  authMiddleware: ReturnType<typeof createFirebaseAuthMiddleware>;
}