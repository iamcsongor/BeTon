/* ============================================================
   BeTon — shared components, icons, scaling stage
   ============================================================ */

const { useState, useEffect, useRef } = React;

/* ---------- icon set (simple geometric line icons) ---------- */
function Icon({ name, size = 20, stroke = 2 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    vs: <><path d="M5 4l5 8-5 8" /><path d="M19 4l-5 8 5 8" /></>,
    cal: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" /></>,
    moon: <path d="M20 14.5A8 8 0 119.5 4 6.5 6.5 0 0020 14.5z" />,
    check: <path d="M5 12l5 5L20 6" />,
    x: <path d="M6 6l12 12M18 6L6 18" />,
    chev: <path d="M9 6l6 6-6 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    minus: <path d="M5 12h14" />,
    dumbbell: <><path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12" /></>,
    flame: <path d="M12 3c1 4 4 5 4 9a4 4 0 11-8 0c0-2 1-3 2-4 0 1 1 2 2 2 0-3-2-4-2-7z" />,
    star: <path d="M12 3l2.5 6 6.5.5-5 4.2L17.5 21 12 17.3 6.5 21 8 13.7l-5-4.2 6.5-.5z" />,
    bolt: <path d="M13 2L4 14h6l-1 8 9-12h-6z" />,
    trophy: <><path d="M7 4h10v5a5 5 0 01-10 0V4z" /><path d="M7 6H4v1a3 3 0 003 3M17 6h3v1a3 3 0 01-3 3M9 19h6M12 14v5" /></>,
    edit: <><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="M14 6l4 4" /></>,
    target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /></>,
    sliders: <><path d="M4 7h9M19 7h1M4 17h1M11 17h9" /><circle cx="16" cy="7" r="2.3" /><circle cx="8" cy="17" r="2.3" /></>,
    logout: <><path d="M14 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3" /><path d="M9 12h11M16 8l4 4-4 4" /></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.8" /><path d="M21 15l-5-4L5 20" /></>,
    bell: <><path d="M6 9a6 6 0 1112 0c0 4.5 2 5.5 2 5.5H4S6 13.5 6 9z" /><path d="M10 20a2 2 0 004 0" /></>,
    camera: <><rect x="3" y="7" width="18" height="13" rx="2.5" /><path d="M8.5 7L10 4.5h4L15.5 7" /><circle cx="12" cy="13.5" r="3.2" /></>,
    userplus: <><circle cx="9" cy="8" r="3.6" /><path d="M3 20c0-3.6 2.7-5.5 6-5.5 1.2 0 2.3.25 3.2.7" /><path d="M18 8v6M15 11h6" /></>,
    login: <><path d="M10 4H7a2 2 0 00-2 2v12a2 2 0 002 2h3" /><path d="M9 12h11M16 8l4 4-4 4" /></>,
  };
  return <svg {...p}>{paths[name]}</svg>;
}

/* ---------- scaling stage: fit fixed device into viewport ---------- */
function Stage({ children, w, h }) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () => {
      const pad = 24;
      const s = Math.min((window.innerWidth - pad) / w, (window.innerHeight - pad) / h);
      setScale(Math.min(s, 1.1));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [w, h]);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(120% 120% at 50% 0%, #15171f, #0a0b0f 80%)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'center center', flexShrink: 0 }}>
        {children}
      </div>
    </div>
  );
}

/* ---------- small atoms ---------- */
function SecLabel({ children, right }) {
  return (
    <div className="sec-label">
      <span className="lbl">{children}</span>
      <span className="ln" />
      {right}
    </div>
  );
}

function Switch({ on, gold, onClick }) {
  return (
    <div className={'switch' + (on ? ' on' : '') + (gold ? ' gold' : '')} onClick={onClick}>
      <div className="knob" />
    </div>
  );
}

function ProgressBar({ value, max, variant, tick, mirror }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const tickPct = tick != null ? Math.min(100, (tick / max) * 100) : null;
  return (
    <div className={'bar' + (mirror ? ' bar-mirror' : '')}>
      <div
        className={'bar-fill ' + variant + (mirror ? ' mirror' : '')}
        style={mirror ? { width: pct + '%', marginLeft: 'auto' } : { width: pct + '%' }}
      />
      {tickPct != null && (
        <div
          className="bar-tick"
          title="Target pace — calories you should be at for days logged this week"
          style={mirror ? { right: tickPct + '%' } : { left: tickPct + '%' }}
        />
      )}
    </div>
  );
}

function kc(n) { return n.toLocaleString('en-US'); }

Object.assign(window, { Icon, Stage, SecLabel, Switch, ProgressBar, kc });
