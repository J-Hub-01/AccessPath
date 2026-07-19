import type { SupportedLanguage } from '../lib/prompts'
import { LANGUAGE_NAMES } from '../lib/prompts'
import type { UiStrings } from '../lib/i18n'

interface LanguageSelectorProps {
  value: SupportedLanguage
  onChange: (language: SupportedLanguage) => void
  strings: UiStrings
}

const LANGUAGES: SupportedLanguage[] = ['en', 'es', 'fr']

export function LanguageSelector({ value, onChange, strings }: LanguageSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="language-select" className="text-sm font-medium text-slate-200">
        {strings.languageLabel}
      </label>
      <select
        id="language-select"
        value={value}
        onChange={(e) => onChange(e.target.value as SupportedLanguage)}
        className="min-h-11 rounded-md border border-slate-500 bg-slate-800 px-3 py-2 text-sm text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang} value={lang}>
            {LANGUAGE_NAMES[lang]}
          </option>
        ))}
      </select>
    </div>
  )
}
