import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { AccessPathResponse } from '../lib/schema'
import type { SupportedLanguage } from '../lib/prompts'
import type { UiStrings } from '../lib/i18n'
import { FallbackCard } from './FallbackCard'
import { translateSummary } from '../lib/gemini'
import { parseTranslateResponse } from '../lib/schema'
import { logger } from '../lib/logger'

export type ResponseStatus = 'idle' | 'streaming' | 'structured' | 'unstructured' | 'fallback'

interface ResponsePanelProps {
  status: ResponseStatus
  streamingText: string
  structuredResponse: AccessPathResponse | null
  unstructuredText: string | null
  language: SupportedLanguage
  strings: UiStrings
  onRetry: () => void
}

export function ResponsePanel({
  status,
  streamingText,
  structuredResponse,
  unstructuredText,
  language,
  strings,
  onRetry,
}: ResponsePanelProps) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [showTranslated, setShowTranslated] = useState(false)
  const [translatedText, setTranslatedText] = useState<string | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)

  // Note: this component is remounted with a fresh `key` by App.tsx on every
  // new question, so TTS/translate/copy state naturally resets per response
  // without needing to synchronize state inside an effect (which the React
  // team recommends against — see https://react.dev/learn/you-might-not-need-an-effect).
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel()
    }
  }, [])

  if (status === 'idle') return null

  if (status === 'fallback') {
    return <FallbackCard strings={strings} onRetry={onRetry} />
  }

  const summaryToShow = showTranslated && translatedText ? translatedText : structuredResponse?.answer_summary

  function handleTtsToggle() {
    const synth = window.speechSynthesis
    if (!synth) return

    if (isSpeaking) {
      synth.cancel()
      setIsSpeaking(false)
      return
    }

    const textToSpeak = summaryToShow ?? unstructuredText ?? ''
    if (!textToSpeak) return

    const utterance = new SpeechSynthesisUtterance(textToSpeak)
    utterance.lang = { en: 'en-US', es: 'es-ES', fr: 'fr-FR' }[language]
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    synth.speak(utterance)
    setIsSpeaking(true)
  }

  async function handleTranslateToggle() {
    if (showTranslated) {
      setShowTranslated(false)
      return
    }
    if (translatedText) {
      setShowTranslated(true)
      return
    }
    if (!structuredResponse) return

    setIsTranslating(true)
    const result = await translateSummary(structuredResponse.answer_summary, language)
    setIsTranslating(false)

    if (!result.success) {
      logger.warn('Translate call failed', { error: result.error })
      return
    }
    const parsed = parseTranslateResponse(result.rawText)
    if (parsed.success) {
      setTranslatedText(parsed.data.translated_summary)
      setShowTranslated(true)
    }
  }

  async function handleCopy() {
    const textToCopy = summaryToShow ?? unstructuredText ?? ''
    try {
      await navigator.clipboard.writeText(textToCopy)
    } catch (err) {
      logger.warn('Clipboard copy failed', { error: String(err) })
    }
  }

  return (
    <section aria-label={strings.responseHeading} className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-slate-100">{strings.responseHeading}</h2>

      {status === 'streaming' && (
        <div aria-live="polite" className="rounded-lg border border-slate-600 bg-slate-800/60 p-4">
          {streamingText ? (
            <p className="whitespace-pre-wrap text-slate-100">{streamingText}</p>
          ) : (
            <p className="animate-pulse text-slate-400">{strings.thinking}</p>
          )}
        </div>
      )}

      {status === 'structured' && structuredResponse && (
        <div className="flex flex-col gap-3 rounded-lg border border-slate-600 bg-slate-800/60 p-4">
          <p className="text-slate-100">{summaryToShow}</p>

          <div>
            <h3 className="text-sm font-semibold text-slate-300">Route</h3>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-200">
              {structuredResponse.route_steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-300">Accessibility notes</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-200">
              {structuredResponse.accessibility_notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-slate-300">
            Estimated walk: {structuredResponse.estimated_walking_minutes} min &middot; Nearest
            accessible restroom: {structuredResponse.nearest_accessible_restroom}
          </p>

          {showTranslated && (
            <button
              type="button"
              onClick={() => setShowTranslated(false)}
              className="min-h-11 self-start text-sm text-teal-300 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
            >
              {strings.showOriginal}
            </button>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={handleTtsToggle}
              aria-pressed={isSpeaking}
              className="min-h-11 rounded-md border border-slate-500 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              {isSpeaking ? strings.stopPlaying : strings.playAloud}
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="min-h-11 rounded-md border border-slate-500 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              {strings.copyButton}
            </button>
            <button
              type="button"
              onClick={handleTranslateToggle}
              disabled={isTranslating}
              className="min-h-11 rounded-md border border-slate-500 px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:opacity-50"
            >
              {strings.translateToggle}
            </button>
          </div>

          {isSpeaking && (
            <p aria-live="polite" className="text-sm text-teal-300">
              {strings.speakingIndicator}
            </p>
          )}
        </div>
      )}

      {status === 'unstructured' && unstructuredText && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-300">
            AI response (unstructured)
          </p>
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown disallowedElements={['script', 'iframe']} skipHtml>
              {unstructuredText}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </section>
  )
}
