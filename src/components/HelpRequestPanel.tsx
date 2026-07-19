import { useEffect, useId, useState } from 'react'
import { HELP_KIND_OPTIONS, type HelpRequestKind } from '../lib/prompts'
import { triageHelpRequest } from '../lib/gemini'
import { parseTriageResponse } from '../lib/schema'
import { getStore, type HelpRequestRecord, type Urgency } from '../lib/store'
import { logger } from '../lib/logger'
import type { UiStrings } from '../lib/i18n'
import type { Session } from '../lib/session'

interface HelpRequestPanelProps {
  session: Session
  strings: UiStrings
  onGoToLost: () => void
}

const HELP_KIND_LABEL_KEY: Record<HelpRequestKind, keyof UiStrings> = {
  lost: 'helpKindLostLabel',
  disturbance: 'helpKindDisturbanceLabel',
  general: 'helpKindGeneralLabel',
}

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

const HELP_STATUS_LABEL_KEY: Record<HelpRequestRecord['status'], keyof UiStrings> = {
  open: 'helpStatusOpen',
  acknowledged: 'helpStatusAcknowledged',
  resolved: 'helpStatusResolved',
}

/**
 * v2 — "Request help / report a disturbance" (accesspath_v2_vision.md,
 * Role 1). A fan's request is triaged by Gemini for urgency + a
 * staff-facing summary before it's written to the shared store, so the
 * Security queue is scannable rather than a wall of raw text (see
 * lib/prompts.ts buildTriagePrompt).
 */
export function HelpRequestPanel({ session, strings, onGoToLost }: HelpRequestPanelProps) {
  const [kind, setKind] = useState<HelpRequestKind>('general')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const [descriptionError, setDescriptionError] = useState<string | null>(null)
  const [myRequests, setMyRequests] = useState<HelpRequestRecord[]>([])
  const descriptionId = useId()

  useEffect(() => {
    const store = getStore()
    return store.subscribeHelpRequests((requests) => {
      setMyRequests(requests.filter((request) => request.sessionId === session.sessionId))
    })
  }, [session.sessionId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) {
      setDescriptionError(strings.helpDescriptionLabel)
      return
    }

    setDescriptionError(null)
    setSubmitting(true)
    setConfirmation(null)

    let urgency: Urgency = 'medium'
    let staffSummary = description.trim()

    const triageResult = await triageHelpRequest({ kind, description, section: session.section })
    if (triageResult.success) {
      const parsed = parseTriageResponse(triageResult.rawText)
      if (parsed.success) {
        urgency = parsed.data.urgency
        staffSummary = parsed.data.staffSummary
      } else {
        logger.warn('Triage response failed schema validation, using untriaged fallback', {
          error: parsed.error,
        })
      }
    } else {
      logger.warn('Triage call failed, submitting request untriaged rather than blocking it', {
        error: triageResult.error,
      })
    }

    await getStore().submitHelpRequest({
      section: session.section,
      sessionId: session.sessionId,
      kind,
      description,
      urgency,
      staffSummary,
    })

    setSubmitting(false)
    setDescription('')
    setConfirmation(strings.helpConfirmation)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">{strings.helpHeading}</h2>
        <p className="mt-1 text-sm text-slate-400">{strings.helpIntro}</p>
      </div>

      {kind === 'lost' ? (
        <div className="rounded-md border border-teal-500/40 bg-teal-500/10 p-4">
          <p className="text-sm text-slate-100">{strings.goToLostTabPrompt}</p>
          <button
            type="button"
            onClick={onGoToLost}
            className="mt-2 min-h-11 rounded-md border border-teal-400 px-4 py-2 text-sm font-medium text-teal-100 hover:bg-teal-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            {strings.goToLostTabButton}
          </button>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-slate-200">{strings.helpHeading}</legend>
          <div className="flex flex-wrap gap-2">
            {HELP_KIND_OPTIONS.map((option) => (
              <label
                key={option.id}
                className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                  kind === option.id
                    ? 'border-teal-400 bg-teal-500/10 text-slate-50'
                    : 'border-slate-600 bg-slate-800/60 text-slate-200'
                }`}
              >
                <input
                  type="radio"
                  name="help-kind"
                  value={option.id}
                  checked={kind === option.id}
                  onChange={() => setKind(option.id)}
                  className="h-4 w-4"
                />
                {strings[HELP_KIND_LABEL_KEY[option.id]]}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor={descriptionId} className="mb-1 block text-sm font-medium text-slate-200">
            {strings.helpDescriptionLabel}
          </label>
          <textarea
            id={descriptionId}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={strings.helpDescriptionPlaceholder}
            rows={3}
            className="w-full rounded-md border border-slate-500 bg-slate-800 px-3 py-2 text-slate-50 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          />
          {descriptionError && (
            <p role="alert" className="mt-1 text-sm text-rose-300">
              {descriptionError}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="min-h-11 self-start rounded-md bg-rose-600 px-4 py-2 font-medium text-white hover:bg-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {strings.helpSubmitLabel}
        </button>

        {confirmation && (
          <p role="status" className="text-sm text-teal-300">
            {confirmation}
          </p>
        )}
      </form>

      {myRequests.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-300">
            {strings.myHelpRequestsHeading}
          </h3>
          <ul className="flex flex-col gap-2">
            {myRequests.map((request) => (
              <li
                key={request.id}
                className="rounded-md border border-slate-700 bg-slate-800/50 p-3 text-sm text-slate-200"
              >
                <div className="flex items-center justify-between gap-2">
                  <p>{strings[HELP_KIND_LABEL_KEY[request.kind]]}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${URGENCY_BADGE_CLASS[request.urgency]}`}
                  >
                    {strings[URGENCY_LABEL_KEY[request.urgency]]}
                  </span>
                </div>
                <p className="mt-1 text-xs font-medium text-amber-300">
                  {strings[HELP_STATUS_LABEL_KEY[request.status]]}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
