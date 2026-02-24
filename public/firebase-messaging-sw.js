// public/firebase-messaging-sw.js
// Service Worker pour gérer les notifications push en arrière-plan

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Configuration Firebase (même que dans config.js)
// IMPORTANT: Remplacez ces valeurs par vos propres clés Firebase
firebase.initializeApp({
  apiKey: "AIzaSyDBccgBgTjrCo3GtWZcxWyy7lM1kjfPjgI",
  authDomain: "attendflow02.firebaseapp.com",
  databaseURL: "https://attendflow02-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "attendflow02",
  storageBucket: "attendflow02.firebasestorage.app",
  messagingSenderId: "302913418567",
  appId: "1:302913418567:web:784f0688840c10456b8862"
});

const messaging = firebase.messaging();

// Gérer les messages en arrière-plan (app fermée)
messaging.onBackgroundMessage((payload) => {
  console.log('[Service Worker] Message reçu en arrière-plan:', payload);

  const notificationTitle = payload.notification?.title || 'AttendFlow';
  const notificationOptions = {
    body: payload.notification?.body || 'Vous avez une nouvelle notification',
    icon: payload.notification?.icon || '/logo192.png',
    badge: '/logo192.png',
    tag: 'attendflow-notification',
    data: payload.data || {},
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Ouvrir'
      },
      {
        action: 'close',
        title: 'Fermer'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Gérer les clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification cliquée:', event);

  event.notification.close();

  if (event.action === 'open' || event.action === '') {
    // Ouvrir l'app
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/')
    );
  }
});
