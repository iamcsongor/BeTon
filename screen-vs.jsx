/* ============================================================
   BeTon — VS / versus screen (hero)
   ============================================================ */

function paceState(cals, loggedDays) {
  if (loggedDays === 0) return { cls: 'good', txt: 'NO DATA' };
  const expected = CONTEST.weeklyCal * (loggedDays / 7);
  return cals <= expected ? { cls: 'good', txt: 'ON PACE' } : { cls: 'warn', txt: 'OVER PACE' };
}

function caloriePacePct(cals, loggedDays) {
  if (loggedDays === 0) return null;
  const expected = CONTEST.weeklyCal * (loggedDays / 7);
  return Math.round((cals / expected) * 100);
}

function TWColumn({ side, name, sum, color }) {
  const pace = paceState(sum.cals, sum.logged);
  const pacePct = caloriePacePct(sum.cals, sum.logged);
  const mirror = side === 'r';
  const expected = CONTEST.weeklyCal * sum.logged / 7;
  const dots = Array.from({ length: CONTEST.weeklyGym }, (_, i) => i < sum.gym);
  return (
    <div className={'tw-col ' + side}>
      <div className="tw-name">
        {side === 'r' && <><span>{name}</span><span className={'dot-' + color}>●</span></>}
        {side === 'l' && <><span className={'dot-' + color}>●</span><span>{name}</span></>}
      </div>
      <div className="tw-metric">
        <div className="lbl">Gym · {sum.gym}/{CONTEST.weeklyGym}</div>
        <div className="dots">
          {dots.map((on, i) => <div key={i} className={'gdot ' + color + (on ? ' on' : '')} />)}
        </div>
      </div>
      <div className="tw-metric">
        <div className="lbl">Calories · tick = target pace</div>
        <div className="tw-val">{kc(sum.cals)} <small>/ {kc(CONTEST.weeklyCal)}</small></div>
        <ProgressBar value={sum.cals} max={CONTEST.weeklyCal} variant={color} tick={expected} mirror={mirror} />
      </div>
      <div className="tw-metric">
        <div className="lbl">Pacing</div>
        <div className={'tw-val' + (pacePct != null && pacePct > 100 ? ' pace-over' : '')}>
          {pacePct != null ? <>{pacePct}<small>% of target</small></> : <>—<small> no days logged</small></>}
        </div>
      </div>
      <span className={'pace ' + pace.cls}>{pace.txt}</span>
    </div>
  );
}

