'use client'

import { FormEvent, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Incorrect password')
        setIsSubmitting(false)
        return
      }

      router.push(searchParams.get('next') || '/')
      router.refresh()
    } catch {
      setError('Could not reach the server. Try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="w-full max-w-xs rounded-card bg-paper-card px-7 py-8 shadow-card"
      >
        <p className="font-mono text-xs uppercase tracking-widest text-ink-faint">Ledger</p>
        <h1 className="mt-1 font-display text-2xl italic text-ink">This page is closed.</h1>
        <p className="mt-2 text-sm text-ink-soft">Enter the passphrase to open today&rsquo;s book.</p>

        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Passphrase"
          aria-label="Passphrase"
          className="mt-5 w-full rounded-card border border-ink/15 bg-paper px-3 py-2 text-sm text-ink outline-none focus-visible:border-verdigris"
        />

        {error && (
          <p role="alert" className="mt-2 text-sm text-clay">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !password}
          className="mt-4 w-full rounded-card bg-ink py-2 font-mono text-xs uppercase tracking-wide text-paper-card transition-opacity disabled:opacity-30"
        >
          {isSubmitting ? 'Checking…' : 'Open'}
        </button>
      </motion.form>
    </main>
  )
}
