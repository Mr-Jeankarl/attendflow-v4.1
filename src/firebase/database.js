// src/firebase/database.js
// Gestion des opérations CRUD avec Firebase Realtime Database

import { ref, set, get, update, remove, push, onValue } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { database, auth, storage } from './config';

// ==========================================
// GESTION DES ORGANISATIONS
// ==========================================

/**
 * Générer un code d'invitation unique
 */
const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const part1 = Array(3).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part2 = Array(3).fill(0).map(() => Math.floor(Math.random() * 10)).join('');
  const year = new Date().getFullYear();
  return `${part1}-${part2}-${year}`;
};


/**
 * Créer l'organisation unique (premier utilisateur)
 */
export const createOrganization = async (orgName, customCode = null) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Non authentifié');

  try {
    // Vérifier si une organisation existe déjà
    const orgRef = ref(database, 'organization');
    const snapshot = await get(orgRef);

    if (snapshot.exists()) {
      throw new Error('Une organisation existe déjà. Utilisez le code d\'invitation pour la rejoindre.');
    }

    // Générer ou valider le code d'invitation
    let inviteCode = customCode;

    if (customCode) {
      if (!/^[a-zA-Z0-9-]{6,20}$/.test(customCode)) {
        throw new Error('Code invalide. Utilisez 6-20 caractères (lettres, chiffres, tirets)');
      }
    } else {
      // Générer un code automatique
      inviteCode = generateInviteCode();
    }

    // Créer l'organisation unique
    const orgData = {
      info: {
        name: orgName,
        inviteCode: inviteCode,
        createdAt: new Date().toISOString(),
        createdBy: user.uid
      },
      admins: {
        [user.uid]: {
          role: 'owner',
          name: user.displayName || 'Admin',
          email: user.email || null,
          avatar: user.photoURL || null,
          joinedAt: new Date().toISOString()
        }
      },
      members: {},
      sessions: {}
    };

    await set(orgRef, orgData);

    // Mettre à jour l'utilisateur
    await set(ref(database, `users/${user.uid}/hasOrganization`), true);

    return { inviteCode };
  } catch (error) {
    console.error('Erreur création organisation:', error);
    throw error;
  }
};

/**
 * Rejoindre l'organisation unique avec un code d'invitation
 */
export const joinOrganization = async (inviteCode) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Non authentifié');

  try {
    // Récupérer l'organisation unique
    const orgRef = ref(database, 'organization');
    const snapshot = await get(orgRef);

    if (!snapshot.exists()) {
      throw new Error('Aucune organisation n\'existe encore. Le premier utilisateur doit la créer.');
    }

    const orgData = snapshot.val();

    // Vérifier le code d'invitation
    if (orgData.info?.inviteCode !== inviteCode) {
      throw new Error('Code d\'invitation incorrect');
    }

    // Vérifier si l'utilisateur est déjà membre
    if (orgData.admins?.[user.uid]) {
      throw new Error('Vous êtes déjà membre de cette organisation');
    }

    // Vérifier la limite de 10 admins
    const adminCount = orgData.admins ? Object.keys(orgData.admins).length : 0;

    if (adminCount >= 10) {
      throw new Error('Cette organisation a atteint le nombre maximum d\'administrateurs (10)');
    }

    // Ajouter l'utilisateur comme admin
    const adminRef = ref(database, `organization/admins/${user.uid}`);
    await set(adminRef, {
      role: 'admin',
      name: user.displayName || 'Admin',
      email: user.email || null,
      avatar: user.photoURL || null,
      joinedAt: new Date().toISOString()
    });

    // Marquer l'utilisateur comme ayant une organisation
    await set(ref(database, `users/${user.uid}/hasOrganization`), true);

    return { success: true };
  } catch (error) {
    console.error('Erreur rejoindre organisation:', error);
    throw error;
  }
};

/**
 * Obtenir les organisations d'un utilisateur
 */
