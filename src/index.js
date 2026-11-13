import React, { useEffect, useState } from 'react';
import './App.css';
import './Redesign.css';
import './ReferencePolish.css';
import ReactDOM from 'react-dom/client';
import App from './App';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import PreviewExperience from './components/PreviewExperience';
import { isPreviewMode } from './firebase/config';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/firebase-messaging-sw.js')
    .then((registration) => console.log('✅ Service Worker enregistré:', registration))
    .catch((error) => console.log('❌ Erreur Service Worker:', error));
}

function AppRoot() {
  const [showFullApp, setShowFullApp] = useState(false);
  useEffect(() => {
    if (!showFullApp) return undefined;
    const restoreThemeBackground = () => {
      document.querySelectorAll('.App').forEach((element) => {
        const image = element.style.backgroundImage;
        if (image) element.style.setProperty('background-image', image, 'important');
      });
    };
    restoreThemeBackground();
    const observer = new MutationObserver(restoreThemeBackground);
    const rootElement = document.getElementById('root');
    if (rootElement) observer.observe(rootElement, { attributes: true, attributeFilter: ['style'], subtree: true });
    return () => observer.disconnect();
  }, [showFullApp]);

  return (
    <>
      {isPreviewMode && !showFullApp ? <PreviewExperience onOpenFullApp={() => setShowFullApp(true)} /> : <App />}
      {isPreviewMode && showFullApp && <button className="reference-return-preview" type="button" onClick={() => setShowFullApp(false)}>← Retour au tableau de bord aperçu</button>}
      <PWAInstallPrompt />
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><AppRoot /></React.StrictMode>);
