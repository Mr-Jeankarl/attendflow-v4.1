// src/App.js
// Application principale AttendFlow V4.1 avec Firebase + Mode Démo

import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import * as XLSX from 'xlsx';
import { isDemoMode, auth, database } from './firebase/config';
import { DEMO_ORGANIZATION, DEMO_USER } from './firebase/demoData';

// Composants
import AuthScreen from './components/AuthScreen';
import SingleOrgManager from './components/SingleOrgManager';
import ConnectionStatus from './components/ConnectionStatus';
import AdminManager from './components/AdminManager';
import RepertoireView from './components/RepertoireView';
import ValidationAnimation from './components/ValidationAnimation';

// Firebase imports – safe stubs when in demo mode
// (Using require() for conditional loading – ESLint-compliant because
//  static `import` statements are ALL above this line)
/* eslint-disable import/first */
let onAuthStateChanged_fn = () => () => {};
let ref_fn = () => ({});
let get_fn = async () => ({ exists: () => false, val: () => null });
let set_fn = async () => {};

let signOut_fn = async () => {};
let updateUserProfile_fn = async () => {};

let subscribeToOrganization_fn = () => () => {};
let updateOrganizationName_fn = async () => {};
let deleteOrganization_fn = async () => {};
let addMember_fn = async () => {};
let updateMember_fn = async () => {};
let deleteMember_fn = async () => {};
let createSession_fn = async () => ({});
let updateSession_fn = async () => {};
let deleteSession_fn = async () => {};
let isUserOwner_fn = async () => true;
let addSong_fn = async () => {};
let updateSong_fn = async () => {};
let deleteSong_fn = async () => {};
let uploadCustomBackground_fn = async () => {};
let removeCustomBackground_fn = async () => {};

let checkOnlineStatus_fn = () => true;
let watchOnlineStatus_fn = () => () => {};
let syncOfflineActions_fn = async () => ({ synced: 0 });
let cacheOrganization_fn = () => {};
let getCachedOrganization_fn = () => null;
let addToOfflineQueue_fn = () => {};

let requestNotificationPermission_fn = async () => null;
let onMessageListener_fn = () => () => {};
let notifyNewSession_fn = async () => {};

if (!isDemoMode) {
  // Only load real Firebase modules when credentials are available
  const fbAuth = require('firebase/auth');
  const fbDb = require('firebase/database');
  const authModule = require('./firebase/auth');
  const dbModule = require('./firebase/database');
  const offlineModule = require('./firebase/offline');
  const notifModule = require('./firebase/notifications');

  onAuthStateChanged_fn = fbAuth.onAuthStateChanged;
  ref_fn = fbDb.ref;
  get_fn = fbDb.get;
  set_fn = fbDb.set;

  signOut_fn = authModule.signOut;
  updateUserProfile_fn = authModule.updateUserProfile;

  subscribeToOrganization_fn = dbModule.subscribeToOrganization;
  updateOrganizationName_fn = dbModule.updateOrganizationName;
  deleteOrganization_fn = dbModule.deleteOrganization;
  addMember_fn = dbModule.addMember;
  updateMember_fn = dbModule.updateMember;
  deleteMember_fn = dbModule.deleteMember;
  createSession_fn = dbModule.createSession;
  updateSession_fn = dbModule.updateSession;
  deleteSession_fn = dbModule.deleteSession;
  isUserOwner_fn = dbModule.isUserOwner;
  addSong_fn = dbModule.addSong;
  updateSong_fn = dbModule.updateSong;
  deleteSong_fn = dbModule.deleteSong;
  uploadCustomBackground_fn = dbModule.uploadCustomBackground;
  removeCustomBackground_fn = dbModule.removeCustomBackground;

  checkOnlineStatus_fn = offlineModule.checkOnlineStatus;
  watchOnlineStatus_fn = offlineModule.watchOnlineStatus;
  syncOfflineActions_fn = offlineModule.syncOfflineActions;
  cacheOrganization_fn = offlineModule.cacheOrganization;
  getCachedOrganization_fn = offlineModule.getCachedOrganization;
  addToOfflineQueue_fn = offlineModule.addToOfflineQueue;

  requestNotificationPermission_fn = notifModule.requestNotificationPermission;
  onMessageListener_fn = notifModule.onMessageListener;
  notifyNewSession_fn = notifModule.notifyNewSession;
}
/* eslint-enable import/first */

// Liste des catégories/pupitres
const PUPITRES = ['Soprano', 'Alto', 'Ténor', 'Basse', 'Instrumentistes', 'Maître de chœur'];


