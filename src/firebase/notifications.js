// src/firebase/notifications.js
// Gestion des notifications push avec Firebase Cloud Messaging

import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from './config';
import { ref, set, get } from 'firebase/database';
import { database, auth } from './config';

/**
 * VAPID Key - À générer dans Firebase Console
 * Cloud Messaging > Web configuration > Web Push certificates
 */
const VAPID_KEY = process.env.REACT_APP_FIREBASE_VAPID_KEY;

/**
 * Demander la permission pour les notifications
 */
export const requestNotificationPermission = async () => {
  try {
    if (!messaging) {
      console.warn('Firebase Messaging non supporté sur ce navigateur');
      return null;
    }

    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      console.log('Permission notifications accordée');

      // Obtenir le token FCM
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY
      });

      if (token) {
        console.log('Token FCM obtenu:', token);

        // Sauvegarder le token dans la DB pour l'utilisateur
        const user = auth.currentUser;
        if (user) {
          await saveNotificationToken(user.uid, token);
        }

        return token;
      }
    } else if (permission === 'denied') {
      console.log('Permission notifications refusée');
      return null;
    } else {
      console.log('Permission notifications par défaut');
      return null;
    }
  } catch (error) {
    console.error('Erreur demande permission notifications:', error);
    return null;
  }
};

/**
 * Sauvegarder le token de notification
 */
const saveNotificationToken = async (userId, token) => {
  try {
    const tokenRef = ref(database, `users/${userId}/notificationToken`);
    await set(tokenRef, token);
  } catch (error) {
    console.error('Erreur sauvegarde token:', error);
  }
};

/**
 * Écouter les messages en premier plan (app ouverte)
 */
export const onMessageListener = (callback) => {
  if (!messaging) {
    console.warn('Firebase Messaging non supporté');
    return () => { };
  }

  return onMessage(messaging, (payload) => {
    console.log('Message reçu (foreground):', payload);

    // Afficher une notification locale
    if (payload.notification) {
      showLocalNotification(
        payload.notification.title,
        payload.notification.body,
        payload.notification.icon
      );
    }

    // Callback pour mettre à jour l'UI
    if (callback) {
      callback(payload);
    }
  });
};

/**
 * Afficher une notification locale (navigateur)
 */
export const showLocalNotification = (title, body, icon = '/logo192.png') => {
  if (!('Notification' in window)) {
    console.warn('Notifications non supportées');
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon,
      badge: '/logo192.png',
      tag: 'attendflow-notification',
      requireInteraction: false
    });
  }
};

/**
 * Envoyer une notification à un utilisateur
 * NOTE: Cette fonction nécessite Cloud Functions côté serveur
 * ou l'API Admin SDK pour fonctionner en production
 */
export const sendNotificationToUser = async (userId, notification) => {
  try {
    // Récupérer le token de l'utilisateur
    const tokenRef = ref(database, `users/${userId}/notificationToken`);
    const snapshot = await get(tokenRef);

    if (!snapshot.exists()) {
      console.log('Utilisateur sans token de notification');
      return false;
    }

    const token = snapshot.val();

    // TODO: Appeler Cloud Function pour envoyer la notif
    // Cette partie nécessite un backend ou Cloud Functions
    console.log('Envoi notification à token:', token, notification);

    return true;
  } catch (error) {
    console.error('Erreur envoi notification:', error);
    return false;
  }
};

/**
 * Notifier tous les admins d'une organisation
 */
export const notifyOrgAdmins = async (notification, excludeUserId = null) => {
  try {
    // Récupérer tous les admins de l'org
    const adminsRef = ref(database, "organization/admins");
    const snapshot = await get(adminsRef);

    if (!snapshot.exists()) return;

    const admins = snapshot.val();
    const promises = [];

    for (const [adminId] of Object.entries(admins)) {
      // Ne pas notifier l'utilisateur qui a fait l'action
      if (adminId === excludeUserId) continue;

      promises.push(sendNotificationToUser(adminId, notification));
    }

    await Promise.all(promises);
  } catch (error) {
    console.error('Erreur notification admins:', error);
  }
};

/**
 * Notification: Nouvelle session créée
 */
export const notifyNewSession = async (sessionData) => {
  const user = auth.currentUser;
  if (!user) return;

  const notification = {
    title: '📅 Nouvelle session enregistrée',
    body: `${sessionData.activityName} le ${sessionData.date} à ${sessionData.startTime}`,
    icon: '/logo192.png',
    data: {
      type: 'new_session',
      sessionId: sessionData.id,
      url: window.location.origin
    }
  };

  await notifyOrgAdmins(notification, user.uid);

  // Aussi afficher localement pour les autres onglets
  if (document.hidden) {
    showLocalNotification(notification.title, notification.body, notification.icon);
  }
};

/**
 * Désactiver les notifications pour un utilisateur
 */
export const disableNotifications = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const tokenRef = ref(database, `users/${user.uid}/notificationToken`);
    await set(tokenRef, null);

    console.log('Notifications désactivées');
  } catch (error) {
    console.error('Erreur désactivation notifications:', error);
  }
};

const notificationService = {
  requestNotificationPermission,
  onMessageListener,
  showLocalNotification,
  sendNotificationToUser,
  notifyOrgAdmins,
  notifyNewSession,
  disableNotifications
};

export default notificationService;
