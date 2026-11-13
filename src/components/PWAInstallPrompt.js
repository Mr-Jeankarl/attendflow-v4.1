import React, { useEffect, useState } from 'react';

const DISMISS_KEY = 'attendflow_install_prompt_dismissed';

function isIOSDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.navigator.standalone;
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export default function PWAInstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null);
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);
  const [message, setMessage] = useState('Installez AttendFlow sur votre téléphone pour y accéder rapidement.');

  useEffect(() => {
    if (isStandalone() || window.sessionStorage.getItem(DISMISS_KEY)) return undefined;

    setIos(isIOSDevice());
    const timer = window.setTimeout(() => setVisible(true), 1400);
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallEvent(event);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setInstallEvent(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismiss = () => {
    window.sessionStorage.setItem(DISMISS_KEY, 'true');
    setVisible(false);
  };

  const install = async () => {
    if (!installEvent) {
      setMessage(ios
        ? 'Sur iPhone : touchez Partager dans Safari, puis « Sur l’écran d’accueil ».'
        : 'Dans le menu de votre navigateur, choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil ».');
      return;
    }

    installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice?.outcome === 'accepted') setVisible(false);
    setInstallEvent(null);
  };

  if (!visible || isStandalone()) return null;

  return (
    <aside className="pwa-install-card" aria-label="Installer AttendFlow">
      <div className="pwa-install-icon" aria-hidden="true">A</div>
      <div className="pwa-install-copy">
        <strong>Installer AttendFlow</strong>
        <span>{message}</span>
      </div>
      <button type="button" className="pwa-install-action" onClick={install}>
        Installer
      </button>
      <button type="button" className="pwa-install-dismiss" onClick={dismiss} aria-label="Plus tard">
        Plus tard
      </button>
    </aside>
  );
}
