// src/firebase/offline.js
// Gestion du mode hors-ligne avec localStorage comme backup

/**
 * Clés localStorage
 */
const KEYS = {
  OFFLINE_QUEUE: 'attendflow_offline_queue',
  CACHED_ORG: 'attendflow_cached_org',
  IS_ONLINE: 'attendflow_is_online'
};

/**
 * Vérifier la connexion Internet
 */
export const checkOnlineStatus = () => {
  return navigator.onLine;
};

/**
 * Ajouter une action à la queue offline
 */
export const addToOfflineQueue = (action) => {
  try {
    const queue = getOfflineQueue();
    queue.push({
      ...action,
      timestamp: new Date().toISOString(),
      synced: false
    });
    localStorage.setItem(KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
  } catch (error) {
    console.error('Erreur ajout à la queue offline:', error);
  }
};

/**
 * Obtenir la queue offline
 */
export const getOfflineQueue = () => {
  try {
    const queueStr = localStorage.getItem(KEYS.OFFLINE_QUEUE);
    return queueStr ? JSON.parse(queueStr) : [];
  } catch (error) {
    console.error('Erreur lecture queue offline:', error);
    return [];
  }
};

/**
 * Vider la queue offline
 */
export const clearOfflineQueue = () => {
  try {
    localStorage.removeItem(KEYS.OFFLINE_QUEUE);
  } catch (error) {
    console.error('Erreur nettoyage queue offline:', error);
  }
};

/**
 * Marquer une action comme synchronisée
 */
export const markActionAsSynced = (actionId) => {
  try {
    const queue = getOfflineQueue();
    const updated = queue.map(action =>
      action.id === actionId ? { ...action, synced: true } : action
    );
    localStorage.setItem(KEYS.OFFLINE_QUEUE, JSON.stringify(updated));
  } catch (error) {
    console.error('Erreur marquage action synced:', error);
  }
};

/**
 * Mettre en cache les données d'une organisation
 */
export const cacheOrganization = (orgId, orgData) => {
  try {
    const cache = {
      orgId,
      data: orgData,
      cachedAt: new Date().toISOString()
    };
    localStorage.setItem(KEYS.CACHED_ORG, JSON.stringify(cache));
  } catch (error) {
    console.error('Erreur mise en cache organisation:', error);
  }
};

/**
 * Récupérer les données en cache d'une organisation
 */
export const getCachedOrganization = (orgId) => {
  try {
    const cacheStr = localStorage.getItem(KEYS.CACHED_ORG);
    if (!cacheStr) return null;

    const cache = JSON.parse(cacheStr);
    if (cache.orgId === orgId) {
      return cache.data;
    }
    return null;
  } catch (error) {
    console.error('Erreur lecture cache organisation:', error);
    return null;
  }
};

/**
 * Effacer le cache
 */
export const clearCache = () => {
  try {
    localStorage.removeItem(KEYS.CACHED_ORG);
  } catch (error) {
    console.error('Erreur nettoyage cache:', error);
  }
};

/**
 * Synchroniser les actions offline vers Firebase
 */
export const syncOfflineActions = async (database) => {
  const queue = getOfflineQueue();
  const unsynced = queue.filter(action => !action.synced);

  if (unsynced.length === 0) {
    return { success: true, count: 0 };
  }

  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  // Map pour faire correspondre les IDs temporaires aux vrais IDs Firebase
  const idMap = {};

  for (const action of unsynced) {
    try {
      // Exécuter l'action selon son type
      switch (action.type) {
        case 'ADD_MEMBER': {
          const result = await database.addMember(action.data);
          if (action.tempId && result.memberId) {
            idMap[action.tempId] = result.memberId;
          }
          break;
        }
        case 'UPDATE_MEMBER': {
          const memberId = idMap[action.memberId] || action.memberId;
          await database.updateMember(memberId, action.data);
          break;
        }
        case 'DELETE_MEMBER': {
          const memberId = idMap[action.memberId] || action.memberId;
          await database.deleteMember(memberId);
          break;
        }
        case 'CREATE_SESSION': {
          // Mapper les IDs de membres dans la session (attendances, punctuality, comments)
          const sessionData = { ...action.data };

          if (sessionData.attendances) {
            const mappedAttendances = {};
            Object.entries(sessionData.attendances).forEach(([id, val]) => {
              mappedAttendances[idMap[id] || id] = val;
            });
            sessionData.attendances = mappedAttendances;
          }

          if (sessionData.punctuality) {
            const mappedPunctuality = {};
            Object.entries(sessionData.punctuality).forEach(([id, val]) => {
              mappedPunctuality[idMap[id] || id] = val;
            });
            sessionData.punctuality = mappedPunctuality;
          }

          if (sessionData.comments) {
            const mappedComments = {};
            Object.entries(sessionData.comments).forEach(([id, val]) => {
              mappedComments[idMap[id] || id] = val;
            });
            sessionData.comments = mappedComments;
          }

          await database.createSession(sessionData);
          break;
        }
        case 'UPDATE_SESSION': {
          const sessionId = idMap[action.sessionId] || action.sessionId;
          await database.updateSession(sessionId, action.data);
          break;
        }
        case 'DELETE_SESSION': {
          const sessionId = idMap[action.sessionId] || action.sessionId;
          await database.deleteSession(sessionId);
          break;
        }
        default:
          console.warn('Type d\'action inconnu:', action.type);
      }

      markActionAsSynced(action.id);
      results.success++;
    } catch (error) {
      console.error('Erreur sync action:', action, error);
      results.failed++;
      results.errors.push({
        action: action.type,
        error: error.message
      });
    }
  }

  // Nettoyer les actions synchronisées
  if (results.success > 0) {
    const remaining = getOfflineQueue().filter(action => !action.synced);
    localStorage.setItem(KEYS.OFFLINE_QUEUE, JSON.stringify(remaining));
  }

  return {
    success: results.success > 0,
    synced: results.success,
    failed: results.failed,
    errors: results.errors
  };
};

/**
 * Observer les changements de statut de connexion
 */
export const watchOnlineStatus = (onStatusChange) => {
  const handleOnline = () => onStatusChange(true);
  const handleOffline = () => onStatusChange(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Retourner une fonction pour nettoyer les listeners
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

const offlineUtils = {
  checkOnlineStatus,
  addToOfflineQueue,
  getOfflineQueue,
  clearOfflineQueue,
  markActionAsSynced,
  cacheOrganization,
  getCachedOrganization,
  clearCache,
  syncOfflineActions,
  watchOnlineStatus
};

export default offlineUtils;
