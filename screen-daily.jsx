/* ============================================================
   BeTon — Daily player view + edit sheet
   ============================================================ */

function isFuture(date) { return daysBetween(CONTEST.today, date) > 0; }
function isToday(date) { return date === CONTEST.today; }

/* ---------- number field with stepper + quick adds ---------- */
function NumberField({ label, sub, value, unit, step, quicks, onChange, accent }) {
  return (
    <div className="field">
      <div className="field-h">
        <span className="lbl">{label}</span>
        {sub && <span className="lbl-r">{sub}</span>}
      </div>
      <div className="num-edit">
        <button className="stp" onClick={() => onChange(Math.max(0, value - step))}><Icon name="minus" size={16} /></button>
        <div className="num-big" style={accent ? { color: accent } : null}>{kc(value)} <small>{unit}</small></div>
        <button className="stp" onClick={() => onChange(value + step)}><Icon name="plus" size={16} /></button>
      </div>
      {quicks && (
        <div className="quick-row">
          {quicks.map((q, i) => (
            <button key={i} className="quick" onClick={() => onChange(q.set != null ? q.set : value + q.add)}>{q.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function EditSheet({ state, setState, player, date, onClose }) {
  const color = COLOR[player];
  const existing = state.days[player][date];
  const [draft, setDraft] = useState(() => existing
    ? { ...existing, muscles: existing.muscles.slice() }
    : { cals: 0, coffees: 0, gym: false, muscles: [], cheat: false });
  const f = fmtDate(date);

  const used = cheatsUsed(state, player);
  const wasCheat = existing && existing.cheat;
  const cheatLeft = CONTEST.cheatTotal - used + (wasCheat ? 1 : 0);
  const canCheat = draft.cheat || cheatLeft > 0;

  const set = (patch) => setDraft(d => ({ ...d, ...patch }));
  const toggleMuscle = (m) => set({ muscles: draft.muscles.includes(m) ? draft.muscles.filter(x => x !== m) : [...draft.muscles, m] });

  const save = () => {
    setState(prev => {
      const next = { ...prev, days: { ...prev.days, [player]: { ...prev.days[player] } } };
      next.days[player][date] = {
        cals: draft.cals, coffees: draft.coffees || 0,
        gym: draft.gym, muscles: draft.gym ? draft.muscles : [],
        cheat: draft.cheat, cheatNo: draft.cheat ? (existing && existing.cheatNo) || (used + 1) : null,
      };
      return next;
    });
    onClose();
  };

  const goal = goalFor(state.goals, player, date);

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-grab" />
        <div className="sheet-h">
          <div>
            <div className="sheet-title">{f.dow} {f.d} {f.mon}</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="sheet-sub" style={{ color: color === 'blue' ? 'var(--blue-br)' : 'var(--red-br)' }}>● {player} · daily log</div>

        <NumberField label="Calories consumed" sub={'Goal ' + kc(goal) + ' kcal'} value={draft.cals} unit="kcal" step={50}
          accent={draft.cals > goal ? 'var(--warn)' : 'var(--good)'}
          quicks={[{ label: '+100', add: 100 }, { label: '+250', add: 250 }, { label: '+500', add: 500 }, { label: 'CLEAR', set: 0 }]}
          onChange={v => set({ cals: v })} />

        <NumberField label="Coffees" sub="Target 3/day · 15/week" value={draft.coffees || 0} unit="" step={1}
          accent={draft.coffees > 3 ? 'var(--warn)' : null}
          quicks={[{ label: '+1', add: 1 }, { label: '+2', add: 2 }, { label: 'CLEAR', set: 0 }]}
          onChange={v => set({ coffees: v })} />

        {/* GYM */}
        <div className="field">
          <div className="toggle-row">
            <div>
              <div className="tg-label">Hit the gym?</div>
              <div className="tg-sub">{draft.gym ? draft.muscles.length + ' MUSCLE GROUPS' : 'REST DAY'}</div>
            </div>
            <Switch on={draft.gym} onClick={() => set({ gym: !draft.gym })} />
          </div>
          {draft.gym && (
            <div className="muscle-grid">
              {MUSCLES.map(m => (
                <div key={m} className={'mg' + (draft.muscles.includes(m) ? ' on' : '')} onClick={() => toggleMuscle(m)}>
                  <span className="mg-l">{m}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CHEAT */}
        <div className="field">
          <div className="toggle-row" style={!canCheat ? { opacity: 0.5 } : null}>
            <div>
              <div className="tg-label" style={{ color: draft.cheat ? 'var(--gold)' : null }}>Cheat meal</div>
              <div className="tg-sub">{cheatLeft - (draft.cheat ? 1 : 0)} of {CONTEST.cheatTotal} remaining{!canCheat ? ' · none left' : ''}</div>
            </div>
            <Switch on={draft.cheat} gold onClick={() => canCheat && set({ cheat: !draft.cheat })} />
          </div>
        </div>

        <button className={'btn-primary ' + color} onClick={save}>Save day</button>
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

function DayCard({ state, player, date, onTap }) {
  const d = state.days[player][date];
  const f = fmtDate(date);
  const future = isFuture(date);
  const today = isToday(date);
  const goal = goalFor(state.goals, player, date);

  if (!d) {
    return (
      <div className={'day-card empty' + (today ? ' today' : '')} onClick={() => !future && onTap()}>
        <div className="day-top" style={{ marginBottom: 0 }}>
          <div className="day-date">{f.dow} <span className="day-dow">{f.d} {f.mon}</span></div>
          {today ? <span className="badge today-b">Today</span> : <span className="badge rest">Upcoming</span>}
        </div>
        {!future && <div className="day-empty-cta"><Icon name="plus" size={14} /> Log this day</div>}
      </div>
    );
  }

  const over = d.cals > goal;
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
        <div className="dstat">
          <div className="lbl">Calories</div>
          <div className={'dstat-v ' + (over ? 'over' : 'under')}>{kc(d.cals)} <small>/ {kc(goal)}</small></div>
        </div>
        <div className="dstat">
          <div className="lbl">Coffees</div>
          <div className={'dstat-v' + ((d.coffees || 0) > 3 ? ' over' : '')}>{d.coffees || 0}<small>/ 3</small></div>
        </div>
      </div>
      {d.gym && d.muscles.length > 0 && (
        <div className="muscles">
          {d.muscles.map(m => <span key={m} className="muscle-chip">{m}</span>)}
        </div>
      )}
    </div>
  );
}

function DailyScreen({ state, setState, player, setPlayer }) {
  const [editDate, setEditDate] = useState(null);
  const color = COLOR[player];
  const goal = currentGoal(state.goals, player);
  const scrollRef = useRef(null);
  const todayRef = useRef(null);

  const setGoal = (delta) => setState(prev => ({ ...prev, goals: setGoalFrom(prev.goals, player, currentGoal(prev.goals, player) + delta) }));

  // continuous descending feed: today at top, then full history to contest start
  const MS = 86400000;
  const startTs = Date.parse(CONTEST.today + 'T00:00:00Z');
  const endTs = Date.parse(weekDates(1)[0] + 'T00:00:00Z');
  const dates = [];
  for (let ts = startTs; ts >= endTs; ts -= MS) dates.push(new Date(ts).toISOString().slice(0, 10));

  // keep today (top of list) in view when switching player
  useEffect(() => {
    const sc = scrollRef.current;
    if (sc) sc.scrollTop = 0;
  }, [player]);

  let lastMonth = null;

  return (
    <React.Fragment>
      <div className="day-head">
        <div className="seg">
          {PLAYERS.map(p => (
            <div key={p} className={'seg-opt ' + COLOR[p] + (player === p ? ' on' : '')} onClick={() => setPlayer(p)}>
              <span>●</span> {p}
            </div>
          ))}
        </div>
        <div className="goal-inline">
          <div className="goal-inline-l">
            <span className="lbl"><Icon name="target" size={11} style={{ verticalAlign: -1 }} /> Daily goal · from today</span>
            <span className="goal-inline-v" style={{ color: color === 'blue' ? 'var(--blue-br)' : 'var(--red-br)' }}>{kc(goal)}<small> kcal · applies forward</small></span>
          </div>
          <div className="stepper">
            <button className="stp" onClick={() => setGoal(-50)}><Icon name="minus" size={16} /></button>
            <button className="stp" onClick={() => setGoal(50)}><Icon name="plus" size={16} /></button>
          </div>
        </div>
      </div>

      <div className="scroll feed" ref={scrollRef}>
        {dates.map(dt => {
          const f = fmtDate(dt);
          const showMonth = f.mon !== lastMonth;
          lastMonth = f.mon;
          const today = isToday(dt);
          return (
            <React.Fragment key={dt}>
              {showMonth && (
                <div className="month-div"><span>{f.mon} 2026</span><span className="ln" /></div>
              )}
              <div ref={today ? todayRef : null}>
                <DayCard state={state} player={player} date={dt} onTap={() => setEditDate(dt)} />
              </div>
            </React.Fragment>
          );
        })}
        <div className="feed-foot">◇ Contest start · 15 Jun 2026</div>
      </div>

      {editDate && <EditSheet key={player + editDate} state={state} setState={setState} player={player} date={editDate} onClose={() => setEditDate(null)} />}
    </React.Fragment>
  );
}

Object.assign(window, { DailyScreen });
