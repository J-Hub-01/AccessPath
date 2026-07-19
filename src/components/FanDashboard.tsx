import { useRef, useState, type KeyboardEvent } from 'react'
import { InputPanel } from './InputPanel'
import { ResponsePanel } from './ResponsePanel'
import { OrderForm } from './OrderForm'
import { HelpRequestPanel } from './HelpRequestPanel'
import { useAskFlow } from '../hooks/useAskFlow'
import { LOST_SAMPLE_QUESTIONS, type SupportedLanguage } from '../lib/prompts'
import type { UiStrings } from '../lib/i18n'
import type { Session } from '../lib/session'

type FanTab = 'concierge' | 'lost' | 'order' | 'help'

interface FanDashboardProps {
  session: Session
  language: SupportedLanguage
  strings: UiStrings
}

/**
 * v2 — the Fan role's four features from accesspath_v2_vision.md, Role 1:
 * the existing AccessPath Concierge (unchanged), Lost & Found (same engine,
 * "lost" intent), Order from your seat, and Request help / report a
 * disturbance. A simple accessible tablist switches between them rather
 * than four separate routes, to keep the hackathon build small.
 */
export function FanDashboard({ session, language, strings }: FanDashboardProps) {
  const [tab, setTab] = useState<FanTab>('concierge')
  const concierge = useAskFlow('ask', language)
  const lost = useAskFlow('lost', language)

  const tabs: { id: FanTab; label: string }[] = [
    { id: 'concierge', label: strings.tabConcierge },
    { id: 'lost', label: strings.tabLost },
    { id: 'order', label: strings.tabOrder },
    { id: 'help', label: strings.tabHelp },
  ]

  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = tabs.length - 1
    if (nextIndex === null) return
    event.preventDefault()
    const nextTab = tabs[nextIndex]
    if (!nextTab) return
    setTab(nextTab.id)
    tabRefs.current[nextIndex]?.focus()
  }

  const lostStrings: UiStrings = {
    ...strings,
    textInputLabel: strings.lostInputLabel,
    textInputPlaceholder: strings.lostInputPlaceholder,
    submitButtonLabel: strings.lostSubmitLabel,
  }

  return (
    <div className="flex flex-col gap-6">
      <div
        role="tablist"
        aria-label={strings.roleFanLabel}
        className="flex flex-wrap gap-2 border-b border-slate-700 pb-2"
      >
        {tabs.map((t, index) => (
          <button
            key={t.id}
            ref={(el) => {
              tabRefs.current[index] = el
            }}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => setTab(t.id)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
            className={`min-h-11 rounded-md px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
              tab === t.id
                ? 'bg-teal-600 text-white'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'concierge' && (
        <div
          id="panel-concierge"
          role="tabpanel"
          aria-labelledby="tab-concierge"
          className="grid gap-8 lg:grid-cols-2"
        >
          <InputPanel
            language={language}
            strings={strings}
            isSubmitting={concierge.status === 'streaming'}
            onSubmit={concierge.ask}
          />
          <ResponsePanel
            key={concierge.requestKey}
            status={concierge.status}
            streamingText={concierge.streamingText}
            structuredResponse={concierge.structuredResponse}
            unstructuredText={concierge.unstructuredText}
            language={language}
            strings={strings}
            onRetry={concierge.retry}
          />
        </div>
      )}

      {tab === 'lost' && (
        <div
          id="panel-lost"
          role="tabpanel"
          aria-labelledby="tab-lost"
          className="grid gap-8 lg:grid-cols-2"
        >
          <InputPanel
            language={language}
            strings={lostStrings}
            isSubmitting={lost.status === 'streaming'}
            onSubmit={lost.ask}
            samples={LOST_SAMPLE_QUESTIONS}
          />
          <ResponsePanel
            key={lost.requestKey}
            status={lost.status}
            streamingText={lost.streamingText}
            structuredResponse={lost.structuredResponse}
            unstructuredText={lost.unstructuredText}
            language={language}
            strings={strings}
            onRetry={lost.retry}
          />
        </div>
      )}

      {tab === 'order' && (
        <div id="panel-order" role="tabpanel" aria-labelledby="tab-order">
          <OrderForm session={session} strings={strings} />
        </div>
      )}

      {tab === 'help' && (
        <div id="panel-help" role="tabpanel" aria-labelledby="tab-help">
          <HelpRequestPanel
            session={session}
            strings={strings}
            onGoToLost={() => setTab('lost')}
          />
        </div>
      )}
    </div>
  )
}
