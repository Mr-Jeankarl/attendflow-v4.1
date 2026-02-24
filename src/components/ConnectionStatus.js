// src/components/ConnectionStatus.js
// Indicateur de statut de connexion (online/offline)

import React from 'react';

const ConnectionStatus = ({ isOnline, pendingSync }) => {
  if (isOnline && !pendingSync) {
    return (
      <div className="connection-status online">
        <span className="status-dot"></span>
        <span className="status-text">En ligne</span>
      </div>
    );
  }

  if (isOnline && pendingSync) {
    return (
      <div className="connection-status syncing">
        <span className="status-dot"></span>
        <span className="status-text">Synchronisation...</span>
      </div>
    );
  }

  return (
    <div className="connection-status offline">
      <span className="status-dot"></span>
      <span className="status-text">Hors ligne</span>
    </div>
  );
};

export default ConnectionStatus;
