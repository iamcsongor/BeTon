'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/* ============================================================
   BeTon — ported from the prototype (beton.css design),
   wired to live Supabase data for the signed-in user.
   ============================================================ */

const MUSCLES = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Abs', 'Cardio']
const DOW = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const MS_DAY = 86400000

function iso(ts: number) {
  return new Date(ts).toISOString().slice(0, 10)
}
function fmtDate(isoStr: string) {
  const d = new Date(isoStr + 'T00:00:00Z')
  return { dow: DOW[(d.getUTCDay() + 6) % 7], d: d.getUTCDate(), mon: MON[d.getUTCMonth()] }
}
function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / MS_DAY)
}
function weekDates(C: any, w: number) {
  const s = Date.parse(C.start + 'T00:00:00Z') + (w - 1) * 7 * MS_DAY
  return Array.from({ length: 7 }, (_, i) => iso(s + i * MS_DAY))
}
function kc(n: number) {
  return (n || 0).toLocaleString('en-US')
}

/* ---------- selectors ---------- */
function weekSummary(state: any, player: string, w: number) {
  const C = state.C
  const dates = weekDates(C, w)
  let cals = 0, protein = 0, junk = 0, gym = 0, logged = 0, cheats = 0, proteinDays = 0
  dates.forEach((dt) => {
    const d = state.days[player]?.[dt]
    if (!d) return
    logged++
    cals += d.cals; junk += d.junk
    if (d.protein) { protein += d.protein; proteinDays++ }
    if (d.gym) gym++
    if (d.cheat) cheats++
  })
  const pts = (gym >= C.weeklyGym ? 1 : 0) + (logged === 7 && cals <= C.weeklyCal ? 1 : 0)
  return {
    cals, protein, junk, gym, logged, cheats,
    avgProtein: proteinDays ? Math.round(protein / proteinDays) : 0,
    gymHit: gym >= C.weeklyGym,
    calHit: logged === 7 ? cals <= C.weeklyCal : true,
    pts, complete: logged === 7,
  }
}
function weekResult(state: any, w: number) {
  const [a, b] = state.players
  const c = weekSummary(state, a, w)
  const p = weekSummary(state, b, w)
  let winner = 'tie'
  if (c.complete && p.complete) {
    if (c.pts > p.pts) winner = a
    else if (p.pts > c.pts) winner = b
    else winner = c.cals <= p.cals ? a : b
  }
  return { c, p, winner }
}
function series(state: any) {
  const [a, b] = state.players
  const out: any = { [a]: 0, [b]: 0 }
  for (let w = 1; w < state.C.currentWeek; w++) {
    const r = weekResult(state, w)
    if (r.winner === a) out[a]++
    else if (r.winner === b) out[b]++
  }
  return out
}
function cheatsUsed(state: any, player: string) {
  let n = 0
  Object.values(state.days[player] || {}).forEach((d: any) => { if (d.cheat) n++ })
  return n
}
function daysLeft(state: any) { return daysBetween(state.C.today, state.C.finish) }
function goalFor(goals: any, player: string, date: string) {
  const list = goals[player] || []
  if (!list.length) return 2000
  let val = list[0].value
  for (let i = 0; i < list.length; i++) { if (list[i].from <= date) val = list[i].value; else break }
  return val
}
function currentGoal(state: any, player: string) { return goalFor(state.goals, player, state.C.today) }
function paceState(C: any, cals: number, loggedDays: number) {
  if (loggedDays === 0) return { cls: 'good', txt: 'NO DATA' }
  const expected = C.weeklyCal * (loggedDays / 7)
  return cals <= expected ? { cls: 'good', txt: 'ON PACE' } : { cls: 'warn', txt: 'OVER PACE' }
}

/* ---------- icons ---------- */
function Icon({ name, size = 20, stroke = 2, style }: any) {
  const p: any = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round', style }
  const paths: any = {
    vs: <><path d="M5 4l5 8-5 8" /><path d="M19 4l-5 8 5 8" /></>,
    cal: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" /></>,
    moon: <path d="M20 14.5A8 8 0 119.5 4 6.5 6.5 0 0020 14.5z" />,
    check: <path d="M5 12l5 5L20 6" />,
    x: <path d="M6 6l12 12M18 6L6 18" />,
    plus: <path d="M12 5v14M5 12h14" />,
    minus: <path d="M5 12h14" />,
    dumbbell: <><path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12" /></>,
    flame: <path d="M12 3c1 4 4 5 4 9a4 4 0 11-8 0c0-2 1-3 2-4 0 1 1 2 2 2 0-3-2-4-2-7z" />,
    star: <path d="M12 3l2.5 6 6.5.5-5 4.2L17.5 21 12 17.3 6.5 21 8 13.7l-5-4.2 6.5-.5z" />,
    bolt: <path d="M13 2L4 14h6l-1 8 9-12h-6z" />,
    trophy: <><path d="M7 4h10v5a5 5 0 01-10 0V4z" /><path d="M7 6H4v1a3 3 0 003 3M17 6h3v1a3 3 0 01-3 3M9 19h6M12 14v5" /></>,
    edit: <><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="M14 6l4 4" /></>,
    target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /></>,
    logout: <><path d="M14 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3" /><path d="M9 12h11M16 8l4 4-4 4" /></>,
  }
  return <svg {...p}>{paths[name]}</svg>
}

