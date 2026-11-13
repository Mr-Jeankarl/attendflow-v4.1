import React, { useMemo, useState } from 'react';
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

  const changeTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
  };

  const go = (next) => {
    setView(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

function PreviewPage({ view, title, members, sessions, onBack, onOpenMember }) {
  if (view === 'newSession') {
    return <section className="reference-subpage"><button className="reference-back" onClick={onBack}>← Retour</button><h1>{title}</h1><p>Les créations effectuées dans le mode aperçu restent fictives.</p><div className="reference-info-card"><strong>Mode démonstration</strong><span>Les modifications ne sont pas envoyées à Firebase.</span></div></section>;
  }
  if (view === 'members') {
    return <section className="reference-subpage"><button className="reference-back" onClick={onBack}>← Accueil</button><div className="reference-page-heading"><span>CHORALE</span><h1>{title}</h1><p>{members.length} membres fictifs</p></div><div className="reference-list">{members.map((member) => <article className="reference-list-card" key={member.id}><span className="reference-avatar">{member.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><div><strong>{member.name}</strong><small>{member.pupitre}</small></div><span className="reference-list-arrow">›</span></article>)}</div></section>;
  }
  if (view === 'history') {
    return <section className="reference-subpage"><button className="reference-back" onClick={onBack}>← Accueil</button><div className="reference-page-heading"><span>ACTIVITÉS</span><h1>{title}</h1><p>{sessions.length} sessions enregistrées</p></div><div className="reference-list">{sessions.map((session) => <article className="reference-list-card session" key={session.id}><span className="reference-list-icon">◷</span><div><strong>{session.activityName}</strong><small>{session.date} · {session.startTime} · {session.location}</small></div><span className="reference-list-arrow">›</span></article>)}</div></section>;
  }
  if (view === 'repertoire') {
    const songs = Object.values(DEMO_ORGANIZATION.repertoire || {});
    return <section className="reference-subpage"><button className="reference-back" onClick={onBack}>← Accueil</button><div className="reference-page-heading"><span>CHANTS</span><h1>{title}</h1><p>Le répertoire de démonstration</p></div><div className="reference-list">{songs.map((song) => <article className="reference-list-card session" key={song.id}><span className="reference-list-icon">♫</span><div><strong>{song.title}</strong><small>{song.composer || 'Chant de la chorale'}</small></div><span className="reference-list-arrow">›</span></article>)}</div></section>;
  }
  if (view === 'notifications') {
    return <section className="reference-subpage"><button className="reference-back" onClick={onBack}>← Accueil</button><div className="reference-page-heading"><span>INFORMATIONS</span><h1>{title}</h1></div><div className="reference-info-card"><strong>Tout est à jour</strong><span>Les notifications de démonstration apparaîtront ici.</span></div></section>;
  }
  return <section className="reference-subpage"><button className="reference-back" onClick={onBack}>← Accueil</button><div className="reference-page-heading"><span>COMPTE DE DÉMONSTRATION</span><h1>{title}</h1></div><div className="reference-profile-card"><span className="reference-avatar large">KM</span><div><strong>{DEMO_USER.displayName}</strong><small>{DEMO_USER.email}</small></div></div><button type="button" className="reference-gold-action reference-profile-members" onClick={onOpenMember}>Voir les membres de la chorale</button></section>;
}

export default PreviewExperience;
