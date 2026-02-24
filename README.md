# 🔥 AttendFlow V4.0 - Application de Gestion des Présences avec Firebase

Application PWA moderne avec **synchronisation temps réel**, multi-organisations, notifications push et mode hors-ligne.

![Version](https://img.shields.io/badge/version-4.0.0-blue)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB)
![Firebase](https://img.shields.io/badge/Firebase-10.7.0-orange)
![PWA](https://img.shields.io/badge/PWA-Ready-purple)

---

## 🎉 NOUVEAUTÉS V4.0

### 🔥 **Firebase - Synchronisation Temps Réel**
- ✅ **Base de données cloud** (Firebase Realtime Database)
- ✅ **Synchronisation automatique** entre tous les appareils
- ✅ **Mise à jour en direct** : Les modifications apparaissent instantanément
- ✅ **Pas de perte de données** : Tout est sauvegardé dans le cloud

### 🏢 **Multi-Organisations**
- ✅ **Plusieurs organisations** indépendantes
- ✅ **Codes d'invitation** (automatiques ou personnalisés)
- ✅ **Maximum 10 admins** par organisation
- ✅ **Gestion hiérarchique** : Owner peut retirer des admins

### 🔐 **Double Authentification**
- ✅ **Option 1** : Nom d'utilisateur + Code secret (simple)
- ✅ **Option 2** : Email + Mot de passe (standard)
- ✅ **Sécurité Firebase** intégrée

### 🔔 **Notifications Push**
- ✅ **"Nouvelle session enregistrée"** → Tous les admins sont notifiés
- ✅ **Notifications web** (dans l'app)
- ✅ **Notifications push** (même app fermée)

### 📴 **Mode Hors-Ligne Hybride**
- ✅ **Online** : Données sync avec Firebase en temps réel
- ✅ **Offline** : Données en cache local (localStorage)
- ✅ **Sync automatique** au retour en ligne
- ✅ **Queue d'actions** : Les modifications offline sont synchronisées automatiquement

---

## 📋 FONCTIONNALITÉS COMPLÈTES

### 👥 **Gestion des Membres**
- Ajout avec infos détaillées (nom, pupitre, tél, anniversaire, email)
- Modification via modal détails
- Suppression avec double confirmation
- 6 pupitres : Soprano, Alto, Ténor, Basse, Instrumentistes, Maître de chœur

### 📝 **Enregistrement des Sessions**
- Champs : Activité, Date, Heure début/fin, Lieu
- **Validation stricte** : Toutes les présences obligatoires
- 3 états : Présent, Absent justifié, Absent non justifié
- Commentaires optionnels pour absences
- **Notification automatique** aux autres admins

### 📊 **Historique & Statistiques**
- Historique complet cliquable
- Classement des membres (du plus au moins assidu)
- Statistiques par pupitre
- Export Excel + PDF

### ⚙️ **Paramètres**
- Gestion des administrateurs (owner)
- Code d'invitation visible
- Changer d'organisation
- Déconnexion

---

## 🚀 INSTALLATION RAPIDE

### **Prérequis**
- Node.js 14+
- Compte Google (pour Firebase)

### **Étape 1 : Setup Firebase** (15 min)

Suivez le guide complet : **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)**

En résumé :
1. Créer projet Firebase sur https://console.firebase.google.com
2. Activer : Authentication, Realtime Database, Cloud Messaging, Storage
3. Copier les clés de configuration

### **Étape 2 : Configuration du projet** (5 min)

```bash
# 1. Extraire le ZIP
unzip attendflow-v4.0-firebase.zip
cd attendflow-v4.0

# 2. Installer les dépendances
npm install

# 3. Configurer Firebase
cp .env.example .env
# Éditez .env avec vos clés Firebase

# 4. Mettre à jour firebase-messaging-sw.js
# Éditez public/firebase-messaging-sw.js avec vos clés
```

### **Étape 3 : Lancer** (1 min)

```bash
npm start
```

L'app s'ouvre sur http://localhost:3000 🎉

---

## 📱 UTILISATION

### **Premier utilisateur (créer l'organisation)**

1. **Inscription** : Choisissez Code OU Email
2. **Créer une organisation**
   - Nom : "Grand Chœur Polyphonique"
   - Code : Généré auto OU personnalisé
3. **Notez le code d'invitation** (ex: `CHOEUR-ABC-2025`)
4. **Partagez** le code avec vos collaborateurs

### **Autres utilisateurs (rejoindre)**

1. **Inscription** : Nouveau compte
2. **Rejoindre une organisation**
3. **Entrez le code** reçu
4. ✅ **Accès immédiat** aux données de l'organisation !

### **Utilisation quotidienne**

1. **Ajouter des membres** : Cliquez ➕ Ajouter un membre
2. **Créer une session** : Cliquez ➕ Nouvelle session
3. **Cochez les présences** pour chaque membre
4. **Enregistrez** → **Notification envoyée** aux autres admins !
5. **Synchronisation automatique** sur tous les appareils

---

## 🌐 MODE ONLINE/OFFLINE

### **Mode Online** (connexion Internet)
- ✅ Données synchronisées en temps réel
- ✅ Notifications push actives
- ✅ Toutes les fonctionnalités disponibles

### **Mode Offline** (pas de connexion)
- ⚠️ Données en cache local
- ⚠️ Modifications mises en queue
- ℹ️ Indicateur "🔴 Hors ligne" visible

### **Retour Online**
- ✅ Détection automatique
- ✅ Synchronisation de toutes les actions offline
- ✅ Message "✅ Données synchronisées"

---

## 🔐 SÉCURITÉ

### **Règles Firebase**
- Seuls les admins d'une org peuvent voir ses données
- Seul l'owner peut retirer d'autres admins
- Chaque utilisateur ne voit que ses organisations
- Authentification obligatoire pour toute action

### **Données privées**
- Chaque organisation est **totalement isolée**
- Impossible de voir les données d'autres organisations
- Code d'invitation requis pour rejoindre

---

## 📊 ARCHITECTURE TECHNIQUE

```
AttendFlow V4.0
├── React 18.2.0 (Interface)
├── Firebase 10.7.0
│   ├── Authentication (Code + Email)
│   ├── Realtime Database (Sync temps réel)
│   ├── Cloud Messaging (Notifications)
│   └── Storage (Avatars)
├── Mode Offline (localStorage)
└── PWA (Installable)
```

### **Structure du code**

```
src/
├── firebase/
│   ├── config.js          # Configuration Firebase
│   ├── auth.js            # Authentification
│   ├── database.js        # CRUD operations
│   ├── offline.js         # Gestion offline
│   └── notifications.js   # Notifications push
│
├── components/
│   ├── AuthScreen.js      # Login/Signup
│   ├── OrgManager.js      # Gestion organisations
│   ├── ConnectionStatus.js # Indicateur online/offline
│   └── AdminManager.js    # Gestion admins
│
├── App.js                 # Application principale (1361 lignes)
├── App.css                # Styles complets
└── index.js               # Point d'entrée
```

---

## 🎨 DESIGN

- **Thème** : Dark + Glassmorphisme
- **Couleurs** :
  - Fond : `#2a2a2a`
  - Dégradé : `#6b5dd3` → `#00d4ff`
  - Présent : `#059669`
  - Justifié : `#f59e0b`
  - Non justifié : `#ef4444`

---

## 🚀 DÉPLOIEMENT PRODUCTION

### **Option 1 : Firebase Hosting** (Recommandé)

```bash
npm run build
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

URL : `https://attendflow-xxxxx.web.app`

### **Option 2 : Netlify**

1. `npm run build`
2. Glisser-déposer `build/` sur Netlify
3. Configurer les variables d'environnement

---

## 💰 COÛTS

### **Firebase (Plan Gratuit)**
```
Quota gratuit :
- 1 Go stockage
- 10 Go téléchargement/mois
- 50 000 lectures/jour
- 20 000 écritures/jour

Estimation pour 50 membres + 500 sessions :
- Stockage : ~3 Mo
- Lectures/Écritures : ~500/jour
Verdict : 100% GRATUIT ✅
```

---

## ❗ DÉPANNAGE

### **Erreur "Firebase not configured"**
→ Vérifiez que `.env` existe avec les bonnes clés

### **Erreur "Permission denied"**
→ Vérifiez les règles de sécurité dans Firebase Console

### **Notifications ne fonctionnent pas**
→ Vérifiez la clé VAPID dans `.env`

### **Synchronisation ne fonctionne pas**
→ Vérifiez que Realtime Database est activé

**Plus de détails** : Consultez [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

---

## 📚 DOCUMENTATION

- **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** : Guide complet setup Firebase
- **[STATUS.md](./STATUS.md)** : État du projet et structure

---

## 🎯 DIFFÉRENCES V3.2 → V4.0

| Fonctionnalité | V3.2 | V4.0 |
|----------------|------|------|
| **Stockage** | localStorage uniquement | Firebase + localStorage (backup) |
| **Synchronisation** | ❌ Aucune | ✅ Temps réel |
| **Multi-users** | ❌ Non | ✅ Oui (10 max/org) |
| **Multi-orgs** | ❌ Non | ✅ Oui (illimité) |
| **Notifications** | ❌ Non | ✅ Push notifications |
| **Authentification** | Simple config | Double option (Code + Email) |
| **Mode offline** | Natif | Hybride avec sync auto |
| **Sauvegarde cloud** | ❌ Non | ✅ Oui |

---

## 🤝 SUPPORT

En cas de problème :
1. Consultez [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
2. Vérifiez la console JavaScript (F12)
3. Vérifiez Firebase Console
4. Consultez [STATUS.md](./STATUS.md)

---

## 📜 LICENCE

© 2025 AttendFlow - Tous droits réservés

---

## 🎉 FÉLICITATIONS !

Vous avez maintenant **AttendFlow V4.0** - La solution complète de gestion des présences avec synchronisation temps réel ! 🔥

**Bon usage ! 🚀**

---

**Version** : 4.0.0  
**Date** : Février 2025  
**Tech Stack** : React + Firebase + PWA  
**Développé par** : Claude + Karl
