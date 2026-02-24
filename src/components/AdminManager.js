// src/components/AdminManager.js
// Gestion des administrateurs (réservé au owner)

import React, { useState } from 'react';
import { removeAdmin } from '../firebase/database';

const AdminManager = ({ organization, currentUserId, onAdminRemoved }) => {
  const [loading, setLoading] = useState(false);

  const admins = organization?.admins || {};
  const adminsList = Object.entries(admins).map(([id, data]) => ({
    id,
    ...data
  }));

  const currentUserRole = admins[currentUserId]?.role;
  const isOwner = currentUserRole === 'owner';

  const handleRemoveAdmin = async (adminId, adminName) => {
    const confirm1 = window.confirm(
      `⚠️ Retirer ${adminName} de l'organisation ?\n\nCette personne n'aura plus accès aux données.`
    );

    if (!confirm1) return;

    const confirm2 = window.confirm(
      `⚠️⚠️ CONFIRMATION FINALE ⚠️⚠️\n\nÊtes-vous sûr de vouloir retirer ${adminName} ?\n\nCette action est irréversible.`
    );

    if (!confirm2) return;

    setLoading(true);
    try {
      await removeAdmin(adminId);
      alert(`✅ ${adminName} a été retiré de l'organisation.`);
      if (onAdminRemoved) {
        onAdminRemoved();
      }
    } catch (err) {
      alert(`❌ Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOwner) {
    return (
      <div className="admin-manager">
        <p className="info-message">
          ℹ️ Seul le chef principal peut gérer les administrateurs.
        </p>
      </div>
    );
  }

  return (
    <div className="admin-manager">
      <h3>👥 Administrateurs ({adminsList.length}/10)</h3>

      <div className="admin-list">
        {adminsList.map(admin => (
          <div key={admin.id} className="admin-item">
            <div className="admin-info">
              <div className="admin-avatar">
                {admin.avatar ? (
                  <img src={admin.avatar} alt={admin.name} />
                ) : (
                  <div className="avatar-placeholder">
                    {admin.name?.substring(0, 2).toUpperCase() || '??'}
                  </div>
                )}
              </div>
              <div className="admin-details">
                <div className="admin-name">
                  {admin.role === 'owner' && '👑 '}
                  {admin.name || 'Admin'}
                  {admin.id === currentUserId && ' (Vous)'}
                </div>
                <div className="admin-email">
                  {admin.email || 'Code secret'}
                </div>
                {admin.role === 'owner' && (
                  <span className="role-badge">Chef Principal</span>
                )}
              </div>
            </div>

            {admin.role !== 'owner' && (
              <button
                onClick={() => handleRemoveAdmin(admin.id, admin.name)}
                className="btn-delete"
                disabled={loading}
              >
                🗑️ Retirer
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="invite-section">
        <h4>Inviter un administrateur</h4>
        <div className="invite-code-display">
          <div className="code-label">Code d'invitation :</div>
          <div className="invite-code">{organization.info?.inviteCode}</div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(organization.info?.inviteCode);
              alert('✅ Code copié dans le presse-papier !');
            }}
            className="btn-secondary"
          >
            📋 Copier
          </button>
        </div>
        <p className="hint">
          💡 Partagez ce code avec les personnes que vous souhaitez inviter
        </p>
      </div>
    </div>
  );
};

export default AdminManager;
