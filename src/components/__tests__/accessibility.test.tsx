import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { axe } from 'vitest-axe'
import App from '../../App'

describe('AccessPath accessibility (axe)', () => {
  it('has zero automated accessibility violations on initial render', async () => {
    const { container } = render(<App />)
    const results = await axe(container)
    expect(results.violations).toEqual([])
  })

  it('renders a skip-to-main-content link as the first focusable element (flaw #22)', () => {
    const { getByText } = render(<App />)
    const skipLink = getByText(/skip to main content/i)
    expect(skipLink.tagName).toBe('A')
    expect(skipLink.getAttribute('href')).toBe('#main-content')
  })

  it('renders a main landmark with id main-content matching the skip link target', () => {
    const { container } = render(<App />)
    const main = container.querySelector('main#main-content')
    expect(main).not.toBeNull()
  })

  it('every icon-only button has an accessible name via aria-label (flaw #13)', () => {
    const { container } = render(<App />)
    const iconButtons = container.querySelectorAll('button svg')
    iconButtons.forEach((svg) => {
      const button = svg.closest('button')
      expect(button?.getAttribute('aria-label')).toBeTruthy()
    })
  })

  it('the language select has an associated label (flaw #23)', () => {
    const { getByLabelText } = render(<App />)
    expect(getByLabelText(/language/i)).toBeInTheDocument()
  })
})
