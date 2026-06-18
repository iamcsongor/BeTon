/* ============================================================
   BeTon — Weekly ladder / 15 rounds overview
   ============================================================ */

function Pip({ label, state }) {
  // state: 'hit' | 'miss' | 'pending'
  return (
    <div className={'pip ' + (state === 'hit' ? 'hit' : state === 'miss' ? 'miss' : '')}>
      <span className="dotp" />{label}
    </div>
  );
}

function WeekDetail({ sum, color }) {
  const cell = (lbl, val, sub) => (
    <div>
      <div className="lbl" style={{ fontSize: 8.5 }}>{lbl}</div>
      <div className="num" style={{ fontWeight: 700, fontSize: 14, marginTop: 2 }}>{val}{sub && <span style={{ fontSize: 9, color: 'var(--txt3)' }}> {sub}</span>}</div>
    </div>
  );
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, padding: '4px 2px 2px' }}>
      {cell('CALS', kc(sum.cals), '')}
      {cell('GYM', sum.gym + '/' + CONTEST.weeklyGym, '')}
      {cell('AVG PRO', sum.avgProtein, 'g')}
      {cell('CHEATS', sum.cheats, '')}
    </div>
  );
}

function WeeksScreen({ state, go }) {
  const s = series(state);
  const [open, setOpen] = useState(null);

  const rows = [];
  for (let w = 1; w <= CONTEST.weeks; w++) {
    const future = w > CONTEST.currentWeek;
    const live = w === CONTEST.currentWeek;
    const r = future ? null : weekResult(state, w);
    const dates = weekDates(w);
    const a = fmtDate(dates[0]), b = fmtDate(dates[6]);
    const isCheckin = [3, 6, 9, 12, 15].includes(w);

    const pipState = (sum, kind) => {
      if (future) return 'pending';
      if (kind === 'gym') return sum.gymHit ? 'hit' : (sum.complete ? 'miss' : 'pending');
      return sum.complete ? (sum.calHit ? 'hit' : 'miss') : 'pending';
    };

    rows.push(
      <div key={w}>
        <div className={'wk-row' + (live ? ' live' : '') + (future ? ' future' : '')} onClick={() => !future && setOpen(open === w ? null : w)}>
          <div className="wk-no">{String(w).padStart(2, '0')}
            <small>{a.d} {a.mon}–{b.d} {b.mon}</small>
          </div>
          <div className="wk-side blue">
            <div className="wk-pips">
              <Pip label="G" state={r ? pipState(r.c, 'gym') : 'pending'} />
              <Pip label="C" state={r ? pipState(r.c, 'cal') : 'pending'} />
            </div>
            <div className="wk-pts blue">{future ? '–' : (live ? 'LIVE' : r.c.pts + 'pt')}</div>
          </div>
          <div className="wk-side red">
            <div className="wk-pips">
              <Pip label="C" state={r ? pipState(r.p, 'cal') : 'pending'} />
              <Pip label="G" state={r ? pipState(r.p, 'gym') : 'pending'} />
            </div>
            <div className="wk-pts red">{future ? '–' : (live ? 'LIVE' : r.p.pts + 'pt')}</div>
          </div>
          <div className={'wk-flag ' + (future || live ? 'tie' : (r.winner === 'Csongor' ? 'blue' : r.winner === 'Peter' ? 'red' : 'tie'))}>
            {future ? <span style={{ color: 'var(--txt3)' }}>{isCheckin ? '★' : '·'}</span>
              : live ? <Icon name="bolt" size={13} />
                : r.winner === 'Csongor' ? '◀' : r.winner === 'Peter' ? '▶' : '='}
          </div>
        </div>
        {open === w && r && (
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderTop: 'none', borderRadius: '0 0 13px 13px', margin: '-9px 0 7px', padding: '12px 13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span className="lbl" style={{ color: 'var(--blue-br)' }}>● Csongor</span>
            </div>
            <WeekDetail sum={r.c} color="blue" />
            <div style={{ height: 1, background: 'var(--line)', margin: '10px 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span className="lbl" style={{ color: 'var(--red-br)' }}>● Peter</span>
            </div>
            <WeekDetail sum={r.p} color="red" />
            {isCheckin && <div style={{ marginTop: 10, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="star" size={12} /> Check-in week · photos + review</div>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="scroll">
      <div className="meta-strip" style={{ paddingTop: 4 }}>
        <span>SERIES</span>
        <span className="meta-sep" />
        <span style={{ color: 'var(--blue-br)' }}><b style={{ color: 'var(--blue-br)' }}>CSO {s.Csongor}</b></span>
        <span>–</span>
        <span style={{ color: 'var(--red-br)' }}><b style={{ color: 'var(--red-br)' }}>{s.Peter} PET</b></span>
        <span className="meta-sep" />
        <span><b>{CONTEST.currentWeek - 1}</b> ROUNDS DECIDED</span>
      </div>

      <div className="wk-legend">
        <div className="li"><span className="dotp" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--good)', display: 'inline-block' }} /> Target hit</div>
        <div className="li"><span className="dotp" style={{ width: 8, height: 8, borderRadius: '50%', border: '1px solid var(--warn)', display: 'inline-block' }} /> Missed</div>
        <div className="li"><b style={{ fontFamily: 'var(--fontTech)' }}>G</b> Gym ≥4 &nbsp; <b style={{ fontFamily: 'var(--fontTech)' }}>C</b> ≤14k kcal</div>
        <div className="li"><span style={{ color: 'var(--gold)' }}>★</span> Check-in</div>
      </div>

      {rows}

      <div style={{ textAlign: 'center', color: 'var(--txt3)', fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 8 }}>Tap a round for the breakdown</div>
    </div>
  );
}

Object.assign(window, { WeeksScreen });
