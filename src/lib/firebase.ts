import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// TEMPORARILY DISABLED: Google sign-in + Firestore cloud sync are turned off.
// Flip this to false to re-enable the full Firebase integration.
const GOOGLE_AUTH_DISABLED = true;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let provider: GoogleAuthProvider | null = null;
let isMockMode = true;

function loadCredentials() {
  // Check for environment variables (preferred) or window-injected config
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  if (apiKey && apiKey !== 'YOUR_FIREBASE_API_KEY') {
    return {
      apiKey,
      authDomain: authDomain || '',
      projectId: projectId || '',
      storageBucket: storageBucket || '',
      messagingSenderId: messagingSenderId || '',
      appId: appId || '',
    };
  }

  return null;
}

export function initFirebase() {
  if (GOOGLE_AUTH_DISABLED) {
    isMockMode = true;
    return;
  }

  const config = loadCredentials();

  if (!config) {
    isMockMode = true;
    return;
  }

  if (getApps().length === 0) {
    app = initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app);
    provider = new GoogleAuthProvider();
    isMockMode = false;
  }
}

export function getIsMockMode() {
  return isMockMode;
}

export function getFirebaseAuth() {
  return auth;
}

export function getFirebaseDb() {
  return db;
}

export function getGoogleProvider() {
  return provider;
}
