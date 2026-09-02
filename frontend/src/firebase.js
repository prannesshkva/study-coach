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

const BUILTIN_CONFIG = {
  apiKey: "AIzaSyBi9gDV1dgwOiwmHEzRIO_2UXYymctl_ic",
  authDomain: "studycoach-838ab.firebaseapp.com",
  projectId: "studycoach-838ab",
  storageBucket: "studycoach-838ab.firebasestorage.app",
  messagingSenderId: "728168441539",
  appId: "1:728168441539:web:042d174f9df2e9c07a2476",
  measurementId: "G-5WYGCM2DR5"
};

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
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || BUILTIN_CONFIG.apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || BUILTIN_CONFIG.authDomain,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || BUILTIN_CONFIG.projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || BUILTIN_CONFIG.storageBucket,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || BUILTIN_CONFIG.messagingSenderId,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || BUILTIN_CONFIG.appId,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || BUILTIN_CONFIG.measurementId
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
    throw new Error('Firebase credentials not configured. Please check your configuration.');
  }
  const result = await signInWithPopup(authInstance, googleProvider);
  return result.user;
};

export const loginWithEmail = async (email, password) => {
  const authInstance = auth || initFirebase();
  if (!authInstance) {
    throw new Error('Firebase credentials not configured. Please check your configuration.');
  }
  const result = await signInWithEmailAndPassword(authInstance, email, password);
  return result.user;
};

export const registerWithEmail = async (email, password, displayName) => {
  const authInstance = auth || initFirebase();
  if (!authInstance) {
    throw new Error('Firebase credentials not configured. Please check your configuration.');
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