function App() {
  // États d'authentification et organisation
  const [isAuthenticated, setIsAuthenticated] = useState(isDemoMode);
  const [currentUser, setCurrentUser] = useState(isDemoMode ? DEMO_USER : null);
  const [hasOrganization, setHasOrganization] = useState(true); // Forced to true for single org
  const [organization, setOrganization] = useState(isDemoMode ? DEMO_ORGANIZATION : null);
  const [isOwner, setIsOwner] = useState(isDemoMode);
  const [loading, setLoading] = useState(!isDemoMode);

  // États de connexion
  const [isOnline, setIsOnline] = useState(checkOnlineStatus_fn());
  const [isSyncing, setIsSyncing] = useState(false);

  // États de navigation
  const [currentView, setCurrentView] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarLocked, setIsSidebarLocked] = useState(() => localStorage.getItem('sidebarLocked') === 'true');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  // États pour les données
  const [members, setMembers] = useState(isDemoMode ? Object.values(DEMO_ORGANIZATION.members) : []);
  const [sessions, setSessions] = useState(isDemoMode ? Object.values(DEMO_ORGANIZATION.sessions) : []);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showValidation, setShowValidation] = useState({ show: false, message: '' });
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  // États pour nouvelle session
  const [newSession, setNewSession] = useState({
    activityName: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    location: ''
  });
  const [attendances, setAttendances] = useState({});
  const [comments, setComments] = useState({});
  const [punctuality, setPunctuality] = useState({}); // À l'heure ou En retard

  // États pour nouveau membre
  const [newMember, setNewMember] = useState({
    name: '',
    pupitre: 'Soprano',
    phone: '',
    birthday: '',
    email: ''
  });

  // ==========================================
  // EFFETS - Initialisation
  // ==========================================

  // Mise à jour de l'heure en temps réel
  // Nouveaux états pour les paramètres avancés
  const [isEditingOrgName, setIsEditingOrgName] = useState(false);
  const [tempOrgName, setTempOrgName] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempDisplayName, setTempDisplayName] = useState('');
  const [profileImage, setProfileImage] = useState(localStorage.getItem('user_profile_image') || null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // ==========================================
  // FONCTIONS - Synchronisation
  // ==========================================

  const handleSync = useCallback(async () => {
    if (isDemoMode || !hasOrganization || !isOnline) return;

    setIsSyncing(true);
    try {
      const result = await syncOfflineActions_fn(
        { addMember: addMember_fn, updateMember: updateMember_fn, deleteMember: deleteMember_fn, createSession: createSession_fn, updateSession: updateSession_fn, deleteSession: deleteSession_fn, addSong: addSong_fn, updateSong: updateSong_fn, deleteSong: deleteSong_fn }
      );

      if (result.synced > 0 || result.success) {
        console.log(`✅ ${result.synced || 0} actions synchronisées`);

        // Nettoyer les données offline du localStorage après sync réussie
        localStorage.removeItem('offline_members');
        localStorage.removeItem('offline_sessions');

        // Forcer une récupération des données fraîches depuis Firebase
        if (isOnline) {
          const orgRef = ref_fn(database, 'organization');
          const snapshot = await get_fn(orgRef);
          if (snapshot.exists()) {
            const orgData = snapshot.val();
            setOrganization(orgData);
            setMembers(Object.values(orgData.members || {}));
            setSessions(Object.values(orgData.sessions || {}));
            cacheOrganization_fn('single_org', orgData);
          }
        }
      }
    } catch (error) {
      console.error('Erreur synchronisation:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [hasOrganization, isOnline]);

  // Surveillance de l'authentification
  useEffect(() => {
    if (isDemoMode) return; // Skip in demo mode – state already set

    // Timeout de sécurité pour le chargement (max 10s)
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ Initialisation Firebase prend trop de temps, forçage de l\'affichage');
        setLoading(false);
      }
    }, 10000);

    const unsubscribe = onAuthStateChanged_fn(auth, async (user) => {
      try {
        if (user) {
          setIsAuthenticated(true);
          setCurrentUser(user);
          if (user.photoURL) setProfileImage(user.photoURL);

          // Vérifier si l'utilisateur a une organisation
          try {
            const userRef = ref_fn(database, `users/${user.uid}/hasOrganization`);
            const snapshot = await get_fn(userRef);
            let hasOrg = snapshot.exists() && snapshot.val() === true;

            // --- AUTO-DETECT / SELF-HEALING ---
            if (!hasOrg) {
              const adminRef = ref_fn(database, `organization/admins/${user.uid}`);
              const adminSnapshot = await get_fn(adminRef);
              if (adminSnapshot.exists()) {
                console.log("🛠️ Auto-détection: Utilisateur trouvé dans la liste des admins. Réparation du compte...");
                hasOrg = true;
                set_fn(userRef, true);
              }
            }

            // Forced single org: always has an org
            setHasOrganization(true);

            // Si en ligne et a une organisation, tenter une sync immédiate
            if (hasOrg && navigator.onLine) {
              handleSync();
            }
          } catch (dbError) {
            console.error('Erreur lecture DB (init):', dbError);
            const cachedOrg = getCachedOrganization_fn('single_org');
            if (cachedOrg) {
              setHasOrganization(true);
            }
          }
        } else {
          setIsAuthenticated(false);
          setCurrentUser(null);
          setHasOrganization(false);
          setOrganization(null);
        }
      } catch (error) {
        console.error('Erreur Auth Change:', error);
      } finally {
        setLoading(false);
        clearTimeout(loadingTimeout);
      }
    });

    return () => {
      unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, [handleSync, loading]);

  // Surveillance du statut de connexion
  useEffect(() => {
    if (isDemoMode) return;
    const unwatch = watchOnlineStatus_fn((online) => {
      setIsOnline(online);

      if (online && hasOrganization) {
        // Synchroniser les actions offline quand on revient en ligne
        handleSync();
      }
    });
    return unwatch;
  }, [hasOrganization, isOnline, handleSync]);

  // Synchronisation en temps réel de l'organisation
  useEffect(() => {
    if (!hasOrganization || isDemoMode) return;

    if (isOnline) {
      // Mode online : écouter Firebase
      const unsubscribe = subscribeToOrganization_fn((orgData) => {
        if (orgData) {
          setOrganization(orgData);

          // Fusionner avec les données offline
          const firebaseMembers = Object.values(orgData.members || {});
          const offlineMembers = JSON.parse(localStorage.getItem('offline_members') || '[]');
          const allMembers = [...firebaseMembers, ...offlineMembers.filter(m => m.id.startsWith('offline_'))];
          setMembers(allMembers);

          const firebaseSessions = Object.values(orgData.sessions || {});
          const offlineSessions = JSON.parse(localStorage.getItem('offline_sessions') || '[]');
          const allSessions = [...firebaseSessions, ...offlineSessions.filter(s => s.id.startsWith('offline_'))];
          setSessions(allSessions);

          // Mettre en cache pour le mode offline
          cacheOrganization_fn('single_org', orgData);
        } else {
          setOrganization(prev => prev || { info: { name: "Grand Chœur Polyphonique de Bobo-Dioulasso" } });
          setHasOrganization(true);
          setMembers([]);
          setSessions([]);
        }
      });
      return unsubscribe;
    } else {
      // Mode offline : charger depuis le cache + localStorage
      const cachedData = getCachedOrganization_fn('single_org');
      if (cachedData) {
        setOrganization(cachedData);

        // Charger membres : Firebase cache + offline
        const firebaseMembers = Object.values(cachedData.members || {});
        const offlineMembers = JSON.parse(localStorage.getItem('offline_members') || '[]');
        setMembers([...firebaseMembers, ...offlineMembers]);

        // Charger sessions : Firebase cache + offline
        const firebaseSessions = Object.values(cachedData.sessions || {});
        const offlineSessions = JSON.parse(localStorage.getItem('offline_sessions') || '[]');
        setSessions([...firebaseSessions, ...offlineSessions]);
      } else {
        // Pas de cache : charger uniquement les données offline
        const offlineMembers = JSON.parse(localStorage.getItem('offline_members') || '[]');
        const offlineSessions = JSON.parse(localStorage.getItem('offline_sessions') || '[]');
        setMembers(offlineMembers);
        setSessions(offlineSessions);
      }
    }
  }, [hasOrganization, isOnline]);

  // Vérifier si l'utilisateur est owner
  useEffect(() => {
    if (isDemoMode) return; // Already set to true
    const checkOwner = async () => {
      if (hasOrganization && currentUser) {
        const owner = await isUserOwner_fn(currentUser.uid);
        setIsOwner(owner);
      }
    };
    checkOwner();
  }, [hasOrganization, currentUser]);

  // Demander permission pour les notifications
  useEffect(() => {
    if (isDemoMode) return;
    if (isAuthenticated && isOnline) {
      requestNotificationPermission_fn();
    }
  }, [isAuthenticated, isOnline]);

  // Écouter les notifications en temps réel
  useEffect(() => {
    if (isDemoMode) return;
    if (isAuthenticated) {
      const unsubscribe = onMessageListener_fn((payload) => {
        console.log('Notification reçue:', payload);
        if (payload.data?.type === 'new_session') {
          // Les données sont déjà synchronisées via subscribeToOrganization
        }
      });
      return unsubscribe;
    }
  }, [isAuthenticated, hasOrganization]);


  // ==========================================
  // FONCTIONS - Authentification
  // ==========================================

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleOrgReady = () => {
    setHasOrganization(true);
    setCurrentView('home');
  };

  const handleSignOut = async (noConfirm = false) => {
    const confirm = noConfirm || window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?');
    if (confirm) {
      try {
        await signOut_fn();
        setIsAuthenticated(false);
        setCurrentUser(null);
        setHasOrganization(false);
        setOrganization(null);
      } catch (error) {
        alert('Erreur lors de la déconnexion: ' + error.message);
      }
    }
  };

  const handleUpdateOrgName = async () => {
    if (!tempOrgName.trim()) return;
    try {
      await updateOrganizationName_fn(tempOrgName);
      setIsEditingOrgName(false);
      alert('Nom de l\'organisation mis à jour !');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteOrg = async () => {
    try {
      await deleteOrganization_fn();
      setShowValidation({ show: true, message: 'Organisation supprimée avec succès.', type: 'delete' });
      window.location.reload(); // Recharger pour réinitialiser l'état global
    } catch (error) {
      alert(error.message);
    }
  };

  const handleUpdateProfile = async () => {
    if (!tempDisplayName.trim()) return;
    try {
      await updateUserProfile_fn({
        name: tempDisplayName,
        photoURL: profileImage // Inclure la photo dans la sync Firebase
      });
      setIsEditingProfile(false);
      alert('Profil mis à jour !');
    } catch (error) {
      alert(error.message);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500000) { // Limite à 500kb
        alert('L\'image est trop lourde (max 500kb)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setProfileImage(base64String);
        localStorage.setItem('user_profile_image', base64String);
      };
      reader.readAsDataURL(file);
    }
  };


  // ==========================================
  // FONCTIONS - Gestion des membres
  // ==========================================

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMember.name.trim()) {
      alert('⚠️ Le nom du membre est obligatoire !');
      return;
    }

    try {
      const memberWithId = {
        ...newMember,
        id: 'offline_' + Date.now(), // ID temporaire pour offline
        createdAt: new Date().toISOString()
      };

      if (isDemoMode || isOnline) {
        if (!isDemoMode) await addMember_fn(newMember);
        // In demo: add directly to state
        setMembers(prev => [...prev, { ...newMember, id: 'demo_' + Date.now(), createdAt: new Date().toISOString() }]);
        setShowValidation({ show: true, message: 'Membre ajouté avec succès !' });
      } else {
        // Mode offline : ajouter immédiatement à la liste locale
        setMembers([...members, memberWithId]);

        // Sauvegarder dans localStorage
        const offlineMembers = JSON.parse(localStorage.getItem('offline_members') || '[]');
        offlineMembers.push(memberWithId);
        localStorage.setItem('offline_members', JSON.stringify(offlineMembers));

        // Ajouter à la queue pour sync future
        addToOfflineQueue_fn({
          type: 'ADD_MEMBER',
          data: newMember,
          tempId: memberWithId.id,
          id: Date.now().toString()
        });

        setShowValidation({ show: true, message: 'Membre ajouté (sera synchronisé en ligne) !' });
      }

      // Réinitialiser le formulaire
      setNewMember({
        name: '',
        pupitre: 'Soprano',
        phone: '',
        birthday: '',
        email: ''
      });
      setShowAddMemberModal(false);
    } catch (error) {
      alert('❌ Erreur: ' + error.message);
    }
  };

  const handleUpdateMember = async (updatedMember) => {
    try {
      if (isOnline) {
        await updateMember_fn(updatedMember.id, updatedMember);
        alert('✅ Informations mises à jour !');
      } else {
        addToOfflineQueue_fn({
          type: 'UPDATE_MEMBER',
          memberId: updatedMember.id,
          data: updatedMember,
          id: Date.now().toString()
        });
        alert('✅ Modifications enregistrées (synchronisation en attente) !');
      }
      setSelectedMember(null);
    } catch (error) {
      alert('❌ Erreur: ' + error.message);
    }
  };

  const handleDeleteMember = async (memberId, memberName) => {
    const confirm1 = window.confirm(
      `⚠️ Êtes-vous sûr de vouloir supprimer "${memberName}" ?\n\nCette action est irréversible.`
    );
    if (!confirm1) return;

    const confirm2 = window.confirm(
      `⚠️⚠️ CONFIRMATION FINALE ⚠️⚠️\n\nVous êtes sur le point de supprimer définitivement "${memberName}".\n\nConfirmez-vous ?`
    );
    if (!confirm2) return;

    try {
      if (isOnline) {
        await deleteMember_fn(memberId);
        setShowValidation({ show: true, message: `"${memberName}" a été supprimé.`, type: 'delete' });
      } else {
        addToOfflineQueue_fn({
          type: 'DELETE_MEMBER',
          memberId: memberId,
          id: Date.now().toString()
        });
        setShowValidation({ show: true, message: `Suppression enregistrée (synchronisation en attente).`, type: 'delete' });
      }
    } catch (error) {
      alert('❌ Erreur: ' + error.message);
    }
  };

  const viewMemberDetails = (member) => {
    setSelectedMember({ ...member, isEditing: false });
  };

  const closeMemberDetails = () => {
    setSelectedMember(null);
  };

  // ==========================================
  // FONCTIONS - Gestion des sessions
  // ==========================================

  const startNewSession = () => {
    if (!isAdmin) {
      alert("vous n'êtes pas autorisé à effectuer cette action.");
      return;
    }
    setCurrentView('newSession');
    setNewSession({
      activityName: '',
      date: new Date().toISOString().split('T')[0],
      startTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      endTime: '',
      location: ''
    });

    const initialAttendances = {};
    members.forEach(member => {
      initialAttendances[member.id] = null;
    });
    setAttendances(initialAttendances);
    setComments({});
    setPunctuality({});
  };

  const handleAttendanceChange = (memberId, status) => {
    setAttendances(prev => ({ ...prev, [memberId]: status }));
    // Reset punctuality and comment if status changes from 'present' or to 'present'
    if (status !== 'present') {
      setPunctuality(prev => {
        const newPunctuality = { ...prev };
        delete newPunctuality[memberId];
        return newPunctuality;
      });
    } else {
      // Default punctuality to 'on_time' when marked present
      setPunctuality(prev => ({ ...prev, [memberId]: 'on_time' }));
    }
    if (status === 'present') {
      setComments(prev => {
        const newComments = { ...prev };
        delete newComments[memberId];
        return newComments;
      });
    }
  };

  const handlePunctualityChange = (memberId, status) => {
    setPunctuality(prev => ({ ...prev, [memberId]: status }));
  };

  const handleSaveSession = async () => {
    // Validations
    if (!newSession.activityName || newSession.activityName.trim() === '') {
      alert('⚠️ Le nom de l\'activité est obligatoire !');
      return;
    }
    if (!newSession.location || newSession.location.trim() === '') {
      alert('⚠️ Le lieu est obligatoire !');
      return;
    }
    if (!newSession.startTime || newSession.startTime.trim() === '') {
      alert('⚠️ L\'heure de début est obligatoire !');
      return;
    }

    const allAttendancesMarked = members.every(member => attendances[member.id] !== null);
    if (!allAttendancesMarked) {
      alert('⚠️ Vous devez cocher une case pour CHAQUE membre !');
      return;
    }

    let endTime = newSession.endTime;
    if (!endTime && newSession.startTime) {
      const [hours, minutes] = newSession.startTime.split(':');
      const endHour = (parseInt(hours) + 4) % 24;
      endTime = `${String(endHour).padStart(2, '0')}:${minutes}`;
    }

    const sessionData = {
      ...newSession,
      endTime,
      attendances,
      comments,
      punctuality
    };

    try {
      if (isDemoMode || isOnline) {
        // Demo mode: save locally; online mode: save to Firebase
        const sessionWithId = {
          ...sessionData,
          id: (isDemoMode ? 'demo_' : 'sess_') + Date.now(),
          createdBy: currentUser?.uid || 'demo_user',
          createdByName: currentUser?.displayName || 'Démo',
          createdAt: new Date().toISOString()
        };
        if (!isDemoMode) {
          const result = await createSession_fn(sessionData);
          await notifyNewSession_fn(result.session);
        } else {
          setSessions(prev => [...prev, sessionWithId]);
        }
        setShowValidation({ show: true, message: 'Session enregistrée avec succès !' });
      } else {
        // Mode offline : ajouter immédiatement à la liste locale
        const sessionWithId = {
          ...sessionData,
          id: 'offline_' + Date.now(),
          createdBy: currentUser?.uid || 'offline_user',
          createdByName: currentUser?.displayName || 'Offline User',
          createdAt: new Date().toISOString()
        };

        setSessions([...sessions, sessionWithId]);

        // Sauvegarder dans localStorage
        const offlineSessions = JSON.parse(localStorage.getItem('offline_sessions') || '[]');
        offlineSessions.push(sessionWithId);
        localStorage.setItem('offline_sessions', JSON.stringify(offlineSessions));

        // Ajouter à la queue
        addToOfflineQueue_fn({
          type: 'CREATE_SESSION',
          data: sessionData,
          tempId: sessionWithId.id,
          id: Date.now().toString()
        });

        setShowValidation({ show: true, message: 'Session enregistrée (sera synchronisée en ligne) !' });
      }
      setCurrentView('home');
    } catch (error) {
      alert('❌ Erreur: ' + error.message);
    }
  };

  const viewSessionDetails = (session) => {
    setSelectedSession(session);
  };

  const closeSessionDetails = () => {
    setSelectedSession(null);
  };

  // ==========================================
  // FONCTIONS - Thème et Répertoire
  // ==========================================

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleAddSong = async (songData) => {
    try {
      // Update local org state (demo: only local; online: Firebase will sync back)
      const tempId = songData.id || ('song_' + Date.now());
      const currentRepertoire = organization?.repertoire || {};
      const updatedRepertoire = { ...currentRepertoire, [tempId]: { ...songData, id: tempId } };
      const updatedOrg = { ...organization, repertoire: updatedRepertoire };
      setOrganization(updatedOrg);

      if (!isDemoMode && isOnline) {
        await addSong_fn(songData);
      } else if (!isDemoMode) {
        cacheOrganization_fn('single_org', updatedOrg);
        addToOfflineQueue_fn({ type: 'ADD_SONG', data: songData, tempId, id: Date.now().toString() });
        alert('✅ Chant enregistré hors-ligne (sera synchronisé) !');
      }
    } catch (err) {
      alert('Erreur lors de l\'ajout du chant : ' + err.message);
    }
  };

  const handleUpdateSong = async (songId, songData) => {
    try {
      const currentRepertoire = organization?.repertoire || {};
      const updatedRepertoire = { ...currentRepertoire, [songId]: songData };
      const updatedOrg = { ...organization, repertoire: updatedRepertoire };
      setOrganization(updatedOrg);

      if (!isDemoMode && isOnline) {
        await updateSong_fn(songId, songData);
      } else if (!isDemoMode) {
        cacheOrganization_fn('single_org', updatedOrg);
        addToOfflineQueue_fn({ type: 'UPDATE_SONG', songId, data: songData, id: Date.now().toString() });
        alert('✅ Modification enregistrée hors-ligne (sera synchronisée) !');
      }
    } catch (err) {
      alert('Erreur lors de la modification : ' + err.message);
    }
  };

  const handleDeleteSong = async (songId, songData) => {
    try {
      const currentRepertoire = organization?.repertoire || {};
      const updatedRepertoire = { ...currentRepertoire };
      delete updatedRepertoire[songId];
      const updatedOrg = { ...organization, repertoire: updatedRepertoire };
      setOrganization(updatedOrg);

      if (!isDemoMode && isOnline) {
        await deleteSong_fn(songId, songData);
      } else if (!isDemoMode) {
        cacheOrganization_fn('single_org', updatedOrg);
        addToOfflineQueue_fn({ type: 'DELETE_SONG', songId, data: songData, id: Date.now().toString() });
        setShowValidation({ show: true, message: 'Suppression enregistrée hors-ligne (sera synchronisée) !', type: 'delete' });
      }
    } catch (err) {
      alert('Erreur lors de la suppression : ' + err.message);
    }
  };

  const handleUploadBackground = async (themeType, file) => {
    if (!file) return;
    if (isDemoMode) { alert('⚠️ Fond d\'écran non disponible en mode démo.'); return; }
    try {
      const url = await uploadCustomBackground_fn(themeType, file);
      alert(`✅ Fond d'écran ${themeType === 'dark' ? 'sombre' : 'clair'} mis à jour !`);
      return url;
    } catch (error) {
      alert('Erreur lors du téléversement : ' + error.message);
    }
  };

  const handleRemoveBackground = async (themeType) => {
    const confirm = window.confirm(`Supprimer le fond d'écran personnalisé (${themeType === 'dark' ? 'sombre' : 'clair'}) ?`);
    if (!confirm) return;
    if (isDemoMode) { alert('⚠️ Non disponible en mode démo.'); return; }
    try {
      await removeCustomBackground_fn(themeType);
      setShowValidation({ show: true, message: `Fond d'écran ${themeType === 'dark' ? 'sombre' : 'clair'} supprimé !`, type: 'delete' });
    } catch (error) {
      alert('Erreur lors de la suppression : ' + error.message);
    }
  };

  // ==========================================
  // FONCTIONS - Export
  // ==========================================

  const exportToExcel = () => {
    const data = [];

    data.push(['Historique des présences - ' + (organization?.info?.name || 'Grand Chœur Polyphonique de Bobo-Dioulasso')]);
    data.push([]);

    sessions.forEach(session => {
      data.push([
        `Activité: ${session.activityName}`,
        `Date: ${session.date}`,
        `Heure: ${session.startTime} - ${session.endTime}`,
        `Lieu: ${session.location}`
      ]);
      data.push(['Nom', 'Pupitre', 'Statut', 'Ponctualité', 'Commentaire']);

      members.forEach(member => {
        const status = session.attendances?.[member.id];
        const statusText = status === 'present' ? 'Présent' :
          status === 'justified' ? 'Absent justifié' :
            status === 'unjustified' ? 'Absent non justifié' : 'Non renseigné';

        const punctuality = session.punctuality?.[member.id];
        const punctualityText = status === 'present' ?
          (punctuality === 'late' ? 'En retard' : 'À l\'heure') : '';

        const comment = session.comments?.[member.id] || '';

        data.push([member.name, member.pupitre, statusText, punctualityText, comment]);
      });

      data.push([]);
    });

    data.push(['STATISTIQUES GLOBALES']);
    data.push([]);
    data.push(['Membre', 'Pupitre', 'Taux', 'Présences', 'Absences just.', 'Absences non just.']);

    members.forEach(member => {
      let present = 0, justified = 0, unjustified = 0;

      sessions.forEach(session => {
        const status = session.attendances?.[member.id];
        if (status === 'present') present++;
        else if (status === 'justified') justified++;
        else if (status === 'unjustified') unjustified++;
      });

      const total = present + justified + unjustified;
      const rate = total > 0 ? ((present / total) * 100).toFixed(1) + '%' : 'N/A';

      data.push([member.name, member.pupitre, rate, present, justified, unjustified]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Présences');
    XLSX.writeFile(wb, `presences_${organization?.info?.name}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const orgName = organization?.info?.name || 'Grand Chœur Polyphonique de Bobo-Dioulasso';
    let htmlContent = `
      <html>
      <head>
        <meta charset="utf-8">
        <title>Historique - ${orgName}</title>
        <style>
          body { font-family: Arial; margin: 20px; background: #2a2a2a; color: #e5e5e5; }
          h1 { color: #00d4ff; text-align: center; }
          h2 { color: #6b5dd3; margin-top: 30px; border-bottom: 2px solid #6b5dd3; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 10px; text-align: left; border: 1px solid #555; }
          th { background: linear-gradient(135deg, #6b5dd3 0%, #00d4ff 100%); color: white; }
          .session-header { background-color: #3a3a3a; padding: 10px; margin: 20px 0; border-left: 4px solid #00d4ff; }
          .present { color: #059669; font-weight: bold; }
          .justified { color: #f59e0b; font-weight: bold; }
          .unjustified { color: #ef4444; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Historique des présences - ${orgName}</h1>
    `;

    sessions.forEach(session => {
      htmlContent += `
        <div class="session-header">
          <h3>${session.activityName}</h3>
          <p><strong>Date:</strong> ${session.date} | <strong>Heure:</strong> ${session.startTime} - ${session.endTime} | <strong>Lieu:</strong> ${session.location}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Pupitre</th>
              <th>Statut</th>
              <th>Commentaire</th>
            </tr>
          </thead>
          <tbody>
      `;

      members.forEach(member => {
        const status = session.attendances?.[member.id];
        let statusText = 'Non renseigné';
        let statusClass = '';

        if (status === 'present') {
          const punctuality = session.punctuality?.[member.id];
          statusText = punctuality === 'late' ? 'Présent (En retard)' : 'Présent (À l\'heure)';
          statusClass = 'present';
        } else if (status === 'justified') {
          statusText = 'Absent justifié';
          statusClass = 'justified';
        } else if (status === 'unjustified') {
          statusText = 'Absent non justifié';
          statusClass = 'unjustified';
        }

        const comment = session.comments?.[member.id] || '';

        htmlContent += `
          <tr>
            <td>${member.name}</td>
            <td>${member.pupitre}</td>
            <td class="${statusClass}">${statusText}</td>
            <td>${comment}</td>
          </tr>
        `;
      });

      htmlContent += `
          </tbody>
        </table>
      `;
    });

    htmlContent += `
      <h2>STATISTIQUES GLOBALES</h2>
      <table>
        <thead>
          <tr>
            <th>Membre</th>
            <th>Pupitre</th>
            <th>Taux</th>
            <th>Présences</th>
            <th>Abs. Just.</th>
            <th>Abs. Non Just.</th>
          </tr>
        </thead>
        <tbody>
    `;

    members.forEach(member => {
      let present = 0, justified = 0, unjustified = 0;

      sessions.forEach(session => {
        const status = session.attendances?.[member.id];
        if (status === 'present') present++;
        else if (status === 'justified') justified++;
        else if (status === 'unjustified') unjustified++;
      });

      const total = present + justified + unjustified;
      const rate = total > 0 ? ((present / total) * 100).toFixed(1) + '%' : 'N/A';

      htmlContent += `
        <tr>
          <td>${member.name}</td>
          <td>${member.pupitre}</td>
          <td>${rate}</td>
          <td>${present}</td>
          <td>${justified}</td>
          <td>${unjustified}</td>
        </tr>
      `;
    });

    htmlContent += `
        </tbody>
      </table>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // ==========================================
  // FONCTIONS - Statistiques
  // ==========================================

  const getStats = () => {
    const stats = {
      totalSessions: sessions.length,
      byPupitre: {},
      allMembers: []
    };

    PUPITRES.forEach(pupitre => {
      const pupitreMembers = members.filter(m => m.pupitre === pupitre);
      let totalPresent = 0;
      let totalPossible = pupitreMembers.length * sessions.length;

      sessions.forEach(session => {
        pupitreMembers.forEach(member => {
          if (session.attendances?.[member.id] === 'present') {
            totalPresent++;
          }
        });
      });

      stats.byPupitre[pupitre] = totalPossible > 0 ? ((totalPresent / totalPossible) * 100).toFixed(1) : 0;
    });

    const memberStats = members.map(member => {
      let present = 0;
      let total = 0;

      sessions.forEach(session => {
        const status = session.attendances?.[member.id];
        if (status) {
          total++;
          if (status === 'present') present++;
        }
      });

      return {
        name: member.name,
        pupitre: member.pupitre,
        rate: total > 0 ? parseFloat(((present / total) * 100).toFixed(1)) : 0,
        present,
        total
      };
    });

    stats.allMembers = memberStats.sort((a, b) => b.rate - a.rate);

    return stats;
  };

  // ==========================================
  // FONCTIONS - Utilitaires
  // ==========================================

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const isAdmin = isOwner || (organization?.admins?.[currentUser?.uid]?.role === 'admin');

  // Custom background URL for current theme
  const customBgUrl = organization?.info?.[`customBg_${theme}`];

  const timeString = currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const dateString = currentTime.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // ==========================================
  // RENDU - Écrans principaux
  // ==========================================

  // Loading
  if (loading) {
    return (
      <div className="App">
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Initialisation AttendFlow...</p>
          {!isOnline && <p className="offline-warning">Mode hors-ligne détecté</p>}
        </div>
      </div>
    );
  }

  // Non authentifié : écran de connexion
  if (!isAuthenticated) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} isOnline={isOnline} />;
  }

  // App is now single org by default, bypassing SingleOrgManager
  // (No 'if (!hasOrganization)' block)

  // Application principale
  return (
    <div className={`App ${theme}-theme`} style={{ backgroundImage: `url(${customBgUrl || `/assets/default_bg_${theme}.png`})` }}>
      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="demo-banner">
          🎭 <strong>MODE DÉMO</strong> — Données fictives · Aucune connexion Firebase requise ·{' '}
          <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer">Configurer Firebase →</a>
        </div>
      )}

      {/* Lock/Unlock sidebar button (PC only) */}
      <button
        className={`sidebar-lock-btn ${isSidebarLocked ? 'locked' : ''}`}
        onClick={() => {
          const newVal = !isSidebarLocked;
          setIsSidebarLocked(newVal);
          localStorage.setItem('sidebarLocked', String(newVal));
        }}
        title={isSidebarLocked ? 'Libérer la barre latérale' : 'Fixer la barre latérale'}
      >
        {isSidebarLocked ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
        )}
      </button>

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''} ${isSidebarLocked ? 'locked' : ''}`}>
        <button
          onClick={() => { setCurrentView('home'); setSidebarOpen(false); }}
          className={currentView === 'home' ? 'active' : ''}
        >
          <span className="sidebar-btn-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></span>
          Accueil
        </button>
        <button
          onClick={() => { setCurrentView('members'); setSidebarOpen(false); }}
          className={currentView === 'members' ? 'active' : ''}
        >
          <span className="sidebar-btn-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
          Membres
        </button>
        <button
          onClick={() => { setCurrentView('history'); setSidebarOpen(false); }}
          className={currentView === 'history' ? 'active' : ''}
        >
          <span className="sidebar-btn-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>
          Historique
        </button>
        <button
          onClick={() => { setCurrentView('stats'); setSidebarOpen(false); }}
          className={currentView === 'stats' ? 'active' : ''}
        >
          <span className="sidebar-btn-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></span>
          Statistiques
        </button>
        <button
          onClick={() => { setCurrentView('repertoire'); setSidebarOpen(false); }}
          className={currentView === 'repertoire' ? 'active' : ''}
        >
          <span className="sidebar-btn-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></span>
          Répertoire
        </button>
        <button
          onClick={() => { setCurrentView('settings'); setSidebarOpen(false); }}
          className={currentView === 'settings' ? 'active' : ''}
        >
          <span className="sidebar-btn-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></span>
          Paramètres
        </button>
      </div>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <div className="user-avatar">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt={currentUser.displayName} />
            ) : (
              <div className="avatar-placeholder-small">
                {getInitials(currentUser?.displayName || currentUser?.email || '?')}
              </div>
            )}
          </div>
          <div className="welcome-user">
            <span className="welcome-text">Bienvenu</span>
            <span className="welcome-name">{currentUser?.displayName || currentUser?.email || 'Admin'}</span>
          </div>
        </div>
        <div className="header-center">
          <span className="org-name">{organization?.info?.name || 'Grand Chœur Polyphonique de Bobo-Dioulasso'}</span>
        </div>
        <div className="header-right">
          <div className="header-time-info">
            <button className="theme-toggle-btn" onClick={toggleTheme} title="Changer le thème">
              {theme === 'dark' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
            <span className="current-time">{timeString}</span>
            <span className="current-date">[{dateString}]</span>
          </div>
          <div className="logo-status-row">
            <ConnectionStatus isOnline={isOnline} pendingSync={isSyncing} />
            <div className="logo-box">
              <span className="logo-text">logo</span>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main with-sidebar">
        {/* Vue Accueil */}
        {currentView === 'home' && (
          <div className="home-view">
            <h2 className="welcome-title">Bienvenue</h2>
            <div className="quick-stats">
              <div
                className="stat-card-dark clickable"
                onClick={() => setCurrentView('members')}
              >
                <h3>{members.length}</h3>
                <p>Membres</p>
              </div>
              <div
                className="stat-card-dark clickable"
                onClick={() => setCurrentView('history')}
              >
                <h3>{sessions.length}</h3>
                <p>sessions enregistrées</p>
              </div>
            </div>
            <div className="home-actions">
              <button onClick={startNewSession} className="btn-primary btn-large">
                + nouvelle session
              </button>
              <button onClick={() => setCurrentView('repertoire')} className="btn-secondary btn-large">
                Voir le répertoire
              </button>
            </div>
          </div>
        )}

        {/* Vue Nouvelle Session */}
        {currentView === 'newSession' && (
          <div className="session-view">
            <div className="view-header">
              <button onClick={() => setCurrentView('home')} className="btn-back">
                ← Retour
              </button>
              <h2>Nouvelle session</h2>
            </div>
            <div className="session-form">
              <div className="form-group">
                <label>Type d'activité <span className="required">*</span> :</label>
                <input
                  type="text"
                  value={newSession.activityName}
                  onChange={(e) => setNewSession({ ...newSession, activityName: e.target.value })}
                  placeholder="Ex: Répétition, Concert..."
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date :</label>
                  <input
                    type="date"
                    value={newSession.date}
                    onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Heure début <span className="required">*</span> :</label>
                  <input
                    type="time"
                    value={newSession.startTime}
                    onChange={(e) => setNewSession({ ...newSession, startTime: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Heure fin :</label>
                  <input
                    type="time"
                    value={newSession.endTime}
                    onChange={(e) => setNewSession({ ...newSession, endTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Lieu <span className="required">*</span> :</label>
                <input
                  type="text"
                  value={newSession.location}
                  onChange={(e) => setNewSession({ ...newSession, location: e.target.value })}
                  placeholder="Ex: Salle paroissiale..."
                  required
                />
              </div>
            </div>

            <h3>Présences <span className="required">*</span></h3>
            {PUPITRES.map(pupitre => {
              const pupitreMembers = members.filter(m => m.pupitre === pupitre);
              if (pupitreMembers.length === 0) return null;

              return (
                <div key={pupitre} className="pupitre-section">
                  <h4>{pupitre}</h4>
                  {pupitreMembers.map(member => (
                    <div key={member.id} className="attendance-row">
                      <span className="member-name">{member.name}</span>
                      <div className="attendance-buttons">
                        <div className="attendance-group">
                          <button
                            className={`btn-attendance present ${attendances[member.id] === 'present' ? 'active' : ''}`}
                            onClick={() => handleAttendanceChange(member.id, 'present')}
                          >
                            Présent
                          </button>

                          {attendances[member.id] === 'present' && (
                            <div className="punctuality-sub-buttons">
                              <button
                                className={`btn-punctuality ${punctuality[member.id] === 'on_time' ? 'active' : ''}`}
                                onClick={() => handlePunctualityChange(member.id, 'on_time')}
                              >
                                🕒 À l'heure
                              </button>
                              <button
                                className={`btn-punctuality ${punctuality[member.id] === 'late' ? 'active' : ''}`}
                                onClick={() => handlePunctualityChange(member.id, 'late')}
                              >
                                🏃 En retard
                              </button>
                            </div>
                          )}
                        </div>

                        <button
                          className={`btn-attendance justified ${attendances[member.id] === 'justified' ? 'active' : ''}`}
                          onClick={() => handleAttendanceChange(member.id, 'justified')}
                        >
                          Justifié
                        </button>
                        <button
                          className={`btn-attendance unjustified ${attendances[member.id] === 'unjustified' ? 'active' : ''}`}
                          onClick={() => handleAttendanceChange(member.id, 'unjustified')}
                        >
                          Absent
                        </button>
                      </div>
                      {/* Commentaire sous Justifié/Non justifié */}
                      {(attendances[member.id] === 'justified' || attendances[member.id] === 'unjustified') && (
                        <input
                          type="text"
                          className="comment-input"
                          placeholder="Commentaire (optionnel)..."
                          value={comments[member.id] || ''}
                          onChange={(e) => setComments({ ...comments, [member.id]: e.target.value })}
                        />
                      )}
                    </div>
                  ))}
                </div>
              );
            })}

            <div className="form-actions">
              <button onClick={() => setCurrentView('home')} className="btn-secondary">
                Annuler
              </button>
              <button onClick={handleSaveSession} className="btn-primary">
                Enregistrer la session
              </button>
            </div>
          </div>
        )}

        {/* Vue Membres */}
        {currentView === 'members' && (
          <div className="members-view">
            <h2>Gestion des membres</h2>

            <button
              onClick={() => setShowAddMemberModal(true)}
              className="btn-primary"
              style={{ marginBottom: '25px' }}
            >
              ➕ Ajouter un membre
            </button>

            <div className="members-list">
              {PUPITRES.map(pupitre => {
                const pupitreMembers = members.filter(m => m.pupitre === pupitre);
                if (pupitreMembers.length === 0) return null;

                return (
                  <div key={pupitre} className="pupitre-group">
                    <h3>{pupitre} ({pupitreMembers.length})</h3>
                    {pupitreMembers.map(member => (
                      <div key={member.id} className="member-item-new">
                        <span className="member-name-text" onClick={() => viewMemberDetails(member)}>{member.name}</span>
                        <div className="member-actions-vertical">
                          <button onClick={() => viewMemberDetails(member)} className="btn-details">
                            📋 Détails
                          </button>
                          <button onClick={() => handleDeleteMember(member.id, member.name)} className="btn-delete">
                            🗑️ Supprimer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Vue Historique */}
        {currentView === 'history' && (
          <div className="history-view">
            <h2>Historique des sessions</h2>
            <div className="export-buttons">
              <button onClick={exportToExcel} className="btn-primary">
                📊 Exporter vers Excel
              </button>
              <button onClick={exportToPDF} className="btn-primary">
                📄 Exporter vers PDF
              </button>
            </div>
            {sessions.length === 0 ? (
              <p className="empty-state">Aucune session enregistrée.</p>
            ) : (
              <div className="sessions-list">
                {[...sessions].reverse().map(session => (
                  <div
                    key={session.id}
                    className="session-card"
                    onClick={() => viewSessionDetails(session)}
                  >
                    <div className="session-header">
                      <h3>{session.activityName}</h3>
                      <span className="session-date">{session.date}</span>
                    </div>
                    <div className="session-info">
                      <span>⏰ {session.startTime} - {session.endTime}</span>
                      <span>📍 {session.location}</span>
                    </div>
                    <div className="session-summary">
                      {(() => {
                        let present = 0, justified = 0, unjustified = 0, late = 0;
                        Object.entries(session.attendances || {}).forEach(([id, status]) => {
                          if (status === 'present') {
                            present++;
                            if (session.punctuality?.[id] === 'late') late++;
                          }
                          else if (status === 'justified') justified++;
                          else if (status === 'unjustified') unjustified++;
                        });
                        return (
                          <>
                            <span className="stat-present">✓ {present}</span>
                            {late > 0 && <span className="stat-late">🏃 {late}</span>}
                            <span className="stat-justified">⚠ {justified}</span>
                            <span className="stat-unjustified">✗ {unjustified}</span>
                          </>
                        );
                      })()}
                    </div>
                    <p className="click-hint">👆 Cliquez pour les détails</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Vue Statistiques */}
        {currentView === 'stats' && (
          <div className="stats-view">
            <h2>Statistiques</h2>
            {sessions.length === 0 ? (
              <p className="empty-state">Pas encore de données.</p>
            ) : (
              <>
                <div className="stats-cards">
                  <div className="stat-card">
                    <h3>{sessions.length}</h3>
                    <p>Sessions totales</p>
                  </div>
                  {Object.entries(getStats().byPupitre).map(([pupitre, rate]) => (
                    rate > 0 && (
                      <div key={pupitre} className="stat-card">
                        <h3>{rate}%</h3>
                        <p>{pupitre}</p>
                      </div>
                    )
                  ))}
                </div>

                <h3>Classement (du plus au moins assidu)</h3>
                <div className="top-members">
                  {getStats().allMembers.map((member, index) => (
                    <div key={index} className="top-member-item">
                      <span className="rank">#{index + 1}</span>
                      <span className="name">{member.name}</span>
                      <span className="pupitre">{member.pupitre}</span>
                      <span className="rate">{member.rate}%</span>
                      <span className="detail">({member.present}/{member.total})</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Vue Répertoire */}
        {currentView === 'repertoire' && (
          <RepertoireView
            organization={organization}
            isOnline={isOnline}
            isAdmin={isAdmin}
            isOwner={isOwner}
            onAddSong={handleAddSong}
            onUpdateSong={handleUpdateSong}
            onDeleteSong={handleDeleteSong}
          />
        )}

        {/* Vue Paramètres */}
        {currentView === 'settings' && (
          <div className="settings-view">
            <h2>⚙️ Paramètres</h2>

            <div className="settings-section">
              <h3>🏢 Organisation</h3>
              <div className="settings-card">
                <div className="settings-item-row">
                  <div>
                    <p><strong>Nom :</strong> {isEditingOrgName ? (
                      <input
                        type="text"
                        value={tempOrgName}
                        onChange={(e) => setTempOrgName(e.target.value)}
                        className="edit-input"
                      />
                    ) : (
                      organization?.info?.name
                    )}</p>
                    <p><strong>Code d'invitation :</strong> {organization?.info?.inviteCode}</p>
                  </div>
                  {/* N'importe quel admin peut modifier le nom */}
                  {(isOwner || organization?.admins?.[currentUser?.uid]?.role === 'admin') && (
                    <div className="item-actions">
                      {isEditingOrgName ? (
                        <>
                          <button onClick={handleUpdateOrgName} className="btn-save-small">💾</button>
                          <button onClick={() => setIsEditingOrgName(false)} className="btn-cancel-small">✕</button>
                        </>
                      ) : (
                        <button onClick={() => {
                          setTempOrgName(organization?.info?.name || '');
                          setIsEditingOrgName(true);
                        }} className="btn-edit-small">✏️</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {(isOwner || isAdmin) && (
              <div className="settings-section">
                <h3>🎨 Fonds d'écran personnalisés</h3>
                <div className="settings-card">
                  <div className="bg-settings-grid">
                    {/* Fond sombre */}
                    <div className="bg-setting-card">
                      <h4>🌙 Thème Sombre</h4>
                      <div
                        className="bg-preview-thumbnail"
                        style={organization?.info?.customBg_dark
                          ? { backgroundImage: `url(${organization.info.customBg_dark})` }
                          : {}}
                      >
                        {!organization?.info?.customBg_dark && 'Par défaut'}
                      </div>
                      <label className="btn-upload-bg">
                        📤 Choisir une image
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => handleUploadBackground('dark', e.target.files[0])}
                          disabled={!isOnline}
                        />
                      </label>
                      {organization?.info?.customBg_dark && (
                        <button onClick={() => handleRemoveBackground('dark')} className="btn-remove-bg" disabled={!isOnline}>
                          🗑️ Supprimer
                        </button>
                      )}
                    </div>
                    {/* Fond clair */}
                    <div className="bg-setting-card">
                      <h4>☀️ Thème Clair</h4>
                      <div
                        className="bg-preview-thumbnail"
                        style={organization?.info?.customBg_light
                          ? { backgroundImage: `url(${organization.info.customBg_light})` }
                          : {}}
                      >
                        {!organization?.info?.customBg_light && 'Par défaut'}
                      </div>
                      <label className="btn-upload-bg">
                        📤 Choisir une image
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => handleUploadBackground('light', e.target.files[0])}
                          disabled={!isOnline}
                        />
                      </label>
                      {organization?.info?.customBg_light && (
                        <button onClick={() => handleRemoveBackground('light')} className="btn-remove-bg" disabled={!isOnline}>
                          🗑️ Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="settings-section">
              <h3>👤 Mon compte</h3>
              <div className="settings-card profile-settings">
                <div className="profile-image-section">
                  <div className="profile-avatar-large">
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" />
                    ) : (
                      <div className="avatar-placeholder-large">
                        {getInitials(currentUser?.displayName || currentUser?.email || '?')}
                      </div>
                    )}
                  </div>
                  <label className="image-upload-label">
                    📷 Changer la photo
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                  </label>
                </div>

                <div className="profile-info-section">
                  <div className="settings-item-row">
                    <div>
                      <p><strong>Nom :</strong> {isEditingProfile ? (
                        <input
                          type="text"
                          value={tempDisplayName}
                          onChange={(e) => setTempDisplayName(e.target.value)}
                          className="edit-input"
                        />
                      ) : (
                        currentUser?.displayName || 'Non renseigné'
                      )}</p>
                      <p><strong>Email :</strong> {currentUser?.email || 'Connecté via code'}</p>
                    </div>
                    <div className="item-actions">
                      {isEditingProfile ? (
                        <>
                          <button onClick={handleUpdateProfile} className="btn-save-small">💾</button>
                          <button onClick={() => setIsEditingProfile(false)} className="btn-cancel-small">✕</button>
                        </>
                      ) : (
                        <button onClick={() => {
                          setTempDisplayName(currentUser?.displayName || '');
                          setIsEditingProfile(true);
                        }} className="btn-edit-small">✏️</button>
                      )}
                    </div>
                  </div>
                  <button onClick={handleSignOut} className="btn-secondary btn-full">
                    🚪 Se déconnecter
                  </button>
                </div>
              </div>
            </div>

            {isOwner && (
              <>
                <div className="settings-section">
                  <h3>👥 Gestion des administrateurs</h3>
                  <AdminManager
                    organization={organization}
                    currentUserId={currentUser?.uid}
                    onAdminRemoved={() => { }}
                  />
                </div>

                <div className="settings-section danger-zone">
                  <h3>🚨 Zone de Danger</h3>
                  <div className="settings-card danger-card">
                    <p>La suppression de l'organisation effacera définitivement tous les membres, sessions et paramètres.</p>
                    {!showDeleteConfirm ? (
                      <button onClick={() => setShowDeleteConfirm(true)} className="btn-danger">
                        🗑️ Supprimer l'organisation
                      </button>
                    ) : (
                      <div className="delete-confirm-actions">
                        <p><strong>Êtes-vous sûr ? Cette action est irréversible.</strong></p>
                        <button onClick={handleDeleteOrg} className="btn-danger-confirm">
                          🔥 Confirmer la suppression
                        </button>
                        <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary">
                          Annuler
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation Mobile */}
      <nav className="bottom-nav">
        <button
          className={`bottom-nav-item ${currentView === 'home' ? 'active' : ''}`}
          onClick={() => setCurrentView('home')}
        >
          <span className="nav-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></span>
          <span>Accueil</span>
        </button>
        <button
          className={`bottom-nav-item ${currentView === 'members' ? 'active' : ''}`}
          onClick={() => setCurrentView('members')}
        >
          <span className="nav-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
          <span>Membres</span>
        </button>

        <button
          className={`bottom-nav-item ${currentView === 'history' ? 'active' : ''}`}
          onClick={() => setCurrentView('history')}
        >
          <span className="nav-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>
          <span>Historique</span>
        </button>
        <button
          className={`bottom-nav-item ${currentView === 'stats' ? 'active' : ''}`}
          onClick={() => setCurrentView('stats')}
        >
          <span className="nav-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></span>
          <span>Stats</span>
        </button>
        <button
          className={`bottom-nav-item ${currentView === 'settings' ? 'active' : ''}`}
          onClick={() => setCurrentView('settings')}
        >
          <span className="nav-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></span>
          <span>Paramètres</span>
        </button>
      </nav>

      <footer className="app-footer"></footer>

      {/* Modal Détails de session */}
      {selectedSession && (
        <div className="modal-overlay" onClick={closeSessionDetails}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📋 Détails de la session</h2>
              <button className="modal-close" onClick={closeSessionDetails}>✕</button>
            </div>
            <div className="modal-body">
              <div className="session-details-header">
                <h3>{selectedSession.activityName}</h3>
                <p>📅 {selectedSession.date}</p>
                <p>⏰ {selectedSession.startTime} - {selectedSession.endTime}</p>
                <p>📍 {selectedSession.location}</p>
              </div>

              <h4>Liste des présences</h4>
              <div className="attendance-details">
                {PUPITRES.map(pupitre => {
                  const pupitreMembers = members.filter(m => m.pupitre === pupitre);
                  const relevantMembers = pupitreMembers.filter(m => selectedSession.attendances?.[m.id]);

                  if (relevantMembers.length === 0) return null;

                  return (
                    <div key={pupitre} className="detail-pupitre-section">
                      <h5>{pupitre}</h5>
                      {relevantMembers.map(member => {
                        const status = selectedSession.attendances[member.id];
                        const isLate = status === 'present' && selectedSession.punctuality?.[member.id] === 'late';
                        const isOnTime = status === 'present' && selectedSession.punctuality?.[member.id] === 'on_time';

                        const statusText = isLate ? 'En retard' :
                          isOnTime ? 'À l\'heure' :
                            status === 'present' ? 'Présent' :
                              status === 'justified' ? 'Absent justifié' :
                                'Absent non justifié';

                        const statusClass = isLate ? 'status-late' :
                          isOnTime ? 'status-present' :
                            status === 'present' ? 'status-present' :
                              status === 'justified' ? 'status-justified' :
                                'status-unjustified';
                        const comment = selectedSession.comments?.[member.id];

                        return (
                          <div key={member.id} className="detail-member-row">
                            <span className="detail-member-name">{member.name}</span>
                            <span className={`detail-status ${statusClass}`}>{statusText}</span>
                            {comment && <span className="detail-comment">💬 {comment}</span>}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={closeSessionDetails} className="btn-primary">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Détails membre */}
      {selectedMember && (
        <MemberDetailsModal
          member={selectedMember}
          onClose={closeMemberDetails}
          onUpdate={handleUpdateMember}
        />
      )}

      {/* Modal Ajout membre */}
      {showAddMemberModal && (
        <div className="modal-overlay" onClick={() => setShowAddMemberModal(false)}>
          <div className="modal-content modal-member" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Ajouter un membre</h2>
              <button className="modal-close" onClick={() => setShowAddMemberModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddMember} className="member-form-modal">
                <div className="form-group">
                  <label>Nom <span className="required">*</span> :</label>
                  <input
                    type="text"
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    placeholder="Nom du membre"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Pupitre :</label>
                  <select value={newMember.pupitre} onChange={(e) => setNewMember({ ...newMember, pupitre: e.target.value })}>
                    {PUPITRES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Téléphone :</label>
                  <input
                    type="tel"
                    value={newMember.phone}
                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
                <div className="form-group">
                  <label>Anniversaire (JJ/MM) :</label>
                  <input
                    type="text"
                    value={newMember.birthday}
                    onChange={(e) => setNewMember({ ...newMember, birthday: e.target.value })}
                    placeholder="15/03"
                    pattern="\d{2}/\d{2}"
                  />
                </div>
                <div className="form-group">
                  <label>Email :</label>
                  <input
                    type="email"
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    placeholder="exemple@email.com"
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={() => setShowAddMemberModal(false)} className="btn-secondary">
                    Annuler
                  </button>
                  <button type="submit" className="btn-primary">
                    Ajouter
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {showValidation.show && (
        <ValidationAnimation
          message={showValidation.message}
          type={showValidation.type}
          onComplete={() => setShowValidation({ show: false, message: '' })}
        />
      )}
    </div>
  );
}

// Composant Modal détails membre
function MemberDetailsModal({ member, onClose, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedMember, setEditedMember] = useState({ ...member });

  const handleSave = () => {
    if (!editedMember.name || !editedMember.name.trim()) {
      alert('⚠️ Le nom est obligatoire !');
      return;
    }
    onUpdate(editedMember);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-member" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>👤 Détails du membre</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {!isEditing ? (
            <div className="member-details-view">
              <h3>{member.name}</h3>
              <div className="detail-item">
                <strong>Pupitre :</strong>
                <span className="badge-pupitre">{member.pupitre}</span>
              </div>
              <div className="detail-item">
                <strong>📞 Téléphone :</strong>
                <span>{member.phone || 'Non renseigné'}</span>
              </div>
              <div className="detail-item">
                <strong>🎂 Anniversaire :</strong>
                <span>{member.birthday || 'Non renseigné'}</span>
              </div>
              <div className="detail-item">
                <strong>📧 Email :</strong>
                <span>{member.email || 'Non renseigné'}</span>
              </div>
            </div>
          ) : (
            <div className="member-details-edit">
              <div className="form-group">
                <label>Nom :</label>
                <input
                  type="text"
                  value={editedMember.name}
                  onChange={(e) => setEditedMember({ ...editedMember, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Pupitre :</label>
                <select value={editedMember.pupitre} onChange={(e) => setEditedMember({ ...editedMember, pupitre: e.target.value })}>
                  {PUPITRES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Téléphone :</label>
                <input
                  type="tel"
                  value={editedMember.phone}
                  onChange={(e) => setEditedMember({ ...editedMember, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Anniversaire :</label>
                <input
                  type="text"
                  value={editedMember.birthday}
                  onChange={(e) => setEditedMember({ ...editedMember, birthday: e.target.value })}
                  pattern="\d{2}/\d{2}"
                />
              </div>
              <div className="form-group">
                <label>Email :</label>
                <input
                  type="email"
                  value={editedMember.email}
                  onChange={(e) => setEditedMember({ ...editedMember, email: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          {!isEditing ? (
            <>
              <button onClick={() => setIsEditing(true)} className="btn-primary">
                ✏️ Modifier
              </button>
              <button onClick={onClose} className="btn-secondary">Fermer</button>
            </>
          ) : (
            <>
              <button onClick={() => setIsEditing(false)} className="btn-secondary">
                Annuler
              </button>
              <button onClick={handleSave} className="btn-primary">
                💾 Enregistrer
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