function VSScreen({ state, go }) {
  const s = series(state);
  const lead = s.Csongor === s.Peter ? null : (s.Csongor > s.Peter ? 'Csongor' : 'Peter');
  const cW = state, ph = CONTEST; // alias
  const cwSum = weekSummary(state, 'Csongor', CONTEST.currentWeek);
  const pSum = weekSummary(state, 'Peter', CONTEST.currentWeek);

  const cheatC = cheatsUsed(state, 'Csongor');
  const cheatP = cheatsUsed(state, 'Peter');

  // next check-in: every 3rd week (3, 6, 9, 12, 15)
  const checkins = [3, 6, 9, 12, 15];
  const nextCi = checkins.find(c => c >= CONTEST.currentWeek) || checkins[checkins.length - 1];
  const ciDates = weekDates(nextCi);
  const ciEnd = fmtDate(ciDates[6]);

  // contest completion %
  const dLeft = daysLeft(state);
  const totalDays = daysBetween(weekDates(1)[0], CONTEST.finish);
  const pctDone = Math.round(((totalDays - dLeft) / totalDays) * 100);

  return (
    <div className="scroll">
      <div className="meta-strip">
        <span>WK <b>{String(CONTEST.currentWeek).padStart(2, '0')}</b>/{CONTEST.weeks}</span>
        <span className="meta-sep" />
        <span><b>{dLeft}</b> DAYS LEFT</span>
        <span className="meta-sep" />
        <span>FINISH <b>SEP 26</b></span>
      </div>

      {/* CONTEST PROGRESS */}
      <div className="cprog">
        <div className="cprog-top">
          <span>Contest progress</span>
          <span className="cprog-pct">{pctDone}%<span className="cprog-pct-l"> complete</span></span>
        </div>
        <div className="cprog-bar">
          <div className="cprog-track"><div className="cprog-fill" style={{ width: pctDone + '%' }} /></div>
          {checkins.map((w, i) => (
            <div key={w} className={'cprog-tick' + (w < CONTEST.currentWeek ? ' done' : '') + (i === checkins.length - 1 ? ' end' : '')}
              style={{ left: 'calc(' + (w / CONTEST.weeks * 100) + '% - 1px)' }} />
          ))}
          <div className="cprog-now" style={{ left: 'calc(' + pctDone + '% - 1px)' }} />
        </div>
      </div>

      {/* HERO */}
      <div className="hero">
        <div className="hero-half hero-blue" />
        <div className="hero-half hero-red" />
        <div className="hero-scan" />
        <div className="hero-seam" />
        <div className="corner left">
          <div className="corner-tag">BLUE CORNER</div>
          <div className="corner-name">CSONGOR</div>
          <div className="corner-spacer" />
          <div className="corner-won">{s.Csongor}</div>
          <div className="corner-won-lbl">ROUNDS WON</div>
          {lead === 'Csongor' && <span className="corner-lead"><Icon name="trophy" size={10} /> LEADS</span>}
        </div>
        <div className="corner right">
          <div className="corner-tag">RED CORNER</div>
          <div className="corner-name">PETER</div>
          <div className="corner-spacer" />
          <div className="corner-won">{s.Peter}</div>
          <div className="corner-won-lbl">ROUNDS WON</div>
          {lead === 'Peter' && <span className="corner-lead"><Icon name="trophy" size={10} /> LEADS</span>}
        </div>
        <div className="vs-badge">VS</div>
        <div className="vs-score">{lead ? (lead.toUpperCase() + ' AHEAD') : 'DEAD HEAT'}</div>
      </div>

      {/* CHECK-IN BANNER */}
      <div className="checkin-banner">
        <span className="ci-ic"><Icon name="star" size={20} /></span>
        <div style={{ flex: 1 }}>
          <div className="ci-t">CHECK-IN #{checkins.indexOf(nextCi) + 1} · WK {String(nextCi).padStart(2, '0')}</div>
          <div className="ci-s">Photos + progress review · week ending {ciEnd.dow} {ciEnd.d} {ciEnd.mon}</div>
        </div>
      </div>

      {/* THIS WEEK LIVE */}
      <SecLabel right={<span className="lbl" style={{ color: 'var(--gold)' }}>● LIVE</span>}>This week · Round {String(CONTEST.currentWeek).padStart(2, '0')}</SecLabel>
      <div className="panel">
        <div className="tw">
          <TWColumn side="l" name="CSONGOR" sum={cwSum} color="blue" />
          <div className="tw-div" />
          <TWColumn side="r" name="PETER" sum={pSum} color="red" />
        </div>
      </div>

      {/* ROUND BY ROUND — comparison ladder */}
      <SecLabel right={<span className="lbl">latest first</span>}>Round by round</SecLabel>
      <ComparisonLadder state={state} go={go} />

      {/* CHEAT MEALS */}
      <SecLabel right={<span className="lbl">{CONTEST.cheatTotal} max each</span>}>Cheat meals</SecLabel>
      <div className="panel">
        <div className="panel-b" style={{ paddingTop: 6, paddingBottom: 8 }}>
          {[['CSONGOR', 'blue', cheatC], ['PETER', 'red', cheatP]].map(([nm, col, used]) => (
            <div className="cheat-row" key={nm}>
              <span className="cheat-name" style={{ color: col === 'blue' ? 'var(--blue-br)' : 'var(--red-br)' }}>{nm}</span>
              <div className="tokens">
                {Array.from({ length: CONTEST.cheatTotal }, (_, i) => (
                  <div key={i} className={'token ' + col + (i < used ? ' used' : '')} />
                ))}
              </div>
              <span className="cheat-left">{CONTEST.cheatTotal - used} left</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function anchorStyle(side, start, w) {
  return side === 'l' ? { right: start + '%', width: w + '%' } : { left: start + '%', width: w + '%' };
}

function LadderSide({ side, sum, color, live, max, budgetPct }) {
  const over = sum.complete && sum.cals > CONTEST.weeklyCal;
  const underW = (Math.min(sum.cals, CONTEST.weeklyCal) / max) * 100;
  const overW = over ? ((sum.cals - CONTEST.weeklyCal) / max) * 100 : 0;
  const gym = Array.from({ length: CONTEST.weeklyGym }, (_, i) => i < sum.gym);
  return (
    <div className={'lside ' + side}>
      <div className="lcal">
        <div className={'lcal-top' + (over ? ' over' : '')}>
          <b>{kc(sum.cals)}</b><small>/14k{live ? ' · live' : ''}</small>
        </div>
        <div className={'lcal-track' + (live ? ' partial' : '')}>
          <div className={'lcal-fill ' + color} style={anchorStyle(side, 0, underW)} />
          {over && <div className="lcal-fill over" style={anchorStyle(side, underW, overW)} />}
          <div className="lcal-tick" style={side === 'l' ? { right: budgetPct + '%' } : { left: budgetPct + '%' }} />
        </div>
      </div>
      <div className="lmeta">
        <div className="lgym">
          {gym.map((on, i) => <div key={i} className={'lgbox ' + color + (on ? ' on' : '')} />)}
        </div>
        <span className={'lgym-n' + (sum.gymHit ? ' hit' : '')}>{sum.gym}/4</span>
        <div className="lcheat">
          {sum.cheats > 0
            ? Array.from({ length: sum.cheats }, (_, i) => <Icon key={i} name="flame" size={12} />)
            : <span className="lc-none">—</span>}
        </div>
      </div>
    </div>
  );
}

function ComparisonLadder({ state, go }) {
  const MAXCAL = CONTEST.weeklyCal * 1.1;
  const budgetPct = (CONTEST.weeklyCal / MAXCAL) * 100;
  const weeks = [];
  for (let w = CONTEST.currentWeek; w >= 1; w--) weeks.push(w);

  return (
    <div className="ladder">
      <div className="lhead">
        <div className="lh-name l"><span className="dot-blue">●</span> CSONGOR</div>
        <div className="lh-c"><span className="lbl">WK</span></div>
        <div className="lh-name r">PETER <span className="dot-red">●</span></div>
      </div>

      {weeks.map(w => {
        const live = w === CONTEST.currentWeek;
        const sumC = weekSummary(state, 'Csongor', w);
        const sumP = weekSummary(state, 'Peter', w);
        const res = live ? null : weekResult(state, w);
        const winner = res ? res.winner : null;
        const flag = live ? { cls: 'live', ch: '●' }
          : winner === 'Csongor' ? { cls: 'blue', ch: '◀' }
            : winner === 'Peter' ? { cls: 'red', ch: '▶' }
              : { cls: 'tie', ch: '=' };
        const wd = fmtDate(weekDates(w)[0]);
        return (
          <div key={w} className={'lrow' + (live ? ' live' : '')} onClick={() => go('weeks')}>
            <LadderSide side="l" sum={sumC} color="blue" live={live} max={MAXCAL} budgetPct={budgetPct} />
            <div className="lspine">
              <div className="lwk">{String(w).padStart(2, '0')}</div>
              <div className={'lflag ' + flag.cls}>{flag.ch}</div>
              <div className="lwk-date">{wd.d} {wd.mon}</div>
            </div>
            <LadderSide side="r" sum={sumP} color="red" live={live} max={MAXCAL} budgetPct={budgetPct} />
          </div>
        );
      })}

      <div className="ladder-legend">
        <span><i className="lg-bar" /> kcal vs 14k · tick = budget</span>
        <span><i className="lg-box" /> gym /4</span>
        <span style={{ color: 'var(--gold)' }}><Icon name="flame" size={10} /> cheat</span>
      </div>
      <div className="ladder-foot">+{CONTEST.weeks - CONTEST.currentWeek} rounds to come · finish Sep 26</div>
    </div>
  );
}

Object.assign(window, { VSScreen });