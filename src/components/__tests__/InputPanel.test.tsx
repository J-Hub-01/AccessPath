import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InputPanel } from '../InputPanel'
import { UI_STRINGS } from '../../lib/i18n'
import { SAMPLE_QUESTIONS } from '../../lib/prompts'

describe('InputPanel', () => {
  it('submits the typed question when the submit button is clicked (AC-IN-01)', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <InputPanel language="en" strings={UI_STRINGS.en} isSubmitting={false} onSubmit={onSubmit} />,
    )

    const textarea = screen.getByLabelText(UI_STRINGS.en.textInputLabel)
    await user.type(textarea, 'How do I reach Section 114?')
    await user.click(screen.getByRole('button', { name: UI_STRINGS.en.submitButtonLabel }))

    expect(onSubmit).toHaveBeenCalledWith('How do I reach Section 114?', null)
  })

  it('rejects input over 2000 characters with a visible role="alert" error (AC-IN-01)', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <InputPanel language="en" strings={UI_STRINGS.en} isSubmitting={false} onSubmit={onSubmit} />,
    )

    const textarea = screen.getByLabelText(UI_STRINGS.en.textInputLabel)
    const tooLong = 'a'.repeat(2001)
    await user.click(textarea)
    await user.paste(tooLong)

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('pre-fills the textarea and focuses submit when a sample-question button is clicked (AC-IN-05)', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <InputPanel language="en" strings={UI_STRINGS.en} isSubmitting={false} onSubmit={onSubmit} />,
    )

    const priyaButton = screen.getByRole('button', { name: 'Priya' })
    await user.click(priyaButton)

    const textarea = screen.getByLabelText<HTMLTextAreaElement>(UI_STRINGS.en.textInputLabel)
    expect(textarea.value).toBe(SAMPLE_QUESTIONS[0]?.sampleQuestion)

    const submitButton = screen.getByRole('button', { name: UI_STRINGS.en.submitButtonLabel })
    expect(submitButton).toHaveFocus()
  })

  it('disables the submit button while a request is in flight', () => {
    render(
      <InputPanel language="en" strings={UI_STRINGS.en} isSubmitting={true} onSubmit={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: UI_STRINGS.en.submitButtonLabel })).toBeDisabled()
  })
})
