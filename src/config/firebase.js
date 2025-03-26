// src/config/firebase.js - Simplified for debugging purposes
import { Platform } from 'react-native';

// Export dummy Firebase services for troubleshooting
console.log('Firebase config loaded in debug mode');
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

// Mock Firebase exports to avoid breaking imports elsewhere
export const app = { name: 'firebase-app-mock' };
export const auth = { 
  currentUser: null,
  onAuthStateChanged: (callback) => callback(null)
};
export const db = { collection: () => ({ doc: () => ({}) }) };

// Mock Firebase authentication functions
export const signInWithGoogle = async () => {
  console.log('Mock signInWithGoogle called');
  return null;
};

export const registerWithEmail = async (email, password) => {
  console.log('Mock registerWithEmail called with:', email);
  return null;
};

export const loginWithEmail = async (email, password) => {
  console.log('Mock loginWithEmail called with:', email);
  return null;
};

export const logoutUser = async () => {
  console.log('Mock logoutUser called');
};
