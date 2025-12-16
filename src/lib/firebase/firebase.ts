// Import the functions you need from the SDKs you need
import {
  initializeApp,
  getApps,
  getApp,
  type FirebaseApp
} from "firebase/app"
import {
  type Auth,
  getAuth
} from 'firebase/auth'
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_ACCOUNT_CONFIG_API_KEY as string,
  authDomain: import.meta.env.PUBLIC_FIREBASE_ACCOUNT_CONFIG_AUTH_DOMAIN as string,
  projectId: import.meta.env.PUBLIC_FIREBASE_ACCOUNT_CONFIG_PROJECT_ID as string,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_ACCOUNT_CONFIG_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_ACCOUNT_CONFIG_MESSAGE_SENDER_ID as string,
  appId: import.meta.env.PUBLIC_FIREBASE_ACCOUNT_CONFIG_APP_ID as string,
}

// Initialize Firebase with singleton pattern to prevent duplicate app errors in SSR
let app: FirebaseApp
let auth: Auth

if (!getApps().length) {
  // No Firebase app exists, initialize one
  app = initializeApp(firebaseConfig)
} else {
  // Use existing Firebase app
  app = getApp()
}

auth = getAuth(app)

export {
  app,
  auth,
}
