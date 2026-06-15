import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createContestAndChallenge } from '@/app/actions'

export const dynamic = 'force-dynamic'

export default async function NewContest({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().slice(0, 10)

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

      <div className="muted">New contest</div>

      <form className="card" action={createContestAndChallenge} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className="muted">Contest name</label>
          <input className="input" name="name" required defaultValue="BeTon — Summer 2026" style={{ marginTop: 6 }} />
        </div>
        <div>
          <label className="muted">Challenge — opponent&apos;s email</label>
          <input className="input" name="opponent_email" type="email" required placeholder="opponent@email.com" style={{ marginTop: 6 }} />
        </div>
        <div className="row" style={{ gap: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label className="muted">Start date</label>
            <input className="input" name="start_date" type="date" required defaultValue={today} style={{ marginTop: 6 }} />
          </div>
          <div style={{ width: 110 }}>
            <label className="muted">Weeks</label>
            <input className="input" name="num_weeks" type="number" min={1} max={52} defaultValue={15} style={{ marginTop: 6 }} />
          </div>
        </div>
        <div className="muted" style={{ textTransform: 'none', letterSpacing: 0, lineHeight: 1.5 }}>
          Standard rules: ≥ 4 gym/wk, ≤ 14,000 kcal/wk, 10 cheats each. You take the blue corner; your
          opponent gets the challenge by email and the red corner.
        </div>
        {searchParams?.error && <div style={{ color: 'var(--red-br)', fontSize: 13 }}>{searchParams.error}</div>}
        <button className="btn">Create &amp; send challenge</button>
      </form>
    </main>
  )
}
