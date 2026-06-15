'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function google() {
    setError(null)
    const supabase = createClient()
    const next = new URLSearchParams(window.location.search).get('next') || '/dashboard'
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    })
    if (error) setError(error.message)
  }

  async function sendLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const next = new URLSearchParams(window.location.search).get('next') || '/dashboard'
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}` },
    })
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <main className="wrap" style={{ justifyContent: 'center', gap: 18 }}>
      <div style={{ textAlign: 'center' }}>
        <div className="brand">BE<span className="t">T</span>ON</div>
        <div className="muted" style={{ marginTop: 6 }}>Csongor vs Peter</div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <button className="btn" onClick={google} style={{ background: '#fff', color: '#111' }}>
          Continue with Google
        </button>

        <div className="muted" style={{ textAlign: 'center' }}>or use email</div>

        {sent ? (
          <p style={{ color: 'var(--txt2)', fontSize: 14, margin: 0, textAlign: 'center', lineHeight: 1.5 }}>
            Magic link sent to <b style={{ color: 'var(--txt)' }}>{email}</b> — open it on this device to sign in.
          </p>
        ) : (
          <form onSubmit={sendLink} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              className="input"
              type="email"
              required
              autoComplete="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="btn ghost" disabled={loading || !email}>
              {loading ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        )}

        {error && <div style={{ color: 'var(--red-br)', fontSize: 13 }}>{error}</div>}
      </div>

      <div className="muted" style={{ textAlign: 'center' }}>Passwordless · one tap to log your day</div>
    </main>
  )
}
