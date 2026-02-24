import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import App from './App';

// Enregistrer le Service Worker pour notifications
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/firebase-messaging-sw.js')
    .then((registration) => {
      console.log('✅ Service Worker enregistré:', registration);
    })
    .catch((error) => {
      console.log('❌ Erreur Service Worker:', error);
    });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
