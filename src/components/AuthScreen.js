// src/components/AuthScreen.js
// Login/signup screen styled after the supplied MyChoir reference.

import React, { useState } from 'react';
import '../AuthActions.css';
import { resetPassword, signinWithEmail, signinWithGoogle, signupWithEmail } from '../firebase/auth';

const PUPITRES = ['Soprano', 'Alto', 'Ténor', 'Basse', 'Instrumentistes', 'Maître de chœur'];

const AuthScreen = ({ onAuthSuccess, isOnline }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [pupitre, setPupitre] = useState('Soprano');

  const resetForm = () => {
    setEmail(''); setPassword(''); setConfirmPassword(''); setName('');
    setInviteCode(''); setPupitre('Soprano'); setError('');
  };

  const completeAuth = () => { if (onAuthSuccess) onAuthSuccess(); };

  const runAuth = async (action) => {
    setError('');
    setLoading(true);
    try {
      await action();
      completeAuth();
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isOnline) return;
    if (!isLogin && password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (!isLogin && !inviteCode.trim()) {
      setError("Le code d'invitation est obligatoire.");
      return;
    }
    runAuth(() => isLogin
      ? signinWithEmail(email, password)
      : signupWithEmail(email, password, name, pupitre, inviteCode));
  };

  const handleGoogle = () => runAuth(() => signinWithGoogle());

  const handleApple = () => {
    setError('La connexion avec Apple sera disponible prochainement.');
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      setError('Saisissez votre adresse e-mail pour recevoir le lien de réinitialisation.');
      return;
    }
    runAuth(async () => {
      await resetPassword(email);
      setError('Un lien de réinitialisation a été envoyé à votre adresse e-mail.');
    });
  };

  const switchMode = () => { setIsLogin(!isLogin); resetForm(); };

  return (
    <main className="auth-screen reference-auth-screen">
      <div className="auth-orb auth-orb-top" />
      <div className="auth-orb auth-orb-bottom" />
      <section className="auth-container reference-auth-card">
        {!isOnline && <div className="offline-banner">⚠️ Vous êtes hors ligne. La connexion et l'inscription nécessitent Internet.</div>}
        <header className="reference-auth-brand">
          <img src="/logo192.png" alt="Logo du Grand Chœur Polyphonique" />
          <p>GRAND CHŒUR POLYPHONIQUE</p>
          <h1>My<span>Choir</span></h1>
          <div className="reference-auth-subtitle">{isLogin ? 'Connexion' : 'Créer un compte'}</div>
        </header>

        <div className="auth-tabs">
          <button type="button" className={isLogin ? 'active' : ''} onClick={() => { setIsLogin(true); resetForm(); }}>Connexion</button>
          <button type="button" className={!isLogin ? 'active' : ''} onClick={() => { setIsLogin(false); resetForm(); }}>Inscription</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form reference-auth-form">
          {!isLogin && <>
            <label className="reference-auth-field"><span aria-hidden="true">♙</span><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom complet" minLength="2" required /></label>
            <label className="reference-auth-field"><span aria-hidden="true">♫</span><select value={pupitre} onChange={(e) => setPupitre(e.target.value)} required>{PUPITRES.map((part) => <option key={part} value={part}>{part}</option>)}</select></label>
            <label className="reference-auth-field"><span aria-hidden="true">⌑</span><input type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="Code d’invitation" required /></label>
          </>}
          <label className="reference-auth-field"><span aria-hidden="true">♙</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Adresse e-mail" autoComplete="email" required /></label>
          <label className="reference-auth-field"><span aria-hidden="true">♙</span><input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" autoComplete={isLogin ? 'current-password' : 'new-password'} minLength="6" required /><button className="reference-password-toggle" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>{showPassword ? '◉' : '◎'}</button></label>
          {!isLogin && <label className="reference-auth-field"><span aria-hidden="true">♙</span><input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmer le mot de passe" minLength="6" required /></label>}

          {error && <div className="error-message" role="status">{error}</div>}
          <button type="submit" className="reference-login-button" disabled={loading || !isOnline}>{loading ? 'Connexion…' : isLogin ? 'Se connecter' : 'Créer mon compte'}</button>
          {isLogin && <>
            <button type="button" className="reference-google-button" onClick={handleGoogle} disabled={loading || !isOnline}><span className="google-g">G</span> Continuer avec Google</button>
            <button type="button" className="reference-apple-button" onClick={handleApple} aria-label="Continuer avec Apple"><span className="apple-mark" aria-hidden="true">●</span> Continuer avec Apple</button>
            <div className="reference-auth-links"><button type="button" onClick={switchMode} disabled={!isOnline}>Créer un compte</button><button type="button" onClick={handleForgotPassword} disabled={loading || !isOnline}>Mot de passe oublié ?</button></div>
            <button type="button" className="reference-preview-link" onClick={() => { const url = new URL(window.location.href); url.searchParams.set('preview', '1'); window.location.assign(url.toString()); }}>👀 Passer en mode aperçu</button>
          </>}
        </form>
      </section>
    </main>
  );
};

export default AuthScreen;
