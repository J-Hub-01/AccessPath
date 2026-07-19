import { FALLBACK_TIPS } from '../lib/prompts'
import type { UiStrings } from '../lib/i18n'

interface FallbackCardProps {
  strings: UiStrings
  onRetry: () => void
}

/**
 * AC-OUT-05 / flaw #6: shown when Gemini errors, times out, or fails
 * schema validation on retry. Must be genuinely useful, not a dead-end.
 */
export function FallbackCard({ strings, onRetry }: FallbackCardProps) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4"
    >
      <h3 className="font-semibold text-amber-200">{strings.fallbackHeading}</h3>
      <ul className="list-disc space-y-1 pl-5 text-sm text-amber-100">
        {FALLBACK_TIPS.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onRetry}
        className="min-h-11 self-start rounded-md border border-amber-400 px-4 py-2 text-sm font-medium text-amber-100 hover:bg-amber-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
      >
        {strings.tryAgain}
      </button>
    </div>
  )
}
