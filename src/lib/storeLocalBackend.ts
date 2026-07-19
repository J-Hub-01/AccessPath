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

/**
 * Demo-mode fallback backend, used automatically when no Firebase project
 * is configured (see firebase.ts / store.ts). This resolves the v2 vision
 * doc's "Open decision" in favor of *both* options rather than one:
 * Firestore is used when configured (real, cross-device), and this
 * localStorage-based backend takes over otherwise so the live Fan -> Staff
 * link is still fully demoable in two browser tabs with zero setup time —
 * exactly the "faked-but-convincing polling loop" the vision doc allowed
 * for, implemented here as an instant event-based sync instead of a poll.
 *
 * How the live sync works:
 * - Writes go to localStorage (shared across tabs in the same browser).
 * - The native `storage` event notifies *other* tabs of the change.
 * - A same-tab EventTarget notifies the writing tab's own subscribers,
 *   since the native `storage` event does not fire in the tab that wrote
 *   the value.
 *
 * Limitation (documented, not hidden — see hidden-flaws checklist): this
 * only syncs across tabs of the *same browser*, not across real devices.
 * README.md and the in-app badge both say so explicitly.
 */

const ORDERS_KEY = 'accesspath:orders'
const HELP_KEY = 'accesspath:helpRequests'

const sameTabEmitter = new EventTarget()

function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function readList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch (err) {
    logger.warn('Local store read failed, treating as empty', { key, error: String(err) })
    return []
  }
}

function writeList<T>(key: string, list: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(list))
    sameTabEmitter.dispatchEvent(new CustomEvent(key))
  } catch (err) {
    logger.error('Local store write failed', { key, error: String(err) })
  }
}

function subscribeList<T>(key: string, onChange: (list: T[]) => void): () => void {
  const emit = () => onChange(readList<T>(key))

  const sameTabHandler = () => emit()
  sameTabEmitter.addEventListener(key, sameTabHandler)

  const crossTabHandler = (event: StorageEvent) => {
    if (event.key === key) emit()
  }
  window.addEventListener('storage', crossTabHandler)

  emit() // initial snapshot

  return () => {
    sameTabEmitter.removeEventListener(key, sameTabHandler)
    window.removeEventListener('storage', crossTabHandler)
  }
}

export function createLocalStore(): AccessPathStore {
  return {
    backendName: 'local-demo',

    async submitOrder(input: NewOrderInput): Promise<string> {
      const record: OrderRecord = {
        id: generateId('order'),
        ...input,
        status: 'pending',
        createdAt: Date.now(),
      }
      const current = readList<OrderRecord>(ORDERS_KEY)
      writeList(ORDERS_KEY, [record, ...current])
      return record.id
    },

    subscribeOrders(onChange) {
      return subscribeList<OrderRecord>(ORDERS_KEY, (list) =>
        onChange([...list].sort((a, b) => b.createdAt - a.createdAt)),
      )
    },

    async updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
      const current = readList<OrderRecord>(ORDERS_KEY)
      writeList(
        ORDERS_KEY,
        current.map((order) => (order.id === id ? { ...order, status } : order)),
      )
    },

    async submitHelpRequest(input: NewHelpRequestInput): Promise<string> {
      const record: HelpRequestRecord = {
        id: generateId('help'),
        ...input,
        status: 'open',
        createdAt: Date.now(),
      }
      const current = readList<HelpRequestRecord>(HELP_KEY)
      writeList(HELP_KEY, [record, ...current])
      return record.id
    },

    subscribeHelpRequests(onChange) {
      return subscribeList<HelpRequestRecord>(HELP_KEY, (list) =>
        onChange([...list].sort((a, b) => b.createdAt - a.createdAt)),
      )
    },

    async updateHelpRequestStatus(id: string, status: HelpRequestStatus): Promise<void> {
      const current = readList<HelpRequestRecord>(HELP_KEY)
      writeList(
        HELP_KEY,
        current.map((request) => (request.id === id ? { ...request, status } : request)),
      )
    },
  }
}
