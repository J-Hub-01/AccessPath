import { initializeApp, type FirebaseOptions } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'

/**
 * Firebase config is read from VITE_FIREBASE_* env vars (see .env.example).
 *
 * These values are safe to expose in a client bundle — a Firebase web
 * config is an app identifier, not a secret. Access control is enforced
 * server-side by Firestore Security Rules (see firestore.rules), never by
 * hiding this config. See SECURITY.md before deploying.
 */
const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/**
 * True only when the builder has actually filled in a Firebase project.
 * When false, store.ts transparently falls back to the local demo-mode
 * backend instead of crashing — see storeLocalBackend.ts.
 */
export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
)

let cachedDb: Firestore | null = null

export function getFirestoreDb(): Firestore | null {
  if (!firebaseConfigured) return null
  if (!cachedDb) {
    const app = initializeApp(firebaseConfig)
    cachedDb = getFirestore(app)
  }
  return cachedDb
}
