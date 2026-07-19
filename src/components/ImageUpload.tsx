import { useId, useState } from 'react'
import type { UiStrings } from '../lib/i18n'

const MAX_IMAGE_BYTES = 4 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png']

interface ImageUploadProps {
  onImageSelected: (base64: string, mimeType: string, previewUrl: string) => void
  onImageRemoved: () => void
  previewUrl: string | null
  strings: UiStrings
}

export function ImageUpload({
  onImageSelected,
  onImageRemoved,
  previewUrl,
  strings,
}: ImageUploadProps) {
  const [error, setError] = useState<string | null>(null)
  const inputId = useId()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please upload a JPEG or PNG image.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image must be under 4 MB.')
      return
    }

    setError(null)
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') {
        const base64 = result.split(',')[1] ?? ''
        onImageSelected(base64, file.type, result)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="sr-only">
        {strings.imageUploadLabel}
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileChange}
        className="min-h-11 text-sm text-slate-300 file:mr-3 file:min-h-11 file:rounded-md file:border-0 file:bg-teal-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-teal-500"
      />
      {error && (
        <p role="alert" className="text-sm text-rose-300">
          {error}
        </p>
      )}
      {previewUrl && (
        <div className="flex items-center gap-3">
          <img
            src={previewUrl}
            alt="Preview of the uploaded ticket or seating map you attached to your question"
            className="h-16 w-16 rounded-md border border-slate-600 object-cover"
          />
          <button
            type="button"
            onClick={onImageRemoved}
            className="min-h-11 rounded-md border border-slate-500 px-3 py-2 text-sm text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            Remove image
          </button>
        </div>
      )}
    </div>
  )
}
