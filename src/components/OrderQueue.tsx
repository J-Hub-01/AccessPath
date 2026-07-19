import { useEffect, useMemo, useState } from 'react'
import { getStore, type OrderRecord } from '../lib/store'
import type { UiStrings } from '../lib/i18n'

interface OrderQueueProps {
  strings: UiStrings
}

/**
 * v2 — "Staff see incoming food/drink/merch orders in real time, by
 * section, and can mark them fulfilled" (accesspath_v2_vision.md, Role 2).
 * Live via getStore().subscribeOrders — Firestore onSnapshot when
 * configured, or the local demo-mode backend otherwise (see store.ts).
 */
export function OrderQueue({ strings }: OrderQueueProps) {
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [sectionFilter, setSectionFilter] = useState<string>('__all__')
  const store = useMemo(() => getStore(), [])

  useEffect(() => {
    return store.subscribeOrders(setOrders)
  }, [store])

  const sections = useMemo(() => {
    const unique = new Set(orders.map((o) => o.section).filter(Boolean))
    return Array.from(unique).sort()
  }, [orders])

  const visibleOrders = useMemo(() => {
    const filtered =
      sectionFilter === '__all__' ? orders : orders.filter((o) => o.section === sectionFilter)
    return [...filtered].sort((a, b) => {
      if (a.status !== b.status) return a.status === 'pending' ? -1 : 1
      return b.createdAt - a.createdAt
    })
  }, [orders, sectionFilter])

  async function handleFulfill(id: string) {
    await store.updateOrderStatus(id, 'fulfilled')
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-100">
          {strings.staffOrderQueueHeading}
        </h2>
        {store.backendName === 'local-demo' && (
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
            {strings.demoModeBadge}
          </span>
        )}
      </div>

      {sections.length > 1 && (
        <div className="flex items-center gap-2">
          <label htmlFor="section-filter" className="text-sm text-slate-300">
            {strings.staffSectionFilterLabel}
          </label>
          <select
            id="section-filter"
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="min-h-11 rounded-md border border-slate-500 bg-slate-800 px-3 py-2 text-sm text-slate-50"
          >
            <option value="__all__">{strings.staffAllSections}</option>
            {sections.map((section) => (
              <option key={section} value={section}>
                {section}
              </option>
            ))}
          </select>
        </div>
      )}

      {visibleOrders.length === 0 ? (
        <p className="rounded-md border border-slate-700 bg-slate-800/40 p-4 text-sm text-slate-400">
          {strings.staffNoOrders}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visibleOrders.map((order) => (
            <li
              key={order.id}
              className={`rounded-md border p-4 ${
                order.status === 'fulfilled'
                  ? 'border-slate-700 bg-slate-800/30 opacity-70'
                  : 'border-slate-600 bg-slate-800/60'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    {strings.orderSectionPrefix} {order.section || strings.orderNoSectionFallback}
                  </p>
                  <p className="mt-1 text-sm text-slate-200">{order.items.join(', ')}</p>
                  {order.notes && (
                    <p className="mt-1 text-xs italic text-slate-400">{order.notes}</p>
                  )}
                </div>
                {order.status === 'pending' ? (
                  <button
                    type="button"
                    onClick={() => handleFulfill(order.id)}
                    className="min-h-11 rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                  >
                    {strings.staffMarkFulfilled}
                  </button>
                ) : (
                  <span className="rounded-full bg-teal-500/20 px-3 py-1 text-xs font-medium text-teal-200">
                    {strings.orderStatusFulfilled}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
