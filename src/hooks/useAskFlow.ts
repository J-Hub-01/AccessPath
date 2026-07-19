import { useState } from 'react'
import type { PendingImage } from '../components/InputPanel'
import type { ResponseStatus } from '../components/ResponsePanel'
import { askAccessPath } from '../lib/gemini'
import { parseAccessPathResponse, type AccessPathResponse } from '../lib/schema'
import type { SupportedLanguage } from '../lib/prompts'

interface LastRequest {
  text: string
  image: PendingImage | null
}

/**
 * v2 — extracted from App.tsx's original handleAsk so the identical
 * ask/stream/parse/retry logic can power both the "AccessPath Concierge"
 * tab (intent: 'ask') and the "Lost & Found" tab (intent: 'lost') without
 * duplicating it, per the vision doc's "reuse, don't rebuild" instruction.
 */
export function useAskFlow(intent: 'ask' | 'lost', language: SupportedLanguage) {
  const [status, setStatus] = useState<ResponseStatus>('idle')
  const [streamingText, setStreamingText] = useState('')
  const [structuredResponse, setStructuredResponse] = useState<AccessPathResponse | null>(null)
  const [unstructuredText, setUnstructuredText] = useState<string | null>(null)
  const [lastRequest, setLastRequest] = useState<LastRequest | null>(null)
  const [requestKey, setRequestKey] = useState(0)

  async function ask(text: string, image: PendingImage | null): Promise<void> {
    setLastRequest({ text, image })
    setRequestKey((current) => current + 1)
    setStatus('streaming')
    setStreamingText('')
    setStructuredResponse(null)
    setUnstructuredText(null)

    const result = await askAccessPath(
      {
        text,
        language,
        imageBase64: image?.base64,
        imageMimeType: image?.mimeType,
        intent,
      },
      (chunkText) => setStreamingText((current) => current + chunkText),
    )

    if (!result.success) {
      setStatus('fallback')
      return
    }

    const parsed = parseAccessPathResponse(result.rawText)
    if (parsed.success) {
      setStructuredResponse(parsed.data)
      setStatus('structured')
    } else {
      setUnstructuredText(result.rawText)
      setStatus('unstructured')
    }
  }

  function retry(): void {
    if (lastRequest) {
      void ask(lastRequest.text, lastRequest.image)
    }
  }

  return { status, streamingText, structuredResponse, unstructuredText, requestKey, ask, retry }
}
