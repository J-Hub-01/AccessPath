import { useEffect, useRef, useState } from 'react'
import type { UiStrings } from '../lib/i18n'
import type { SupportedLanguage } from '../lib/prompts'

// Minimal ambient typing for the Web Speech API, which is not part of
// standard TS DOM lib types across all environments.
interface SpeechRecognitionResultLike {
  isFinal: boolean
  0: { transcript: string }
}
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number
  results: ArrayLike<SpeechRecognitionResultLike>
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
}

const SPEECH_LANG_MAP: Record<SupportedLanguage, string> = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
}

const SILENCE_TIMEOUT_MS = 20_000

interface VoiceInputProps {
  language: SupportedLanguage
  onTranscript: (text: string) => void
  strings: UiStrings
}

export function VoiceInput({ language, onTranscript, strings }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [liveTranscript, setLiveTranscript] = useState('')
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    }
  }, [])

  function resetSilenceTimer() {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    silenceTimerRef.current = setTimeout(() => {
      recognitionRef.current?.stop()
    }, SILENCE_TIMEOUT_MS)
  }

  function handleToggle() {
    if (isListening) {
      recognitionRef.current?.stop()
      return
    }

    if (!isSupported) return

    const windowWithSpeech = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike
      webkitSpeechRecognition?: new () => SpeechRecognitionLike
    }
    const SpeechRecognitionCtor =
      windowWithSpeech.SpeechRecognition ?? windowWithSpeech.webkitSpeechRecognition
    if (!SpeechRecognitionCtor) return

    const recognition = new SpeechRecognitionCtor()
    recognition.lang = SPEECH_LANG_MAP[language]
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let transcript = ''
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        if (result) transcript += result[0].transcript
      }
      setLiveTranscript(transcript)
      resetSilenceTimer()
    }

    recognition.onend = () => {
      setIsListening(false)
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      setLiveTranscript((current) => {
        if (current) onTranscript(current)
        return ''
      })
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
    resetSilenceTimer()
  }

  if (!isSupported) return null

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleToggle}
        aria-label={isListening ? strings.micButtonLabelStop : strings.micButtonLabel}
        aria-pressed={isListening}
        className={`flex min-h-11 min-w-11 items-center justify-center rounded-full border-2 p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
          isListening
            ? 'animate-pulse border-rose-400 bg-rose-500/20 text-rose-200'
            : 'border-slate-500 bg-slate-800 text-slate-200'
        }`}
      >
        <MicIcon />
      </button>
      {isListening && (
        <p aria-live="polite" className="min-h-6 text-sm text-slate-300">
          {liveTranscript || '\u2026'}
        </p>
      )}
    </div>
  )
}

function MicIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
      className="h-5 w-5"
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
    </svg>
  )
}
