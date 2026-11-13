// src/firebase/auth.js
// Gestion de l'authentification Firebase
// V4.1 — Email + Mot de passe + Google

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { ref, set, get, update } from 'firebase/database';
import { auth, database } from './config';
import { submitMemberRequest } from './database';

export const signupWithEmail = async (email, password, name, pupitre, inviteCode) => {
  try {
    if (!email || !email.includes('@')) throw new Error('Email invalide');
    if (!password || password.length < 6) throw new Error('Le mot de passe doit contenir au moins 6 caractères');
    if (!name || name.trim().length < 2) throw new Error('Le nom doit contenir au moins 2 caractères');
    if (!pupitre) throw new Error('Veuillez choisir un pupitre');
    if (!inviteCode || inviteCode.trim().length < 3) throw new Error("Le code d'invitation est obligatoire");

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await updateProfile(user, { displayName: name });
    await set(ref(database, `users/${user.uid}`), {
      name, email, authMethod: 'email', createdAt: new Date().toISOString()
    });
    await submitMemberRequest(name, pupitre, inviteCode);
    return { user, name, pending: true };
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') throw new Error('Cette adresse email est déjà utilisée');
    if (error.code === 'auth/invalid-email') throw new Error('Adresse email invalide');
    if (error.code === 'auth/weak-password') throw new Error('Mot de passe trop faible');
    console.error('Erreur signup avec email:', error);
    throw error;
  }
};

export const signinWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user };
  } catch (error) {
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      throw new Error('Email ou mot de passe incorrect');
    }
    if (error.code === 'auth/invalid-email') throw new Error('Adresse email invalide');
    throw error;
  }
};

export const signinWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    await set(ref(database, `users/${user.uid}`), {
      name: user.displayName || '',
      email: user.email || '',
      authMethod: 'google',
      createdAt: new Date().toISOString()
    });
    return { user };
  } catch (error) {
    if (error.code === 'auth/popup-closed-by-user') throw new Error('La fenêtre Google a été fermée avant la connexion.');
    if (error.code === 'auth/unauthorized-domain') throw new Error('Ce domaine doit être autorisé dans les paramètres Firebase Authentication.');
    throw error;
  }
};

export const signOut = async () => {
  try { await firebaseSignOut(auth); }
  catch (error) { console.error('Erreur déconnexion:', error); throw error; }
};

export const resetPassword = async (email) => {
  try { await sendPasswordResetEmail(auth, email); }
  catch (error) {
    if (error.code === 'auth/user-not-found') throw new Error('Aucun compte associé à cet email');
    throw error;
  }
};

export const getCurrentUserData = async () => {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    const snapshot = await get(ref(database, `users/${user.uid}`));
    return snapshot.exists() ? { uid: user.uid, ...snapshot.val() } : null;
  } catch (error) { console.error('Erreur récupération user data:', error); return null; }
};

export const updateUserProfile = async (updates) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Non authentifié');
  try {
    if (updates.name || updates.photoURL) {
      await updateProfile(user, { displayName: updates.name || user.displayName, photoURL: updates.photoURL || user.photoURL });
    }
    await update(ref(database, `users/${user.uid}`), updates);
  } catch (error) { console.error('Erreur mise à jour profil:', error); throw error; }
};
