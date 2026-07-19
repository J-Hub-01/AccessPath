/**
 * AccessPath v2 — shared data model for the "critical link" described in
 * the v2 vision doc: fan-side actions (order, help request) must appear on
 * staff's screen live, without either side refreshing or sharing a session.
 *
 * These types are backend-agnostic. Two backends implement AccessPathStore
 * (see store.ts): a real Firestore backend for genuine cross-device sync,
 * and a same-browser local demo-mode fallback so the app is still fully
 * demoable with zero external setup (see storeLocalBackend.ts).
 */

export type OrderStatus = 'pending' | 'fulfilled'

export interface OrderRecord {
  id: string
  section: string
  items: string[]
  notes: string
  sessionId: string
  status: OrderStatus
  upsellSuggestion: string | null
  createdAt: number
}

export interface NewOrderInput {
  section: string
  items: string[]
  notes: string
  sessionId: string
  upsellSuggestion: string | null
}

export type HelpRequestKind = 'lost' | 'disturbance' | 'general'
export type Urgency = 'low' | 'medium' | 'high'
export type HelpRequestStatus = 'open' | 'acknowledged' | 'resolved'

export interface HelpRequestRecord {
  id: string
  section: string
  sessionId: string
  kind: HelpRequestKind
  description: string
  urgency: Urgency
  staffSummary: string
  status: HelpRequestStatus
  createdAt: number
}

export interface NewHelpRequestInput {
  section: string
  sessionId: string
  kind: HelpRequestKind
  description: string
  urgency: Urgency
  staffSummary: string
}

export interface AccessPathStore {
  /** Human-readable identifier of which backend is actually live. Shown in the UI so nobody mistakes demo mode for a real deploy. */
  readonly backendName: 'firestore' | 'local-demo'
  submitOrder(input: NewOrderInput): Promise<string>
  subscribeOrders(onChange: (orders: OrderRecord[]) => void): () => void
  updateOrderStatus(id: string, status: OrderStatus): Promise<void>
  submitHelpRequest(input: NewHelpRequestInput): Promise<string>
  subscribeHelpRequests(onChange: (requests: HelpRequestRecord[]) => void): () => void
  updateHelpRequestStatus(id: string, status: HelpRequestStatus): Promise<void>
}
