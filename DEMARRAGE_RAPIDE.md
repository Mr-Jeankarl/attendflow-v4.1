# 🚀 ATTENDFLOW V4.1 - Guide de Démarrage Rapide

## ⏱️ Installation en 20 minutes !

---

## 📦 ÉTAPE 1 : Extraire le projet (1 min)

```bash
unzip attendflow-v4.1-final.zip
cd attendflow-v4.1
```

---

## 🔥 ÉTAPE 2 : Configurer Firebase (15 min)

### **Suivez le guide détaillé :**
Ouvrez le fichier **`GUIDE_FIREBASE_RAPIDE.md`** et suivez les 7 étapes.

**En résumé :**
1. Créer projet Firebase
2. Activer Authentication (Email + Anonyme)
3. Activer Realtime Database
4. Configurer les règles de sécurité
5. Activer Cloud Messaging (notifications)
6. Récupérer les clés de configuration
7. Les coller dans `.env`

---

## ⚙️ ÉTAPE 3 : Installer les dépendances (2 min)

```bash
npm install
```

Attends que toutes les dépendances s'installent...

---

## 🎯 ÉTAPE 4 : Configurer les clés Firebase (2 min)

### 1. Créer le fichier .env
```bash
cp .env.example .env
```

### 2. Éditer .env
Ouvre le fichier `.env` et remplace avec TES clés Firebase :

```
REACT_APP_FIREBASE_API_KEY=Ta_clé_ici
REACT_APP_FIREBASE_AUTH_DOMAIN=Ton_domaine_ici
REACT_APP_FIREBASE_DATABASE_URL=Ton_URL_ici
REACT_APP_FIREBASE_PROJECT_ID=Ton_projet_ici
REACT_APP_FIREBASE_STORAGE_BUCKET=Ton_bucket_ici
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=Ton_sender_id_ici
REACT_APP_FIREBASE_APP_ID=Ton_app_id_ici
REACT_APP_FIREBASE_VAPID_KEY=Ta_clé_VAPID_ici
```

### 3. Mettre à jour firebase-messaging-sw.js
Ouvre `public/firebase-messaging-sw.js` et remplace aussi les clés Firebase.

---

## 🚀 ÉTAPE 5 : Lancer l'application !

```bash
npm start
```

L'app s'ouvre automatiquement sur **http://localhost:3000** 🎉

---

## 🎮 UTILISATION

### **Premier utilisateur (toi) :**

1. **Inscription** :
   - Choisis **Code secret** OU **Email**
   - Exemple Code : `karl` / `moncode2025`

2. **Créer l'organisation** :
   - Nom : `Grand Chœur Polyphonique`
   - Code d'invitation : Généré auto OU personnalisé
   - **Note le code !** Ex: `CHOEUR-ABC-2025`

3. **Tu as accès à l'app !** 🎉

### **Autres utilisateurs (tes collaborateurs) :**

1. **Inscription** : Nouveau compte
2. **Rejoindre** : Entre le code que tu leur as donné
3. **Accès immédiat** aux données ! ✅

---

## ✨ NOUVELLES FONCTIONNALITÉS V4.1

### 🕐 **Ponctualité**
Quand tu marques quelqu'un "Présent" :
- Les boutons **À l'heure** / **En retard** apparaissent en dessous
- Clique pour indiquer la ponctualité

### 📴 **Mode Offline Total**
- **Offline** : Ajoute membres et sessions normalement
- **Tout est visible** immédiatement dans l'app
- **Retour online** : Synchronisation automatique invisible !

### 🏢 **Organisation Unique**
- **Plus de choix** d'organisation
- **Une seule** organisation partagée par tous
- **Workflow simplifié** : Auth → Config → App

---

## 🐛 DÉPANNAGE

### **Erreur "Firebase not configured"**
→ Vérifie que `.env` existe et contient les bonnes clés

### **App ne se lance pas**
→ Vérifie que Node.js 14+ est installé : `node --version`

### **Données ne se synchronisent pas**
→ Vérifie que Realtime Database est activé dans Firebase Console

### **Notifications ne fonctionnent pas**
→ Vérifie la clé VAPID dans `.env`

---

## 📚 DOCUMENTATION COMPLÈTE

- **`GUIDE_FIREBASE_RAPIDE.md`** : Setup Firebase étape par étape
- **`CHANGELOG.md`** : Toutes les nouveautés V4.1
- **`README.md`** : Documentation complète
- **`FIREBASE_SETUP.md`** : Guide détaillé Firebase

---

## 🎉 C'EST TOUT !

**Profite bien d'AttendFlow V4.1 !** 🚀

Des questions ? Consulte la documentation ou teste directement !

---

**Version** : 4.1.0  
**Date** : 22 février 2025  
**Temps d'installation** : ~20 minutes
