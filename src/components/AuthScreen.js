// src/components/AuthScreen.js
// Écran unifié pour Login et Signup — Email + Mot de passe uniquement

import React, { useState } from 'react';
import { signupWithEmail, signinWithEmail } from '../firebase/auth';

const PUPITRES = ['Soprano', 'Alto', 'Ténor', 'Basse', 'Instrumentistes', 'Maître de chœur'];

const AuthScreen = ({ onAuthSuccess, isOnline }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // États pour auth avec email
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [pupitre, setPupitre] = useState('Soprano');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setInviteCode('');
    setPupitre('Soprano');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signinWithEmail(email, password);
      } else {
        if (password !== confirmPassword) {
          throw new Error('Les mots de passe ne correspondent pas');
        }
        if (!inviteCode.trim()) {
          throw new Error('Le code d\'invitation est obligatoire');
        }
        await signupWithEmail(email, password, name, pupitre, inviteCode);
      }

      if (onAuthSuccess) {
        onAuthSuccess();
      }
    } catch (err) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  return (
    <div className="auth-screen">
      <div className="auth-container">
        {!isOnline && (
          <div className="offline-banner">
            ⚠️ Vous êtes hors-ligne. La connexion et l'inscription nécessitent Internet.
          </div>
        )}
        <div className="auth-header">
          <h1>🎵 AttendFlow</h1>
          <p>Gestion des présences moderne</p>
        </div>

        <div className="auth-tabs">
          <button
            className={isLogin ? 'active' : ''}
            onClick={() => setIsLogin(true)}
          >
            Connexion
          </button>
          <button
            className={!isLogin ? 'active' : ''}
            onClick={() => setIsLogin(false)}
          >
            Inscription
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <>
            {!isLogin && (
              <>
                <div className="form-group">
                  <label>Nom complet</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jean Dupont"
                    required
                    minLength="2"
                  />
                </div>
                <div className="form-group">
                  <label>Pupitre souhaité</label>
                  <select
                    value={pupitre}
                    onChange={(e) => setPupitre(e.target.value)}
                    className="auth-select"
                    required
                  >
                    {PUPITRES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Code d'invitation</label>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Ex: ABC-123-2025"
                    required
                  />
                </div>
              </>
            )}
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@email.com"
                required
              />
            </div>
            <div className="form-group">
              <label>Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength="6"
              />
            </div>
            {!isLogin && (
              <div className="form-group">
                <label>Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength="6"
                />
              </div>
            )}
          </>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <div className="auth-form-actions">
            <button
              type="submit"
              className="btn-primary btn-large"
              disabled={loading || !isOnline}
            >
              {loading ? '⏳ Chargement...' : (!isOnline ? 'Internet requis' : (isLogin ? 'Se connecter' : 'Créer mon compte'))}
            </button>
          </div>
        </form>

        <div className="auth-footer">
          <p>
            {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
            {' '}
            <button onClick={switchMode} className="link-button" disabled={!isOnline}>
              {isLogin ? "S'inscrire" : "Se connecter"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
