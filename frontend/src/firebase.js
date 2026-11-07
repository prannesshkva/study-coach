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
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
  };
};

export const isFirebaseConfigured = () => {
  const config = getDefaultFirebaseConfig();
  return Boolean(config && config.apiKey && config.projectId && !config.apiKey.includes('...'));
};

export const saveFirebaseConfig = (config) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

export const clearFirebaseConfig = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const formatAuthError = (err) => {
  const msg = err?.message || String(err);
  if (msg.includes('auth/api-key-not-valid') || msg.includes('api-key-not-valid')) {
    return 'Firebase API key is invalid or not active for this domain. You can sign in instantly using Student ID, or update credentials in Setup.';
  }
  if (msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password') || msg.includes('auth/invalid-credential')) {
    return 'Incorrect email or password. Please verify your credentials or register a new account.';
  }
  if (msg.includes('auth/email-already-in-use')) {
    return 'An account with this email already exists. Please sign in instead.';
  }
  if (msg.includes('auth/popup-closed-by-user')) {
    return 'Google sign-in popup was closed before completing.';
  }
  if (msg.includes('auth/network-request-failed')) {
    return 'Network connection error. Please check your internet connection.';
  }
  return msg.replace(/^Firebase:\s*/, '').replace(/Error\s*\([^)]*\)\.?/, '').trim() || msg;
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
    throw new Error('Firebase credentials not configured. Please add your Firebase configuration in Setup.');
  }
  try {
    const result = await signInWithPopup(authInstance, googleProvider);
    return result.user;
  } catch (err) {
    throw new Error(formatAuthError(err));
  }
};

export const loginWithEmail = async (email, password) => {
  const authInstance = auth || initFirebase();
  if (!authInstance) {
    throw new Error('Firebase credentials not configured. Please add your Firebase configuration in Setup.');
  }
  try {
    const result = await signInWithEmailAndPassword(authInstance, email, password);
    return result.user;
  } catch (err) {
    throw new Error(formatAuthError(err));
  }
};

export const registerWithEmail = async (email, password, displayName) => {
  const authInstance = auth || initFirebase();
  if (!authInstance) {
    throw new Error('Firebase credentials not configured. Please add your Firebase configuration in Setup.');
  }
  try {
    const result = await createUserWithEmailAndPassword(authInstance, email, password);
    if (displayName && result.user) {
      await updateProfile(result.user, { displayName });
    }
    return result.user;
  } catch (err) {
    throw new Error(formatAuthError(err));
  }
};

export const logout = async () => {
  const authInstance = auth || initFirebase();
  if (authInstance) {
    try {
      await signOut(authInstance);
    } catch (e) {
      console.error('Sign out error:', e);
    }
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
