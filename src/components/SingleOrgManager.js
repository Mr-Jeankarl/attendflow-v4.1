// src/components/SingleOrgManager.js
// Gestionnaire simplifié pour une seule organisation

import React, { useState, useEffect } from 'react';
import { checkOrganizationExists, createOrganization, joinOrganization } from '../firebase/database';

const SingleOrgManager = ({ onOrgReady }) => {
  const [view, setView] = useState('loading'); // 'loading', 'create', 'join'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // États pour créer une org
  const [orgName, setOrgName] = useState('');
  const [useCustomCode, setUseCustomCode] = useState(false);
  const [customCode, setCustomCode] = useState('');

  // États pour rejoindre une org
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    checkIfOrgExists();
  }, []);

  const checkIfOrgExists = async () => {
    try {
      const exists = await checkOrganizationExists();
      
      if (exists) {
        // L'organisation existe déjà, demander le code
        setView('join');
      } else {
        // Première utilisation, créer l'organisation
        setView('create');
      }
    } catch (err) {
      console.error('Erreur vérification organisation:', err);
      setView('create'); // Par défaut, permettre la création
    }
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const code = useCustomCode && customCode.trim() ? customCode.trim() : null;
      const result = await createOrganization(orgName.trim(), code);

      alert(`✅ Organisation créée !\n\nCode d'invitation : ${result.inviteCode}\n\nPartagez ce code avec vos collaborateurs pour qu'ils puissent rejoindre l'organisation.`);

      // Organisation créée et utilisateur ajouté automatiquement
      onOrgReady();
    } catch (err) {
      setError(err.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinOrg = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await joinOrganization(inviteCode.trim());
      alert('✅ Vous avez rejoint l\'organisation !');
      onOrgReady();
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'adhésion');
    } finally {
      setLoading(false);
    }
  };

  if (view === 'loading') {
    return (
      <div className="org-manager">
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Vérification...</p>
        </div>
      </div>
    );
  }

  if (view === 'create') {
    return (
      <div className="org-manager">
        <div className="org-form-container">
          <h2>🎵 Bienvenue sur AttendFlow !</h2>
          <p style={{ textAlign: 'center', color: '#9ca3af', marginBottom: '30px' }}>
            Vous êtes le premier utilisateur. Créez votre organisation.
          </p>

          <form onSubmit={handleCreateOrg}>
            <div className="form-group">
              <label>Nom de l'organisation <span className="required">*</span></label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Grand Chœur Polyphonique"
                required
                minLength="3"
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={useCustomCode}
                  onChange={(e) => setUseCustomCode(e.target.checked)}
                />
                Personnaliser le code d'invitation
              </label>
            </div>

            {useCustomCode && (
              <div className="form-group">
                <label>Code d'invitation personnalisé</label>
                <input
                  type="text"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  placeholder="mon-code-choeur"
                  pattern="[a-zA-Z0-9-]{6,20}"
                  title="6-20 caractères (lettres, chiffres, tirets uniquement)"
                />
                <small>6-20 caractères (lettres, chiffres, tirets uniquement)</small>
              </div>
            )}

            {!useCustomCode && (
              <p className="hint">
                💡 Un code d'invitation sera généré automatiquement
              </p>
            )}

            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary btn-large"
              disabled={loading}
              style={{ width: '100%', marginTop: '20px' }}
            >
              {loading ? 'Création...' : 'Créer l\'organisation'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'join') {
    return (
      <div className="org-manager">
        <div className="org-form-container">
          <h2>🎵 Rejoindre AttendFlow</h2>
          <p style={{ textAlign: 'center', color: '#9ca3af', marginBottom: '30px' }}>
            Une organisation existe déjà. Entrez le code d'invitation pour la rejoindre.
          </p>

          <form onSubmit={handleJoinOrg}>
            <div className="form-group">
              <label>Code d'invitation <span className="required">*</span></label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="ABC-123-2025"
                required
              />
              <small>Demandez le code au chef de votre organisation</small>
            </div>

            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary btn-large"
              disabled={loading}
              style={{ width: '100%', marginTop: '20px' }}
            >
              {loading ? 'Vérification...' : 'Rejoindre l\'organisation'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return null;
};

export default SingleOrgManager;
