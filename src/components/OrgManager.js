// src/components/OrgManager.js
// Gestionnaire d'organisations (créer, rejoindre, sélectionner)

import React, { useState, useEffect } from 'react';
import { getUserOrganizations, createOrganization, joinOrganization } from '../firebase/database';
import { auth } from '../firebase/config';

const OrgManager = ({ onOrgSelected }) => {
  const [view, setView] = useState('loading'); // 'loading', 'list', 'create', 'join'
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // États pour créer une org
  const [orgName, setOrgName] = useState('');
  const [useCustomCode, setUseCustomCode] = useState(false);
  const [customCode, setCustomCode] = useState('');

  // États pour rejoindre une org
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const orgs = await getUserOrganizations();
      setOrganizations(orgs);

      if (orgs.length === 0) {
        setView('create');
      } else if (orgs.length === 1) {
        // Auto-sélectionner si une seule org
        onOrgSelected(orgs[0].id);
      } else {
        setView('list');
      }
    } catch (err) {
      console.error('Erreur chargement organisations:', err);
      setView('create');
    }
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const code = useCustomCode && customCode.trim() ? customCode.trim() : null;
      const result = await createOrganization(orgName.trim(), code);

      alert(`✅ Organisation créée !\n\nCode d'invitation: ${result.inviteCode}\n\nPartagez ce code avec vos collaborateurs.`);

      onOrgSelected(result.orgId);
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
      const result = await joinOrganization(inviteCode.trim());
      alert('✅ Vous avez rejoint l\'organisation !');
      onOrgSelected(result.orgId);
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
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (view === 'list') {
    return (
      <div className="org-manager">
        <div className="org-selector">
          <h2>Sélectionnez votre organisation</h2>

          <div className="org-list">
            {organizations.map(org => (
              <div
                key={org.id}
                className="org-card"
                onClick={() => onOrgSelected(org.id)}
              >
                <h3>🎵 {org.name}</h3>
                <div className="org-stats">
                  <span>{org.memberCount} membres</span>
                  <span>•</span>
                  <span>{org.sessionCount} sessions</span>
                </div>
                {org.role === 'owner' && (
                  <span className="owner-badge">👑 Chef Principal</span>
                )}
              </div>
            ))}
          </div>

          <div className="org-actions">
            <button onClick={() => setView('create')} className="btn-primary">
              ➕ Créer une organisation
            </button>
            <button onClick={() => setView('join')} className="btn-secondary">
              Rejoindre une organisation
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'create') {
    return (
      <div className="org-manager">
        <div className="org-form-container">
          <h2>Créer une organisation</h2>

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
                  placeholder="mon-code-perso"
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

            <div className="form-actions">
              {organizations.length > 0 && (
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className="btn-secondary"
                >
                  Retour
                </button>
              )}
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Création...' : 'Créer l\'organisation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'join') {
    return (
      <div className="org-manager">
        <div className="org-form-container">
          <h2>Rejoindre une organisation</h2>

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
              <small>Demandez le code d'invitation au chef de votre organisation</small>
            </div>

            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                onClick={() => organizations.length > 0 ? setView('list') : setView('create')}
                className="btn-secondary"
              >
                Retour
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Vérification...' : 'Rejoindre'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return null;
};

export default OrgManager;
