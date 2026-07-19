import { describe, expect, it } from 'vitest'
import {
  parseAccessPathResponse,
  parseTranslateResponse,
  parseTriageResponse,
  parseUpsellResponse,
} from '../schema'

const VALID_RESPONSE = {
  route_steps: ['Exit accessible parking at Gate 5.', 'Follow ramp to Section 114.'],
  accessibility_notes: ['Elevator available at Gate 5.'],
  estimated_walking_minutes: 8,
  nearest_accessible_restroom: 'Near Section 112, ground level.',
  answer_summary: 'Take the ramp from Gate 5 to reach Section 114 in about 8 minutes.',
}

describe('parseAccessPathResponse', () => {
  it('successfully parses a well-formed Gemini JSON response', () => {
    const result = parseAccessPathResponse(JSON.stringify(VALID_RESPONSE))
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.estimated_walking_minutes).toBe(8)
      expect(result.data.route_steps).toHaveLength(2)
    }
  })

  it('strips markdown code fences before parsing, since models sometimes wrap JSON despite instructions', () => {
    const fenced = '```json\n' + JSON.stringify(VALID_RESPONSE) + '\n```'
    const result = parseAccessPathResponse(fenced)
    expect(result.success).toBe(true)
  })

  it('fails gracefully on malformed JSON rather than throwing (AC-OUT-02 fallback path)', () => {
    const result = parseAccessPathResponse('this is not JSON at all {{{')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBeTruthy()
    }
  })

  it('fails validation when a required field is missing', () => {
    const incomplete = { ...VALID_RESPONSE } as Partial<typeof VALID_RESPONSE>
    delete incomplete.estimated_walking_minutes
    const result = parseAccessPathResponse(JSON.stringify(incomplete))
    expect(result.success).toBe(false)
  })

  it('fails validation when a field has the wrong type', () => {
    const wrongType = { ...VALID_RESPONSE, estimated_walking_minutes: 'eight minutes' }
    const result = parseAccessPathResponse(JSON.stringify(wrongType))
    expect(result.success).toBe(false)
  })
})

describe('parseTranslateResponse', () => {
  it('parses a valid translate response', () => {
    const result = parseTranslateResponse(JSON.stringify({ translated_summary: 'Vaya a la Puerta 5.' }))
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.translated_summary).toBe('Vaya a la Puerta 5.')
    }
  })

  it('fails gracefully when translated_summary is missing', () => {
    const result = parseTranslateResponse(JSON.stringify({}))
    expect(result.success).toBe(false)
  })
})

describe('parseTriageResponse (v2 — staff help-request triage)', () => {
  it('successfully parses a well-formed triage response', () => {
    const result = parseTriageResponse(
      JSON.stringify({ urgency: 'high', staffSummary: 'Separated child near Gate 5.' }),
    )
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.urgency).toBe('high')
      expect(result.data.staffSummary).toContain('Gate 5')
    }
  })

  it('rejects an urgency value outside the low/medium/high enum', () => {
    const result = parseTriageResponse(JSON.stringify({ urgency: 'critical', staffSummary: 'x' }))
    expect(result.success).toBe(false)
  })

  it('fails gracefully on malformed JSON rather than throwing', () => {
    const result = parseTriageResponse('not json {{{')
    expect(result.success).toBe(false)
  })

  it('strips markdown code fences before parsing', () => {
    const fenced = '```json\n' + JSON.stringify({ urgency: 'low', staffSummary: 'ok' }) + '\n```'
    const result = parseTriageResponse(fenced)
    expect(result.success).toBe(true)
  })
})

describe('parseUpsellResponse (v2 — order upsell)', () => {
  it('successfully parses a well-formed upsell response', () => {
    const result = parseUpsellResponse(
      JSON.stringify({ suggestion: 'Soft drink', reason: 'Pairs well with the hot dog.' }),
    )
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.suggestion).toBe('Soft drink')
    }
  })

  it('fails validation when suggestion is missing', () => {
    const result = parseUpsellResponse(JSON.stringify({ reason: 'x' }))
    expect(result.success).toBe(false)
  })
})
