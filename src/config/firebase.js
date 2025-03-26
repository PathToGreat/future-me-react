// src/config/firebase.js
import { Platform } from 'react-native';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

console.log('Firebase config initializing');
console.log('Environment platform:', Platform.OS);

// Check what environment variables are available
const envVars = {
  EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? 'present' : 'missing',
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ? 'present' : 'missing',
  EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ? 'present' : 'missing',
  FIREBASE_API_KEY: process.env.FIREBASE_API_KEY ? 'present' : 'missing',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'present' : 'missing',
  FIREBASE_APP_ID: process.env.FIREBASE_APP_ID ? 'present' : 'missing'
};

console.log('Environment variables availability:', envVars);

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain: `${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID}.appspot.com`,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
};

console.log('Firebase config (with masked keys):', {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? '***' : undefined,
  appId: firebaseConfig.appId ? '***' : undefined
});

// Initialize Firebase with fallback for testing if needed
let app, auth, db;

try {
  console.log('Attempting to initialize Firebase...');
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  
  // Fallback to mock implementation for development
  console.warn('Using mock Firebase implementation');
  
  app = { name: 'firebase-app-mock' };
  auth = { 
    currentUser: null,
    onAuthStateChanged: (callback) => {
      callback(null);
      return () => {};
    }
  };
  db = { collection: () => ({ doc: () => ({}) }) };
}

// Authentication functions
export const signInWithGoogle = async () => {
  try {
    console.log('Attempting Google sign-in...');
    if (Platform.OS === 'web') {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log('Google sign-in successful');
      return result;
    } else {
      console.error('Google sign-in is only supported on web for this demo');
      throw new Error('Google sign-in is only supported on web for this demo');
    }
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
};

export const registerWithEmail = async (email, password) => {
  try {
    console.log('Attempting email registration...');
    const result = await createUserWithEmailAndPassword(auth, email, password);
    console.log('Email registration successful');
    return result;
  } catch (error) {
    console.error('Email registration error:', error);
    throw error;
  }
};

export const loginWithEmail = async (email, password) => {
  try {
    console.log('Attempting email login...');
    const result = await signInWithEmailAndPassword(auth, email, password);
    console.log('Email login successful');
    return result;
  } catch (error) {
    console.error('Email login error:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    console.log('Attempting logout...');
    await signOut(auth);
    console.log('Logout successful');
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

// Export the initialized services
export { app, auth, db, onAuthStateChanged };
