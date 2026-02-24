// src/components/AuthScreen.js
// Écran unifié pour Login et Signup

import React, { useState } from 'react';
import { signupWithCode, signinWithCode, signupWithEmail, signinWithEmail } from '../firebase/auth';

const AuthScreen = ({ onAuthSuccess, isOnline }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [authMethod, setAuthMethod] = useState('code'); // 'code' ou 'email'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // États pour auth avec code
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');

  // États pour auth avec email
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');

  const resetForm = () => {
    setUsername('');
    setCode('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (authMethod === 'code') {
        if (isLogin) {
          await signinWithCode(username, code);
        } else {
          await signupWithCode(username, code);
        }
      } else {
        if (isLogin) {
          await signinWithEmail(email, password);
        } else {
          if (password !== confirmPassword) {
            throw new Error('Les mots de passe ne correspondent pas');
          }
          await signupWithEmail(email, password, name);
        }
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

  const switchMethod = (method) => {
    setAuthMethod(method);
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

        <div className="auth-method-selector">
          <button
            className={authMethod === 'code' ? 'method-btn active' : 'method-btn'}
            onClick={() => switchMethod('code')}
          >
            ⚡ Code Secret
          </button>
          <button
            className={authMethod === 'email' ? 'method-btn active' : 'method-btn'}
            onClick={() => switchMethod('email')}
          >
            📧 Email
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {authMethod === 'code' ? (
            <>
              <div className="form-group">
                <label>Nom d'utilisateur</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="votre_nom"
                  required
                  minLength="3"
                />
              </div>
              <div className="form-group">
                <label>Code secret</label>
                <input
                  type="password"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength="6"
                />
              </div>
            </>
          ) : (
            <>
              {!isLogin && (
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
          )}

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <div className="auth-form-actions">
            {!isLogin || authMethod !== 'code' ? (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setIsLogin(true);
                  setAuthMethod('code');
                  resetForm();
                }}
              >
                ← Retour
              </button>
            ) : null}

            <button
              type="submit"
              className={`btn-primary ${isLogin && authMethod === 'code' ? 'btn-large' : ''}`}
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
