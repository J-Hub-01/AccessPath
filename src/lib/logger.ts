/**
 * Thin logging wrapper. Build spec flaw #27: no `console.log` in production
 * code. This is the only place console.* may be called from app code.
 */

const isProd = import.meta.env.PROD

export const logger = {
  warn(message: string, context?: Record<string, unknown>): void {
    if (isProd) return
    console.warn(`[AccessPath] ${message}`, context ?? '')
  },
  error(message: string, context?: Record<string, unknown>): void {
    // Errors are always surfaced, even in production, since they're
    // essential for diagnosing live issues — but never via console.log.
    console.error(`[AccessPath] ${message}`, context ?? '')
  },
}
