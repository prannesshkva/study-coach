import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

const STORAGE_KEY = 'STUDY_COACH_FIREBASE_CONFIG';

export const getDefaultFirebaseConfig = () => {
  const custom = localStorage.getItem(STORAGE_KEY);
  if (custom) {
    try {
      return JSON.parse(custom);
    } catch (e) {
      console.error('Failed to parse custom Firebase config from localStorage', e);
    }
  }

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
  };
};

export const isFirebaseConfigured = () => {
  const config = getDefaultFirebaseConfig();
  return Boolean(config && config.apiKey && config.projectId);
};

export const saveFirebaseConfig = (config) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

export const clearFirebaseConfig = () => {
  localStorage.removeItem(STORAGE_KEY);
};

let app = null;
let auth = null;
const googleProvider = new GoogleAuthProvider();

export const initFirebase = () => {
  try {
    const config = getDefaultFirebaseConfig();
    if (!config.apiKey || !config.projectId) {
      return null;
    }

    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    auth = getAuth(app);
    return auth;
  } catch (err) {
    console.error('Firebase initialization error:', err);
    return null;
  }
};

export const loginWithGoogle = async () => {
  const authInstance = auth || initFirebase();
  if (!authInstance) {
    throw new Error('Firebase credentials not configured. Please add your Firebase configuration.');
  }
  const result = await signInWithPopup(authInstance, googleProvider);
  return result.user;
};

export const loginWithEmail = async (email, password) => {
  const authInstance = auth || initFirebase();
  if (!authInstance) {
    throw new Error('Firebase credentials not configured. Please add your Firebase configuration.');
  }
  const result = await signInWithEmailAndPassword(authInstance, email, password);
  return result.user;
};

export const registerWithEmail = async (email, password, displayName) => {
  const authInstance = auth || initFirebase();
  if (!authInstance) {
    throw new Error('Firebase credentials not configured. Please add your Firebase configuration.');
  }
  const result = await createUserWithEmailAndPassword(authInstance, email, password);
  if (displayName && result.user) {
    await updateProfile(result.user, { displayName });
  }
  return result.user;
};

export const logout = async () => {
  const authInstance = auth || initFirebase();
  if (authInstance) {
    await signOut(authInstance);
  }
};

export const onAuthChange = (callback) => {
  const authInstance = auth || initFirebase();
  if (!authInstance) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(authInstance, callback);
};
