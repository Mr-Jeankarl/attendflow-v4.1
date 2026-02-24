# 🔥 ATTENDFLOW V4.0 - Guide d'installation Firebase

## 📋 PRÉREQUIS

- Compte Google
- Node.js 14+ installé
- Navigateur moderne (Chrome, Firefox, Edge, Safari)

---

## 🚀 ÉTAPE 1 : Setup Firebase (15 min)

### 1.1 Créer le projet Firebase

1. Allez sur https://console.firebase.google.com
2. Cliquez sur "Ajouter un projet"
3. Nom du projet : **AttendFlow**
4. Désactivez Google Analytics (optionnel)
5. Cliquez sur "Créer le projet"

### 1.2 Activer l'authentification

1. Dans le menu gauche : **Authentication**
2. Cliquez sur **"Commencer"**
3. Activez les fournisseurs :
   - **Email/Password** → Activé
   - **Anonyme** → Activé (pour les codes secrets)
4. Cliquez sur "Enregistrer"

### 1.3 Activer Realtime Database

1. Dans le menu gauche : **Realtime Database**
2. Cliquez sur **"Créer une base de données"**
3. Sélectionnez une région (ex: europe-west1)
4. Mode : **"Démarrer en mode test"** (règles ouvertes temporairement)
5. Cliquez sur "Activer"

**IMPORTANT : Règles de sécurité**

Dans l'onglet "Règles", remplacez par :

```json
{
  "rules": {
    "organizations": {
      "$orgId": {
        ".read": "auth != null && data.child('admins').child(auth.uid).exists()",
        ".write": "auth != null && data.child('admins').child(auth.uid).exists()",
        "admins": {
          "$userId": {
            ".write": "auth != null && (data.parent().child(auth.uid).child('role').val() == 'owner' || $userId == auth.uid)"
          }
        }
      }
    },
    "users": {
      "$userId": {
        ".read": "auth != null && auth.uid == $userId",
        ".write": "auth != null && auth.uid == $userId"
      }
    },
    "usernames": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

Cliquez sur **"Publier"**

### 1.4 Activer Cloud Messaging (Notifications)

1. Dans le menu gauche : **Cloud Messaging**
2. Cliquez sur "Commencer"
3. Dans "Web Push certificates", cliquez sur "Generate key pair"
4. **Copiez la clé VAPID** (vous en aurez besoin plus tard)

### 1.5 Activer Storage (pour les avatars)

1. Dans le menu gauche : **Storage**
2. Cliquez sur "Commencer"
3. Mode test → Démarrer
4. Cliquez sur "Terminer"

### 1.6 Récupérer les clés de configuration

1. Dans "Project settings" (⚙️ en haut à gauche)
2. Scrollez vers "Vos applications"
3. Cliquez sur l'icône **Web** (</>)
4. Nom de l'app : **AttendFlow Web**
5. Cochez "Also set up Firebase Hosting"
6. Cliquez sur "Enregistrer l'application"
7. **COPIEZ toute la configuration** qui apparaît

Exemple de ce que vous devez copier :
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "attendflow-xxxxx.firebaseapp.com",
  databaseURL: "https://attendflow-xxxxx-default-rtdb.firebaseio.com",
  projectId: "attendflow-xxxxx",
  storageBucket: "attendflow-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxxx"
};
```

---

## 💻 ÉTAPE 2 : Configuration du projet

### 2.1 Extraire le projet

```bash
unzip attendflow-v4.0-firebase.zip
cd attendflow-v4.0
```

### 2.2 Créer le fichier .env

```bash
cp .env.example .env
```

### 2.3 Remplir le fichier .env

Ouvrez `.env` et remplissez avec vos clés Firebase :

```
REACT_APP_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
REACT_APP_FIREBASE_AUTH_DOMAIN=attendflow-xxxxx.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://attendflow-xxxxx-default-rtdb.firebaseio.com
REACT_APP_FIREBASE_PROJECT_ID=attendflow-xxxxx
REACT_APP_FIREBASE_STORAGE_BUCKET=attendflow-xxxxx.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789012
REACT_APP_FIREBASE_APP_ID=1:123456789012:web:xxxxxxxxxxxxx
REACT_APP_FIREBASE_VAPID_KEY=VOTRE_CLE_VAPID_ICI
```

### 2.4 Mettre à jour firebase-messaging-sw.js

Ouvrez `public/firebase-messaging-sw.js` et remplacez les valeurs :

```javascript
firebase.initializeApp({
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_AUTH_DOMAIN",
  // ... etc
});
```

### 2.5 Installer les dépendances

```bash
npm install
```

---

## 🎯 ÉTAPE 3 : Lancer l'application

```bash
npm start
```

L'application s'ouvre sur http://localhost:3000

---

## 📱 ÉTAPE 4 : Tester

### Premier utilisateur :

1. **Inscription** (choisissez Code OU Email)
2. **Créer une organisation**
3. Notez le **code d'invitation** généré

### Deuxième utilisateur (tester multi-users) :

1. Ouvrez un **navigateur privé**
2. Inscription (autre compte)
3. **Rejoindre** avec le code d'invitation
4. Les deux utilisateurs voient les mêmes données en temps réel ! 🎉

---

## 🔔 ÉTAPE 5 : Activer les notifications

Dans l'app :
1. Créez une session
2. Le navigateur demande l'autorisation pour les notifications
3. Cliquez sur **"Autoriser"**
4. Les autres admins reçoivent une notification !

---

## 🏗️ ÉTAPE 6 : Déployer en production

### Option A : Firebase Hosting (Recommandé)

```bash
npm run build
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

Votre app est en ligne sur : `https://attendflow-xxxxx.web.app`

### Option B : Netlify

1. `npm run build`
2. Glisser-déposer le dossier `build/` sur Netlify
3. Configurer les variables d'environnement

---

## ❗ DÉPANNAGE

### Erreur "Firebase not configured"
→ Vérifiez que `.env` existe et contient les bonnes clés

### Erreur "Permission denied"
→ Vérifiez les règles de sécurité dans Firebase Console

### Notifications ne fonctionnent pas
→ Vérifiez que la clé VAPID est correcte dans `.env`

### Synchronisation temps réel ne fonctionne pas
→ Vérifiez que Realtime Database est activé

---

## 📞 SUPPORT

En cas de problème :
1. Vérifiez la console JavaScript (F12)
2. Vérifiez la console Firebase
3. Relisez ce guide étape par étape

---

## 🎉 FÉLICITATIONS !

Vous avez maintenant AttendFlow V4.0 avec :
- ✅ Synchronisation temps réel
- ✅ Multi-organisations
- ✅ Notifications push
- ✅ Mode offline
- ✅ Gestion hiérarchique

**Profitez-en ! 🚀**
