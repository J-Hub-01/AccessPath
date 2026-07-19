import { afterEach, describe, expect, it, vi } from 'vitest'
import { askAccessPath, suggestUpsell, triageHelpRequest } from '../gemini'

function makeStreamResponse(chunks: string[], ok = true, status = 200): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      controller.close()
    },
  })
  return new Response(stream, { status, statusText: ok ? 'OK' : 'Error' })
}

describe('askAccessPath', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('calls its own /api/gemini proxy, never generativelanguage.googleapis.com directly (flaw #2)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeStreamResponse(['{"answer_summary":"ok"}']))
    vi.stubGlobal('fetch', fetchMock)

    await askAccessPath({ text: 'Where is Gate 5?', language: 'en' }, () => {})

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/gemini')
    expect(url).not.toContain('googleapis.com')
  })

  it('streams tokens to onChunk as they arrive rather than buffering (flaw #7)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeStreamResponse(['{"a', 'nswer_summary":"hi"}']))
    vi.stubGlobal('fetch', fetchMock)

    const received: string[] = []
    const result = await askAccessPath({ text: 'test', language: 'en' }, (chunk) => {
      received.push(chunk)
    })

    expect(received.length).toBeGreaterThanOrEqual(1)
    expect(received.join('')).toBe('{"answer_summary":"hi"}')
    expect(result.success).toBe(true)
  })

  it('retries on a 5xx server error with backoff, then succeeds (flaw #5)', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(makeStreamResponse([], false, 500))
      .mockResolvedValueOnce(makeStreamResponse(['{"answer_summary":"recovered"}']))
    vi.stubGlobal('fetch', fetchMock)
    vi.useFakeTimers()

    const promise = askAccessPath({ text: 'test', language: 'en' }, () => {})
    await vi.advanceTimersByTimeAsync(600)
    const result = await promise

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(result.success).toBe(true)

    vi.useRealTimers()
  })

  it('does not retry on a 4xx client error (flaw #5)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeStreamResponse([], false, 400))
    vi.stubGlobal('fetch', fetchMock)

    const result = await askAccessPath({ text: 'test', language: 'en' }, () => {})

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(result.success).toBe(false)
  })

  it('returns a failure result (not a thrown error) after exhausting retries, so the UI can show the fallback card (flaw #6)', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'))
    vi.stubGlobal('fetch', fetchMock)
    vi.useFakeTimers()

    const promise = askAccessPath({ text: 'test', language: 'en' }, () => {})
    await vi.advanceTimersByTimeAsync(3000)
    const result = await promise

    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledTimes(3) // initial + 2 retries

    vi.useRealTimers()
  })

  it('sends mode "lost" instead of "ask" when intent is "lost" (v2 Lost & Found)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeStreamResponse(['{"answer_summary":"ok"}']))
    vi.stubGlobal('fetch', fetchMock)

    await askAccessPath({ text: 'Where do I find Gate 5?', language: 'en', intent: 'lost' }, () => {})

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    const sentBody = JSON.parse(options.body as string) as { mode: string }
    expect(sentBody.mode).toBe('lost')
  })

  it('defaults to mode "ask" when no intent is passed', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeStreamResponse(['{"answer_summary":"ok"}']))
    vi.stubGlobal('fetch', fetchMock)

    await askAccessPath({ text: 'Where is Gate 5?', language: 'en' }, () => {})

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    const sentBody = JSON.parse(options.body as string) as { mode: string }
    expect(sentBody.mode).toBe('ask')
  })
})

describe('triageHelpRequest (v2)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('calls its own /api/gemini proxy with mode "triage" and the request details', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ urgency: 'high', staffSummary: 'x' })))
    vi.stubGlobal('fetch', fetchMock)

    await triageHelpRequest({
      kind: 'disturbance',
      description: 'Loud argument nearby',
      section: 'Section 114',
    })

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/gemini')
    const sentBody = JSON.parse(options.body as string) as { mode: string; kind: string }
    expect(sentBody.mode).toBe('triage')
    expect(sentBody.kind).toBe('disturbance')
  })

  it('returns a failure result rather than throwing when the call fails', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'))
    vi.stubGlobal('fetch', fetchMock)

    const result = await triageHelpRequest({ kind: 'general', description: 'x', section: '' })
    expect(result.success).toBe(false)
  })
})

describe('suggestUpsell (v2)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('calls its own /api/gemini proxy with mode "upsell" and the order items', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ suggestion: 'Soft drink', reason: 'x' })))
    vi.stubGlobal('fetch', fetchMock)

    await suggestUpsell({ items: ['1x Hot dog'], section: 'Section 114' })

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/gemini')
    const sentBody = JSON.parse(options.body as string) as { mode: string; items: string[] }
    expect(sentBody.mode).toBe('upsell')
    expect(sentBody.items).toEqual(['1x Hot dog'])
  })

  it('returns a failure result (non-fatal) rather than throwing when the call fails, so ordering is never blocked', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network down'))
    vi.stubGlobal('fetch', fetchMock)

    const result = await suggestUpsell({ items: ['1x Hot dog'], section: '' })
    expect(result.success).toBe(false)
  })
})
