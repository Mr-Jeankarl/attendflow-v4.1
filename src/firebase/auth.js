// src/firebase/auth.js
// Gestion de l'authentification Firebase

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { ref, set, get, update } from 'firebase/database';
import { auth, database } from './config';

// ==========================================
// AUTHENTIFICATION AVEC CODE (Option 1)
// ==========================================

/**
 * Créer un compte avec nom d'utilisateur + code secret
 * Simule un login simple en créant un compte anonyme + métadonnées
 */
export const signupWithCode = async (username, code) => {
  try {
    // Valider les entrées
    if (!username || username.trim().length < 3) {
      throw new Error('Le nom d\'utilisateur doit contenir au moins 3 caractères');
    }
    if (!code || code.trim().length < 6) {
      throw new Error('Le code secret doit contenir au moins 6 caractères');
    }

    // Vérifier si le nom d'utilisateur existe déjà
    const usernameRef = ref(database, `usernames/${username.toLowerCase()}`);
    const snapshot = await get(usernameRef);

    if (snapshot.exists()) {
      throw new Error('Ce nom d\'utilisateur est déjà pris');
    }

    // Créer un email fictif pour Firebase Auth
    const email = `${username.toLowerCase()}@attendflow.local`;

    // Créer le compte Firebase
    const userCredential = await createUserWithEmailAndPassword(auth, email, code);
    const user = userCredential.user;

    // Mettre à jour le profil
    await updateProfile(user, {
      displayName: username
    });

    // Sauvegarder les infos utilisateur dans la DB
    await set(ref(database, `users/${user.uid}`), {
      username: username,
      authMethod: 'code',
      createdAt: new Date().toISOString(),
      organizations: []
    });

    // Réserver le nom d'utilisateur
    await set(ref(database, `usernames/${username.toLowerCase()}`), user.uid);

    return { user, username };
  } catch (error) {
    console.error('Erreur signup avec code:', error);
    throw error;
  }
};

/**
 * Se connecter avec nom d'utilisateur + code secret
 */
export const signinWithCode = async (username, code) => {
  try {
    const email = `${username.toLowerCase()}@attendflow.local`;
    const userCredential = await signInWithEmailAndPassword(auth, email, code);
    return { user: userCredential.user, username };
  } catch (error) {
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      throw new Error('Nom d\'utilisateur ou code incorrect');
    }
    throw error;
  }
};

// ==========================================
// AUTHENTIFICATION AVEC EMAIL (Option 2)
// ==========================================

/**
 * Créer un compte avec email + mot de passe
 */
export const signupWithEmail = async (email, password, name) => {
  try {
    // Valider les entrées
    if (!email || !email.includes('@')) {
      throw new Error('Email invalide');
    }
    if (!password || password.length < 6) {
      throw new Error('Le mot de passe doit contenir au moins 6 caractères');
    }
    if (!name || name.trim().length < 2) {
      throw new Error('Le nom doit contenir au moins 2 caractères');
    }

    // Créer le compte Firebase
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Mettre à jour le profil
    await updateProfile(user, {
      displayName: name
    });

    // Sauvegarder les infos utilisateur dans la DB
    await set(ref(database, `users/${user.uid}`), {
      name: name,
      email: email,
      authMethod: 'email',
      createdAt: new Date().toISOString(),
      organizations: []
    });

    return { user, name };
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Cette adresse email est déjà utilisée');
    }
    if (error.code === 'auth/invalid-email') {
      throw new Error('Adresse email invalide');
    }
    if (error.code === 'auth/weak-password') {
      throw new Error('Mot de passe trop faible');
    }
    console.error('Erreur signup avec email:', error);
    throw error;
  }
};

/**
 * Se connecter avec email + mot de passe
 */
export const signinWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user };
  } catch (error) {
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      throw new Error('Email ou mot de passe incorrect');
    }
    if (error.code === 'auth/invalid-email') {
      throw new Error('Adresse email invalide');
    }
    throw error;
  }
};

// ==========================================
// FONCTIONS COMMUNES
// ==========================================

/**
 * Déconnexion
 */
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Erreur déconnexion:', error);
    throw error;
  }
};

/**
 * Réinitialisation du mot de passe (email uniquement)
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      throw new Error('Aucun compte associé à cet email');
    }
    throw error;
  }
};

/**
 * Obtenir les infos de l'utilisateur courant
 */
export const getCurrentUserData = async () => {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const userRef = ref(database, `users/${user.uid}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      return {
        uid: user.uid,
        ...snapshot.val()
      };
    }
    return null;
  } catch (error) {
    console.error('Erreur récupération user data:', error);
    return null;
  }
};

/**
 * Mettre à jour le profil utilisateur
 */
export const updateUserProfile = async (updates) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Non authentifié');

  try {
    // Mettre à jour Firebase Auth si nom/photo changent
    if (updates.name || updates.photoURL) {
      await updateProfile(user, {
        displayName: updates.name || user.displayName,
        photoURL: updates.photoURL || user.photoURL
      });
    }

    // Mettre à jour la base de données
    const userRef = ref(database, `users/${user.uid}`);
    await update(userRef, updates);
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    throw error;
  }
};
