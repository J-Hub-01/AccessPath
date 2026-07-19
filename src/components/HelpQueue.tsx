import { useEffect, useMemo, useState } from 'react'
import { getStore, type HelpRequestRecord, type Urgency } from '../lib/store'
import type { UiStrings } from '../lib/i18n'

interface HelpQueueProps {
  strings: UiStrings
}

const URGENCY_RANK: Record<Urgency, number> = { high: 0, medium: 1, low: 2 }

const URGENCY_LABEL_KEY: Record<Urgency, keyof UiStrings> = {
  low: 'urgencyLow',
  medium: 'urgencyMedium',
  high: 'urgencyHigh',
}

const URGENCY_BADGE_CLASS: Record<Urgency, string> = {
  low: 'bg-slate-700 text-slate-200',
  medium: 'bg-amber-500/20 text-amber-200',
  high: 'bg-rose-500/20 text-rose-200',
}

const STATUS_LABEL_KEY: Record<HelpRequestRecord['status'], keyof UiStrings> = {
  open: 'helpStatusOpen',
  acknowledged: 'helpStatusAcknowledged',
  resolved: 'helpStatusResolved',
}

/**
 * v2 — "staff (specifically security-tagged staff) see help requests in
 * real time, with seat/section location, and can acknowledge + resolve
 * them" (accesspath_v2_vision.md, Role 2). Sorted by Gemini-assigned
 * urgency (see lib/prompts.ts buildTriagePrompt) so the most pressing
 * requests surface first regardless of arrival order.
 */
export function HelpQueue({ strings }: HelpQueueProps) {
  const [requests, setRequests] = useState<HelpRequestRecord[]>([])
  const store = useMemo(() => getStore(), [])

  useEffect(() => {
    return store.subscribeHelpRequests(setRequests)
  }, [store])

  const visibleRequests = useMemo(() => {
    const open = requests.filter((r) => r.status !== 'resolved')
    return [...open].sort((a, b) => {
      const urgencyDelta = URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency]
      if (urgencyDelta !== 0) return urgencyDelta
      return b.createdAt - a.createdAt
    })
  }, [requests])

  async function handleAcknowledge(id: string) {
    await store.updateHelpRequestStatus(id, 'acknowledged')
  }

  async function handleResolve(id: string) {
    await store.updateHelpRequestStatus(id, 'resolved')
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-100">
          {strings.securityHelpQueueHeading}
        </h2>
        {store.backendName === 'local-demo' && (
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
            {strings.demoModeBadge}
          </span>
        )}
      </div>

      {visibleRequests.length === 0 ? (
        <p className="rounded-md border border-slate-700 bg-slate-800/40 p-4 text-sm text-slate-400">
          {strings.securityNoRequests}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visibleRequests.map((request) => (
            <li
              key={request.id}
              className={`rounded-md border p-4 ${
                request.urgency === 'high'
                  ? 'border-rose-500/60 bg-rose-500/5'
                  : 'border-slate-600 bg-slate-800/60'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${URGENCY_BADGE_CLASS[request.urgency]}`}
                    >
                      {strings[URGENCY_LABEL_KEY[request.urgency]]}
                    </span>
                    <span className="text-sm font-semibold text-slate-100">
                      {strings.orderSectionPrefix} {request.section || strings.orderNoSectionFallback}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-200">{request.staffSummary}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {strings[STATUS_LABEL_KEY[request.status]]}
                  </p>
                </div>
                <div className="flex gap-2">
                  {request.status === 'open' && (
                    <button
                      type="button"
                      onClick={() => handleAcknowledge(request.id)}
                      className="min-h-11 rounded-md border border-slate-500 px-3 py-2 text-sm text-slate-100 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                    >
                      {strings.securityAcknowledge}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleResolve(request.id)}
                    className="min-h-11 rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                  >
                    {strings.securityResolve}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