export const getUserOrganizations = async () => {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const userOrgsRef = ref(database, `users/${user.uid}/organizations`);
    const snapshot = await get(userOrgsRef);

    if (!snapshot.exists()) return [];

    const orgIds = snapshot.val();
    const organizations = [];

    for (const orgId of orgIds) {
      const orgRef = ref(database, `organizations/${orgId}`);
      const orgSnapshot = await get(orgRef);

      if (orgSnapshot.exists()) {
        const orgData = orgSnapshot.val();

        // Compter membres et sessions
        const memberCount = orgData.members ? Object.keys(orgData.members).length : 0;
        const sessionCount = orgData.sessions ? Object.keys(orgData.sessions).length : 0;

        organizations.push({
          id: orgId,
          name: orgData.info?.name || 'Organisation',
          inviteCode: orgData.info?.inviteCode || '',
          memberCount,
          sessionCount,
          role: orgData.admins?.[user.uid]?.role || 'admin'
        });
      }
    }

    return organizations;
  } catch (error) {
    console.error('Erreur récupération organisations:', error);
    return [];
  }
};

/**
 * Vérifier si l'organisation existe
 */
export const checkOrganizationExists = async () => {
  try {
    const orgRef = ref(database, 'organization');
    const snapshot = await get(orgRef);
    return snapshot.exists();
  } catch (error) {
    console.error('Erreur vérification organisation:', error);
    return false;
  }
};

/**
 * Obtenir l'organisation unique
 */
export const getOrganization = async () => {
  try {
    const orgRef = ref(database, 'organization');
    const snapshot = await get(orgRef);

    if (!snapshot.exists()) return null;

    return snapshot.val();
  } catch (error) {
    console.error('Erreur récupération organisation:', error);
    return null;
  }
};

/**
 * Écouter les changements de l'organisation en temps réel
 */
export const subscribeToOrganization = (callback) => {
  const orgRef = ref(database, 'organization');

  const unsubscribe = onValue(orgRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });

  return unsubscribe;
};

/**
 * Retirer un admin d'une organisation (owner uniquement)
 */
export const removeAdmin = async (adminId) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Non authentifié');

  try {
    // Vérifier que l'utilisateur est owner
    const ownerRef = ref(database, `organization/admins/${user.uid}`);
    const ownerSnapshot = await get(ownerRef);

    if (!ownerSnapshot.exists() || ownerSnapshot.val().role !== 'owner') {
      throw new Error('Seul le chef principal peut retirer des administrateurs');
    }

    // Empêcher de se retirer soi-même
    if (adminId === user.uid) {
      throw new Error('Vous ne pouvez pas vous retirer vous-même');
    }

    // Retirer l'admin
    const adminRef = ref(database, `organization/admins/${adminId}`);
    await remove(adminRef);

    // Retirer l'org de la liste des orgs de l'admin
    const adminOrgsRef = ref(database, `users/${adminId}/organizations`);
    const adminOrgsSnapshot = await get(adminOrgsRef);

    if (adminOrgsSnapshot.exists()) {
      const orgs = adminOrgsSnapshot.val().filter(id => id !== 'organization');
      await set(adminOrgsRef, orgs);
    }

    return true;
  } catch (error) {
    console.error('Erreur retrait admin:', error);
    throw error;
  }
};

/**
 * Mettre à jour le nom de l'organisation (owner uniquement)
 */
export const updateOrganizationName = async (newName) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Non authentifié');

  try {
    const isAdmin = await isUserAdmin(user.uid);
    if (!isAdmin) throw new Error('Seul un administrateur peut modifier le nom');

    const nameRef = ref(database, 'organization/info/name');
    await set(nameRef, newName);
    return true;
  } catch (error) {
    console.error('Erreur mise à jour nom organisation:', error);
    throw error;
  }
};

/**
 * Supprimer l'organisation et toutes ses données (owner uniquement)
 */
export const deleteOrganization = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Non authentifié');

  try {
    const isOwner = await isUserOwner(user.uid);
    if (!isOwner) throw new Error('Seul le chef principal peut supprimer l\'organisation');

    // Mettre à jour le statut "hasOrganization" uniquement pour l'utilisateur courant
    // Les autres admins seront redirigés automatiquement car orgRef deviendra null (écouté via subscribeToOrganization)
    await set(ref(database, `users/${user.uid}/hasOrganization`), false);

    // Supprimer l'organisation entière
    const orgRef = ref(database, 'organization');
    await remove(orgRef);

    return true;
  } catch (error) {
    console.error('Erreur suppression organisation:', error);
    throw error;
  }
};

