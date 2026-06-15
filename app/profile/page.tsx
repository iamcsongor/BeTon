import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateProfile } from '@/app/actions'

export const dynamic = 'force-dynamic'

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  return (
    <main className="wrap" style={{ gap: 16 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="brand">
          BE<span className="t">T</span>ON
        </div>
        <a className="btn ghost" href="/dashboard" style={{ width: 'auto', padding: '8px 12px', textDecoration: 'none' }}>
          Back
        </a>
      </div>

      <div className="muted">Your profile</div>

      <form className="card" action={updateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className="muted">Display name</label>
          <input className="input" name="display_name" required defaultValue={profile?.display_name ?? ''} style={{ marginTop: 6 }} />
        </div>
        <div>
          <label className="muted">Handle</label>
          <input className="input" name="handle" placeholder="csongor" defaultValue={profile?.handle ?? ''} style={{ marginTop: 6 }} />
          <div className="muted" style={{ textTransform: 'none', letterSpacing: 0, marginTop: 6 }}>
            Letters, numbers, and underscores only.
          </div>
        </div>
        <div className="muted" style={{ textTransform: 'none', letterSpacing: 0 }}>{profile?.email}</div>
        {searchParams?.error && <div style={{ color: 'var(--red-br)', fontSize: 13 }}>{searchParams.error}</div>}
        <button className="btn">Save profile</button>
      </form>
    </main>
  )
}
