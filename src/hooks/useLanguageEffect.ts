import { useEffect } from 'react'
import type { SupportedLanguage } from '../lib/prompts'

/**
 * Build spec flaw #17: the language selector must update <html lang>
 * immediately so screen readers pronounce content correctly.
 */
export function useLanguageEffect(language: SupportedLanguage): void {
  useEffect(() => {
    document.documentElement.lang = language
  }, [language])
}
