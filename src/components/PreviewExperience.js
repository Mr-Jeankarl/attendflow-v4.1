import React, { useEffect, useMemo, useState } from 'react';
import App from '../App';
import { DEMO_MEMBERS, DEMO_SESSIONS, DEMO_ORGANIZATION, DEMO_USER } from '../firebase/demoData';

const NAV_ITEMS = [
  { id: 'home', icon: '⌂', label: 'Accueil' },
  { id: 'history', icon: '◷', label: 'Historique' },
  { id: 'repertoire', icon: '♫', label: 'Répertoire' },
  { id: 'notifications', icon: '♧', label: 'Alertes' },
  { id: 'profile', icon: '◉', label: 'Profil' }
];

function PreviewExperience() {
  const [view, setView] = useState('home');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [showFullApp, setShowFullApp] = useState(false);
  const members = useMemo(() => Object.values(DEMO_MEMBERS), []);
  const sessions = useMemo(() => Object.values(DEMO_SESSIONS).sort((a, b) => b.date.localeCompare(a.date)), []);
  const stats = useMemo(() => {
    let present = 0;
    let marked = 0;
    let onTime = 0;
    let presentWithPunctuality = 0;
    sessions.forEach((session) => {
      members.forEach((member) => {
        const status = session.attendances?.[member.id];
        if (status) marked += 1;
        if (status === 'present') {
          present += 1;
          if (session.punctuality?.[member.id]) presentWithPunctuality += 1;
          if (session.punctuality?.[member.id] === 'on_time') onTime += 1;
        }
      });
    });
    return {
      attendance: marked ? Math.round((present / marked) * 100) : 0,
      punctuality: presentWithPunctuality ? Math.round((onTime / presentWithPunctuality) * 100) : 0,
      participation: `${sessions.length} / ${sessions.length}`
    };
  }, [members, sessions]);

  // Legacy AttendFlow remains available from the preview profile, including member details,
  // session attendance details, settings, exports, and existing management actions.
  useEffect(() => {
    if (!showFullApp) return undefined;
    const applyInlineBackground = () => {
      const appElement = document.querySelector('.App');
      const image = appElement?.style.backgroundImage;
      if (appElement && image) appElement.style.setProperty('background-image', image, 'important');
    };
    applyInlineBackground();
    const observer = new MutationObserver(applyInlineBackground);
    const appElement = document.querySelector('.App');
    if (appElement) observer.observe(appElement, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, [showFullApp]);

  const changeTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
  };

  const go = (next) => {
    setView(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (showFullApp) {
    return (
      <div className="reference-full-app-wrap">
        <App />
        <button type="button" className="reference-return-preview" onClick={() => setShowFullApp(false)}>
          ← Retour au tableau de bord aperçu
        </button>
      </div>
    );
  }

  const title = {
    home: 'Accueil', members: 'Membres', history: 'Historique', repertoire: 'Répertoire',
    notifications: 'Notifications', profile: 'Mon profil', newSession: 'Nouvelle session'
  }[view] || 'Accueil';

  return (
    <div className={`reference-app ${theme}-theme`} style={{ backgroundImage: `url(/assets/default_bg_${theme}.jpg)` }}>
      <div className="reference-backdrop" />
      <header className="reference-header">
        <div className="reference-brand">
          <img src="/logo192.png" alt="" />
          <div><strong>My<span>Choir</span></strong><small>Grand Chœur Polyphonique</small></div>
        </div>
        <div className="reference-header-actions">
          <button type="button" className="reference-icon-button" aria-label="Notifications" onClick={() => go('notifications')}>♧<i /></button>
          <button type="button" className="reference-icon-button" aria-label="Profil" onClick={() => go('profile')}>◉</button>
          <button type="button" className="reference-icon-button" aria-label="Changer de thème" onClick={changeTheme}>{theme === 'dark' ? '☼' : '☾'}</button>
        </div>
      </header>

      <main className="reference-main">
        {view === 'home' ? (
          <>
            <button type="button" className="reference-org-picker" onClick={() => go('members')}>
              <span>♟</span> Section de Ouagadougou <span className="reference-chevron">⌄</span>
            </button>
            <div className="reference-greeting">
              <span>Tableau de bord</span>
              <h1>Bonjour, {DEMO_USER.displayName} !</h1>
              <p>Voici le résumé de votre chorale.</p>
            </div>

            <section className="reference-dashboard-grid" aria-label="Indicateurs de la chorale">
              <div className="reference-metrics-panel">
                <MetricRing value={stats.attendance} label="Taux de présence" suffix="(global)" />
                <MetricRing value={stats.punctuality} label="Taux de" suffix="ponctualité" />
                <div className="reference-participation">
                  <span className="reference-calendar" aria-hidden="true">▦</span>
                  <div><strong>{stats.participation}</strong><span>sessions<br />participées</span></div>
                </div>
              </div>
              <div className="reference-count-stack">
                <button type="button" className="reference-count-card" onClick={() => go('members')}>
                  <strong>{members.length}</strong><span>membres</span>
                </button>
                <button type="button" className="reference-count-card dark" onClick={() => go('history')}>
                  <strong>{sessions.length}</strong><span>sessions</span>
                </button>
              </div>
            </section>

            <section className="reference-home-actions">
              <button type="button" className="reference-primary-action" onClick={() => go('newSession')}>＋ nouvelle session</button>
              <button type="button" className="reference-gold-action" onClick={() => go('repertoire')}>Voir répertoire</button>
            </section>
          </>
        ) : (
          <PreviewPage
            view={view}
            title={title}
            members={members}
            sessions={sessions}
            onBack={() => go('home')}
            onOpenMember={() => go('members')}
            onOpenFullApp={() => setShowFullApp(true)}
          />
        )}
      </main>

      <nav className="reference-bottom-nav" aria-label="Navigation principale">
        {NAV_ITEMS.map((item) => (
          <button key={item.id} type="button" className={view === item.id ? 'active' : ''} onClick={() => go(item.id)} aria-label={item.label}>
            <span>{item.icon}</span><small>{item.label}</small>
          </button>
        ))}
      </nav>
      <div className="reference-preview-label">APERÇU · DONNÉES FICTIVES</div>
    </div>
  );
}

function MetricRing({ value, label, suffix }) {
  return (
    <div className="reference-metric">
      <div className="reference-ring" style={{ '--ring-value': `${value * 3.6}deg` }}><strong>{value}%</strong></div>
      <p>{label}<br /><span>{suffix}</span></p>
    </div>
  );
}

function PreviewPage({ view, title, members, sessions, onBack, onOpenMember, onOpenFullApp }) {
  if (view === 'newSession') {
    return <section className="reference-subpage"><button className="reference-back" onClick={onBack}>← Retour</button><h1>{title}</h1><p>Les créations effectuées dans le mode aperçu restent fictives.</p><div className="reference-info-card"><strong>Mode démonstration</strong><span>Les modifications ne sont pas envoyées à Firebase.</span></div><button className="reference-primary-action reference-full-app-button" onClick={onOpenFullApp}>Ouvrir la gestion complète</button></section>;
  }
  if (view === 'members') {
    return <section className="reference-subpage"><button className="reference-back" onClick={onBack}>← Accueil</button><div className="reference-page-heading"><span>CHORALE</span><h1>{title}</h1><p>{members.length} membres fictifs · Touchez un membre pour consulter ses informations</p></div><div className="reference-list">{members.map((member) => <button type="button" className="reference-list-card" key={member.id} onClick={onOpenFullApp}><span className="reference-avatar">{member.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><span className="reference-member-copy"><strong>{member.name}</strong><small>{member.pupitre} · {member.phone}</small></span><span className="reference-list-arrow">›</span></button>)}</div><button className="reference-primary-action reference-full-app-button" onClick={onOpenFullApp}>Ouvrir les détails et la gestion des membres</button></section>;
  }
  if (view === 'history') {
    return <section className="reference-subpage"><button className="reference-back" onClick={onBack}>← Accueil</button><div className="reference-page-heading"><span>ACTIVITÉS</span><h1>{title}</h1><p>{sessions.length} sessions · touchez une session pour voir présences et absences</p></div><div className="reference-list">{sessions.map((session) => <button type="button" className="reference-list-card session" key={session.id} onClick={onOpenFullApp}><span className="reference-list-icon">◷</span><span className="reference-member-copy"><strong>{session.activityName}</strong><small>{session.date} · {session.startTime} · {session.location}</small></span><span className="reference-list-arrow">›</span></button>)}</div><button className="reference-primary-action reference-full-app-button" onClick={onOpenFullApp}>Ouvrir les détails complets des sessions</button></section>;
  }
  if (view === 'repertoire') {
    const songs = Object.values(DEMO_ORGANIZATION.repertoire || {});
    return <section className="reference-subpage"><button className="reference-back" onClick={onBack}>← Accueil</button><div className="reference-page-heading"><span>CHANTS</span><h1>{title}</h1><p>Le répertoire de démonstration</p></div><div className="reference-list">{songs.map((song) => <button type="button" className="reference-list-card session" key={song.id} onClick={onOpenFullApp}><span className="reference-list-icon">♫</span><span className="reference-member-copy"><strong>{song.title}</strong><small>{song.composer || 'Chant de la chorale'}</small></span><span className="reference-list-arrow">›</span></button>)}</div><button className="reference-primary-action reference-full-app-button" onClick={onOpenFullApp}>Ouvrir le répertoire complet</button></section>;
  }
  if (view === 'notifications') {
    return <section className="reference-subpage"><button className="reference-back" onClick={onBack}>← Accueil</button><div className="reference-page-heading"><span>INFORMATIONS</span><h1>{title}</h1></div><div className="reference-info-card"><strong>Tout est à jour</strong><span>Les notifications de démonstration apparaîtront ici.</span></div></section>;
  }
  return <section className="reference-subpage"><button className="reference-back" onClick={onBack}>← Accueil</button><div className="reference-page-heading"><span>COMPTE DE DÉMONSTRATION</span><h1>{title}</h1></div><div className="reference-profile-card"><span className="reference-avatar large">KM</span><div><strong>{DEMO_USER.displayName}</strong><small>{DEMO_USER.email}</small></div></div><button type="button" className="reference-gold-action reference-profile-members" onClick={onOpenMember}>Voir les membres de la chorale</button><button type="button" className="reference-primary-action reference-full-app-button" onClick={onOpenFullApp}>Ouvrir AttendFlow complet · paramètres, exports et gestion</button></section>;
}

export default PreviewExperience;
