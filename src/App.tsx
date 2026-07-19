import { useState } from 'react'
import { LanguageSelector } from './components/LanguageSelector'
import { RoleSelector } from './components/RoleSelector'
import { FanDashboard } from './components/FanDashboard'
import { OrderQueue } from './components/OrderQueue'
import { HelpQueue } from './components/HelpQueue'
import { UI_STRINGS } from './lib/i18n'
import type { SupportedLanguage } from './lib/prompts'
import { useLanguageEffect } from './hooks/useLanguageEffect'
import { clearSession, createSession, loadSession, type Role, type Session } from './lib/session'

/**
 * AccessPath v2 — role-based stadium operations platform
 * (accesspath_v2_vision.md). App.tsx is now a thin role router: the v1
 * accessibility Q&A engine (Concierge) is preserved unchanged inside
 * FanDashboard, alongside the three new v2 features, and Staff/Security
 * get their own live queue views. See RoleSelector for the entry point.
 */
export default function App() {
  const [language, setLanguage] = useState<SupportedLanguage>('en')
  const [session, setSession] = useState<Session | null>(() => loadSession())

  const strings = UI_STRINGS[language]
  useLanguageEffect(language)

  function handleRoleChosen(role: Role, section: string) {
    setSession(createSession(role, section))
  }

  function handleSwitchRole() {
    clearSession()
    setSession(null)
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-teal-500 focus:px-4 focus:py-2 focus:text-white"
      >
        {strings.skipToMain}
      </a>

      <header className="border-b border-slate-800 px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">AccessPath</h1>
            <p className="text-sm text-slate-400">{strings.tagline}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <LanguageSelector value={language} onChange={setLanguage} strings={strings} />
            {session && (
              <button
                type="button"
                onClick={handleSwitchRole}
                className="min-h-11 rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                {strings.switchRoleButtonLabel}
              </button>
            )}
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
        {!session ? (
          <RoleSelector strings={strings} onChoose={handleRoleChosen} />
        ) : session.role === 'fan' ? (
          <FanDashboard session={session} language={language} strings={strings} />
        ) : session.role === 'staff' ? (
          <OrderQueue strings={strings} />
        ) : (
          <HelpQueue strings={strings} />
        )}
      </main>

      <footer className="border-t border-slate-800 px-4 py-6 text-sm text-slate-400 sm:px-8">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4">
          <p>
            Built with Google AI Studio + Gemini 2.5 Flash for FIFA World Cup 2026 &middot;{' '}
            <a
              href="#accessibility-statement"
              className="underline hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
            >
              Accessibility statement
            </a>
          </p>
          <a
            href="https://github.com/"
            className="underline hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}
