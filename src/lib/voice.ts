import type { SupportedLanguage } from './prompts'

const LANG_PREFIX: Record<SupportedLanguage, string> = {
  en: 'en',
  es: 'es',
  fr: 'fr',
}

// Names of voices known to sound natural/pleasant across common platforms
// (Chrome's network "Google" voices, macOS's higher-quality voices, and
// Microsoft's "Online (Natural)" voices). Novelty/robotic system voices
// (e.g. "Zarvox", "Whisper", "Bad News", generic "eSpeak" voices) are
// deliberately not preferred here.
const PREFERRED_VOICE_NAME_HINTS = [
  'google',
  'natural',
  'samantha',
  'aria',
  'jenny',
  'neural',
]

let cachedVoices: SpeechSynthesisVoice[] = []

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) return []
  const voices = window.speechSynthesis.getVoices()
  if (voices.length > 0) cachedVoices = voices
  return cachedVoices
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  // Voice lists load asynchronously in some browsers (notably Chrome) —
  // this keeps the cache warm so the first TTS click doesn't get an
  // empty list and silently fall back to the worst available voice.
  window.speechSynthesis.onvoiceschanged = () => loadVoices()
  loadVoices()
}

/**
 * Picks the best available voice for a given language, preferring known
 * natural-sounding voices over the browser's arbitrary default.
 */
export function pickVoice(language: SupportedLanguage): SpeechSynthesisVoice | null {
  const voices = loadVoices()
  if (voices.length === 0) return null

  const prefix = LANG_PREFIX[language]
  const matchingLanguage = voices.filter((v) => v.lang.toLowerCase().startsWith(prefix))
  const pool = matchingLanguage.length > 0 ? matchingLanguage : voices

  const preferred = pool.find((v) =>
    PREFERRED_VOICE_NAME_HINTS.some((hint) => v.name.toLowerCase().includes(hint)),
  )
  if (preferred) return preferred

  // Fall back to the platform's default voice for that language, if any,
  // rather than the very first entry (which is sometimes a novelty voice).
  const defaultForLang = pool.find((v) => v.default)
  return defaultForLang ?? pool[0] ?? null
}