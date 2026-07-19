import { z } from 'zod'

/**
 * AC-OUT-02: every Gemini response must validate against this exact shape.
 * On failure the caller must fall back to raw-text display, never crash.
 */
export const AccessPathResponseSchema = z.object({
  route_steps: z.array(z.string()),
  accessibility_notes: z.array(z.string()),
  estimated_walking_minutes: z.number(),
  nearest_accessible_restroom: z.string(),
  answer_summary: z.string(),
})

export type AccessPathResponse = z.infer<typeof AccessPathResponseSchema>

export const TranslateResponseSchema = z.object({
  translated_summary: z.string(),
})

export type TranslateResponse = z.infer<typeof TranslateResponseSchema>

/**
 * Attempts to parse raw Gemini text (which should be strict JSON per the
 * system prompt) into a validated AccessPathResponse. Strips markdown code
 * fences defensively in case the model wraps its JSON despite instructions.
 */
export function parseAccessPathResponse(
  raw: string,
): { success: true; data: AccessPathResponse } | { success: false; error: string } {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\n?/, '')
    .replace(/\n?```$/, '')

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(cleaned)
  } catch {
    return { success: false, error: 'Response was not valid JSON.' }
  }

  const result = AccessPathResponseSchema.safeParse(parsedJson)
  if (!result.success) {
    return { success: false, error: result.error.message }
  }
  return { success: true, data: result.data }
}

export function parseTranslateResponse(
  raw: string,
): { success: true; data: TranslateResponse } | { success: false; error: string } {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\n?/, '')
    .replace(/\n?```$/, '')

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(cleaned)
  } catch {
    return { success: false, error: 'Response was not valid JSON.' }
  }

  const result = TranslateResponseSchema.safeParse(parsedJson)
  if (!result.success) {
    return { success: false, error: result.error.message }
  }
  return { success: true, data: result.data }
}

/**
 * v2 — staff triage response (urgency classification + one-line summary
 * for the live security help queue). See prompts.ts buildTriagePrompt.
 */
export const TriageResponseSchema = z.object({
  urgency: z.enum(['low', 'medium', 'high']),
  staffSummary: z.string(),
})

export type TriageResponse = z.infer<typeof TriageResponseSchema>

export function parseTriageResponse(
  raw: string,
): { success: true; data: TriageResponse } | { success: false; error: string } {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\n?/, '')
    .replace(/\n?```$/, '')

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(cleaned)
  } catch {
    return { success: false, error: 'Response was not valid JSON.' }
  }

  const result = TriageResponseSchema.safeParse(parsedJson)
  if (!result.success) {
    return { success: false, error: result.error.message }
  }
  return { success: true, data: result.data }
}

/**
 * v2 — order upsell suggestion. See prompts.ts buildUpsellPrompt.
 */
export const UpsellResponseSchema = z.object({
  suggestion: z.string(),
  reason: z.string(),
})

export type UpsellResponse = z.infer<typeof UpsellResponseSchema>

export function parseUpsellResponse(
  raw: string,
): { success: true; data: UpsellResponse } | { success: false; error: string } {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\n?/, '')
    .replace(/\n?```$/, '')

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(cleaned)
  } catch {
    return { success: false, error: 'Response was not valid JSON.' }
  }

  const result = UpsellResponseSchema.safeParse(parsedJson)
  if (!result.success) {
    return { success: false, error: result.error.message }
  }
  return { success: true, data: result.data }
}
