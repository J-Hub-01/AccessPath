import { useId, useState } from 'react'
import type { UiStrings } from '../lib/i18n'
import type { Role } from '../lib/session'

interface RoleSelectorProps {
  strings: UiStrings
  onChoose: (role: Role, section: string) => void
}

const ROLES: { id: Role; labelKey: keyof UiStrings }[] = [
  { id: 'fan', labelKey: 'roleFanLabel' },
  { id: 'staff', labelKey: 'roleStaffLabel' },
  { id: 'security', labelKey: 'roleSecurityLabel' },
]

/**
 * v2 — "a lightweight role picker (Fan / Staff / Security) is enough to
 * demonstrate the concept convincingly" (accesspath_v2_vision.md). No
 * auth: the choice + section/zone are simply carried forward as a
 * Session (see lib/session.ts).
 */
export function RoleSelector({ strings, onChoose }: RoleSelectorProps) {
  const [role, setRole] = useState<Role>('fan')
  const [section, setSection] = useState('')
  const [error, setError] = useState<string | null>(null)
  const sectionInputId = useId()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (role === 'fan' && !section.trim()) {
      setError(strings.sectionRequiredError)
      return
    }
    setError(null)
    onChoose(role, section)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex max-w-md flex-col gap-6 rounded-lg border border-slate-700 bg-slate-800/40 p-6"
    >
      <div>
        <h2 className="text-lg font-semibold text-slate-100">{strings.roleSelectorHeading}</h2>
        <p className="mt-1 text-sm text-slate-400">{strings.roleSelectorIntro}</p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">{strings.roleSelectorHeading}</legend>
        {ROLES.map((r) => (
          <label
            key={r.id}
            className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm ${
              role === r.id
                ? 'border-teal-400 bg-teal-500/10 text-slate-50'
                : 'border-slate-600 bg-slate-800/60 text-slate-200'
            }`}
          >
            <input
              type="radio"
              name="role"
              value={r.id}
              checked={role === r.id}
              onChange={() => setRole(r.id)}
              className="h-4 w-4"
            />
            {strings[r.labelKey]}
          </label>
        ))}
      </fieldset>

      <div>
        <label htmlFor={sectionInputId} className="mb-1 block text-sm font-medium text-slate-200">
          {role === 'fan' ? strings.sectionInputLabel : strings.zoneInputLabel}
        </label>
        <input
          id={sectionInputId}
          type="text"
          value={section}
          onChange={(e) => setSection(e.target.value)}
          placeholder={role === 'fan' ? strings.sectionInputPlaceholder : strings.zoneInputPlaceholder}
          className="w-full rounded-md border border-slate-500 bg-slate-800 px-3 py-2 text-slate-50 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        />
        {error && (
          <p role="alert" className="mt-1 text-sm text-rose-300">
            {error}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="min-h-11 rounded-md bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
      >
        {strings.continueButtonLabel}
      </button>
    </form>
  )
}
