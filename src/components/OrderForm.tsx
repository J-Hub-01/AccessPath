import { useEffect, useId, useState } from 'react'
import { STADIUM_MENU } from '../lib/prompts'
import { suggestUpsell } from '../lib/gemini'
import { parseUpsellResponse } from '../lib/schema'
import { getStore, type OrderRecord } from '../lib/store'
import { logger } from '../lib/logger'
import type { UiStrings } from '../lib/i18n'
import type { Session } from '../lib/session'

interface OrderFormProps {
  session: Session
  strings: UiStrings
}

/**
 * v2 — "Order from your seat" (accesspath_v2_vision.md, Role 1). Submits
 * straight to the shared store so it appears on the Staff order queue
 * live. Gemini suggests one upsell item per order (best-effort — a failed
 * upsell call never blocks placing the order itself).
 */
export function OrderForm({ session, strings }: OrderFormProps) {
  const [selected, setSelected] = useState<Record<string, number>>({})
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const [selectionError, setSelectionError] = useState<string | null>(null)
  const [myOrders, setMyOrders] = useState<OrderRecord[]>([])
  const notesId = useId()

  useEffect(() => {
    const store = getStore()
    return store.subscribeOrders((orders) => {
      setMyOrders(orders.filter((order) => order.sessionId === session.sessionId))
    })
  }, [session.sessionId])

  function toggleItem(itemId: string) {
    setSelected((current) => {
      const next = { ...current }
      if (next[itemId]) {
        delete next[itemId]
      } else {
        next[itemId] = 1
      }
      return next
    })
  }

  function updateQty(itemId: string, qty: number) {
    setSelected((current) => ({ ...current, [itemId]: Math.max(1, Math.min(9, qty)) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const itemNames = Object.entries(selected).map(([itemId, qty]) => {
      const menuItem = STADIUM_MENU.find((m) => m.id === itemId)
      return `${qty}x ${menuItem?.name ?? itemId}`
    })

    if (itemNames.length === 0) {
      setSelectionError(strings.orderEmptySelectionError)
      return
    }

    setSelectionError(null)
    setSubmitting(true)
    setConfirmation(null)

    let upsellSuggestion: string | null = null
    const upsellResult = await suggestUpsell({ items: itemNames, section: session.section })
    if (upsellResult.success) {
      const parsed = parseUpsellResponse(upsellResult.rawText)
      if (parsed.success) {
        upsellSuggestion = parsed.data.suggestion
      } else {
        logger.warn('Upsell response failed schema validation', { error: parsed.error })
      }
    }

    await getStore().submitOrder({
      section: session.section,
      items: itemNames,
      notes,
      sessionId: session.sessionId,
      upsellSuggestion,
    })

    setSubmitting(false)
    setSelected({})
    setNotes('')
    setConfirmation(strings.orderConfirmation)
  }

  const hasSelection = Object.keys(selected).length > 0

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-slate-200">
            {strings.orderMenuHeading}
          </legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {STADIUM_MENU.map((item) => (
              <label
                key={item.id}
                className={`flex min-h-11 items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                  selected[item.id]
                    ? 'border-teal-400 bg-teal-500/10 text-slate-50'
                    : 'border-slate-600 bg-slate-800/60 text-slate-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={Boolean(selected[item.id])}
                  onChange={() => toggleItem(item.id)}
                  className="h-4 w-4"
                />
                <span className="flex-1">{item.name}</span>
                {selected[item.id] ? (
                  <input
                    type="number"
                    min={1}
                    max={9}
                    value={selected[item.id]}
                    onChange={(e) => updateQty(item.id, Number(e.target.value))}
                    aria-label={`${strings.orderQtyLabel} ${item.name}`}
                    className="w-14 rounded border border-slate-500 bg-slate-900 px-1 py-1 text-center"
                  />
                ) : null}
              </label>
            ))}
          </div>
          {selectionError && (
            <p role="alert" className="text-sm text-rose-300">
              {selectionError}
            </p>
          )}
        </fieldset>

        <div>
          <label htmlFor={notesId} className="mb-1 block text-sm font-medium text-slate-200">
            {strings.orderNotesLabel}
          </label>
          <textarea
            id={notesId}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={strings.orderNotesPlaceholder}
            rows={2}
            className="w-full rounded-md border border-slate-500 bg-slate-800 px-3 py-2 text-slate-50 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !hasSelection}
          className="min-h-11 self-start rounded-md bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {strings.orderSubmitLabel} {strings.orderSectionPrefix}{' '}
          {session.section || strings.orderNoSectionFallback}
        </button>

        {confirmation && (
          <p role="status" className="text-sm text-teal-300">
            {confirmation}
          </p>
        )}
      </form>

      {myOrders.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-300">{strings.myOrdersHeading}</h3>
          <ul className="flex flex-col gap-2">
            {myOrders.map((order) => (
              <li
                key={order.id}
                className="rounded-md border border-slate-700 bg-slate-800/50 p-3 text-sm text-slate-200"
              >
                <p>{order.items.join(', ')}</p>
                <p
                  className={`mt-1 text-xs font-medium ${
                    order.status === 'fulfilled' ? 'text-teal-300' : 'text-amber-300'
                  }`}
                >
                  {order.status === 'fulfilled'
                    ? strings.orderStatusFulfilled
                    : strings.orderStatusPending}
                </p>
                {order.upsellSuggestion && (
                  <p className="mt-1 text-xs text-slate-400">
                    {strings.upsellPrefix} {order.upsellSuggestion}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
