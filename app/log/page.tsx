import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { saveDay } from '@/app/actions'

export const dynamic = 'force-dynamic'

const MUSCLES = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Abs', 'Cardio']
const cbStyle = { accentColor: '#2f5fe0', width: 18, height: 18 } as const
function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function Field({ label, name, value, unit }: { label: string; name: string; value?: number; unit: string }) {
  return (
    <div>
      <label className="muted">{label}</label>
      <div className="row" style={{ gap: 8, marginTop: 6 }}>
        <input className="input" type="number" name={name} min={0} defaultValue={value ?? 0} />
        <span className="muted" style={{ textTransform: 'none', letterSpacing: 0 }}>{unit}</span>
      </div>
    </div>
  )
}

export default async function LogPage({
  searchParams,
}: {
  searchParams: { date?: string; saved?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: parts } = await supabase
    .from('contest_participants')
    .select('contest_id, contest:contests(*)')
    .eq('profile_id', user.id)
    .limit(1)
  const contest = (parts?.[0]?.contest ?? null) as any
  if (!contest) redirect('/dashboard')

  const date = searchParams?.date || todayISO()

  const { data: dayRow } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('contest_id', contest.id)
    .eq('profile_id', user.id)
    .eq('log_date', date)
    .maybeSingle()
  const d = (dayRow ?? {}) as any
  const muscles: string[] = d.muscles ?? []

  const { data: recent } = await supabase
    .from('daily_logs')
    .select('log_date, calories, gym, cheat')
    .eq('contest_id', contest.id)
    .eq('profile_id', user.id)
  const byDate = new Map((recent ?? []).map((r: any) => [r.log_date, r]))

  const days: string[] = []
  for (let i = 0; i < 14; i++) {
    const t = new Date()
    t.setUTCDate(t.getUTCDate() - i)
    days.push(t.toISOString().slice(0, 10))
  }

  return (
    <main className="wrap" style={{ gap: 16 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="brand">BE<span className="t">T</span>ON</div>
        <a className="btn ghost" href="/dashboard" style={{ width: 'auto', padding: '8px 12px', textDecoration: 'none' }}>
          Back
        </a>
      </div>

      <div className="muted">Log your day</div>

      <form className="card" action={saveDay} key={date} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className="muted">Date</label>
          <input className="input" type="date" name="log_date" defaultValue={date} max={todayISO()} style={{ marginTop: 6 }} />
        </div>

        <Field label="Calories consumed" name="calories" value={d.calories} unit="kcal" />
        <Field label="Protein" name="protein_g" value={d.protein_g} unit="g" />
        <Field label="Junk calories" name="junk_calories" value={d.junk_calories} unit="kcal" />

        <label className="row" style={{ gap: 10 }}>
          <input type="checkbox" name="gym" defaultChecked={!!d.gym} style={cbStyle} />
          <span style={{ fontFamily: 'var(--tech)', fontWeight: 700, fontSize: 13 }}>Hit the gym</span>
        </label>

        <div>
          <div className="muted" style={{ marginBottom: 8 }}>Muscle groups</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {MUSCLES.map((m) => (
              <label key={m} className="row" style={{ gap: 8 }}>
                <input type="checkbox" name="muscles" value={m} defaultChecked={muscles.includes(m)} style={cbStyle} />
                <span style={{ fontSize: 14 }}>{m}</span>
              </label>
            ))}
          </div>
        </div>

        <label className="row" style={{ gap: 10 }}>
          <input type="checkbox" name="cheat" defaultChecked={!!d.cheat} style={{ ...cbStyle, accentColor: '#e7b53c' }} />
          <span style={{ fontFamily: 'var(--tech)', fontWeight: 700, fontSize: 13 }}>Cheat meal</span>
        </label>

        <button className="btn">Save day</button>
        {searchParams?.saved && <div style={{ color: 'var(--good)', fontSize: 13, textAlign: 'center' }}>Saved ✓</div>}
      </form>

      <div className="muted">Recent days · tap to edit</div>
      <div className="card" style={{ padding: 0 }}>
        {days.map((dt) => {
          const r = byDate.get(dt) as any
          return (
            <Link
              key={dt}
              href={`/log?date=${dt}`}
              style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid var(--line)', textDecoration: 'none', color: 'inherit' }}
            >
              <span style={{ fontFamily: 'var(--mono)', fontSize: 14 }}>
                {dt}{dt === todayISO() ? '  · today' : ''}
              </span>
              <span className="muted" style={{ textTransform: 'none', letterSpacing: 0 }}>
                {r ? `${r.calories.toLocaleString()} kcal${r.gym ? ' · gym' : ''}${r.cheat ? ' · cheat' : ''}` : 'not logged'}
              </span>
            </Link>
          )
        })}
      </div>
    </main>
  )
}
