/**
 * TypeScript interfaces for Firebase Auth Middleware
 * Defines core types for authentication state management and token refresh
 */

import type { CustomFirebaseUser } from './firebase/custom-user';

// Auth State Interface
export interface AuthState {
  isAuthenticated: boolean;
  user: CustomFirebaseUser | null;
  tokenExpiresAt: number | null;
  lastRefreshAt: number | null;
  nextRefreshAt: number | null;
  refreshAttempts: number;
}

// Token Refresh Result Interface
export interface TokenRefreshResult {
  success: boolean;
  newToken?: string;
  error?: string;
  retryAfter?: number;
  timestamp: number;
}

// Auth Polling Result Interface
export interface AuthPollingResult {
  isValid: boolean;
  shouldRefresh: boolean;
  error?: string;
  timestamp: number;
}

// Token Validation Result Interface
export interface TokenValidationResult {
  isValid: boolean;
  isExpired: boolean;
  expiresAt: number | null;
  shouldRefresh: boolean;
  error?: string;
}

// Auth Manager Configuration Interface
export interface AuthManagerConfig {
  proactiveRefreshInterval: number; // milliseconds (30 minutes = 1800000)
  authPollingInterval: number; // milliseconds (5 minutes = 300000)
  maxRefreshAttempts: number;
  refreshBufferTime: number; // milliseconds before token expiration to trigger refresh
}

// Auth Service Interface
export interface AuthService {
  initialize(initialToken?: string): Promise<void>;
  startProactiveRefresh(): void;
  startAuthPolling(): void;
  stopAllServices(): void;
  refreshToken(): Promise<TokenRefreshResult>;
  validateAuthState(): Promise<AuthPollingResult>;
  logout(): Promise<void>;
  cleanup(): void;
}

// Auth Store Interface
export interface AuthStore {
  isAuthenticated: () => boolean;
  currentUser: () => User | null;
  tokenStatus: () => 'valid' | 'refreshing' | 'expired' | 'error';
  authError: () => string | null;
  lastRefreshAt: () => number | null;
  nextRefreshAt: () => number | null;
  refreshToken: () => Promise<void>;
  logout: () => Promise<void>;
}

// Storage Event Interface for multi-tab coordination
export interface AuthStorageEvent {
  type: 'TOKEN_REFRESHED' | 'AUTH_FAILED' | 'USER_LOGGED_OUT' | 'TOKEN_EXPIRED';
  timestamp: number;
  data?: {
    newToken?: string;
    expiresAt?: number;
    error?: string;
  };
}

// Middleware Navigation Context Interface
export interface NavigationContext {
  from: string;
  to: string;
  authenticated: boolean;
  tokenStatus: 'valid' | 'refreshing' | 'expired' | 'error';
}

// Auth Failure Reason Enum
export enum AuthFailureReason {
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  REFRESH_FAILED = 'REFRESH_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  FIREBASE_ERROR = 'FIREBASE_ERROR',
  USER_DISABLED = 'USER_DISABLED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Error Handling Interface
export interface AuthError {
  reason: AuthFailureReason;
  message: string;
  timestamp: number;
  shouldRetry: boolean;
  retryAfter?: number;
  originalError?: Error;
}

// Timer Management Interface
export interface TimerManager {
  proactiveRefreshTimer: number | null;
  authPollingTimer: number | null;
  cleanupTimer: number | null;
}

// Service Health Interface
export interface ServiceHealth {
  isHealthy: boolean;
  lastCheck: number;
  consecutiveFailures: number;
  issues: string[];
}

// Direct Token Refresh Result Interface
export interface DirectRefreshResult {
  success: boolean;
  newToken?: string;
  refreshToken?: string;
  error?: string;
  timestamp: number;
}

// Session Expiry Notification Interface
export interface SessionExpiryNotification {
  isVisible: boolean;
  countdown: number;
  message: string;
  onRedirect: () => void;
  onDismiss: () => void;
}

// Default Configuration Constants
export const DEFAULT_AUTH_CONFIG: AuthManagerConfig = {
  proactiveRefreshInterval: 30 * 60 * 1000, // 30 minutes
  authPollingInterval: 5 * 60 * 1000, // 5 minutes
  maxRefreshAttempts: 3,
  refreshBufferTime: 30 * 60 * 1000, // 30 minutes before expiration
};

// Storage Keys Constants
export const STORAGE_KEYS = {
  ID_TOKEN: 'firebase-idToken',
  REFRESH_TOKEN: 'firebase-refreshToken',
  REMEMBER_ME: 'firebase-rememberMe',
  LAST_REFRESH: 'firebase-lastRefresh',
  NEXT_REFRESH: 'firebase-nextRefresh',
  AUTH_ERROR: 'firebase-authError',
  TOKEN_EXPIRES_AT: 'firebase-tokenExpiresAt',
} as const;

// Cookie Names Constants
export const COOKIE_NAMES = {
  AUTH_TOKEN: 'firebase-auth-token',
  AUTH_STATUS: 'firebase-auth-status',
  TOKEN_EXPIRES: 'firebase-token-expires',
} as const;