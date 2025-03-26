import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import Constants from 'expo-constants';

// Firebase configuration using secrets directly
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain: `${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID}.appspot.com`,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID
};

// Log configuration for debugging (without showing actual values)
console.log('Firebase config keys available:', {
  apiKey: !!firebaseConfig.apiKey,
  authDomain: !!firebaseConfig.authDomain,
  projectId: !!firebaseConfig.projectId,
  appId: !!firebaseConfig.appId
});

// More detailed validation, logging empty strings but not revealing actual values
if (!firebaseConfig.apiKey) console.error('Firebase API key is missing!');
if (!firebaseConfig.projectId) console.error('Firebase Project ID is missing!');
if (!firebaseConfig.appId) console.error('Firebase App ID is missing!');

console.log('Initializing Firebase app...');

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.log('The current browser does not support all of the features required to enable persistence');
    }
  });

// Authentication functions
const googleProvider = new GoogleAuthProvider();

const signInWithGoogle = async () => {
  try {
    await signInWithRedirect(auth, googleProvider);
    const result = await getRedirectResult(auth);
    if (result) {
      return result.user;
    }
  } catch (error) {
    console.error("Error signing in with Google: ", error);
    throw error;
  }
};

const registerWithEmail = async (email, password) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Error registering with email: ", error);
    throw error;
  }
};

const loginWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Error logging in with email: ", error);
    throw error;
  }
};

const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out: ", error);
    throw error;
  }
};

export {
  app,
  auth,
  db,
  signInWithGoogle,
  registerWithEmail,
  loginWithEmail,
  logoutUser
};
