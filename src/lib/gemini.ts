import { logger } from './logger'
import type { HelpRequestKind, SupportedLanguage } from './prompts'

const REQUEST_TIMEOUT_MS = 15_000
const RETRY_DELAYS_MS = [500, 1500]

export interface AskAccessPathParams {
  text: string
  language: SupportedLanguage
  imageBase64?: string
  imageMimeType?: string
  /**
   * v2: 'lost' routes to the lost-person wayfinding system prompt instead
   * of the general accessibility concierge one. Same schema, same UI.
   */
  intent?: 'ask' | 'lost'
}

export interface AskAccessPathResult {
  success: boolean
  rawText: string
  error?: string
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Calls this app's own /api/gemini serverless proxy (never
 * generativelanguage.googleapis.com directly from the browser — see
 * SECURITY.md and flaw #2). Streams tokens via onChunk as they arrive
 * (flaw #7), enforces a 15s timeout (flaw #4), and retries transient
 * failures with exponential backoff (flaw #5).
 */
export async function askAccessPath(
  params: AskAccessPathParams,
  onChunk: (chunkText: string) => void,
): Promise<AskAccessPathResult> {
  let lastError = ''

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: params.intent === 'lost' ? 'lost' : 'ask',
          text: params.text,
          language: params.language,
          imageBase64: params.imageBase64,
          imageMimeType: params.imageMimeType,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        // Do not retry on 4xx (flaw #5) — those are our own bugs, not
        // transient failures.
        if (response.status >= 400 && response.status < 500) {
          const body = await response.text()
          return { success: false, rawText: '', error: `Client error: ${body}` }
        }
        throw new Error(`Server responded with ${response.status}`)
      }

      if (!response.body) {
        throw new Error('Response had no body to stream')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let full = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        const chunkText = decoder.decode(value, { stream: true })
        full += chunkText
        onChunk(chunkText)
      }
      return { success: true, rawText: full }
    } catch (err) {
      clearTimeout(timeoutId)
      lastError = err instanceof Error ? err.message : 'Unknown error'
      logger.warn('Gemini call failed, will retry if attempts remain', {
        attempt,
        error: lastError,
      })

      const delay = RETRY_DELAYS_MS[attempt]
      if (delay !== undefined) {
        await sleep(delay)
        continue
      }
    }
  }

  logger.error('Gemini call exhausted all retries', { error: lastError })
  return { success: false, rawText: '', error: lastError }
}

/**
 * Calls the translate_only path (AC-OUT-04) via the same proxy.
 */
export async function translateSummary(
  summary: string,
  targetLanguage: SupportedLanguage,
): Promise<AskAccessPathResult> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'translate', summary, targetLanguage }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      const body = await response.text()
      return { success: false, rawText: '', error: body }
    }

    const rawText = await response.text()
    return { success: true, rawText }
  } catch (err) {
    clearTimeout(timeoutId)
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error('Translate call failed', { error: message })
    return { success: false, rawText: '', error: message }
  }
}

export interface TriageParams {
  kind: HelpRequestKind
  description: string
  section: string
}

/**
 * v2 - calls the triage path (mode: 'triage') via the same proxy. Used by
 * the Fan "Request help / report a disturbance" flow before the request
 * is written to the shared store, so the Security queue receives urgency
 * plus a staff-facing summary already attached.
 */
export async function triageHelpRequest(params: TriageParams): Promise<AskAccessPathResult> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'triage',
        kind: params.kind,
        description: params.description,
        section: params.section,
      }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorBody = await response.text()
      return { success: false, rawText: '', error: errorBody }
    }

    const rawText = await response.text()
    return { success: true, rawText }
  } catch (err) {
    clearTimeout(timeoutId)
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error('Triage call failed', { error: message })
    return { success: false, rawText: '', error: message }
  }
}

export interface UpsellParams {
  items: string[]
  section: string
}

/**
 * v2 - calls the upsell path (mode: 'upsell') via the same proxy. Used by
 * the Fan "Order from your seat" flow. Best-effort: if this fails, the
 * order still submits without a suggestion (see OrderForm.tsx) - an
 * upsell suggestion is a nice-to-have, never a blocker on ordering food.
 */
export async function suggestUpsell(params: UpsellParams): Promise<AskAccessPathResult> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'upsell', items: params.items, section: params.section }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorBody = await response.text()
      return { success: false, rawText: '', error: errorBody }
    }

    const rawText = await response.text()
    return { success: true, rawText }
  } catch (err) {
    clearTimeout(timeoutId)
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.warn('Upsell call failed (non-fatal)', { error: message })
    return { success: false, rawText: '', error: message }
  }
}
