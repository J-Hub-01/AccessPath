import { useId, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { VoiceInput } from './VoiceInput'
import { ImageUpload } from './ImageUpload'
import { SAMPLE_QUESTIONS, type SamplePersona, type SupportedLanguage } from '../lib/prompts'
import type { UiStrings } from '../lib/i18n'

const MAX_CHARS = 2000
const WARNING_THRESHOLD = 1800

export interface PendingImage {
  base64: string
  mimeType: string
  previewUrl: string
}

interface InputPanelProps {
  language: SupportedLanguage
  strings: UiStrings
  isSubmitting: boolean
  onSubmit: (text: string, image: PendingImage | null) => void
  /** v2: lets the Lost & Found tab reuse this component with its own sample set instead of the accessibility Q&A personas. Pass [] to hide the fieldset entirely. */
  samples?: SamplePersona[]
}

export function InputPanel({
  language,
  strings,
  isSubmitting,
  onSubmit,
  samples = SAMPLE_QUESTIONS,
}: InputPanelProps) {
  const [text, setText] = useState('')
  const [image, setImage] = useState<PendingImage | null>(null)
  const [lengthError, setLengthError] = useState<string | null>(null)
  const textareaId = useId()
  const submitButtonRef = useRef<HTMLButtonElement>(null)

  function handleTextChange(value: string) {
    if (value.length > MAX_CHARS) {
      setLengthError(`Your question must be ${MAX_CHARS} characters or fewer.`)
      return
    }
    setLengthError(null)
    setText(value)
  }

  function handleSampleClick(sampleQuestion: string) {
    flushSync(() => {
      setText(sampleQuestion)
      setLengthError(null)
    })
    submitButtonRef.current?.focus()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || text.length > MAX_CHARS) return
    onSubmit(text, image)
  }

  const isOverWarningThreshold = text.length >= WARNING_THRESHOLD

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor={textareaId} className="mb-1 block text-sm font-medium text-slate-200">
          {strings.textInputLabel}
        </label>
        <textarea
          id={textareaId}
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={strings.textInputPlaceholder}
          rows={4}
          className="w-full rounded-md border border-slate-500 bg-slate-800 px-3 py-2 text-slate-50 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        />
        <p
          className={`mt-1 text-right text-xs ${
            isOverWarningThreshold ? 'text-rose-300' : 'text-slate-400'
          }`}
        >
          {text.length}/{MAX_CHARS} {strings.charCounterSuffix}
        </p>
        {lengthError && (
          <p role="alert" className="text-sm text-rose-300">
            {lengthError}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-start gap-4">
        <VoiceInput
          language={language}
          onTranscript={(transcript) => handleTextChange(`${text}${transcript}`.slice(0, MAX_CHARS))}
          strings={strings}
        />
        <ImageUpload
          onImageSelected={(base64, mimeType, previewUrl) =>
            setImage({ base64, mimeType, previewUrl })
          }
          onImageRemoved={() => setImage(null)}
          previewUrl={image?.previewUrl ?? null}
          strings={strings}
        />
      </div>

      {samples.length > 0 && (
        <fieldset className="flex flex-col gap-2 border-t border-slate-700 pt-3">
          <legend className="mb-1 text-sm font-medium text-slate-200">
            {strings.sampleQuestionsHeading}
          </legend>
          <div className="flex flex-wrap gap-2">
            {samples.map((persona) => (
              <button
                key={persona.id}
                type="button"
                onClick={() => handleSampleClick(persona.sampleQuestion)}
                className="min-h-11 rounded-md border border-slate-600 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                {persona.name}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <button
        ref={submitButtonRef}
        type="submit"
        aria-label={strings.submitButtonLabel}
        disabled={isSubmitting || !text.trim()}
        className="min-h-11 rounded-md bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {strings.submitButtonLabel}
      </button>
    </form>
  )
}
