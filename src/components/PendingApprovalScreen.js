// src/components/PendingApprovalScreen.js
// Écran d'attente de validation par un administrateur

import React from 'react';

const PendingApprovalScreen = ({ user, requestedPupitre, onSignOut }) => {
  return (
    <div className="auth-screen">
      <div className="auth-container pending-container">
        <div className="auth-header">
          <h1>🎵 AttendFlow</h1>
          <p>Demande d'accès</p>
        </div>

        <div className="pending-status-card">
          <div className="pending-icon">🕐</div>
          <h3>Validation en attente</h3>
          <p className="pending-message">
            Votre demande a été envoyée à l'administrateur. Vous aurez accès à l'application dès qu'elle aura été validée.
          </p>
          <div className="pending-details">
            <div className="pending-detail-item">
              <strong>Nom :</strong> <span>{user?.displayName || 'Non renseigné'}</span>
            </div>
            <div className="pending-detail-item">
              <strong>Email :</strong> <span>{user?.email}</span>
            </div>
            <div className="pending-detail-item">
              <strong>Pupitre demandé :</strong> <span className="badge-pupitre">{requestedPupitre || 'Non renseigné'}</span>
            </div>
          </div>
        </div>

        <div className="auth-form-actions" style={{ marginTop: '20px' }}>
          <button
            onClick={onSignOut}
            className="btn-secondary btn-large"
            style={{ width: '100%' }}
          >
            🚪 Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingApprovalScreen;
