// Import the functions you need from the SDKs you need
import {
  initializeApp,
  getApps,
  getApp,
  type FirebaseApp
} from "firebase/app"
import {
  type Auth,
  getAuth,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  connectAuthEmulator
} from 'firebase/auth'
import { createLogger } from '../logger'
// https://firebase.google.com/docs/web/setup#available-libraries

const logger = createLogger('[Firebase Config]');

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_ACCOUNT_CONFIG_API_KEY as string,
  authDomain: import.meta.env.PUBLIC_FIREBASE_ACCOUNT_CONFIG_AUTH_DOMAIN as string,
  projectId: import.meta.env.PUBLIC_FIREBASE_ACCOUNT_CONFIG_PROJECT_ID as string,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_ACCOUNT_CONFIG_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_ACCOUNT_CONFIG_MESSAGE_SENDER_ID as string,
  appId: import.meta.env.PUBLIC_FIREBASE_ACCOUNT_CONFIG_APP_ID as string,
}

// Firebase configuration validation
function validateFirebaseConfig(): boolean {
  const required = [
    'apiKey',
    'authDomain',
    'projectId',
    'appId'
  ];

  const missing = required.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

  if (missing.length > 0) {
    logger.error('Missing Firebase configuration:', missing);
    return false;
  }

  logger.debug('Firebase configuration validated', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
  });

  return true;
}

// Initialize Firebase with enhanced auth configuration
let app: FirebaseApp;
let auth: Auth;
let isInitialized = false;

async function initializeFirebase(): Promise<void> {
  if (isInitialized) {
    logger.debug('Firebase already initialized');
    return;
  }

  try {
    logger.debug('Initializing Firebase');

    // Validate configuration
    if (!validateFirebaseConfig()) {
      throw new Error('Invalid Firebase configuration');
    }

    // Initialize Firebase app with singleton pattern
    if (!getApps().length) {
      logger.debug('Creating new Firebase app');
      app = initializeApp(firebaseConfig);
    } else {
      logger.debug('Using existing Firebase app');
      app = getApp();
    }

    // Initialize Auth
    auth = getAuth(app);

    // Configure auth persistence based on environment
    await configureAuthPersistence();

    // Connect to auth emulator in development
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      const emulatorHost = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST;
      if (emulatorHost) {
        logger.debug('Connecting to Firebase Auth emulator', { emulatorHost });
        connectAuthEmulator(auth, `http://${emulatorHost}`);
      }
    }

    isInitialized = true;
    logger.debug('Firebase initialized successfully', {
      projectId: firebaseConfig.projectId,
      apps: getApps().length,
    });
  } catch (error) {
    logger.error('Failed to initialize Firebase:', error);
    throw error;
  }
}

// Configure Firebase Auth persistence
async function configureAuthPersistence(): Promise<void> {
  try {
    // Check if user has "remember me" preference
    const hasRememberMe = localStorage.getItem('firebase-rememberMe') === 'true';

    const persistence = hasRememberMe ? browserLocalPersistence : browserSessionPersistence;

    logger.debug('Setting Firebase auth persistence', {
      persistence: hasRememberMe ? 'local' : 'session',
      rememberMe: hasRememberMe,
    });

    await setPersistence(auth, persistence);

    logger.debug('Firebase auth persistence configured successfully');
  } catch (error) {
    logger.error('Failed to configure Firebase auth persistence:', error);
    // Don't throw - this is not critical for basic functionality
  }
}

// Enhanced auth configuration utilities
export const firebaseUtils = {
  // Get current auth configuration
  getAuthConfig: () => ({
    persistence: auth.config.persistence,
    apiKey: firebaseConfig.apiKey,
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
  }),

  // Update auth persistence dynamically
  updateAuthPersistence: async (rememberMe: boolean) => {
    try {
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;

      logger.debug('Updating Firebase auth persistence', {
        persistence: rememberMe ? 'local' : 'session',
        rememberMe,
      });

      await setPersistence(auth, persistence);

      // Update stored preference
      localStorage.setItem('firebase-rememberMe', rememberMe.toString());

      logger.debug('Firebase auth persistence updated successfully');
    } catch (error) {
      logger.error('Failed to update Firebase auth persistence:', error);
      throw error;
    }
  },

  // Get Firebase project configuration
  getProjectConfig: () => ({
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    apiKey: firebaseConfig.apiKey ? 'CONFIGURED' : 'MISSING',
  }),

  // Check if Firebase is properly configured
  isConfigured: () => validateFirebaseConfig(),

  // Get initialization status
  isInitialized: () => isInitialized,

  // Force re-initialization (for testing or recovery)
  reinitialize: async () => {
    isInitialized = false;
    await initializeFirebase();
  },
};

// Auto-initialize Firebase when module loads
if (typeof window !== 'undefined') {
  // Initialize Firebase on browser environment
  initializeFirebase().catch(error => {
    logger.error('Auto-initialization failed:', error);
  });
} else {
  // In SSR environment, just create basic instances
  logger.debug('SSR environment detected, creating basic Firebase instances');

  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  auth = getAuth(app);
  isInitialized = true;
}

export {
  app,
  auth,
  initializeFirebase,
  configureAuthPersistence,
  validateFirebaseConfig,
};
