// Copy to src/lib/firebaseConfig.ts and fill with your Firebase web config.
// Use Vite env vars for safety. Do not commit real values.

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Granular emulator flags: if a specific flag not provided, fall back to global VITE_USE_FIREBASE_EMULATORS
const globalEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';
const authEnabled = (import.meta.env.VITE_USE_FIREBASE_AUTH_EMULATOR || '').toLowerCase() === 'true' || globalEmulators;
const firestoreEnabled = (import.meta.env.VITE_USE_FIREBASE_FIRESTORE_EMULATOR || '').toLowerCase() === 'true' || globalEmulators;
const functionsEnabled = (import.meta.env.VITE_USE_FIREBASE_FUNCTIONS_EMULATOR || '').toLowerCase() === 'true' || globalEmulators;

export const firebaseEmulator = {
  auth: authEnabled,
  firestore: firestoreEnabled,
  functions: functionsEnabled,
  authHost: import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST || 'localhost',
  authPort: parseInt(import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_PORT || '9099', 10),
  firestoreHost: import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST || 'localhost',
  firestorePort: parseInt(import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_PORT || '8080', 10),
  functionsHost: import.meta.env.VITE_FIREBASE_FUNCTIONS_EMULATOR_HOST || 'localhost',
  functionsPort: parseInt(import.meta.env.VITE_FIREBASE_FUNCTIONS_EMULATOR_PORT || '5001', 10),
};

export const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;