function SecLabel({ children, right }: any) {
  return (
    <div className="sec-label">
      <span className="lbl">{children}</span>
      <span className="ln" />
      {right}
    </div>
  )
}
function Switch({ on, gold, onClick }: any) {
  return (
    <div className={'switch' + (on ? ' on' : '') + (gold ? ' gold' : '')} onClick={onClick}>
      <div className="knob" />
    </div>
  )
}
function ProgressBar({ value, max, variant, tick }: any) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const tickPct = tick != null ? Math.min(100, (tick / max) * 100) : null
  return (
    <div className="bar">
      <div className={'bar-fill ' + variant} style={{ width: pct + '%' }} />
      {tickPct != null && <div className="bar-tick" style={{ left: tickPct + '%' }} />}
    </div>
  )
}

/* ---------- VERSUS screen ---------- */
function TWColumn({ C, side, name, sum, color }: any) {
  const pace = paceState(C, sum.cals, sum.logged)
  const dots = Array.from({ length: C.weeklyGym }, (_, i) => i < sum.gym)
  return (
    <div className={'tw-col ' + side}>
      <div className="tw-name">
        {side === 'r' && <><span>{name}</span><span className={'dot-' + color}>●</span></>}
        {side === 'l' && <><span className={'dot-' + color}>●</span><span>{name}</span></>}
      </div>
      <div className="tw-metric">
        <div className="lbl">Gym · {sum.gym}/{C.weeklyGym}</div>
        <div className="dots">{dots.map((on: boolean, i: number) => <div key={i} className={'gdot ' + color + (on ? ' on' : '')} />)}</div>
      </div>
      <div className="tw-metric">
        <div className="lbl">Calories</div>
        <div className="tw-val">{kc(sum.cals)} <small>/ {kc(C.weeklyCal)}</small></div>
        <ProgressBar value={sum.cals} max={C.weeklyCal} variant={color} tick={C.weeklyCal * sum.logged / 7} />
      </div>
      <div className="tw-metric">
        <div className="lbl">Junk · {sum.logged}d logged</div>
        <div className="tw-val">{kc(sum.junk)} <small>kcal</small></div>
      </div>
      <span className={'pace ' + pace.cls}>{pace.txt}</span>
    </div>
  )
}
function anchorStyle(side: string, start: number, w: number): any {
  return side === 'l' ? { right: start + '%', width: w + '%' } : { left: start + '%', width: w + '%' }
}
function LadderSide({ C, side, sum, color, live, max, budgetPct }: any) {
  const over = sum.complete && sum.cals > C.weeklyCal
  const underW = (Math.min(sum.cals, C.weeklyCal) / max) * 100
  const overW = over ? ((sum.cals - C.weeklyCal) / max) * 100 : 0
  const gym = Array.from({ length: C.weeklyGym }, (_, i) => i < sum.gym)
  return (
    <div className={'lside ' + side}>
      <div className="lcal">
        <div className={'lcal-top' + (over ? ' over' : '')}><b>{kc(sum.cals)}</b><small>/14k{live ? ' · live' : ''}</small></div>
        <div className={'lcal-track' + (live ? ' partial' : '')}>
          <div className={'lcal-fill ' + color} style={anchorStyle(side, 0, underW)} />
          {over && <div className="lcal-fill over" style={anchorStyle(side, underW, overW)} />}
          <div className="lcal-tick" style={side === 'l' ? { right: budgetPct + '%' } : { left: budgetPct + '%' }} />
        </div>
      </div>
      <div className="lmeta">
        <div className="lgym">{gym.map((on: boolean, i: number) => <div key={i} className={'lgbox ' + color + (on ? ' on' : '')} />)}</div>
        <span className={'lgym-n' + (sum.gymHit ? ' hit' : '')}>{sum.gym}/4</span>
        <div className="lcheat">{sum.cheats > 0 ? Array.from({ length: sum.cheats }, (_, i) => <Icon key={i} name="flame" size={12} />) : <span className="lc-none">—</span>}</div>
      </div>
    </div>
  )
}
function ComparisonLadder({ state, go }: any) {
  const C = state.C
  const [a, b] = state.players
  const MAXCAL = C.weeklyCal * 1.1
  const budgetPct = (C.weeklyCal / MAXCAL) * 100
  const weeks = []
  for (let w = C.currentWeek; w >= 1; w--) weeks.push(w)
  return (
    <div className="ladder">
      <div className="lhead">
        <div className="lh-name l"><span className="dot-blue">●</span> {a?.toUpperCase()}</div>
        <div className="lh-c"><span className="lbl">WK</span></div>
        <div className="lh-name r">{b?.toUpperCase()} <span className="dot-red">●</span></div>
      </div>
      {weeks.map((w) => {
        const live = w === C.currentWeek
        const sumC = weekSummary(state, a, w)
        const sumP = weekSummary(state, b, w)
        const res = live ? null : weekResult(state, w)
        const winner = res ? res.winner : null
        const flag = live ? { cls: 'live', ch: '●' } : winner === a ? { cls: 'blue', ch: '◀' } : winner === b ? { cls: 'red', ch: '▶' } : { cls: 'tie', ch: '=' }
        const wd = fmtDate(weekDates(C, w)[0])
        return (
          <div key={w} className={'lrow' + (live ? ' live' : '')} onClick={() => go('weeks')}>
            <LadderSide C={C} side="l" sum={sumC} color="blue" live={live} max={MAXCAL} budgetPct={budgetPct} />
            <div className="lspine">
              <div className="lwk">{String(w).padStart(2, '0')}</div>
              <div className={'lflag ' + flag.cls}>{flag.ch}</div>
              <div className="lwk-date">{wd.d} {wd.mon}</div>
            </div>
            <LadderSide C={C} side="r" sum={sumP} color="red" live={live} max={MAXCAL} budgetPct={budgetPct} />
          </div>
        )
      })}
      <div className="ladder-foot">+{C.weeks - C.currentWeek} rounds to come · finish {fmtDate(C.finish).d} {fmtDate(C.finish).mon}</div>
    </div>
  )
}
function VSScreen({ state, go }: any) {
  const C = state.C
  const [a, b] = state.players
  const s = series(state)
  const lead = s[a] === s[b] ? null : (s[a] > s[b] ? a : b)
  const cwSum = weekSummary(state, a, C.currentWeek)
  const pSum = weekSummary(state, b, C.currentWeek)
  const cheatA = cheatsUsed(state, a)
  const cheatB = cheatsUsed(state, b)
  const checkins = C.checkins
  const nextCi = checkins.find((c: number) => c >= C.currentWeek) || checkins[checkins.length - 1]
  const ciEnd = fmtDate(weekDates(C, nextCi)[6])
  const dLeft = daysLeft(state)
  const totalDays = daysBetween(C.start, C.finish)
  const pctDone = Math.max(0, Math.round(((totalDays - dLeft) / totalDays) * 100))
  const fin = fmtDate(C.finish)

  return (
    <div className="scroll">
      <div className="meta-strip">
        <span>WK <b>{String(C.currentWeek).padStart(2, '0')}</b>/{C.weeks}</span>
        <span className="meta-sep" />
        <span><b>{dLeft}</b> DAYS LEFT</span>
        <span className="meta-sep" />
        <span>FINISH <b>{fin.mon} {fin.d}</b></span>
      </div>

      <div className="cprog">
        <div className="cprog-top"><span>Contest progress</span><span className="cprog-pct">{pctDone}%<span className="cprog-pct-l"> complete</span></span></div>
        <div className="cprog-bar">
          <div className="cprog-track"><div className="cprog-fill" style={{ width: pctDone + '%' }} /></div>
          {checkins.map((w: number) => <div key={w} className={'cprog-tick' + (w < C.currentWeek ? ' done' : '')} style={{ left: 'calc(' + (w / C.weeks * 100) + '% - 1px)' }} />)}
          <div className="cprog-now" style={{ left: 'calc(' + pctDone + '% - 1px)' }} />
        </div>
      </div>

      <div className="hero">
        <div className="hero-half hero-blue" />
        <div className="hero-half hero-red" />
        <div className="hero-scan" />
        <div className="hero-seam" />
        <div className="corner left">
          <div className="corner-tag">BLUE CORNER</div>
          <div className="corner-name">{a?.toUpperCase()}</div>
          <div className="corner-spacer" />
          <div className="corner-won">{s[a]}</div>
          <div className="corner-won-lbl">ROUNDS WON</div>
          {lead === a && <span className="corner-lead"><Icon name="trophy" size={10} /> LEADS</span>}
        </div>
        <div className="corner right">
          <div className="corner-tag">RED CORNER</div>
          <div className="corner-name">{b?.toUpperCase()}</div>
          <div className="corner-spacer" />
          <div className="corner-won">{s[b]}</div>
          <div className="corner-won-lbl">ROUNDS WON</div>
          {lead === b && <span className="corner-lead"><Icon name="trophy" size={10} /> LEADS</span>}
        </div>
        <div className="vs-badge">VS</div>
        <div className="vs-score">{lead ? (lead.toUpperCase() + ' AHEAD') : 'DEAD HEAT'}</div>
      </div>

      <div className="checkin-banner">
        <span className="ci-ic"><Icon name="star" size={20} /></span>
        <div style={{ flex: 1 }}>
          <div className="ci-t">CHECK-IN #{checkins.indexOf(nextCi) + 1} · WK {String(nextCi).padStart(2, '0')}</div>
          <div className="ci-s">Photos + progress review · week ending {ciEnd.dow} {ciEnd.d} {ciEnd.mon}</div>
        </div>
      </div>

      <SecLabel right={<span className="lbl" style={{ color: 'var(--gold)' }}>● LIVE</span>}>This week · Round {String(C.currentWeek).padStart(2, '0')}</SecLabel>
      <div className="panel">
        <div className="tw">
          <TWColumn C={C} side="l" name={a?.toUpperCase()} sum={cwSum} color="blue" />
          <div className="tw-div" />
          <TWColumn C={C} side="r" name={b?.toUpperCase()} sum={pSum} color="red" />
        </div>
      </div>

      <SecLabel right={<span className="lbl">latest first</span>}>Round by round</SecLabel>
      <ComparisonLadder state={state} go={go} />

      <SecLabel right={<span className="lbl">{C.cheatTotal} max each</span>}>Cheat meals</SecLabel>
      <div className="panel">
        <div className="panel-b" style={{ paddingTop: 6, paddingBottom: 8 }}>
          {[[a, 'blue', cheatA], [b, 'red', cheatB]].map(([nm, col, used]: any) => (
            <div className="cheat-row" key={nm}>
              <span className="cheat-name" style={{ color: col === 'blue' ? 'var(--blue-br)' : 'var(--red-br)' }}>{nm?.toUpperCase()}</span>
              <div className="tokens">{Array.from({ length: C.cheatTotal }, (_, i) => <div key={i} className={'token ' + col + (i < used ? ' used' : '')} />)}</div>
              <span className="cheat-left">{C.cheatTotal - used} left</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------- ROUNDS screen ---------- */
function Pip({ label, state }: any) {
  return <div className={'pip ' + (state === 'hit' ? 'hit' : state === 'miss' ? 'miss' : '')}><span className="dotp" />{label}</div>
}
function WeekDetail({ sum, C }: any) {
  const cell = (lbl: string, val: any, sub?: string) => (
    <div><div className="lbl" style={{ fontSize: 8.5 }}>{lbl}</div><div className="num" style={{ fontWeight: 700, fontSize: 14, marginTop: 2 }}>{val}{sub && <span style={{ fontSize: 9, color: 'var(--txt3)' }}> {sub}</span>}</div></div>
  )
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, padding: '4px 2px 2px' }}>
      {cell('CALS', kc(sum.cals))}{cell('GYM', sum.gym + '/' + C.weeklyGym)}{cell('AVG PRO', sum.avgProtein, 'g')}{cell('CHEATS', sum.cheats)}
    </div>
  )
}
function WeeksScreen({ state }: any) {
  const C = state.C
  const [a, b] = state.players
  const s = series(state)
  const [open, setOpen] = useState<number | null>(null)
  const rows = []
  for (let w = 1; w <= C.weeks; w++) {
    const future = w > C.currentWeek
    const live = w === C.currentWeek
    const r = future ? null : weekResult(state, w)
    const dates = weekDates(C, w)
    const da = fmtDate(dates[0]), db = fmtDate(dates[6])
    const isCheckin = C.checkins.includes(w)
    const pipState = (sum: any, kind: string) => {
      if (future) return 'pending'
      if (kind === 'gym') return sum.gymHit ? 'hit' : (sum.complete ? 'miss' : 'pending')
      return sum.complete ? (sum.calHit ? 'hit' : 'miss') : 'pending'
    }
    rows.push(
      <div key={w}>
        <div className={'wk-row' + (live ? ' live' : '') + (future ? ' future' : '')} onClick={() => !future && setOpen(open === w ? null : w)}>
          <div className="wk-no">{String(w).padStart(2, '0')}<small>{da.d} {da.mon}–{db.d} {db.mon}</small></div>
          <div className="wk-side blue">
            <div className="wk-pips"><Pip label="G" state={r ? pipState(r.c, 'gym') : 'pending'} /><Pip label="C" state={r ? pipState(r.c, 'cal') : 'pending'} /></div>
            <div className="wk-pts blue">{future ? '–' : (live ? 'LIVE' : r!.c.pts + 'pt')}</div>
          </div>
          <div className="wk-side red">
            <div className="wk-pips"><Pip label="C" state={r ? pipState(r.p, 'cal') : 'pending'} /><Pip label="G" state={r ? pipState(r.p, 'gym') : 'pending'} /></div>
            <div className="wk-pts red">{future ? '–' : (live ? 'LIVE' : r!.p.pts + 'pt')}</div>
          </div>
          <div className={'wk-flag ' + (future || live ? 'tie' : (r!.winner === a ? 'blue' : r!.winner === b ? 'red' : 'tie'))}>
            {future ? <span style={{ color: 'var(--txt3)' }}>{isCheckin ? '★' : '·'}</span> : live ? <Icon name="bolt" size={13} /> : r!.winner === a ? '◀' : r!.winner === b ? '▶' : '='}
          </div>
        </div>
        {open === w && r && (
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderTop: 'none', borderRadius: '0 0 13px 13px', margin: '-9px 0 7px', padding: '12px 13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}><span className="lbl" style={{ color: 'var(--blue-br)' }}>● {a}</span></div>
            <WeekDetail sum={r.c} C={C} />
            <div style={{ height: 1, background: 'var(--line)', margin: '10px 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}><span className="lbl" style={{ color: 'var(--red-br)' }}>● {b}</span></div>
            <WeekDetail sum={r.p} C={C} />
          </div>
        )}
      </div>
    )
  }
  return (
    <div className="scroll">
      <div className="meta-strip" style={{ paddingTop: 4 }}>
        <span>SERIES</span><span className="meta-sep" />
        <span style={{ color: 'var(--blue-br)' }}><b style={{ color: 'var(--blue-br)' }}>{a?.slice(0, 3).toUpperCase()} {s[a]}</b></span><span>–</span>
        <span style={{ color: 'var(--red-br)' }}><b style={{ color: 'var(--red-br)' }}>{s[b]} {b?.slice(0, 3).toUpperCase()}</b></span>
        <span className="meta-sep" /><span><b>{C.currentWeek - 1}</b> ROUNDS DECIDED</span>
      </div>
      {rows}
      <div style={{ textAlign: 'center', color: 'var(--txt3)', fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 8 }}>Tap a round for the breakdown</div>
    </div>
  )
}

/* ---------- LOG (daily) screen ---------- */
function NumberField({ label, sub, value, unit, step, quicks, onChange, accent }: any) {
  return (
    <div className="field">
      <div className="field-h"><span className="lbl">{label}</span>{sub && <span className="lbl-r">{sub}</span>}</div>
      <div className="num-edit">
        <button className="stp" onClick={() => onChange(Math.max(0, value - step))}><Icon name="minus" size={16} /></button>
        <div className="num-big" style={accent ? { color: accent } : undefined}>{kc(value)} <small>{unit}</small></div>
        <button className="stp" onClick={() => onChange(value + step)}><Icon name="plus" size={16} /></button>
      </div>
      {quicks && <div className="quick-row">{quicks.map((q: any, i: number) => <button key={i} className="quick" onClick={() => onChange(q.set != null ? q.set : value + q.add)}>{q.label}</button>)}</div>}
    </div>
  )
}
function EditSheet({ state, date, onSave, onClose }: any) {
  const player = state.selfName
  const color = state.color[player]
  const existing = state.days[player]?.[date]
  const [draft, setDraft] = useState<any>(() => existing ? { ...existing, muscles: (existing.muscles || []).slice() } : { cals: 0, protein: 0, junk: 0, gym: false, muscles: [], cheat: false })
  const f = fmtDate(date)
  const used = cheatsUsed(state, player)
  const wasCheat = existing && existing.cheat
  const cheatLeft = state.C.cheatTotal - used + (wasCheat ? 1 : 0)
  const canCheat = draft.cheat || cheatLeft > 0
  const set = (patch: any) => setDraft((d: any) => ({ ...d, ...patch }))
  const toggleMuscle = (m: string) => set({ muscles: draft.muscles.includes(m) ? draft.muscles.filter((x: string) => x !== m) : [...draft.muscles, m] })
  const goal = goalFor(state.goals, player, date)
  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grab" />
        <div className="sheet-h">
          <div><div className="sheet-title">{f.dow} {f.d} {f.mon}</div></div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="sheet-sub" style={{ color: color === 'blue' ? 'var(--blue-br)' : 'var(--red-br)' }}>● {player} · daily log</div>

        <NumberField label="Calories consumed" sub={'Goal ' + kc(goal) + ' kcal'} value={draft.cals} unit="kcal" step={50}
          accent={draft.cals > goal ? 'var(--warn)' : 'var(--good)'}
          quicks={[{ label: '+100', add: 100 }, { label: '+250', add: 250 }, { label: '+500', add: 500 }, { label: 'CLEAR', set: 0 }]}
          onChange={(v: number) => set({ cals: v })} />
        <NumberField label="Protein" value={draft.protein} unit="g" step={5}
          quicks={[{ label: '+20', add: 20 }, { label: '+40', add: 40 }, { label: 'CLEAR', set: 0 }]} onChange={(v: number) => set({ protein: v })} />
        <NumberField label="Junk calories" sub="McD · crisps · chocolate" value={draft.junk} unit="kcal" step={50}
          accent={draft.junk > 0 ? 'var(--warn)' : undefined}
          quicks={[{ label: 'McD +1200', add: 1200 }, { label: 'BAR +250', add: 250 }, { label: 'CLEAR', set: 0 }]} onChange={(v: number) => set({ junk: v })} />

        <div className="field">
          <div className="toggle-row">
            <div><div className="tg-label">Hit the gym?</div><div className="tg-sub">{draft.gym ? draft.muscles.length + ' MUSCLE GROUPS' : 'REST DAY'}</div></div>
            <Switch on={draft.gym} onClick={() => set({ gym: !draft.gym })} />
          </div>
          {draft.gym && (
            <div className="muscle-grid">
              {MUSCLES.map((m) => <div key={m} className={'mg' + (draft.muscles.includes(m) ? ' on' : '')} onClick={() => toggleMuscle(m)}><span className="mg-l">{m}</span></div>)}
            </div>
          )}
        </div>

        <div className="field">
          <div className="toggle-row" style={!canCheat ? { opacity: 0.5 } : undefined}>
            <div><div className="tg-label" style={{ color: draft.cheat ? 'var(--gold)' : undefined }}>Cheat meal</div><div className="tg-sub">{cheatLeft - (draft.cheat ? 1 : 0)} of {state.C.cheatTotal} remaining{!canCheat ? ' · none left' : ''}</div></div>
            <Switch on={draft.cheat} gold onClick={() => canCheat && set({ cheat: !draft.cheat })} />
          </div>
        </div>

        <button className={'btn-primary ' + color} onClick={() => onSave(date, draft)}>Save day</button>
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
      </div>
    </div>
  )
}
function DayCard({ state, date, onTap }: any) {
  const player = state.selfName
  const d = state.days[player]?.[date]
  const f = fmtDate(date)
  const future = daysBetween(state.C.today, date) > 0
  const today = date === state.C.today
  const goal = goalFor(state.goals, player, date)
  if (!d) {
    return (
      <div className={'day-card empty' + (today ? ' today' : '')} onClick={() => !future && onTap()}>
        <div className="day-top" style={{ marginBottom: 0 }}>
          <div className="day-date">{f.dow} <span className="day-dow">{f.d} {f.mon}</span></div>
          {today ? <span className="badge today-b">Today</span> : <span className="badge rest">Upcoming</span>}
        </div>
        {!future && <div className="day-empty-cta"><Icon name="plus" size={14} /> Log this day</div>}
      </div>
    )
  }
  const over = d.cals > goal
  return (
    <div className={'day-card' + (today ? ' today' : '')} onClick={onTap}>
      <div className="day-top">
        <div className="day-date">{f.dow} <span className="day-dow">{f.d} {f.mon}</span></div>
        <div className="day-badges">
          {d.cheat && <span className="badge cheat"><Icon name="flame" size={11} /> Cheat</span>}
          {d.gym ? <span className="badge gym"><Icon name="dumbbell" size={11} /> Gym</span> : <span className="badge rest">Rest</span>}
        </div>
      </div>
      <div className="day-stats">
        <div className="dstat"><div className="lbl">Calories</div><div className={'dstat-v ' + (over ? 'over' : 'under')}>{kc(d.cals)} <small>/ {kc(goal)}</small></div></div>
        <div className="dstat"><div className="lbl">Protein</div><div className="dstat-v">{d.protein}<small>g</small></div></div>
        <div className="dstat"><div className="lbl">Junk</div><div className="dstat-v">{d.junk ? kc(d.junk) : '0'}<small>kcal</small></div></div>
      </div>
      {d.gym && d.muscles.length > 0 && <div className="muscles">{d.muscles.map((m: string) => <span key={m} className="muscle-chip">{m}</span>)}</div>}
    </div>
  )
}
function DailyScreen({ state, onSetGoal, editDate, setEditDate }: any) {
  const C = state.C
  const player = state.selfName
  const color = state.color[player]
  const goal = currentGoal(state, player)
  const startTs = Date.parse(C.today + 'T00:00:00Z')
  const endTs = Date.parse(weekDates(C, 1)[0] + 'T00:00:00Z')
  const dates: string[] = []
  for (let ts = startTs; ts >= endTs; ts -= MS_DAY) dates.push(new Date(ts).toISOString().slice(0, 10))
  let lastMonth: string | null = null
  return (
    <>
      <div className="day-head">
        <div className="seg"><div className={'seg-opt ' + color + ' on'}><span>●</span> {player}</div></div>
        <div className="goal-inline">
          <div className="goal-inline-l">
            <span className="lbl"><Icon name="target" size={11} style={{ verticalAlign: -1 }} /> Daily goal · from today</span>
            <span className="goal-inline-v" style={{ color: color === 'blue' ? 'var(--blue-br)' : 'var(--red-br)' }}>{kc(goal)}<small> kcal · applies forward</small></span>
          </div>
          <div className="stepper">
            <button className="stp" onClick={() => onSetGoal(Math.max(1000, goal - 50))}><Icon name="minus" size={16} /></button>
            <button className="stp" onClick={() => onSetGoal(goal + 50)}><Icon name="plus" size={16} /></button>
          </div>
        </div>
      </div>
      <div className="scroll feed">
        {dates.map((dt) => {
          const f = fmtDate(dt)
          const showMonth = f.mon !== lastMonth
          lastMonth = f.mon
          return (
            <div key={dt}>
              {showMonth && <div className="month-div"><span>{f.mon} 2026</span><span className="ln" /></div>}
              <DayCard state={state} date={dt} onTap={() => setEditDate(dt)} />
            </div>
          )
        })}
        <div className="feed-foot">◇ Contest start · {fmtDate(weekDates(C, 1)[0]).d} {fmtDate(weekDates(C, 1)[0]).mon} 2026</div>
      </div>
    </>
  )
}

/* ---------- tab bar ---------- */
function TabBar({ route, go }: any) {
  const tabs = [
    { id: 'vs', label: 'Versus', icon: 'vs' },
    { id: 'weeks', label: 'Rounds', icon: 'cal' },
    { id: 'daily', label: 'Log', icon: 'edit' },
  ]
  return (
    <div className="tabbar">
      {tabs.map((t) => (
        <div key={t.id} className={'tab' + (route === t.id ? ' on' : '') + (t.id === 'vs' && route === t.id ? ' vs' : '')} onClick={() => go(t.id)}>
          <Icon name={t.icon} size={22} stroke={route === t.id ? 2.4 : 2} />
          {t.label}
        </div>
      ))}
    </div>
  )
}

/* ---------- app shell + data ---------- */
export default function BetonApp() {
  const router = useRouter()
  const [state, setState] = useState<any>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'nocontest'>('loading')
  const [route, setRoute] = useState('vs')
  const [editDate, setEditDate] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    let alive = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: mine } = await supabase
        .from('contest_participants')
        .select('color, contest:contests(*)')
        .eq('profile_id', user.id).limit(1)
      const contest = (mine?.[0] as any)?.contest
      if (!contest) { if (alive) setStatus('nocontest'); return }
      const { data: roster } = await supabase
        .from('contest_participants').select('color, profile:profiles(id, display_name)').eq('contest_id', contest.id)
      const blue = (roster || []).find((r: any) => r.color === 'blue') as any
      const red = (roster || []).find((r: any) => r.color === 'red') as any
      const blueName = blue?.profile?.display_name || 'Blue'
      const redName = red?.profile?.display_name || 'Awaiting'
      const nameById: any = {}
      ;(roster || []).forEach((r: any) => { nameById[r.profile.id] = r.profile.display_name })
      const { data: logs } = await supabase.from('daily_logs').select('*').eq('contest_id', contest.id)
      const days: any = { [blueName]: {}, [redName]: {} }
      ;(logs || []).forEach((l: any) => {
        const nm = nameById[l.profile_id]; if (!nm || !days[nm]) return
        days[nm][l.log_date] = { cals: l.calories, protein: l.protein_g, junk: l.junk_calories, gym: l.gym, muscles: l.muscles || [], cheat: l.cheat }
      })
      const { data: goalRows } = await supabase.from('calorie_goals').select('*').eq('contest_id', contest.id)
      const goals: any = { [blueName]: [], [redName]: [] }
      ;(goalRows || []).forEach((g: any) => { const nm = nameById[g.profile_id]; if (!nm || !goals[nm]) return; goals[nm].push({ from: g.effective_from, value: g.goal_calories }) })
      ;[blueName, redName].forEach((nm) => { if (!goals[nm].length) goals[nm] = [{ from: contest.start_date, value: contest.default_daily_calorie_goal }]; goals[nm].sort((x: any, y: any) => (x.from < y.from ? -1 : 1)) })
      const today = new Date().toISOString().slice(0, 10)
      const elapsed = Math.max(0, Math.floor((Date.parse(today + 'T00:00:00Z') - Date.parse(contest.start_date + 'T00:00:00Z')) / MS_DAY))
      const currentWeek = Math.min(contest.num_weeks, Math.max(1, Math.floor(elapsed / 7) + 1))
      const C = { weeks: contest.num_weeks, weeklyGym: contest.weekly_gym_target, weeklyCal: contest.weekly_calorie_cap, cheatTotal: contest.cheat_total_allowance, finish: contest.end_date, start: contest.start_date, today, currentWeek, checkins: contest.checkin_weeks || [5, 10, 15], name: contest.name }
      if (!alive) return
      setState({ C, days, goals, players: [blueName, redName], color: { [blueName]: 'blue', [redName]: 'red' }, selfName: nameById[user.id] || blueName, selfId: user.id, contestId: contest.id, theme: 'dark' })
      setStatus('ready')
    })()
    return () => { alive = false }
  }, [])

  async function onSaveDay(date: string, draft: any) {
    const muscles = draft.gym ? draft.muscles : []
    await (supabase.from('daily_logs') as any).upsert({
      contest_id: state.contestId, profile_id: state.selfId, log_date: date,
      calories: draft.cals, protein_g: draft.protein, junk_calories: draft.junk, gym: draft.gym, muscles, cheat: draft.cheat,
    }, { onConflict: 'contest_id,profile_id,log_date' })
    setState((p: any) => {
      const next = { ...p, days: { ...p.days, [p.selfName]: { ...p.days[p.selfName] } } }
      next.days[p.selfName][date] = { cals: draft.cals, protein: draft.protein, junk: draft.junk, gym: draft.gym, muscles, cheat: draft.cheat }
      return next
    })
    setEditDate(null)
  }
  async function onSetGoal(value: number) {
    await (supabase.from('calorie_goals') as any).upsert({
      contest_id: state.contestId, profile_id: state.selfId, effective_from: state.C.today, goal_calories: value,
    }, { onConflict: 'contest_id,profile_id,effective_from' })
    setState((p: any) => {
      const list = (p.goals[p.selfName] || []).filter((g: any) => g.from !== p.C.today)
      list.push({ from: p.C.today, value }); list.sort((a: any, b: any) => (a.from < b.from ? -1 : 1))
      return { ...p, goals: { ...p.goals, [p.selfName]: list } }
    })
  }
  async function logout() { await supabase.auth.signOut(); router.push('/login') }
  const toggleTheme = () => setState((p: any) => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' }))

  if (status === 'loading') {
    return <div data-theme="dark" style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: 'var(--bg)', color: 'var(--txt3)', fontFamily: 'var(--fontMono)' }}>Loading…</div>
  }
  if (status === 'nocontest') {
    return (
      <div data-theme="dark" style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: 'var(--bg)', color: 'var(--txt)', fontFamily: 'var(--fontMono)', padding: 24, textAlign: 'center' }}>
        <div>
          <div className="brand" style={{ marginBottom: 12 }}>BE<span className="t">T</span>ON</div>
          <p style={{ color: 'var(--txt2)' }}>You&apos;re not in a contest yet. You&apos;ll appear here the moment someone challenges you.</p>
          <button className="btn" style={{ marginTop: 14 }} onClick={logout}>Log out</button>
        </div>
      </div>
    )
  }

  const dark = state.theme === 'dark'
  const abbr = state.players.map((n: string) => (n || '?').slice(0, 3).toUpperCase()).join('·')
  const go = (r: string) => setRoute(r)

  return (
    <div className="app" data-theme={state.theme} style={{ minHeight: '100dvh' }}>
      <div className="top">
        <div className="wordmark">
          <span className="be">BE</span><span className="flick-t">T</span><span className="ton">ON</span>
          <span className="dot">&nbsp;/ {abbr}</span>
        </div>
        <div className="top-actions">
          <button className="icon-btn" onClick={toggleTheme} aria-label="theme"><Icon name={dark ? 'moon' : 'sun'} size={18} /></button>
          <button className="icon-btn" onClick={logout} aria-label="log out"><Icon name="logout" size={18} /></button>
        </div>
      </div>

      {route === 'vs' && <VSScreen state={state} go={go} />}
      {route === 'weeks' && <WeeksScreen state={state} />}
      {route === 'daily' && <DailyScreen state={state} onSetGoal={onSetGoal} editDate={editDate} setEditDate={setEditDate} />}

      <TabBar route={route} go={go} />

      {editDate && <EditSheet key={editDate} state={state} date={editDate} onSave={onSaveDay} onClose={() => setEditDate(null)} />}
    </div>
  )
}
