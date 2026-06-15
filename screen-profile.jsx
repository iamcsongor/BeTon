/* ============================================================
   BeTon — Profile / account sheet
   ============================================================ */

const HERO_OPTS = [
  { id: 'photo', label: 'Photo' },
  { id: 'blue', label: 'Blue' },
  { id: 'red', label: 'Red' },
  { id: 'octa', label: 'Cage' },
];

function ProfileRow({ icon, label, sub, right, onClick, danger, accent }) {
  return (
    <div className={'prow' + (danger ? ' danger' : '')} onClick={onClick}>
      <span className="prow-ic" style={accent ? { color: accent } : null}><Icon name={icon} size={18} /></span>
      <div className="prow-t">
        <div className="prow-l">{label}</div>
        {sub && <div className="prow-s">{sub}</div>}
      </div>
      <span className="prow-r">{right != null ? right : <Icon name="chev" size={16} />}</span>
    </div>
  );
}

function ProfileSheet({ player, setPlayer, theme, toggleTheme, onClose }) {
  const [loggedIn, setLoggedIn] = useState(true);
  const [hero, setHero] = useState('blue');
  const [notif, setNotif] = useState(true);
  const color = COLOR[player];
  const accent = color === 'blue' ? 'var(--blue-br)' : 'var(--red-br)';

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-grab" />
        <div className="sheet-h">
          <div className="sheet-title">Profile</div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>

        {/* HERO + AVATAR */}
        <div className="phero">
          <div className="phero-bg">
            {hero === 'photo'
              ? <image-slot id="beton-hero" placeholder="Drop a hero photo" radius="16" style={{ width: '100%', height: '100%', display: 'block' }} />
              : <div className={'phero-fill ' + hero} />}
          </div>
          {hero !== 'photo' && <div className="phero-grain" />}
          <div className="pavatar" style={{ borderColor: accent }}>
            <image-slot id={'beton-avatar-' + player} shape="circle" placeholder="Photo" style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>
        </div>
        <div className="pident">
          <div className="pname">{player}</div>
          <div className="phandle" style={{ color: accent }}>● {color === 'blue' ? 'Blue corner' : 'Red corner'} · @{player.toLowerCase()}</div>
        </div>

        {/* HERO OPTIONS */}
        <div className="psec-l">Hero photo</div>
        <div className="hero-opts">
          {HERO_OPTS.map(o => (
            <div key={o.id} className={'hopt' + (hero === o.id ? ' on' : '')} onClick={() => setHero(o.id)}>
              <div className={'hopt-sw ' + o.id}>{o.id === 'photo' && <Icon name="camera" size={15} />}</div>
              <span>{o.label}</span>
            </div>
          ))}
        </div>

        {/* PROFILES */}
        <div className="psec-l">Profiles</div>
        <div className="plist">
          {PLAYERS.map(p => (
            <ProfileRow key={p} icon="user" label={p}
              sub={COLOR[p] === 'blue' ? 'Blue corner' : 'Red corner'}
              accent={COLOR[p] === 'blue' ? 'var(--blue-br)' : 'var(--red-br)'}
              right={player === p ? <span className="prow-check" style={{ color: COLOR[p] === 'blue' ? 'var(--blue-br)' : 'var(--red-br)' }}><Icon name="check" size={17} /></span> : <span className="prow-switch">Switch</span>}
              onClick={() => setPlayer(p)} />
          ))}
          <ProfileRow icon="userplus" label="Create new profile" sub="Add a contestant" onClick={() => {}} />
        </div>

        {/* SETTINGS */}
        <div className="psec-l">Settings</div>
        <div className="plist">
          <ProfileRow icon="image" label="Add profile photo" sub="Drag onto the avatar above" right={<Icon name="camera" size={16} />} onClick={() => {}} />
          <ProfileRow icon="bell" label="Reminders" sub="Daily log nudge · 9pm"
            right={<Switch on={notif} onClick={(e) => { setNotif(!notif); }} />} />
          <ProfileRow icon={theme === 'dark' ? 'moon' : 'sun'} label="Appearance" sub={theme === 'dark' ? 'Dark' : 'Light'}
            right={<Switch on={theme === 'dark'} onClick={toggleTheme} />} />
          <ProfileRow icon="sliders" label="Goals & units" sub="kcal · grams" onClick={() => {}} />
        </div>

        {/* AUTH */}
        <div className="psec-l">Account</div>
        {loggedIn ? (
          <React.Fragment>
            <div className="plist">
              <ProfileRow icon="check" label="Signed in" sub={'@' + player.toLowerCase() + ' · synced'} accent="var(--good)" right={<span />} />
            </div>
            <button className="btn-ghost" onClick={() => setLoggedIn(false)}><Icon name="logout" size={14} style={{ verticalAlign: -2, marginRight: 6 }} />Log out</button>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <button className={'btn-primary ' + color} onClick={() => setLoggedIn(true)}><Icon name="login" size={14} style={{ verticalAlign: -2, marginRight: 6 }} />Log in</button>
            <button className="btn-ghost" onClick={() => setLoggedIn(true)}><Icon name="userplus" size={14} style={{ verticalAlign: -2, marginRight: 6 }} />Create account</button>
          </React.Fragment>
        )}

        <div className="pfoot">BeTon · CSO vs PET · v1.0</div>
      </div>
    </div>
  );
}

Object.assign(window, { ProfileSheet });