// ==========================================
// GESTION DES MEMBRES
// ==========================================

/**
 * Ajouter un membre à l'organisation unique
 */
export const addMember = async (memberData) => {
  try {
    const memberRef = push(ref(database, 'organization/members'));
    const memberId = memberRef.key;

    const member = {
      id: memberId,
      name: memberData.name,
      pupitre: memberData.pupitre,
      phone: memberData.phone || '',
      birthday: memberData.birthday || '',
      email: memberData.email || '',
      createdAt: new Date().toISOString()
    };

    await set(memberRef, member);
    return { memberId, member };
  } catch (error) {
    console.error('Erreur ajout membre:', error);
    throw error;
  }
};

/**
 * Mettre à jour un membre
 */
export const updateMember = async (memberId, updates) => {
  try {
    const memberRef = ref(database, `organization/members/${memberId}`);
    await update(memberRef, updates);
    return true;
  } catch (error) {
    console.error('Erreur mise à jour membre:', error);
    throw error;
  }
};

/**
 * Supprimer un membre
 */
export const deleteMember = async (memberId) => {
  try {
    const memberRef = ref(database, `organization/members/${memberId}`);
    await remove(memberRef);
    return true;
  } catch (error) {
    console.error('Erreur suppression membre:', error);
    throw error;
  }
};

// ==========================================
// GESTION DES SESSIONS
// ==========================================

/**
 * Créer une session
 */
export const createSession = async (sessionData) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Non authentifié');

  try {
    const sessionRef = push(ref(database, "organization/sessions"));
    const sessionId = sessionRef.key;

    const session = {
      id: sessionId,
      activityName: sessionData.activityName,
      date: sessionData.date,
      startTime: sessionData.startTime,
      endTime: sessionData.endTime,
      location: sessionData.location,
      attendances: sessionData.attendances || {},
      punctuality: sessionData.punctuality || {},
      comments: sessionData.comments || {},
      createdBy: user.uid,
      createdByName: user.displayName || 'Admin',
      createdAt: new Date().toISOString()
    };

    await set(sessionRef, session);

    // TODO: Envoyer notification aux autres admins

    return { sessionId, session };
  } catch (error) {
    console.error('Erreur création session:', error);
    throw error;
  }
};

/**
 * Mettre à jour une session
 */
export const updateSession = async (sessionId, updates) => {
  try {
    const sessionRef = ref(database, `organization/sessions/${sessionId}`);
    await update(sessionRef, updates);
    return true;
  } catch (error) {
    console.error('Erreur mise à jour session:', error);
    throw error;
  }
};

/**
 * Supprimer une session
 */
export const deleteSession = async (sessionId) => {
  try {
    const sessionRef = ref(database, `organization/sessions/${sessionId}`);
    await remove(sessionRef);
    return true;
  } catch (error) {
    console.error('Erreur suppression session:', error);
    throw error;
  }
};

// ==========================================
// UTILITAIRES
// ==========================================

/**
 * Vérifier si un utilisateur est admin d'une organisation
 */
export const isUserAdmin = async (userId = null) => {
  const uid = userId || auth.currentUser?.uid;
  if (!uid) return false;

  try {
    const adminRef = ref(database, `organization/admins/${uid}`);
    const snapshot = await get(adminRef);
    return snapshot.exists();
  } catch (error) {
    return false;
  }
};

/**
 * Vérifier si un utilisateur est owner d'une organisation
 */
export const isUserOwner = async (userId = null) => {
  const uid = userId || auth.currentUser?.uid;
  if (!uid) return false;

  try {
    const adminRef = ref(database, `organization/admins/${uid}`);
    const snapshot = await get(adminRef);
    return snapshot.exists() && snapshot.val().role === 'owner';
  } catch (error) {
    return false;
  }
};

// ==========================================
// GESTION DU REPERTOIRE (CHANTS)
// ==========================================

/**
 * Uploader un fichier pour un chant (PDF ou Audio)
 */
