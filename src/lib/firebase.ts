import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator, GoogleAuthProvider, signInWithCredential, signInWithPopup, signOut } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { firebaseConfig, firebaseEmulator } from './firebaseConfig';

// Initialize Firebase app once
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// Emulators (granular)
try {
  if (firebaseEmulator.auth) {
    connectAuthEmulator(auth, `http://${firebaseEmulator.authHost}:${firebaseEmulator.authPort}`);
  }
} catch {}
try {
  if (firebaseEmulator.firestore) {
    connectFirestoreEmulator(db, firebaseEmulator.firestoreHost, firebaseEmulator.firestorePort);
  }
} catch {}
try {
  if (firebaseEmulator.functions) {
    connectFunctionsEmulator(functions, firebaseEmulator.functionsHost, firebaseEmulator.functionsPort);
  }
} catch {}

// Helper: bridge GIS id_token -> Firebase Auth sign-in
export async function signInToFirebaseWithGoogleIdToken(idToken: string) {
  const credential = GoogleAuthProvider.credential(idToken);
  await signInWithCredential(auth, credential);
}

// Helper: get a callable
export function callable(name: string) {
  return httpsCallable(functions, name);
}

export default app;

// Sign out helper for convenience in non-TS modules
export async function signOutFirebase() {
  await signOut(auth);
}

// Optional: Direct Firebase Google popup (fallback if GIS client ID not set)
export async function signInWithGooglePopup() {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  return cred;
}