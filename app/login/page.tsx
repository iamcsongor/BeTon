'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function sendLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    })
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <main className="wrap" style={{ justifyContent: 'center', gap: 18 }}>
      <div style={{ textAlign: 'center' }}>
        <div className="brand">
          BE<span className="t">T</span>ON
        </div>
        <div className="muted" style={{ marginTop: 6 }}>Csongor vs Peter</div>
      </div>

      {sent ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--tech)', fontWeight: 700, marginBottom: 8 }}>
            Check your email
          </div>
          <p style={{ color: 'var(--txt2)', fontSize: 14, margin: 0 }}>
            We sent a magic link to <b style={{ color: 'var(--txt)' }}>{email}</b>. Open it on this
            device to sign in.
          </p>
        </div>
      ) : (
        <form className="card" onSubmit={sendLink} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label className="muted">Email</label>
          <input
            className="input"
            type="email"
            required
            autoComplete="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="btn" disabled={loading || !email}>
            {loading ? 'Sending…' : 'Send magic link'}
          </button>
          {error && <div style={{ color: 'var(--red-br)', fontSize: 13 }}>{error}</div>}
        </form>
      )}

      <div className="muted" style={{ textAlign: 'center' }}>
        Passwordless · one tap to log your day
      </div>
    </main>
  )
}
