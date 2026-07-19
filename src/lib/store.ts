import { firebaseConfigured, getFirestoreDb } from './firebase'
import { createFirestoreStore } from './storeFirestoreBackend'
import { createLocalStore } from './storeLocalBackend'
import type { AccessPathStore } from './storeTypes'

export type {
  AccessPathStore,
  HelpRequestKind,
  HelpRequestRecord,
  HelpRequestStatus,
  NewHelpRequestInput,
  NewOrderInput,
  OrderRecord,
  OrderStatus,
  Urgency,
} from './storeTypes'

let cachedStore: AccessPathStore | null = null

/**
 * Resolves the v2 vision doc's open decision: use real Firestore when a
 * Firebase project is configured (see .env.example), otherwise fall back
 * to the local demo-mode backend automatically so the live Fan <-> Staff
 * link still works out of the box. See storeLocalBackend.ts for the
 * documented limitation of that fallback (same-browser only).
 */
export function getStore(): AccessPathStore {
  if (cachedStore) return cachedStore

  if (firebaseConfigured) {
    const db = getFirestoreDb()
    if (db) {
      cachedStore = createFirestoreStore(db)
      return cachedStore
    }
  }

  cachedStore = createLocalStore()
  return cachedStore
}
