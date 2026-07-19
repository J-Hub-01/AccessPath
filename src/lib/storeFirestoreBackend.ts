import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  type Firestore,
} from 'firebase/firestore'
import { logger } from './logger'
import type {
  AccessPathStore,
  HelpRequestRecord,
  HelpRequestStatus,
  NewHelpRequestInput,
  NewOrderInput,
  OrderRecord,
  OrderStatus,
} from './storeTypes'

const ORDERS_COLLECTION = 'orders'
const HELP_REQUESTS_COLLECTION = 'helpRequests'

export function createFirestoreStore(db: Firestore): AccessPathStore {
  return {
    backendName: 'firestore',

    async submitOrder(input: NewOrderInput): Promise<string> {
      const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
        ...input,
        status: 'pending' satisfies OrderStatus,
        createdAt: Date.now(),
      })
      return docRef.id
    },

    subscribeOrders(onChange) {
      const q = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'))
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const orders: OrderRecord[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data()
            return {
              id: docSnap.id,
              section: String(data.section ?? ''),
              items: Array.isArray(data.items) ? (data.items as string[]) : [],
              notes: String(data.notes ?? ''),
              sessionId: String(data.sessionId ?? ''),
              status: (data.status as OrderStatus) ?? 'pending',
              upsellSuggestion: (data.upsellSuggestion as string | null) ?? null,
              createdAt: Number(data.createdAt ?? 0),
            }
          })
          onChange(orders)
        },
        (err) => logger.error('Firestore orders subscription failed', { error: err.message }),
      )
      return unsubscribe
    },

    async updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
      await updateDoc(doc(db, ORDERS_COLLECTION, id), { status })
    },

    async submitHelpRequest(input: NewHelpRequestInput): Promise<string> {
      const docRef = await addDoc(collection(db, HELP_REQUESTS_COLLECTION), {
        ...input,
        status: 'open' satisfies HelpRequestStatus,
        createdAt: Date.now(),
      })
      return docRef.id
    },

    subscribeHelpRequests(onChange) {
      const q = query(collection(db, HELP_REQUESTS_COLLECTION), orderBy('createdAt', 'desc'))
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const requests: HelpRequestRecord[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data()
            return {
              id: docSnap.id,
              section: String(data.section ?? ''),
              sessionId: String(data.sessionId ?? ''),
              kind: (data.kind as HelpRequestRecord['kind']) ?? 'general',
              description: String(data.description ?? ''),
              urgency: (data.urgency as HelpRequestRecord['urgency']) ?? 'medium',
              staffSummary: String(data.staffSummary ?? ''),
              status: (data.status as HelpRequestStatus) ?? 'open',
              createdAt: Number(data.createdAt ?? 0),
            }
          })
          onChange(requests)
        },
        (err) =>
          logger.error('Firestore help-request subscription failed', { error: err.message }),
      )
      return unsubscribe
    },

    async updateHelpRequestStatus(id: string, status: HelpRequestStatus): Promise<void> {
      await updateDoc(doc(db, HELP_REQUESTS_COLLECTION, id), { status })
    },
  }
}
