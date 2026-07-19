import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createLocalStore } from '../storeLocalBackend'

describe('createLocalStore (v2 — demo-mode shared state)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('reports its backend name so the UI can show the demo-mode badge honestly', () => {
    const store = createLocalStore()
    expect(store.backendName).toBe('local-demo')
  })

  it('submitOrder persists the order and subscribeOrders delivers it to a listener in the same tab', async () => {
    const store = createLocalStore()
    let latest: unknown[] = []
    const unsubscribe = store.subscribeOrders((orders) => {
      latest = orders
    })

    await store.submitOrder({
      section: 'Section 114',
      items: ['1x Hot dog'],
      notes: '',
      sessionId: 'sess_1',
      upsellSuggestion: null,
    })

    expect(latest).toHaveLength(1)
    expect(latest[0]).toMatchObject({ section: 'Section 114', status: 'pending' })

    unsubscribe()
  })

  it('updateOrderStatus flips a pending order to fulfilled and notifies subscribers live', async () => {
    const store = createLocalStore()
    const id = await store.submitOrder({
      section: 'Section 114',
      items: ['1x Chips'],
      notes: '',
      sessionId: 'sess_1',
      upsellSuggestion: null,
    })

    let latest: Array<{ id: string; status: string }> = []
    const unsubscribe = store.subscribeOrders((orders) => {
      latest = orders
    })

    await store.updateOrderStatus(id, 'fulfilled')

    expect(latest.find((o) => o.id === id)?.status).toBe('fulfilled')
    unsubscribe()
  })

  it('submitHelpRequest persists urgency and staffSummary from Gemini triage, not just raw text', async () => {
    const store = createLocalStore()
    let latest: Array<{ urgency: string; staffSummary: string }> = []
    const unsubscribe = store.subscribeHelpRequests((requests) => {
      latest = requests
    })

    await store.submitHelpRequest({
      section: 'Section 114',
      sessionId: 'sess_2',
      kind: 'disturbance',
      description: 'Someone is being loud and aggressive nearby.',
      urgency: 'high',
      staffSummary: 'Fan reports aggressive behavior, Section 114.',
    })

    expect(latest).toHaveLength(1)
    expect(latest[0]?.urgency).toBe('high')
    expect(latest[0]?.staffSummary).toContain('Section 114')
    unsubscribe()
  })

  it('updateHelpRequestStatus moves a request from open to acknowledged to resolved', async () => {
    const store = createLocalStore()
    const id = await store.submitHelpRequest({
      section: 'Section 200',
      sessionId: 'sess_3',
      kind: 'lost',
      description: 'Cannot find my seat.',
      urgency: 'medium',
      staffSummary: 'Fan needs wayfinding help, Section 200.',
    })

    let latest: Array<{ id: string; status: string }> = []
    const unsubscribe = store.subscribeHelpRequests((requests) => {
      latest = requests
    })

    await store.updateHelpRequestStatus(id, 'acknowledged')
    expect(latest.find((r) => r.id === id)?.status).toBe('acknowledged')

    await store.updateHelpRequestStatus(id, 'resolved')
    expect(latest.find((r) => r.id === id)?.status).toBe('resolved')

    unsubscribe()
  })

  it('sorts newest orders first so staff see the most recent requests at the top', async () => {
    const store = createLocalStore()
    await store.submitOrder({
      section: 'A',
      items: ['1x Water'],
      notes: '',
      sessionId: 'sess_a',
      upsellSuggestion: null,
    })
    await new Promise((resolve) => setTimeout(resolve, 5))
    await store.submitOrder({
      section: 'B',
      items: ['1x Chips'],
      notes: '',
      sessionId: 'sess_b',
      upsellSuggestion: null,
    })

    let latest: Array<{ section: string }> = []
    const unsubscribe = store.subscribeOrders((orders) => {
      latest = orders
    })

    expect(latest[0]?.section).toBe('B')
    unsubscribe()
  })
})
