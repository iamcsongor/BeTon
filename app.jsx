/* ============================================================
   BeTon — app shell: state, theme, routing, device frame
   ============================================================ */

function TabBar({ route, go }) {
  const tabs = [
    { id: 'vs', label: 'Versus', icon: 'vs' },
    { id: 'weeks', label: 'Rounds', icon: 'cal' },
    { id: 'daily', label: 'Log', icon: 'edit' },
  ];
  return (
    <div className="tabbar">
      {tabs.map(t => (
        <div key={t.id} className={'tab' + (route === t.id ? ' on' : '') + (t.id === 'vs' && route === t.id ? ' vs' : '')} onClick={() => go(t.id)}>
          <Icon name={t.icon} size={22} stroke={route === t.id ? 2.4 : 2} />
          {t.label}
        </div>
      ))}
    </div>
  );
}

function App() {
  const [state, setState] = useState(makeInitialState);
  const [route, setRoute] = useState('vs');
  const [player, setPlayer] = useState('Csongor');
  const [profileOpen, setProfileOpen] = useState(false);
  const dark = state.theme === 'dark';
  const W = 412, H = 892;

  const go = (r) => setRoute(r);
  const pickPlayer = (p) => { setPlayer(p); setProfileOpen(false); setRoute('daily'); };
  const toggleTheme = () => setState(p => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' }));

  return (
    <Stage w={W} h={H}>
      <IOSDevice dark={dark} width={W} height={H}>
        <div className="app" data-theme={state.theme}>
          <div className="top">
            <div className="wordmark">
              <span className="be">BE</span><span className="flick-t">T</span><span className="ton">ON</span>
              <span className="dot">&nbsp;/ CSO·PET</span>
            </div>
            <div className="top-actions">
              <button className="icon-btn" onClick={toggleTheme} aria-label="theme">
                <Icon name={dark ? 'moon' : 'sun'} size={18} />
              </button>
              <button className={'icon-btn avatar-btn ' + COLOR[player]} onClick={() => setProfileOpen(true)} aria-label="profile">
                {player[0]}
              </button>
            </div>
          </div>

          {route === 'vs' && <VSScreen state={state} go={go} />}
          {route === 'weeks' && <WeeksScreen state={state} go={go} />}
          {route === 'daily' && <DailyScreen state={state} setState={setState} player={player} setPlayer={setPlayer} />}

          <TabBar route={route} go={go} />

          {profileOpen && <ProfileSheet player={player} setPlayer={pickPlayer} theme={state.theme} toggleTheme={toggleTheme} onClose={() => setProfileOpen(false)} />}
        </div>
      </IOSDevice>
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