export const uploadSongFile = async (songId, fileType, file) => {
  if (!file) return null;
  try {
    const fileRef = storageRef(storage, `organization/repertoire/${songId}/${fileType}_${file.name}`);
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    return downloadURL;
  } catch (error) {
    console.error(`Erreur d'upload pour le type ${fileType}:`, error);
    throw error;
  }
};

/**
 * Ajouter un chant au répertoire
 */
export const addSong = async (songData) => {
  try {
    const songRef = push(ref(database, 'organization/repertoire'));
    const songId = songRef.key;

    const song = {
      id: songId,
      title: songData.title,
      pdfUrl: songData.pdfUrl || '',
      audioUrl: songData.audioUrl || '',
      pupitresAudio: songData.pupitresAudio || {},
      createdAt: new Date().toISOString(),
      createdBy: auth.currentUser?.uid || 'system'
    };

    await set(songRef, song);
    return { songId, song };
  } catch (error) {
    console.error('Erreur ajout chant:', error);
    throw error;
  }
};

/**
 * Mettre à jour un chant
 */
export const updateSong = async (songId, updates) => {
  try {
    const songRef = ref(database, `organization/repertoire/${songId}`);
    await update(songRef, updates);
    return true;
  } catch (error) {
    console.error('Erreur mise à jour chant:', error);
    throw error;
  }
};

/**
 * Supprimer un chant et ses fichiers associés du Storage
 */
export const deleteSong = async (songId, songData = null) => {
  try {
    if (songData) {
      const pathsToDelete = [];
      if (songData.pdfUrl && songData.pdfUrl.includes('firebasestorage')) pathsToDelete.push(songData.pdfUrl);
      if (songData.audioUrl && songData.audioUrl.includes('firebasestorage')) pathsToDelete.push(songData.audioUrl);
      if (songData.pupitresAudio) {
        Object.values(songData.pupitresAudio).forEach(url => {
          if (url && url.includes('firebasestorage')) pathsToDelete.push(url);
        });
      }

      for (const url of pathsToDelete) {
        try {
          const fileRef = storageRef(storage, url);
          await deleteObject(fileRef);
        } catch (e) {
          console.warn('Erreur suppression fichier storage (ignorée):', e);
        }
      }
    }

    const songRef = ref(database, `organization/repertoire/${songId}`);
    await remove(songRef);
    return true;
  } catch (error) {
    console.error('Erreur suppression chant:', error);
    throw error;
  }
};

// ==========================================
// GESTION DU THÈME ET FONDS D'ÉCRAN
// ==========================================

/**
 * Uploader un fond d'écran personnalisé pour l'organisation
 */
export const uploadCustomBackground = async (themeType, file) => {
  if (!file) return null;
  const user = auth.currentUser;
  if (!user) throw new Error('Non authentifié');
  
  try {
    const fileRef = storageRef(storage, `organization/theme/customBg_${themeType}`);
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    
    const dbRef = ref(database, `organization/info/customBg_${themeType}`);
    await set(dbRef, downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error(`Erreur d'upload du fond d'écran ${themeType}:`, error);
    throw error;
  }
};

/**
 * Supprimer un fond d'écran personnalisé pour l'organisation
 */
export const removeCustomBackground = async (themeType) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Non authentifié');
  
  try {
    try {
      const fileRef = storageRef(storage, `organization/theme/customBg_${themeType}`);
      await deleteObject(fileRef);
    } catch (e) {
      console.warn('Erreur suppression storage (fond d\'écran):', e);
    }
    
    const dbRef = ref(database, `organization/info/customBg_${themeType}`);
    await remove(dbRef);
    return true;
  } catch (error) {
    console.error(`Erreur de suppression du fond d'écran ${themeType}:`, error);
    throw error;
  }
};

const databaseService = {
  createOrganization,
  joinOrganization,
  checkOrganizationExists,
  getOrganization,
  subscribeToOrganization,
  removeAdmin,
  updateOrganizationName,
  deleteOrganization,
  addMember,
  updateMember,
  deleteMember,
  createSession,
  updateSession,
  deleteSession,
  isUserAdmin,
  isUserOwner,
  uploadSongFile,
  addSong,
  updateSong,
  deleteSong,
  uploadCustomBackground,
  removeCustomBackground
};

export default databaseService;
