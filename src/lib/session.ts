/**
 * AccessPath v2 — lightweight session/role concept (v2 vision doc,
 * "Technical implications" section): no real auth for a hackathon demo,
 * just "this browser tab is Fan in Section 114" vs "this browser tab is
 * Staff". Persisted to sessionStorage so a reload doesn't lose the role,
 * but a fresh tab always starts at the role picker.
 */

export type Role = 'fan' | 'staff' | 'security'

export interface Session {
  role: Role
  /** Seat section for a Fan, or an assigned zone for Staff/Security. May be blank. */
  section: string
  sessionId: string
}

const STORAGE_KEY = 'accesspath:session'

function generateSessionId(): string {
  const random = Math.random().toString(36).slice(2, 10)
  const time = Date.now().toString(36)
  return `sess_${time}${random}`
}

export function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Session>
    if (
      (parsed.role === 'fan' || parsed.role === 'staff' || parsed.role === 'security') &&
      typeof parsed.section === 'string' &&
      typeof parsed.sessionId === 'string'
    ) {
      return { role: parsed.role, section: parsed.section, sessionId: parsed.sessionId }
    }
    return null
  } catch {
    return null
  }
}

export function createSession(role: Role, section: string): Session {
  const session: Session = { role, section: section.trim(), sessionId: generateSessionId() }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
    // sessionStorage may be unavailable (e.g. private browsing edge cases) —
    // the app still works for the current render, it just won't survive a reload.
  }
  return session
}

export function clearSession(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // no-op — see createSession
  }
}
