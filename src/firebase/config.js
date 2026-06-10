// src/firebase/config.js
// Configuration Firebase pour AttendFlow

// Detect demo mode (no Firebase credentials configured)
const hasFbConfig = process.env.REACT_APP_FIREBASE_API_KEY &&
  process.env.REACT_APP_FIREBASE_API_KEY !== 'your_api_key_here';

export const isDemoMode = !hasFbConfig;

if (isDemoMode) {
  console.warn('⚠️ AttendFlow en MODE DÉMO – aucune clé Firebase détectée.');
}

let app = null;
let auth = null;
let database = null;
let storage = null;
let messaging = null;

if (!isDemoMode) {
  // Real Firebase initialization
  const { initializeApp } = require('firebase/app');
  const { getAuth } = require('firebase/auth');
  const { getDatabase } = require('firebase/database');
  const { getStorage } = require('firebase/storage');
  const { getMessaging, isSupported } = require('firebase/messaging');

  const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID
  };

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  database = getDatabase(app);
  storage = getStorage(app);

  isSupported().then(supported => {
    if (supported) {
      messaging = getMessaging(app);
    }
  }).catch(err => {
    console.warn('Firebase Messaging non supporté:', err);
  });
}

export { auth, database, storage, messaging };
export default app;
