import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canCreateContests } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Auto-join any contest you've been challenged to — no accept step.
  await (supabase as any).rpc('accept_all_my_invites')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const { data: parts } = await supabase
    .from('contest_participants')
    .select('color, contest:contests(*)')
    .eq('profile_id', user.id)
  const contest = (parts?.[0]?.contest ?? null) as any

  let roster: any[] = []
  let standings: any[] = []
  if (contest) {
    const [{ data: r }, { data: s }] = await Promise.all([
      supabase
        .from('contest_participants')
        .select('color, profile:profiles(id, display_name)')
        .eq('contest_id', contest.id),
      supabase.from('v_series_standings').select('*').eq('contest_id', contest.id),
    ])
    roster = r ?? []
    standings = s ?? []
  }

  const wins = (pid?: string) => standings.find((x) => x.profile_id === pid)?.rounds_won ?? 0
  const blue = roster.find((x) => x.color === 'blue')
  const red = roster.find((x) => x.color === 'red')
  const needsSetup = !profile?.handle
  const isAdmin = canCreateContests(profile?.email ?? user.email)

  return (
    <main className="wrap" style={{ gap: 16 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="brand">
          BE<span className="t">T</span>ON
        </div>
        <form action="/auth/signout" method="post">
          <button className="btn ghost" style={{ width: 'auto', padding: '8px 12px' }}>
            Log out
          </button>
        </form>
      </div>

      <div className="card">
        <div className="muted">Signed in as</div>
        <div style={{ fontFamily: 'var(--tech)', fontWeight: 700, fontSize: 18, marginTop: 4 }}>
          {profile?.display_name}
        </div>
        <div className="muted" style={{ textTransform: 'none', letterSpacing: 0, marginTop: 2 }}>
          {profile?.email}
        </div>
        {needsSetup && (
          <Link href="/profile" style={{ display: 'inline-block', marginTop: 10, color: 'var(--blue-br)', fontSize: 13 }}>
            Finish setting up your profile →
          </Link>
        )}
      </div>

      {contest ? (
        <>
          <div className="muted">{contest.name}</div>
          <div className="row" style={{ alignItems: 'stretch' }}>
            <div className="corner blue">
              <div className="name">
                <span className="dot-blue">●</span> {blue?.profile?.display_name ?? 'Blue corner'}
              </div>
              <div className="score" style={{ marginTop: 12 }}>{wins(blue?.profile?.id)}</div>
              <div className="muted" style={{ marginTop: 6 }}>rounds won</div>
            </div>
            <div className="vs">VS</div>
            <div className="corner red">
              <div className="name">
                {red?.profile?.display_name ?? 'Awaiting'} <span className="dot-red">●</span>
              </div>
              <div className="score" style={{ marginTop: 12 }}>{wins(red?.profile?.id)}</div>
              <div className="muted" style={{ marginTop: 6 }}>rounds won</div>
            </div>
          </div>
          {!red && (
            <div className="muted" style={{ textTransform: 'none', letterSpacing: 0 }}>
              Your opponent joins automatically the moment they sign in.
            </div>
          )}
          <div className="card">
            <div className="muted">The bet</div>
            <p style={{ margin: '8px 0 0', color: 'var(--txt2)', fontSize: 14, lineHeight: 1.5 }}>
              {contest.num_weeks} rounds · ≥ {contest.weekly_gym_target} gym/wk · ≤{' '}
              {contest.weekly_calorie_cap.toLocaleString()} kcal/wk · {contest.cheat_total_allowance} cheats each
            </p>
            <div className="muted" style={{ marginTop: 10, textTransform: 'none', letterSpacing: 0 }}>
              {contest.start_date} → {contest.end_date}
            </div>
          </div>
          <div className="muted" style={{ textAlign: 'center' }}>
            Daily logging &amp; live scoreboard — coming next
          </div>
          {isAdmin && (
            <Link href="/new" className="muted" style={{ textAlign: 'center', textDecoration: 'none' }}>
              + New contest
            </Link>
          )}
        </>
      ) : isAdmin ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--tech)', fontWeight: 700, marginBottom: 8 }}>No contest yet</div>
          <p style={{ color: 'var(--txt2)', fontSize: 14, margin: '0 0 14px', lineHeight: 1.5 }}>
            Start a head-to-head and challenge someone by email.
          </p>
          <Link href="/new" className="btn" style={{ display: 'block', textDecoration: 'none' }}>
            Create a contest
          </Link>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--tech)', fontWeight: 700, marginBottom: 8 }}>Invite-only</div>
          <p style={{ color: 'var(--txt2)', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
            BeTon is invite-only. Your contest shows up here the moment someone challenges you.
          </p>
        </div>
      )}
    </main>
  )
}
