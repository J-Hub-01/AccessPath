import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RoleSelector } from '../RoleSelector'
import { UI_STRINGS } from '../../lib/i18n'

describe('RoleSelector (v2)', () => {
  it('requires a section for the Fan role before continuing', async () => {
    const user = userEvent.setup()
    const onChoose = vi.fn()
    render(<RoleSelector strings={UI_STRINGS.en} onChoose={onChoose} />)

    await user.click(screen.getByRole('button', { name: UI_STRINGS.en.continueButtonLabel }))

    expect(onChoose).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('calls onChoose with the fan role and section once filled in', async () => {
    const user = userEvent.setup()
    const onChoose = vi.fn()
    render(<RoleSelector strings={UI_STRINGS.en} onChoose={onChoose} />)

    await user.type(screen.getByLabelText(UI_STRINGS.en.sectionInputLabel), 'Section 114')
    await user.click(screen.getByRole('button', { name: UI_STRINGS.en.continueButtonLabel }))

    expect(onChoose).toHaveBeenCalledWith('fan', 'Section 114')
  })

  it('does not require a section for the Staff role', async () => {
    const user = userEvent.setup()
    const onChoose = vi.fn()
    render(<RoleSelector strings={UI_STRINGS.en} onChoose={onChoose} />)

    await user.click(screen.getByLabelText(UI_STRINGS.en.roleStaffLabel))
    await user.click(screen.getByRole('button', { name: UI_STRINGS.en.continueButtonLabel }))

    expect(onChoose).toHaveBeenCalledWith('staff', '')
  })
})
