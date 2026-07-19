import { GoogleGenAI } from '@google/genai'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  buildLostPersonSystemPrompt,
  buildSystemPrompt,
  buildTranslatePrompt,
  buildTriagePrompt,
  buildUpsellPrompt,
  type HelpRequestKind,
  type SupportedLanguage,
} from '../src/lib/prompts.js'

/**
 * Serverless proxy for Gemini calls.
 *
 * SECURITY (build spec flaw #2): the browser calls this endpoint, never
 * generativelanguage.googleapis.com directly. GEMINI_API_KEY is read from
 * process.env here, server-side only, and is never sent to the client.
 *
 * v2 fix: v1's handler sent a generic inline hint instead of the actual
 * buildSystemPrompt() from lib/prompts.ts, so the fully-specified, tested
 * system prompt (host cities, JSON schema, anti-jailbreak instructions)
 * was defined but never actually reached Gemini — and a second,
 * undocumented prompt string lived here, violating "every prompt lives in
 * exactly one place" (build spec flaw #25). This version imports the real
 * builders directly so there is exactly one copy of each prompt, and what
 * is tested is what is actually sent.
 *
 * Deploy note: this file targets Vercel's serverless function convention.
 * If deploying via Google AI Studio's built-in "Build & Deploy" instead,
 * port this handler to whatever server entrypoint AI Studio expects — the
 * logic (key handling, CORS, validation, streaming) stays the same.
 */

const MAX_TEXT_LENGTH = 2000
const MAX_IMAGE_BYTES = 4 * 1024 * 1024 // 4 MB, matches AC-IN-03
const MAX_ITEMS = 20
const VALID_LANGUAGES: SupportedLanguage[] = ['en', 'es', 'fr']
const VALID_HELP_KINDS: HelpRequestKind[] = ['lost', 'disturbance', 'general']

// Flaw #37: CORS restricted to production origin + localhost dev only.
// Fails CLOSED: an unset/misconfigured PRODUCTION_ORIGIN blocks everyone
// instead of silently accepting requests from anywhere.
const ALLOWED_ORIGINS: readonly string[] =
  process.env.NODE_ENV === 'production'
    ? [process.env.PRODUCTION_ORIGIN].filter((o): o is string => Boolean(o))
    : ['http://localhost:5173', 'http://localhost:3000']

function setCorsHeaders(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin
  const isAllowed = typeof origin === 'string' && ALLOWED_ORIGINS.includes(origin)
  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  return isAllowed
}

// Strips control characters except \n and \t (flaw #8).
function sanitizeInput(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
}

function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return typeof value === 'string' && (VALID_LANGUAGES as string[]).includes(value)
}

function isHelpRequestKind(value: unknown): value is HelpRequestKind {
  return typeof value === 'string' && (VALID_HELP_KINDS as string[]).includes(value)
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const isAllowedOrigin = setCorsHeaders(req, res)

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (!isAllowedOrigin) {
    res.status(403).json({ error: 'Origin not allowed.' })
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    // Never leak whether/why in detail — but do log server-side for us.
    console.error('[api/gemini] GEMINI_API_KEY is not configured')
    res.status(500).json({ error: 'Server is not configured correctly.' })
    return
  }

  const body = req.body as Record<string, unknown>
  const mode = body.mode

  const ai = new GoogleGenAI({ apiKey })

  try {
    if (mode === 'translate') {
      const summary = typeof body.summary === 'string' ? body.summary : ''
      const targetLanguage = isSupportedLanguage(body.targetLanguage) ? body.targetLanguage : 'en'
      if (!summary || summary.length > MAX_TEXT_LENGTH) {
        res.status(400).json({ error: 'Invalid summary for translation.' })
        return
      }

      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: buildTranslatePrompt(sanitizeInput(summary), targetLanguage),
      })

      res.status(200).send(result.text ?? '')
      return
    }

    if (mode === 'triage') {
      const kind = isHelpRequestKind(body.kind) ? body.kind : 'general'
      const description = typeof body.description === 'string' ? body.description : ''
      const section = typeof body.section === 'string' ? body.section : ''

      if (!description || description.length > MAX_TEXT_LENGTH) {
        res.status(400).json({ error: 'Description must be between 1 and 2000 characters.' })
        return
      }

      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: buildTriagePrompt(kind, sanitizeInput(description), sanitizeInput(section)),
      })

      res.status(200).send(result.text ?? '')
      return
    }

    if (mode === 'upsell') {
      const items = Array.isArray(body.items) ? body.items.filter((i) => typeof i === 'string') : []
      const section = typeof body.section === 'string' ? body.section : ''

      if (items.length === 0 || items.length > MAX_ITEMS) {
        res.status(400).json({ error: 'Order must contain between 1 and 20 items.' })
        return
      }

      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: buildUpsellPrompt(
          items.map((item) => sanitizeInput(item)),
          sanitizeInput(section),
        ),
      })

      res.status(200).send(result.text ?? '')
      return
    }

    // mode === 'ask' | 'lost' (default path — the accessibility/wayfinding
    // concierge engine, shared by both intents per the v2 vision doc)
    const text = typeof body.text === 'string' ? sanitizeInput(body.text) : ''
    const language = isSupportedLanguage(body.language) ? body.language : 'en'
    const imageBase64 = typeof body.imageBase64 === 'string' ? body.imageBase64 : undefined
    const imageMimeType = typeof body.imageMimeType === 'string' ? body.imageMimeType : undefined
    const isLostIntent = mode === 'lost'

    // Server-side revalidation (flaw #9) — never trust the client alone.
    if (text.length === 0 || text.length > MAX_TEXT_LENGTH) {
      res.status(400).json({ error: 'Text must be between 1 and 2000 characters.' })
      return
    }
    if (imageBase64 && imageBase64.length > MAX_IMAGE_BYTES * 1.4) {
      // base64 is ~1.37x the binary size; 1.4x gives a safe margin.
      res.status(400).json({ error: 'Image exceeds 4 MB limit.' })
      return
    }

    const systemPrompt = isLostIntent
      ? buildLostPersonSystemPrompt(language)
      : buildSystemPrompt(language)

    const contentParts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> =
      [{ text: `${systemPrompt}\n\nUser question: ${text}` }]

    if (imageBase64 && imageMimeType) {
      contentParts.push({ inlineData: { data: imageBase64, mimeType: imageMimeType } })
    }

    const streamResult = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: contentParts }],
    })

    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Transfer-Encoding', 'chunked')

    for await (const chunk of streamResult) {
      const chunkText = chunk.text
      if (chunkText) {
        res.write(chunkText)
      }
    }
    res.end()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[api/gemini] Gemini call failed:', message)
    if (!res.headersSent) {
      res.status(502).json({ error: 'AccessPath could not reach its AI service.' })
    } else {
      res.end()
    }
  }
}
